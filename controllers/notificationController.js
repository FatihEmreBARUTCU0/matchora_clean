const Notification = require("../models/notificationModel");

// 🔔 Bildirimleri getir
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    console.error("Bildirim alma hatası:", err);
    res.status(500).json({ message: "Bildirimler alınamadı." });
  }
};

// 🆕 Yeni bildirim oluştur

exports.createNotification = async ({ userId, type, content, link }) => {
  try {
    console.log("✅ Bildirim yaratılıyor:", { userId, type, content }); // 👉 BURAYI EKLE
    const notification = new Notification({ userId, type, content, link });
    await notification.save();
  } catch (err) {
    console.error("❌ Bildirim oluşturma hatası:", err);
  }
};


// ✅ Bildirimleri okundu olarak işaretle
exports.markAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.user.id, isRead: false }, { isRead: true });
    res.json({ message: "Tüm bildirimler okundu olarak işaretlendi." });
  } catch (err) {
    console.error("Okundu işaretleme hatası:", err);
    res.status(500).json({ message: "İşlem başarısız." });
  }
};

exports.clearNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.user.id }); // ✅ düzeltildi
    res.status(200).json({ message: "Tüm bildirimler temizlendi." });
  } catch (err) {
    console.error("Bildirim temizleme hatası:", err);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};