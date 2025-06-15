const User = require('../models/userModel');
const Personality = require('../models/personalityModel');
const Diary = require('../models/diaryModel');
const Match = require('../models/matchModel');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getSpiritAnimal } = require('../utils/spiritAnimalMap');

// Kullanıcı Kaydı
exports.registerUser = async (req, res) => {
  const { username, email, password, gender } = req.body;

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Bu e-posta zaten kayıtlı." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      username,
      email,
      password: hashedPassword,
      gender
    });
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'gizli', {
      expiresIn: '1d'
    });

    res.status(201).json({ token });
  } catch (err) {
    console.error("❌ Kayıt hatası:", err);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

// Giriş
exports.loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Kullanıcı bulunamadı" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Şifre yanlış" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'gizli', {
      expiresIn: '1d'
    });

    res.status(200).json({ token });
  } catch (err) {
    console.error("❌ Giriş hatası:", err);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

// Kimlik Bilgisi
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "username email createdAt personalityType matchCount lastLoginDate personalityCode gender"
    );

    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı." });

    const { img: spiritAnimalImageUrl, label: spiritAnimalName } = getSpiritAnimal(
      user.personalityCode,
      user.gender
    );

    res.status(200).json({
      _id: user._id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      personalityType: user.personalityType,
      personalityCode: user.personalityCode,
      matchCount: user.matchCount,
      lastLoginDate: user.lastLoginDate,
      gender: user.gender,
      spiritAnimalImageUrl,
      spiritAnimalName
    });
  } catch (err) {
    console.error("getMe Hatası:", err);
    res.status(500).json({ message: "Sunucu hatası." });
  }
};

// Çıkış
exports.logoutUser = (req, res) => {
  res.status(200).json({ message: "Çıkış başarılı. (stateless API)" });
};

// ✅ Kullanıcı ve ilişkili tüm verileri sil
exports.deleteUser = async (req, res) => {
  try {
    const userId = req.user.id;

    await User.findByIdAndDelete(userId);
    await Personality.deleteMany({ userId });
    await Diary.deleteMany({ userId });
    await Match.deleteMany({
      $or: [{ user1: userId }, { user2: userId }]
    });

    res.json({ message: "Kullanıcı ve ilişkili tüm veriler silindi." });
  } catch (err) {
    console.error("Silme hatası:", err);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

// Profil güncelle
exports.updateProfile = async (req, res) => {
  const userId = req.user.id;
  const { username, email } = req.body;

  try {
    const existingEmail = await User.findOne({ email, _id: { $ne: userId } });
    if (existingEmail) {
      return res.status(400).json({ message: "Bu e-posta zaten kullanılıyor." });
    }

    const existingUsername = await User.findOne({ username, _id: { $ne: userId } });
    if (existingUsername) {
      return res.status(400).json({ message: "Bu kullanıcı adı zaten alınmış." });
    }

    const updated = await User.findByIdAndUpdate(
      userId,
      { username, email },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: "Profil güncellendi",
      user: {
        _id: updated._id,
        username: updated.username,
        email: updated.email
      }
    });
  } catch (err) {
    console.error("Profil güncelleme hatası:", err);
    res.status(500).json({ message: "Sunucu hatası." });
  }
};

// Şifre güncelle
exports.changePassword = async (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "Kullanıcı bulunamadı." });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: "Mevcut şifre yanlış." });

    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    res.status(200).json({ message: "Şifre başarıyla değiştirildi." });
  } catch (err) {
    console.error("Şifre değiştirme hatası:", err);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

// Kullanıcı adı güncelle
exports.updateUsername = async (req, res) => {
  try {
    const userId = req.user.id;
    const { username } = req.body;

    if (!username || username.length < 3) {
      return res.status(400).json({ message: "Kullanıcı adı en az 3 karakter olmalı." });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser && String(existingUser._id) !== userId) {
      return res.status(409).json({ message: "Bu kullanıcı adı zaten alınmış." });
    }

    const updatedUser = await User.findByIdAndUpdate(userId, { username }, { new: true });

    res.json({
      message: "Kullanıcı adı güncellendi.",
      username: updatedUser.username
    });
  } catch (err) {
    console.error("Kullanıcı adı güncelleme hatası:", err);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};
