import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
const settings=JSON.parse(readFileSync('release-settings.json'));
test.beforeEach(async({page})=>{await page.route('https://challenges.cloudflare.com/**',r=>r.fulfill({status:200,contentType:'application/javascript',body:''}));await page.route('**/api/**',r=>{if(r.request().method()!=='GET')return r.fulfill({status:503,contentType:'application/json',body:'{"error":"Browser check: delivery disabled"}'});return r.continue();});});
test('pages render and navigation works',async({page})=>{
 test.skip(settings.private,'Private workspace is tested through its authentication boundary');
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const route of settings.paths){const response=await page.goto(route);expect(response.status(),route).toBe(200);await expect(page.locator('h1').first()).toBeVisible();const csp=response.headers()['content-security-policy'];expect(csp,'Production security policy must be present').toBeTruthy();expect(csp).not.toMatch(/script-src[^;]*'unsafe-inline'/);await expect(page.locator('body')).not.toHaveText(/^\s*$/);}
 const home=page.locator('a[href="/"]').first();if(await home.isVisible()){await home.click();await expect(page.locator('h1').first()).toBeVisible();}
 expect(errors).toEqual([]);await page.screenshot({path:test.info().outputPath('site.png'),fullPage:true});
});
test('forms reject incomplete input without sending enquiries',async({page})=>{
 test.skip(settings.private,'No public forms');
 for(const route of settings.paths){await page.goto(route);for(const input of await page.locator('form input[required]:not([type=hidden]):not([type=checkbox]):not([type=number]), form textarea[required]').all()){if(await input.isVisible() && await input.evaluate(e=>e.willValidate)){await input.fill('');expect(await input.evaluate(e=>e.checkValidity())).toBe(false);}}}
});
test('private workspace rejects anonymous and forged identities',async({page,request,baseURL})=>{
 test.skip(!settings.private,'Public website');
 const r=await request.get('/',{headers:{'Cf-Access-Jwt-Assertion':'invalid','Cf-Access-Authenticated-User-Email':'test@example.invalid'},maxRedirects:0});
 expect([302,303,403]).toContain(r.status());if(r.status()===403)expect(await r.text()).toContain('Sign in through Cloudflare Access');else expect(new URL(r.headers().location,baseURL).hostname).toMatch(/\.cloudflareaccess\.com$/);
 await page.goto('/');await expect(page.locator('body')).toContainText(/Sign in|email|Access/i);await page.screenshot({path:test.info().outputPath('access-boundary.png')});
});
