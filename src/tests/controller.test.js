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

test('createConversation returns threadId from the service', async () => {
  const mockedService = {
    async processCreateConversation(threadId, initialMessages) {
      assert.equal(threadId, 'thread-1');
      assert.deepEqual(initialMessages, []);
      return 'thread-1';
    },
    async getAllThreads() {
      return [];
    },
    async getConversation() {
      return null;
    },
    async deleteConversation() {
      return false;
    },
  };

  const { module: controller, restore } = loadModuleWithMocks(path.join(__dirname, '..', 'controller', 'controller.js'), {
    '../service/service.js': mockedService,
  });

  try {
    const req = { body: { threadId: 'thread-1', initialMessages: [] } };
    const res = createResponse();

    await controller.createConversation(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, { threadId: 'thread-1' });
  } finally {
    restore();
  }
});

test('getChatHistory returns 404 when conversation does not exist', async () => {
  const mockedService = {
    async processCreateConversation() {
      return 'thread-1';
    },
    async getAllThreads() {
      return [];
    },
    async getConversation() {
      return null;
    },
    async deleteConversation() {
      return false;
    },
  };

  const { module: controller, restore } = loadModuleWithMocks(path.join(__dirname, '..', 'controller', 'controller.js'), {
    '../service/service.js': mockedService,
  });

  try {
    const req = { params: { threadId: 'missing-thread' } };
    const res = createResponse();

    await controller.getChatHistory(req, res);

    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, { error: 'Conversa não encontrada' });
  } finally {
    restore();
  }
});

test('deleteChat returns success payload when conversation is deleted', async () => {
  const mockedService = {
    async processCreateConversation() {
      return 'thread-1';
    },
    async getAllThreads() {
      return [];
    },
    async getConversation() {
      return null;
    },
    async deleteConversation(threadId) {
      assert.equal(threadId, 'thread-1');
      return true;
    },
  };

  const { module: controller, restore } = loadModuleWithMocks(path.join(__dirname, '..', 'controller', 'controller.js'), {
    '../service/service.js': mockedService,
  });

  try {
    const req = { params: { threadId: 'thread-1' } };
    const res = createResponse();

    await controller.deleteChat(req, res);

    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, {
      success: true,
      message: 'Conversa excluída com sucesso',
    });
  } finally {
    restore();
  }
});
