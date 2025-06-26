const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Bildirimi alan kişi
type: { type: String, enum: ["comment", "match", "message", "unmatch", "chat"], required: true },
  content: { type: String, required: true }, // Bildirim mesajı
  link: { type: String }, // tıklanabilir rota (örn: /mesajlar)
  isRead: { type: Boolean, default: false }, // okunup okunmadığı
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Notification", notificationSchema);
