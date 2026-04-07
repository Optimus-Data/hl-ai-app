const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { loadModuleWithMocks } = require('./helpers/module-loader.js');

class HumanMessage {
  constructor(content) {
    this.content = content;
  }

  _getType() {
    return 'human';
  }
}

class AIMessage {
  constructor(content, additional_kwargs = {}) {
    this.content = content;
    this.additional_kwargs = additional_kwargs;
  }

  _getType() {
    return 'ai';
  }
}

test('processCreateConversation persists a generated conversation id and serialized messages', async () => {
  const saveCalls = [];
  const mockedRedis = {
    async save(key, value) {
      saveCalls.push([key, value]);
      return 'OK';
    },
    async get() {
      return null;
    },
    async getAllKeys() {
      return [];
    },
    async remove() {
      return 0;
    },
  };

  const { module: service, restore } = loadModuleWithMocks(path.join(__dirname, '..', 'service', 'service.js'), {
    '../redis/redis.js': mockedRedis,
    uuid: { v4: () => 'generated-id' },
    '@langchain/core/messages': { HumanMessage, AIMessage },
  });

  try {
    const initialMessages = [
      new HumanMessage('Oi'),
      new AIMessage('Olá'),
    ];

    const conversationId = await service.processCreateConversation(undefined, initialMessages);

    assert.equal(conversationId, 'generated-id');
    assert.equal(saveCalls.length, 1);
    assert.equal(saveCalls[0][0], 'conversation:generated-id');
    assert.equal(saveCalls[0][1].messageCount, 2);
    assert.equal(saveCalls[0][1].messages[0].type, 'human');
    assert.equal(saveCalls[0][1].messages[1].type, 'ai');
  } finally {
    restore();
  }
});

test('getConversation deserializes stored messages from redis', async () => {
  const mockedRedis = {
    async save() {
      return 'OK';
    },
    async get() {
      return {
        messages: [
          { type: 'human', content: 'Pergunta', additional_kwargs: {} },
          { type: 'ai', content: 'Resposta', additional_kwargs: {} },
        ],
        createdAt: '2026-04-06T00:00:00.000Z',
      };
    },
    async getAllKeys() {
      return [];
    },
    async remove() {
      return 0;
    },
  };

  const { module: service, restore } = loadModuleWithMocks(path.join(__dirname, '..', 'service', 'service.js'), {
    '../redis/redis.js': mockedRedis,
    uuid: { v4: () => 'generated-id' },
    '@langchain/core/messages': { HumanMessage, AIMessage },
  });

  try {
    const conversation = await service.getConversation('thread-1');

    assert.equal(conversation.messages[0].content, 'Pergunta');
    assert.equal(conversation.messages[1].content, 'Resposta');
    assert.equal(conversation.messages[0]._getType(), 'human');
    assert.equal(conversation.messages[1]._getType(), 'ai');
  } finally {
    restore();
  }
});

test('getAllThreads strips the conversation prefix from redis keys', async () => {
  const mockedRedis = {
    async save() {
      return 'OK';
    },
    async get() {
      return null;
    },
    async getAllKeys() {
      return ['conversation:a', 'conversation:b'];
    },
    async remove() {
      return 0;
    },
  };

  const { module: service, restore } = loadModuleWithMocks(path.join(__dirname, '..', 'service', 'service.js'), {
    '../redis/redis.js': mockedRedis,
    uuid: { v4: () => 'generated-id' },
    '@langchain/core/messages': { HumanMessage, AIMessage },
  });

  try {
    const threadIds = await service.getAllThreads();
    assert.deepEqual(threadIds, ['a', 'b']);
  } finally {
    restore();
  }
});

test('deleteConversation returns the redis delete result', async () => {
  const mockedRedis = {
    async save() {
      return 'OK';
    },
    async get() {
      return null;
    },
    async getAllKeys() {
      return [];
    },
    async remove(key) {
      assert.equal(key, 'conversation:thread-1');
      return 1;
    },
  };

  const { module: service, restore } = loadModuleWithMocks(path.join(__dirname, '..', 'service', 'service.js'), {
    '../redis/redis.js': mockedRedis,
    uuid: { v4: () => 'generated-id' },
    '@langchain/core/messages': { HumanMessage, AIMessage },
  });

  try {
    const deleted = await service.deleteConversation('thread-1');
    assert.equal(deleted, 1);
  } finally {
    restore();
  }
});
