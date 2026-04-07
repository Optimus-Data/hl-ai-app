const { AIMessage } = require("@langchain/core/messages");
const {
    START,
    END,
    MessagesAnnotation,
    StateGraph,
    MemorySaver,
} = require("@langchain/langgraph");
const {
    createTrimmer,
    orchestrateInput,
} = require("./llm_config/llm_instance.js");

const callModel = async state => {
    console.log(
        "======= ACIONANDO TRIMMER - ESTABELECENDO VARIÁVEIS DE MEMÓRIA =======\n\n",
    );
    const trimmer = createTrimmer();
    if (!state.messages?.length) {
        throw new Error("SEM MENSAGENS EM state.messages!");
    }
    const trimmedMessages = trimmer(state.messages);
    let lastMessage = trimmedMessages[trimmedMessages.length - 1].content;
    const recentMessages = trimmedMessages
        .slice(-4)
        .map(msg => msg.content)
        .join("\n");
    try {
        orchestratedJson = JSON.stringify([
            {
                perguntas: [
                    {
                        tipo: "tipo_menu",
                        texto: lastMessage,
                    },
                ],
            },
        ]);

        console.log(
            "======================== INICIANDO FLUXO DE RESPOSTA =========================\n",
        );

        orchestratedJson = await orchestrateInput(lastMessage, recentMessages);
        console.log("\n\n");
        console.log("RESULTADO:");
        console.log(JSON.stringify(orchestratedJson, null, 2));
    } catch (error) {
        console.error(
            "ERRO AO CHAMAR O MODELO | FALLBACK | MENSAGEM DE ERRO:",
            error,
        );
    }
    return {
        messages: [
            new AIMessage({
                content: JSON.stringify(orchestratedJson),
            }),
        ],
    };
};

/*------------------------------------------------+
|================== SET GRAPH ====================|
+------------------------------------------------*/
const workflow = new StateGraph(MessagesAnnotation)
    .addNode("model", callModel)
    .addEdge(START, "model")
    .addEdge("model", END);

const orchestratorApp = workflow.compile({ checkpointer: new MemorySaver() });

module.exports = { orchestratorApp };
