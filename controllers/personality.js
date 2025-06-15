const Personality = require('../models/personalityModel');
const User = require('../models/userModel');
const { getSpiritAnimal } = require('../utils/spiritAnimalMap');

exports.submitPersonality = async (req, res) => {
  const userId = req.user.id;
  const { q1, q2, q3, q4 } = req.body;

  if (!q1 || !q2 || !q3 || !q4) {
    return res.status(400).json({ message: "Tüm sorular zorunludur." });
  }

  try {
    const personalityType = q1 + q2 + q3 + q4;

    // ✅ Hayvan haritasından tür ve resim bilgisi al
    const { animalName, imageUrl } = getSpiritAnimal(personalityType, req.user.gender);

    // ✅ Eski varsa güncelle, yoksa oluştur
    await Personality.findOneAndUpdate(
      { userId },
      { q1, q2, q3, q4, personalityType },
      { upsert: true, new: true }
    );

    // ✅ User modelini güncelle
    await User.findByIdAndUpdate(userId, {
      personalityType,
      personalityCode: personalityType,
      spiritAnimalName: animalName,
      spiritAnimalImageUrl: imageUrl
    });

    res.json({
      message: "Kişilik başarıyla kaydedildi.",
      personalityType,
      spiritAnimalName: animalName,
      spiritAnimalImageUrl: imageUrl
    });
  } catch (err) {
    console.error("Kişilik hatası:", err);
    res.status(500).json({ message: "Sunucu hatası." });
  }
};
