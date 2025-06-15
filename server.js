const express = require("express");
const http = require("http"); // ✅ HTTP sunucusu için
const cors = require("cors");
const dotenv = require("dotenv");
const { Server } = require("socket.io"); // ✅ Socket.io

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const personalityRoutes = require("./routes/personality");
const diaryRoutes = require("./routes/diary");
const matchRoutes = require("./routes/match");

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app); // ✅ Express'i HTTP server'a bağla

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000", // frontend portun
    methods: ["GET", "POST"]
  }
});

// ✅ Socket bağlantısı
io.on("connection", (socket) => {
  console.log("🔌 Yeni bağlantı:", socket.id);

  socket.on("sendMessage", (data) => {
    console.log("📨 Mesaj alındı:", data);
    io.emit("receiveMessage", data); // herkese mesajı gönder
  });

  socket.on("disconnect", () => {
    console.log("❌ Kullanıcı ayrıldı:", socket.id);
  });
});

app.use(express.json());
app.use(cors());

app.use("/api/auth", authRoutes);
app.use("/api/personality", personalityRoutes);
app.use("/api/diary", diaryRoutes);
app.use("/api/match", matchRoutes);

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
  console.log(`✅ Sunucu çalışıyor: http://localhost:${PORT}`);
});
