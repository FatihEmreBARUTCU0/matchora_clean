const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, unique: true },
  gender: { type: String, required: true },

  personalityType: { type: String, default: "Belirtilmemiş" },
  spiritAnimalImageUrl: { type: String, default: "" },
  matchCount: { type: Number, default: 0 },
  lastLoginDate: { type: Date, default: Date.now },

  personalityCode: { type: String, default: "" },        // ✅ eklendi
  spiritAnimalName: { type: String, default: "" }        // ✅ eklendi
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
