const test = require('node:test');
const assert = require('node:assert/strict');

test('authenticate allows request when api-key matches API_TOKEN', () => {
  process.env.API_TOKEN = 'secret-token';
  delete require.cache[require.resolve('../auth_middleware/auth.js')];
  const authenticate = require('../auth_middleware/auth.js');

  let nextCalled = false;
  const req = {
    header(name) {
      return name === 'api-key' ? 'secret-token' : undefined;
    },
  };
  const res = {
    status() {
      throw new Error('status should not be called');
    },
  };

  authenticate(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
});

test('authenticate rejects request when api-key is missing or invalid', () => {
  process.env.API_TOKEN = 'secret-token';
  delete require.cache[require.resolve('../auth_middleware/auth.js')];
  const authenticate = require('../auth_middleware/auth.js');

  let statusCode;
  let payload;
  const req = {
    header() {
      return undefined;
    },
  };
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(body) {
      payload = body;
      return this;
    },
  };

  authenticate(req, res, () => {
    throw new Error('next should not be called');
  });

  assert.equal(statusCode, 401);
  assert.deepEqual(payload, { error: 'Token inválido ou ausente.' });
});
