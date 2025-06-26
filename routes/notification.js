const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authMiddleware");
const notificationController = require("../controllers/notificationController");

router.get("/", verifyToken, notificationController.getNotifications);
router.post("/read", verifyToken, notificationController.markAsRead);
router.delete("/clear", verifyToken, notificationController.clearNotifications); // ✅ EKLENDİ

module.exports = router;
