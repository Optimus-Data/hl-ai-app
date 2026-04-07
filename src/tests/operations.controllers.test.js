const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { loadModuleWithMocks } = require('./helpers/module-loader.js');

function createResponse() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

test('addMeditationsMessage validates required message', async () => {
  const { module: controller, restore } = loadModuleWithMocks(
    path.join(__dirname, '..', 'meditations_operations', 'controller', 'controller.js'),
    {
      '../service/service.js': {
        async processAddMeditationsMessage() {
          throw new Error('should not be called');
        },
      },
    },
  );

  try {
    const req = { params: { threadId: 'thread-1' }, body: {} };
    const res = createResponse();

    await controller.addMeditationsMessage(req, res);

    assert.equal(res.statusCode, 400);
    assert.deepEqual(res.body, { error: 'Mensagem não fornecida' });
  } finally {
    restore();
  }
});

test('addOrchestratorMessage returns 404 when service reports missing conversation', async () => {
  const { module: controller, restore } = loadModuleWithMocks(
    path.join(__dirname, '..', 'orchestrator_operations', 'controller', 'controller.js'),
    {
      '../service/service.js': {
        async processAddOrchestratorMessage() {
          throw new Error('Conversa não encontrada');
        },
      },
    },
  );

  try {
    const req = {
      params: { threadId: 'missing-thread' },
      body: { message: 'Oi' },
    };
    const res = createResponse();

    await controller.addOrchestratorMessage(req, res);

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, { error: 'Conversa não encontrada' });
  } finally {
    restore();
  }
});
