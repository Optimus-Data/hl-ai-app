const { loadRetrieverFromStore } = require("./config_model/db_utils.js");
const { AIMessage } = require("@langchain/core/messages");
const {
    START,
    END,
    MessagesAnnotation,
    StateGraph,
    MemorySaver,
} = require("@langchain/langgraph");
const {
    llm,
    classifier_llm,
    retrieval_llm,
    systemInstructions,
    classifierPrompt,
    retrievalPromptTemplate,
    createTrimmer,
    determineRetrievalNeed,
    handleDirectResponse,
    handleRetrieverResponse,
} = require("./config_model/llm_utils.js");

/*------------------------------------------------+
|=============== LOAD RETRIEVER ==================|
+------------------------------------------------*/
let retriever;
loadRetrieverFromStore()
    .then(r => {
        retriever = r;
    })
    .catch(err => {
        console.error("Failed to load retriever:", err);
    });

/*------------------------------------------------+
|================ MAIN FUNCTION ==================|
+------------------------------------------------*/
const callModel = async state => {
    const trimmer = createTrimmer();

    try {
        if (!state.messages?.length) {
            throw new Error("No messages available");
        }

        const trimmedMessages = trimmer(state.messages);
        const lastMessage = trimmedMessages[trimmedMessages.length - 1].content;

        const recentMessages = trimmedMessages
            .slice(-4)
            .filter(
                msg =>
                    msg?.content &&
                    !msg.content.toLowerCase().includes("olá") &&
                    !msg.content.includes("Sou o agente de IA"),
            )
            .map(msg => msg.content)
            .join("\n");
        //========  USE RETRIEVER? ========//
        const { relevance, retrieverQuery } = await determineRetrievalNeed(
            lastMessage,
            recentMessages,
            { retrievalPromptTemplate, retrieval_llm, classifierPrompt, classifier_llm },
        );
        if (relevance === "false") {
            return await handleDirectResponse(trimmedMessages, {
                llm,
                systemInstructions,
            });
        } else {
            //===========   USE RETRIEVER   ===========//
            return await handleRetrieverResponse(
                retrieverQuery,
                recentMessages,
                trimmedMessages,
                lastMessage,
                { llm, systemInstructions, retriever },
            );
        }
    } catch (error) {
        console.error("Erro no fluxo de meditacoes:", error);
        return {
            messages: [
                new AIMessage({
                    content:
                        'Estamos com dificuldades técnicas. Por favor, digite "atendente" para falar com um atendente.',
                }),
            ],
        };
    }
};

/*------------------------------------------------+
|================== SET GRAPH ====================|
+------------------------------------------------*/
const workflow = new StateGraph(MessagesAnnotation)
    .addNode("model", callModel)
    .addEdge(START, "model")
    .addEdge("model", END);

const meditationsApp = workflow.compile({ checkpointer: new MemorySaver() });

module.exports = { meditationsApp };
