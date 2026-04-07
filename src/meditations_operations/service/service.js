const { meditationsApp } = require('../../chatbot_config/meditations_config/initialize_llm.js');
const { save, get } = require('../../redis/redis.js');
const { HumanMessage, AIMessage } = require("@langchain/core/messages");

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

async function getMeditationsConversation(threadId) {
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

async function processAddMeditationsMessage(threadId, message) {
  const conversation = await getMeditationsConversation(threadId);
  
  if (!conversation) {
    return null;
  }
  
  const currentMessages = conversation.messages;
  const input = [
    ...currentMessages,
    new HumanMessage(message)
  ];
  
  const config = { configurable: { thread_id: threadId } };
  const output = await meditationsApp.invoke({ messages: input }, config); 
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
  processAddMeditationsMessage,
  getMeditationsConversation
};
