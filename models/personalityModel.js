const mongoose = require("mongoose");

const PersonalitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  q1: { type: String, required: true },
  q2: { type: String, required: true },
  q3: { type: String, required: true },
  q4: { type: String, required: true }, // ✅ yeni eklendi
  personalityType: { type: String }
});


module.exports = mongoose.model("Personality", PersonalitySchema);
