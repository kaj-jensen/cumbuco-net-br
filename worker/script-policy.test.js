import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { scriptPolicy } from "./script-policy.js";
test("policy authorizes exact trusted script bytes, not modified inline code",async()=>{
 const code="window.ready = true;";
 const policy=await scriptPolicy(`<script>${code}</script><script src="/app.js"></script>`,"default-src 'self'; script-src 'self'; object-src 'none'");
 assert.ok(policy.includes(`'sha256-${createHash('sha256').update(code).digest('base64')}'`));
 assert.ok(!policy.includes(createHash('sha256').update(code+'alert(1)').digest('base64')));
 assert.ok(!policy.includes("unsafe-inline"));
 assert.ok(policy.endsWith("; object-src 'none'"));
});
