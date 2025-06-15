const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth");
const verifyToken = require("../middleware/authMiddleware");

// Kayıt olma
router.post("/register", authController.registerUser);

// Giriş yapma
router.post("/login", authController.loginUser);

// Giriş yapan kullanıcı bilgisi
router.get("/me", verifyToken, authController.getMe);

// Çıkış yapma
router.post("/logout", verifyToken, authController.logoutUser);

//Hesap Silme
router.delete('/delete', verifyToken, authController.deleteUser); // ✅

router.put("/update-profile", verifyToken, authController.updateProfile);

router.put("/change-password", verifyToken, authController.changePassword);

router.put("/update-username", verifyToken, authController.updateUsername);

module.exports = router;
