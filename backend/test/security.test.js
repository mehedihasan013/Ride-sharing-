// Runs against the compiled output: `npm test` builds first, then `node --test test/`.
const { test, afterEach } = require('node:test');
const assert = require('node:assert');
const { isAdminKeyValid } = require('../dist/common/admin-key.guard');
const { AuthService } = require('../dist/modules/auth/auth.service');

const saved = { NODE_ENV: process.env.NODE_ENV, ADMIN_API_KEY: process.env.ADMIN_API_KEY };
afterEach(() => {
  for (const [k, v] of Object.entries(saved)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
});

const newAuth = () =>
  new AuthService(
    { sign: () => 'test-token' },
    { getUsers: () => [], saveUsers: () => {}, registerResetListener: () => {} },
  );

test('admin key: correct key passes, wrong/missing/other-length keys fail', () => {
  process.env.ADMIN_API_KEY = 'secret-key';
  assert.strictEqual(isAdminKeyValid('secret-key'), true);
  assert.strictEqual(isAdminKeyValid('secret-kez'), false);
  assert.strictEqual(isAdminKeyValid('short'), false);
  assert.strictEqual(isAdminKeyValid(undefined), false);
  assert.strictEqual(isAdminKeyValid(['secret-key']), false);
});

test('admin key: with no key configured, production refuses and development allows', () => {
  delete process.env.ADMIN_API_KEY;
  process.env.NODE_ENV = 'production';
  assert.strictEqual(isAdminKeyValid('anything'), false);
  process.env.NODE_ENV = 'development';
  assert.strictEqual(isAdminKeyValid(undefined), true);
});

test('OTP: production rejects the 123456 demo code and hides the OTP', async () => {
  process.env.NODE_ENV = 'production';
  const auth = newAuth();
  await assert.rejects(auth.verifyOtp('01700000009', '123456'));
  const res = await auth.requestOtp('01700000009');
  assert.strictEqual(res.demoOtp, undefined);
});

test('OTP: development accepts 123456 and the code works only once', async () => {
  process.env.NODE_ENV = 'development';
  const auth = newAuth();
  const res = await auth.requestOtp('01700000009');
  assert.strictEqual(res.demoOtp, '123456');
  const session = await auth.verifyOtp('01700000009', res.demoOtp);
  assert.strictEqual(session.token, 'test-token');

  process.env.NODE_ENV = 'production'; // bypass off, so a reused code must fail
  await assert.rejects(auth.verifyOtp('01700000009', '123456'));
});
