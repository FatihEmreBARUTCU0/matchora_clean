const express = require('express');
const router = express.Router();
const diaryController = require('../controllers/diary');
const verifyToken = require('../middleware/authMiddleware');

// Günlük gönderme (sadece giriş yapan kullanıcı)
router.post('/submit', verifyToken, diaryController.submitDiary);

// Kişilik uyumu ile günlükleri filtrele (girişli)
router.get('/match', verifyToken, diaryController.getMatchingDiaries);

// Tüm günlükleri getir (herkese açık)
router.get('/all', diaryController.getAllDiaries);

// Günlüğe yorum yapma (girişli)
router.post('/:id/comment', verifyToken, diaryController.commentDiary);

// Yorumu beğenme ve eşleşme başlatma (girişli)
router.post('/:diaryId/comment/:commentId/like', verifyToken, diaryController.likeComment);

// Günlüğü silme (girişli)
router.delete('/:id', verifyToken, diaryController.deleteDiary);

// Kullanıcının eşleştiği günlükleri getirme (girişli)
router.get('/matched', verifyToken, diaryController.getMatchedComments);


module.exports = router;
