import { execSync } from 'node:child_process';
import { createHmac, randomBytes, randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';

const status = JSON.parse(execSync('npx --yes supabase@2.119.0 status -o json', {
  encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'],
}));
const url = new URL(status.API_URL);
assert.equal(url.protocol, 'http:', 'Only a local HTTP test instance is allowed.');
assert.ok(['127.0.0.1', 'localhost'].includes(url.hostname), 'Remote projects are forbidden.');
const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
const operator = createClient(status.API_URL, status.SERVICE_ROLE_KEY, options);
const visitor = createClient(status.API_URL, status.ANON_KEY, options);
const admin = createClient(status.API_URL, status.ANON_KEY, options);
const member = createClient(status.API_URL, status.ANON_KEY, options);
const suffix = randomUUID(), password = 'LocalOnly-Aa1!' + randomBytes(24).toString('base64url');
const users = [], products = [randomUUID(), randomUUID()];
const path = 'images/v2-' + randomUUID() + '.png';
let uploaded = false;
const ok = (response, label) => { if (response.error) throw new Error(label + ' [' + (response.error.code ?? 'request_failed') + ']'); return response.data; };
const imageUrl = admin.storage.from('productos').getPublicUrl(path).data.publicUrl;
// RFC 6238. Used only for ephemeral local accounts; secrets never leave memory.
function totp(secret) {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let bits = '';
  for (const char of secret.toUpperCase().replace(/=+$/, '')) {
    const index = alphabet.indexOf(char); assert.ok(index >= 0);
    bits += index.toString(2).padStart(5, '0');
  }
  const key = Buffer.from(bits.match(/.{8}/g).map(byte => parseInt(byte, 2)));
  const counter = Buffer.alloc(8); counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const hash = createHmac('sha1', key).update(counter).digest();
  const value = (hash.readUInt32BE(hash[hash.length - 1] & 15) & 0x7fffffff) % 1000000;
  return value.toString().padStart(6, '0');
}
try {
  const signup = await visitor.auth.signUp({ email: 'signup-' + suffix + '@example.invalid', password });
  assert.ok(signup.error, 'Public registration must be disabled.');
  console.log('PASS: public registration disabled locally');
  for (const [name, client, isAdmin] of [['admin', admin, true], ['member', member, false]]) {
    const email = name + '-' + suffix + '@example.invalid';
    const data = ok(await operator.auth.admin.createUser({
      email, password, email_confirm: true,
      app_metadata: { is_admin: isAdmin }, user_metadata: { is_admin: true },
    }), 'Create local test user');
    users.push(data.user.id);
    ok(await client.auth.signInWithPassword({ email, password }), 'Local sign in');
  }
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jOc0AAAAASUVORK5CYII=', 'base64');
  const forbidden = await member.storage.from('productos').upload('images/denied-' + suffix + '.png', png, { contentType: 'image/png' });
  assert.ok(forbidden.error, 'A nonadmin must not upload.');
  ok(await admin.storage.from('productos').upload(path, png, { contentType: 'image/png' }), 'Admin image upload');
  uploaded = true;
  ok(await admin.from('productos').insert(products.map((id, i) => ({
    id, nombre: 'Docker café ' + i, categoria: 'Docker integration', precio: 10,
    estado: i ? 'Oculto' : 'Activo', imagenUrl: imageUrl, imagenes: [imageUrl],
  }))), 'Admin insert');
  for (const client of [visitor, member]) {
    const rows = ok(await client.from('productos').select('id').in('id', products), 'Public reads');
    assert.equal(rows.length, 1, 'Hidden products must stay private.');
    const insert = await client.from('productos').insert({ nombre: 'Denied', categoria: 'Docker integration', precio: 10, estado: 'Activo' });
    assert.ok(insert.error, 'Public and ordinary accounts must not insert.');
  }
  const updated = ok(await member.from('productos').update({ precio: 99 }).eq('id', products[0]).select('id'), 'Nonadmin update');
  assert.equal(updated.length, 0, 'A nonadmin must not update.');
  const deleted = ok(await member.from('productos').delete().eq('id', products[0]).select('id'), 'Nonadmin delete');
  assert.equal(deleted.length, 0, 'A nonadmin must not delete.');
  const all = ok(await admin.from('productos').select('id').in('id', products), 'Admin reads');
  assert.equal(all.length, 2);
  const searched = ok(await visitor.rpc('catalog_products', { search_term: 'DOCKER CAFE', active_only: false }), 'RPC search');
  assert.equal(searched.filter(row => products.includes(row.id)).length, 1);
  console.log('PASS: real Auth sessions, trusted admin role, spoofed user_metadata rejected, catalog search and CRUD permissions');
  const initial = ok(await admin.auth.mfa.getAuthenticatorAssuranceLevel(), 'Initial assurance level');
  assert.equal(initial.currentLevel, 'aal1');
  const session = ok(await admin.auth.getSession(), 'Local session').session;
  const stale = createClient(status.API_URL, status.ANON_KEY, {
    ...options, global: { headers: { Authorization: 'Bearer ' + session.access_token } },
  });
  const factor = ok(await admin.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Temporary local factor' }), 'MFA enroll');
  const wrong = (Number(totp(factor.totp.secret)) + 123) % 1000000;
  const rejected = await admin.auth.mfa.challengeAndVerify({ factorId: factor.id, code: String(wrong).padStart(6, '0') });
  assert.ok(rejected.error, 'Wrong MFA code must fail.');
  ok(await admin.auth.mfa.challengeAndVerify({ factorId: factor.id, code: totp(factor.totp.secret) }), 'MFA verify');
  const assurance = ok(await admin.auth.mfa.getAuthenticatorAssuranceLevel(), 'MFA assurance level');
  assert.equal(assurance.currentLevel, 'aal2');
  const staleRows = ok(await stale.from('productos').select('id').in('id', products), 'Stale AAL1 reads');
  assert.equal(staleRows.length, 1, 'An enrolled admin at AAL1 must not read hidden products.');
  const deniedInsert = await stale.from('productos').insert({ nombre: 'MFA denied', categoria: 'Docker integration', precio: 10, estado: 'Activo' });
  assert.ok(deniedInsert.error, 'Enrolled admin AAL1 insert must fail.');
  const deniedUpdate = ok(await stale.from('productos').update({ precio: 99 }).eq('id', products[0]).select('id'), 'AAL1 update');
  assert.equal(deniedUpdate.length, 0);
  const deniedDelete = ok(await stale.from('productos').delete().eq('id', products[0]).select('id'), 'AAL1 delete');
  assert.equal(deniedDelete.length, 0);
  const deniedImage = await stale.storage.from('productos').upload('images/mfa-denied-' + suffix + '.png', png, { contentType: 'image/png' });
  assert.ok(deniedImage.error, 'Enrolled admin AAL1 upload must fail.');
  const upgraded = ok(await admin.from('productos').select('id').in('id', products), 'AAL2 reads');
  assert.equal(upgraded.length, 2);
  ok(await admin.from('productos').update({ precio: 11 }).eq('id', products[0]), 'AAL2 update');
  console.log('PASS: TOTP enrollment, wrong-code rejection, AAL2 session and server-side rejection of stale AAL1 tokens');
  const unfinished = ok(await admin.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Temporary cancelled factor' }), 'Pending factor');
  ok(await admin.auth.mfa.unenroll({ factorId: unfinished.id }), 'Cancel pending factor');
  const backup = ok(await admin.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'Temporary backup factor' }), 'Backup enrollment');
  ok(await admin.auth.mfa.challengeAndVerify({ factorId: backup.id, code: totp(backup.totp.secret) }), 'Backup verification');
  ok(await admin.auth.mfa.unenroll({ factorId: factor.id }), 'Remove original factor with backup');
  const backupList = ok(await admin.auth.mfa.listFactors(), 'Backup factor listing');
  assert.equal(backupList.totp.length, 1);
  assert.equal(backupList.totp[0].id, backup.id);
  const adminEmail = session.user.email;
  ok(await admin.auth.signOut(), 'Sign out before challenge');
  ok(await admin.auth.signInWithPassword({ email: adminEmail, password }), 'Sign in with enrolled MFA');
  const needsChallenge = ok(await admin.auth.mfa.getAuthenticatorAssuranceLevel(), 'Sign in assurance');
  assert.equal(needsChallenge.currentLevel, 'aal1'); assert.equal(needsChallenge.nextLevel, 'aal2');
  // Avoid reusing the code consumed when the backup device was enrolled.
  await new Promise(resolve => setTimeout(resolve, 30000 - Date.now() % 30000 + 1000));
  ok(await admin.auth.mfa.challengeAndVerify({ factorId: backup.id, code: totp(backup.totp.secret) }), 'Challenge using backup device');
  assert.equal(ok(await admin.auth.mfa.getAuthenticatorAssuranceLevel(), 'Recovered assurance').currentLevel, 'aal2');
  console.log('PASS: unfinished enrollment cancellation, backup device, device replacement and challenge after a fresh login');
  await admin.storage.from('productos').remove([path]);
  const retained = ok(await admin.storage.from('productos').download(path), 'Referenced image retained');
  assert.ok(retained.size > 0);
  console.log('PASS: admin upload succeeds; ordinary upload denied; referenced image cannot be removed');
  ok(await admin.from('productos').delete().in('id', products), 'Remove local fixture products');
  ok(await admin.storage.from('productos').remove([path]), 'Remove unreferenced image');
  uploaded = false;
  const missing = await admin.storage.from('productos').download(path);
  assert.ok(missing.error, 'An unreferenced test image should be removed.');
  console.log('PASS: unreferenced image removed');
} finally {
  ok(await operator.from('productos').delete().in('id', products), 'Cleanup fixture products');
  if (uploaded) ok(await operator.storage.from('productos').remove([path]), 'Cleanup fixture image');
  await admin.auth.signOut(); await member.auth.signOut();
  for (const id of users) ok(await operator.auth.admin.deleteUser(id), 'Cleanup local user');
  const remaining = ok(await operator.from('productos').select('id').in('id', products), 'Verify cleanup');
  assert.equal(remaining.length, 0);
  console.log('PASS: local test users, products and images cleaned up');
}
