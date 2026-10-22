import test from 'node:test';
import assert from 'node:assert/strict';
import {decodeEntities} from '../scripts/html-entities.mjs';
test('decodes exactly one entity layer',()=>{
 assert.equal(decodeEntities('&amp;lt;script&amp;gt;'),'&lt;script&gt;');
 assert.equal(decodeEntities('&quot;Cear&aacute;&quot; &#039; &#8211;'),'"Ceará" \' –');
});
