const Match = require("../models/matchModel");
const Diary = require("../models/diaryModel");

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

// ✅ 2. Belirli bir eşleşmenin mesajlarını getir
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

    res.status(200).json(match.messages || []);
  } catch (err) {
    console.error("❌ Mesaj alma hatası:", err);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};

// ✅ 3. Yeni mesaj gönder
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

    // Günlük yorumu disable et → tekrar eşleşilemesin
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

    // Kullanıcıyı gizli listeye ekle
    if (!match.hiddenFor.includes(userId)) {
      match.hiddenFor.push(userId);
      if (match.user1.toString() === userId) match.leftByUser1 = true;
      if (match.user2.toString() === userId) match.leftByUser2 = true;
      await match.save();
    }

    return res.status(200).json({ message: "Eşleşme kaldırıldı ve tekrar eşleşme engellendi." });
  } catch (err) {
    console.error("❌ Eşleşmeden çıkış hatası:", err);
    res.status(500).json({ message: "Sunucu hatası" });
  }
};
