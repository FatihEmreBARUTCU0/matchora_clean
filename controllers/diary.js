const Diary = require('../models/diaryModel');
const Personality = require('../models/personalityModel');
const Match = require("../models/matchModel");
const Notification = require("../models/notificationModel"); 


// ✅ 1. Kişilik tipine göre eşleşen günlükleri getir (Keşfet)
exports.getMatchingDiaries = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ message: "Giriş yapılmamış." });

    const personality = await Personality.findOne({ userId });
    if (!personality || !personality.q1 || !personality.q2 || !personality.q3 || !personality.q4)
      return res.status(404).json({ message: "Kişilik tipi bulunamadı." });

    const type = personality.q1 + personality.q2 + personality.q3 + personality.q4;
    const allDiaries = await Diary.find({ personalityType: type }).sort({ createdAt: -1 });

    const filtered = [];

    for (const diary of allDiaries) {
      const match = await Match.findOne({
        diary: diary._id,
        $or: [{ user1: userId }, { user2: userId }],
        hiddenFor: { $ne: userId }
      });

      if (!match) {
        filtered.push({
          ...diary._doc,
          commentCount: diary.comments.length,
          matchCount: await Match.countDocuments({ diary: diary._id })
        });
        continue;
      }

      if (
        (match.user1.toString() === userId && match.leftByUser1) ||
        (match.user2.toString() === userId && match.leftByUser2)
      ) {
        continue;
      }
    }

    res.status(200).json(filtered);
  } catch (err) {
    console.error("Günlükleri alma hatası:", err);
    res.status(500).json({ message: "Sunucu hatası." });
  }
};

// ✅ 2. Yeni günlük gönder
exports.submitDiary = async (req, res) => {
  try {
    const { content, personalityType } = req.body;
    const userId = req.user?.id || null;

    if (!content) return res.status(400).json({ message: "İçerik boş olamaz." });

    let finalType = personalityType;
    if (!finalType && userId) {
      const personality = await Personality.findOne({ userId });
      if (!personality) return res.status(400).json({ message: "Kişilik tipi eksik." });

      finalType = personality.q1 + personality.q2 + personality.q3 + personality.q4;
    }

    const newDiary = new Diary({ userId, content, personalityType: finalType });
    await newDiary.save();

    res.status(201).json({ message: "Günlük kaydedildi." });
  } catch (err) {
    console.error("Günlük kaydetme hatası:", err);
    res.status(500).json({ message: "Sunucu hatası." });
  }
};

// ✅ 3. Tüm günlükleri getir (Ana sayfa)
exports.getAllDiaries = async (req, res) => {
  try {
    const currentUserId = req.user?.id;
    const allDiaries = await Diary.find().sort({ createdAt: -1 });

    const hiddenMatches = currentUserId
      ? await Match.find({ hiddenFor: currentUserId }).select("diary")
      : [];

    const hiddenDiaryIds = hiddenMatches.map(m => m.diary.toString());

    const visibleDiaries = allDiaries.filter(d => !hiddenDiaryIds.includes(d._id.toString()));

    const enriched = await Promise.all(
      visibleDiaries.map(async diary => ({
        ...diary._doc,
        commentCount: diary.comments.length,
        matchCount: await Match.countDocuments({ diary: diary._id })
      }))
    );

    res.status(200).json(enriched);
  } catch (err) {
    console.error("Günlükleri alma hatası:", err);
    res.status(500).json({ message: "Sunucu hatası." });
  }
};

// ✅ 4. Yorumu beğen → eşleşme başlat
exports.likeComment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { diaryId, commentId } = req.params;

    const diary = await Diary.findById(diaryId);
    if (!diary) return res.status(404).json({ message: "Günlük bulunamadı." });

    const comment = diary.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: "Yorum bulunamadı." });

    if (comment.blocked) {
      return res.status(403).json({ message: "Bu yorum daha önce eşleşmeden çıkarıldı. Tekrar eşleşemezsiniz." });
    }

    if (comment.matched) {
      return res.status(409).json({ message: "Bu yorum zaten eşleşmiş." });
    }

    if (comment.userId.toString() === userId) {
      return res.status(403).json({ message: "Kendi yorumunuzla eşleşemezsiniz." });
    }

    const existingMatch = await Match.findOne({
      diary: diaryId,
      $or: [
        { user1: userId, user2: comment.userId },
        { user1: comment.userId, user2: userId }
      ]
    });

    if (existingMatch) {
      return res.status(409).json({ message: "Bu günlükte bu kullanıcıyla zaten eşleştiniz." });
    }

    comment.matched = true;
    await diary.save();

    const match = new Match({
      diary: diaryId,
      comment: {
        content: comment.content,
        createdAt: comment.createdAt
      },
      user1: userId,
      user2: comment.userId,
      messages: [],
      hiddenFor: []
    });

    await match.save();
    // 🔔 Bildirim oluştur
  await Notification.create({
 userId: comment.userId,
  type: "match",
  content: "Yorumun beğenildi ve eşleşme başladı!", // ✅ Doğru olan bu
  link: "/mesajlar"
});



    return res.status(201).json({ message: "Eşleşme başarıyla oluşturuldu.", matchId: match._id });

  } catch (err) {
    console.error("❌ Yorum beğenme hatası:", err);
    return res.status(500).json({ message: "Sunucu hatası." });
  }
};

// ✅ 5. Günlüğe yorum yap
exports.commentDiary = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { content } = req.body;
    const { id } = req.params;

    if (!content) return res.status(400).json({ message: "Yorum boş olamaz." });

    const diary = await Diary.findById(id);
    if (!diary) return res.status(404).json({ message: "Günlük bulunamadı." });

    // Kullanıcının zaten yorum yapıp yapmadığını kontrol et (1 kullanıcı 1 yorum)
    const alreadyCommented = diary.comments.some(c => c.userId.toString() === userId);
    if (alreadyCommented) {
      return res.status(400).json({ message: "Bu günlüğe zaten yorum yaptınız." });
    }

    diary.comments.push({ userId, content });
    await diary.save();
 await Notification.create({
  userId: diary.userId,
  type: "comment",
  content: "Günlüğüne yeni bir yorum geldi!",
  link: `/gunlukler` // 🔧 burası düzeltildi
});


    return res.status(201).json({ message: "Yorum başarıyla eklendi." });
  } catch (err) {
    console.error("Yorum ekleme hatası:", err);
    return res.status(500).json({ message: "Sunucu hatası." });
  }
};

// ✅ 6. Günlük sil
exports.deleteDiary = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    const diary = await Diary.findById(id);
    if (!diary) return res.status(404).json({ message: "Günlük bulunamadı." });
    if (diary.userId.toString() !== userId)
      return res.status(403).json({ message: "Bu günlük size ait değil." });

    await Diary.findByIdAndDelete(id);
    res.status(200).json({ message: "Günlük silindi." });
  } catch (err) {
    console.error("Günlük silme hatası:", err);
    res.status(500).json({ message: "Sunucu hatası." });
  }
};

// ✅ 7. Eşleşmiş yorumları getir
exports.getMatchedComments = async (req, res) => {
  try {
    const userId = req.user?.id;

    const matches = await Match.find({
      $or: [{ user1: userId }, { user2: userId }],
      hiddenFor: { $ne: userId }
    }).populate({
      path: "diary",
      select: "content personalityType createdAt"
    });

    const result = matches.map(m => ({
      diaryId: m.diary?._id,
      diaryContent: m.diary?.content,
      personalityType: m.diary?.personalityType,
      createdAt: m.comment?.createdAt || m.diary?.createdAt,
      comment: m.comment?.content
    }));

    res.status(200).json(result);
  } catch (err) {
    console.error("Matched yorumlar alınamadı:", err);
    res.status(500).json({ message: "Sunucu hatası." });
  }
};
