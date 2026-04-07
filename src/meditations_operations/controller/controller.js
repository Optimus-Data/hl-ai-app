const { processAddMeditationsMessage } = require("../service/service.js");

async function addMeditationsMessage(req, res) {
  try {
    const { threadId } = req.params;
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: "Mensagem não fornecida" });
    }
    
    const result = await processAddMeditationsMessage(threadId, message);
    res.json(result);
  } catch (error) {
    console.error("Erro ao adicionar mensagem:", error);
    
    if (error.message === "Conversa não encontrada") {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ error: "Falha ao adicionar mensagem" });
  }
}

module.exports = { 
  addMeditationsMessage
}
