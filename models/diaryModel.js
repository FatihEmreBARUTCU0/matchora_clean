const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  content: String,
  matched: { type: Boolean, default: false },
  blocked: { type: Boolean, default: false } // ❗ Eşleşmeden çıkınca işaretlenir
}, { timestamps: true });

const diarySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  content: String,
  personalityType: String,
  comments: [commentSchema]
}, { timestamps: true });

module.exports = mongoose.model('Diary', diarySchema);
