const mongoose = require("mongoose");

// Mesaj alt şeması
const MessageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// Eşleşme ana şeması
const MatchSchema = new mongoose.Schema({
  user1: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Günlük sahibi
  user2: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // Yorumu yapan kişi
  diary: { type: mongoose.Schema.Types.ObjectId, ref: "Diary", required: true },

  // Yorum bilgisi eşleşmeye gömülü tutulur
  comment: {
    content: { type: String, required: true },
    createdAt: { type: Date, required: true }
  },

  createdAt: { type: Date, default: Date.now },

  // Karşılıklı onay takibi (sınırsız sohbet için)
  approvedByUser1: { type: Boolean, default: false },
  approvedByUser2: { type: Boolean, default: false },
  isUnlimited: { type: Boolean, default: false }, // 5 mesaj sınırı kalktı mı?

  // Gizlenmiş eşleşmeler (örn: eşleşmeden çıkan kullanıcılar için)
  hiddenFor: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  // Mesaj geçmişi
  messages: {
    type: [MessageSchema],
    default: []
  },

  // Kim eşleşmeden çıktı takibi (isteğe bağlı kullanılır)
  leftByUser1: { type: Boolean, default: false },
  leftByUser2: { type: Boolean, default: false }
});

module.exports = mongoose.model("Match", MatchSchema);
