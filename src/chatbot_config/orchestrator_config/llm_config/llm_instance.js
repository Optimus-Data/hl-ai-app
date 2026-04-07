const { ChatOpenAI } = require("@langchain/openai");
const { orchestratorPrompt } = require("./prompt.js");
const fs = require("fs/promises");

/*-----------------------------------------------+
|================== SETUP LLM ===================|
+------------------------------------------------*/
const orchestrator_llm = new ChatOpenAI({
    model: "gpt-4o",
    temperature: 0.2,
});

// ========== TRIMMER - MEMORY HANDLING ========== \\
const createTrimmer = () => {
    return messages => {
        if (messages.length <= 800) return messages;
        return messages.slice(-800);
    };
};

// ========== FUNCTION - ORCHESTRATION ========== \\
const orchestrateInput = async (lastMessage, recentMessages) => {
    let orchestratedJson;
    try {
        const orchestrateAnswer = await orchestrator_llm.invoke([
            {
                role: "system",
                content: `O seu prompt de instruções: ${orchestratorPrompt}\n\n
                CLASSIFIQUE ESSE INPUT: ${lastMessage}\n\n
				USE AS MENSAGENS RECENTES COMO UM CONTEXTO AUXILIAR, NÃO AS CLASSIFIQUE: ${recentMessages}\n\n`,
            },
        ]);
        orchestratedJson = JSON.parse(orchestrateAnswer.content);
    } catch (error) {
        console.error(
            "ERRO AO ORQUESTRAR INPUT | FALLBACK | MENSAGEM DE ERRO:",
            error,
        );
        orchestratedJson = [
            {
                perguntas: [
                    {
                        tipo: "tipo_menu",
                        texto: lastMessage,
                    },
                ],
            },
        ];
    }
    return orchestratedJson;
};

module.exports = {
    createTrimmer,
    orchestrateInput,
};
