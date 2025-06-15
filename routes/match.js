const express = require("express");
const router = express.Router();
const matchController = require("../controllers/match");
const verifyToken = require("../middleware/authMiddleware");

// 🔐 Giriş yapan kullanıcının tüm eşleşmelerini getir
router.get("/", verifyToken, matchController.getMatches);

// 📩 Belirli bir eşleşmenin mesajlarını getir
router.get("/:matchId/messages", verifyToken, matchController.getMessagesByMatchId);

// ✉️ Yeni mesaj gönder (eşleşmeye bağlı)
router.post("/:matchId/messages", verifyToken, matchController.sendMessage);

// ✅ "Memnun kaldım" → sınırsız mesajlaşma onayı (her kullanıcı bir kez basar)
router.patch("/:matchId/approve", verifyToken, matchController.approveMatch);

// ❌ Eşleşmeden çık (komple sil)
router.post("/:matchId/leave", verifyToken, matchController.leaveMatch);


module.exports = router;
