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
    logDebugInfo,
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
        console.log("\n======== RELEVÂNCIA IDENTIFICADA ========");
        console.log(" => RELEVÂNCIA:", relevance);
        console.log(" => RETRIEVER QUERY:", retrieverQuery);
        if (relevance === "false") {
            console.log("\n======== SKIPPING RETRIEVER ========");
            console.log(
                "\n => GENERATING ANSWER AT:",
                new Date().toLocaleTimeString(),
            );
            console.log("======RELEVÂNCIA IDENTIFICADA", relevance);
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
                { llm, systemInstructions, retriever, logDebugInfo },
            );
        }
    } catch (error) {
        console.log("Error in callModel:", error);
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
