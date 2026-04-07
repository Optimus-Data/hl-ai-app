const { orchestratorApp } = require('../../chatbot_config/orchestrator_config/initialize_llm.js');
const { save, get } = require('../../redis/redis.js');
const { HumanMessage, AIMessage } = require("@langchain/core/messages");

const fs = require('fs');
const path = require('path');

const badWordsFilePath = path.resolve(__dirname, '../../../assets/bad_words.txt');

function loadBadWords() {
  const fileContent = fs.readFileSync(badWordsFilePath, 'utf-8');
  return fileContent.split('\n').map(w => w.trim().toLowerCase()).filter(Boolean);
}

function containsBadWords(message, badWords) {
  const normalizedMessage = message.toLowerCase();
  return badWords.some(word => normalizedMessage.includes(word));
}


const serializeMessages = (messages) => {
  return messages.map(msg => ({
	type: msg._getType ? msg._getType() : (msg.type || "unknown"),
	content: msg.content,
	additional_kwargs: msg.additional_kwargs || {}
  }));
};

const deserializeMessages = (serializedMessages) => {
  return serializedMessages.map(msg => {
	if (msg.type === 'human') {
	  return new HumanMessage(msg.content);
	} else if (msg.type === 'ai') {
	  return new AIMessage(msg.content, msg.additional_kwargs);
	} else {
	  return { type: msg.type, content: msg.content };
	}
  });
};

async function getOrchestratorConversation(threadId) {
  if (!threadId) {
    return null;
  }  
  const key = `conversation:${threadId}`;
  const data = await get(key);
  
  if (!data) {
    return null;
  }

  return {
    ...data,
    messages: deserializeMessages(data.messages)
  };
}

async function processAddOrchestratorMessage(threadId, message) {
  const badWords = loadBadWords();
  
if (containsBadWords(message, badWords)) {
  return {
    threadId,
    responseMessage: {
      type: 'ai',
      content: 'Por favor, mantenha a conversa respeitosa.'
    },
    censored: true
  };
}
  const conversation = await getOrchestratorConversation(threadId);
  
  if (!conversation) {
    throw new Error('Conversa não encontrada');
  }
  
  const currentMessages = conversation.messages;
  const input = [
    ...currentMessages,
    new HumanMessage(message)
  ];
  
  const config = { configurable: { thread_id: threadId } };
  const output = await orchestratorApp.invoke({ messages: input }, config); 
  const responseMessage = output.messages[output.messages.length - 1];  
  const updatedMessages = [...input, responseMessage];
  
  const updatedConversation = {
    messages: serializeMessages(updatedMessages), 
    updatedAt: new Date().toISOString(),
    messageCount: updatedMessages.length
  };
  
  const key = `conversation:${threadId}`;
  await save(key, updatedConversation);
  
  return {
    threadId,
    responseMessage: {
      type: responseMessage._getType ? responseMessage._getType() : 'ai',
      content: responseMessage.content
    }
  };
}


module.exports = {
  processAddOrchestratorMessage,
  getOrchestratorConversation
};
