const express = require("express");
const router = express.Router();
const authenticate = require("../auth_middleware/auth.js");
const meditationsController = require("../meditations_operations/controller/controller.js");
const orchestratorController = require("../orchestrator_operations/controller/controller.js");
const controller = require("../controller/controller.js");

router.post("/conversations", authenticate, controller.createConversation);
router.post("/conversations/:threadId/meditations", authenticate, meditationsController.addMeditationsMessage);
router.post("/conversations/:threadId/orchestrator", authenticate, orchestratorController.addOrchestratorMessage);
router.get("/conversations/:threadId", authenticate, controller.getChatHistory);
router.get("/conversations", authenticate, controller.getKeys);
router.delete("/conversations/:threadId", authenticate, controller.deleteChat);

module.exports = router;