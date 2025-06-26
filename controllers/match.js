const Match = require("../models/matchModel");
const Diary = require("../models/diaryModel");
const { createNotification } = require("./notificationController");

// ✅ 1. Giriş yapan kullanıcının eşleşmelerini getir
exports.getMatches = async (req, res) => {
  try {
    const userId = req.user.id;

    const matches = await Match.find({
      $or: [{ user1: userId }, { user2: userId }],
      hiddenFor: { $ne: userId }
    })
      .populate("diary", "content personalityType")
      .populate("user1", "username")
      .populate("user2", "username")
      .sort({ createdAt: -1 });

    res.status(200).json(matches);
  } catch (err) {
    console.error("❌ Eşleşme alma hatası:", err);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

exports.getMessagesByMatchId = async (req, res) => {
  try {
    const matchId = req.params.matchId;
    const userId = req.user.id;

    const match = await Match.findById(matchId);
    if (!match) return res.status(404).json({ message: "Eşleşme bulunamadı" });

    if (match.user1.toString() !== userId && match.user2.toString() !== userId) {
      return res.status(403).json({ message: "Bu eşleşmeye erişim izniniz yok" });
    }

    if (
      (match.user1.toString() === userId && match.leftByUser1) ||
      (match.user2.toString() === userId && match.leftByUser2)
    ) {
      return res.status(403).json({ message: "Bu eşleşmeden çıktığınız için mesaj geçmişi gizlenmiştir." });
    }

    // Kullanıcı için en son silme zamanı varsa, sadece sonrası mesajlar gösterilir
    const hideEntry = match.hiddenTimestamps?.find(e => e.userId.toString() === userId);
    const filteredMessages = hideEntry
      ? match.messages.filter(msg => new Date(msg.createdAt) > new Date(hideEntry.timestamp))
      : match.messages;

    res.status(200).json(filteredMessages);
  } catch (err) {
    console.error("❌ Mesaj alma hatası:", err);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};


exports.sendMessage = async (req, res) => {
  try {
    const matchId = req.params.matchId;
    const userId = req.user.id;
    const { content } = req.body;

    const match = await Match.findById(matchId);
    if (!match) return res.status(404).json({ message: "Eşleşme bulunamadı" });

    if (match.user1.toString() !== userId && match.user2.toString() !== userId) {
      return res.status(403).json({ message: "Bu eşleşmeye mesaj gönderemezsiniz" });
    }

    if (
      (match.user1.toString() === userId && match.leftByUser1) ||
      (match.user2.toString() === userId && match.leftByUser2)
    ) {
      return res.status(403).json({ message: "Bu eşleşmeden çıktığınız için mesaj gönderemezsiniz." });
    }

    const userMessageCount = match.messages.filter(
      msg => msg.senderId.toString() === userId
    ).length;

    if (!match.isUnlimited && userMessageCount >= 5) {
      return res.status(400).json({ message: "Mesaj limitine ulaştınız (5 mesaj)" });
    }

    match.messages.push({
      senderId: userId,
      content,
      createdAt: new Date()
    });

    await match.save();

    // 🔔 Bildirim gönder
    const otherUserId = match.user1.toString() === userId ? match.user2 : match.user1;

    await createNotification({
      userId: otherUserId,
      type: "message",
      content: "Yeni bir mesajın var!",
      link: "/mesajlar"
    });

    return res.status(200).json({ message: "Mesaj gönderildi", messages: match.messages });
  } catch (err) {
    console.error("❌ Mesaj gönderme hatası:", err);
    return res.status(500).json({ message: "Sunucu hatası" });
  }
};




// ✅ 4. Memnuniyet onayı → sınırsız mesajlaşma
exports.approveMatch = async (req, res) => {
  try {
    const matchId = req.params.matchId;
    const userId = req.user.id;

    const match = await Match.findById(matchId);
    if (!match) return res.status(404).json({ message: "Eşleşme bulunamadı" });

    if (match.user1.toString() !== userId && match.user2.toString() !== userId) {
      return res.status(403).json({ message: "Erişim izniniz yok" });
    }

    if (match.user1.toString() === userId) match.approvedByUser1 = true;
    if (match.user2.toString() === userId) match.approvedByUser2 = true;

    if (match.approvedByUser1 && match.approvedByUser2) {
      match.isUnlimited = true;

      // 🔔 Bildirim gönder her iki tarafa
      await createNotification({
        userId: match.user1,
        type: "chat",
        content: "Eşleşmeniz onaylandı! Artık  sohbet edebilirsiniz.",
        link: `/mesajlar`
      });

      await createNotification({
        userId: match.user2,
        type: "chat",
        content: "Eşleşmeniz onaylandı! Artık sohbet edebilirsiniz.",
        link: `/mesajlar`
      });
    }

    await match.save();

    res.status(200).json({
      message: "Onay başarıyla verildi",
      isUnlimited: match.isUnlimited
    });
  } catch (err) {
    console.error("❌ Onay hatası:", err);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};


// ✅ 5. Eşleşmeden çık (yorum block, görünüm gizle)
exports.leaveMatch = async (req, res) => {
  try {
    const matchId = req.params.matchId;
    const userId = req.user?.id;

    const match = await Match.findById(matchId);
    if (!match) return res.status(404).json({ message: "Eşleşme bulunamadı." });

    const diary = await Diary.findById(match.diary);
    if (diary) {
      const comment = diary.comments.find(c =>
        c.content === match.comment.content &&
        new Date(c.createdAt).getTime() === new Date(match.comment.createdAt).getTime()
      );
      if (comment) {
        comment.matched = false;
        comment.blocked = true;
        await diary.save();
      }
    }

    if (!match.hiddenFor.includes(userId)) {
      match.hiddenFor.push(userId);
      if (match.user1.toString() === userId) match.leftByUser1 = true;
      if (match.user2.toString() === userId) match.leftByUser2 = true;
      await match.save();
    }

    // 🔔 Bildirimi her zaman gönder (if bloğunun dışında!)
    const otherUserId =
      match.user1.toString() === userId ? match.user2 : match.user1;

      console.log("💔 Eşleşme sona erdi bildirimi tetiklendi:", otherUserId);
    await createNotification({
      userId: otherUserId,
      type: "unmatch",
      content: "Eşleşme sona erdi. Artık bu kişiyle mesajlaşamazsınız.",
      link: "/mesajlar",
      
    });

    return res.status(200).json({ message: "Eşleşme kaldırıldı ve tekrar eşleşme engellendi." });
  } catch (err) {
    console.error("❌ Eşleşmeden çıkış hatası:", err);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};


// ✅ 6. Belirli eşleşmenin durumunu getir (mesaj kutusu kontrolü için)
exports.getMatchById = async (req, res) => {
  try {
    const match = await Match.findById(req.params.matchId);

    if (!match) return res.status(404).json({ message: "Eşleşme bulunamadı." });

    const currentUserId = req.user.id;

    const otherUserId =
      String(match.user1) === currentUserId ? String(match.user2) : String(match.user1);

    const isHiddenByOther = match.hiddenFor.includes(otherUserId);
    const iAmHiddenByOther = match.hiddenFor.includes(currentUserId); // ✅ yeni bilgi

    return res.json({
      isUnlimited: match.isUnlimited,
      isHiddenByOther,
      iAmHiddenByOther, // ✅ geri döndürüyoruz
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};


exports.hideMatchForUser = async (req, res) => {
  try {
    const matchId = req.params.matchId;
    const userId = req.user.id;

    const match = await Match.findById(matchId);
    if (!match) return res.status(404).json({ message: "Eşleşme bulunamadı." });

    // ✅ hiddenFor dizisine ekle (hala gerekli)
    if (!match.hiddenFor.includes(userId)) {
      match.hiddenFor.push(userId);
    }

    // ✅ hiddenTimestamps dizisini güncelle
    const existing = match.hiddenTimestamps?.find(e => e.userId.toString() === userId);
    const now = new Date();

    if (existing) {
      existing.timestamp = now; // varsa güncelle
    } else {
      match.hiddenTimestamps = match.hiddenTimestamps || [];
      match.hiddenTimestamps.push({ userId, timestamp: now });
    }

    await match.save();

    res.status(200).json({ message: "Sohbet sadece sizde silindi." });
  } catch (err) {
    console.error("❌ Sohbet gizleme hatası:", err);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

