const express = require("express");
const http = require("http");
const cors = require("cors");
const dotenv = require("dotenv");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const personalityRoutes = require("./routes/personality");
const diaryRoutes = require("./routes/diary");
const matchRoutes = require("./routes/match");
const Match = require("./models/matchModel");
const notificationRoutes = require("./routes/notification");

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

io.on("connection", (socket) => {
  console.log("🔌 Yeni bağlantı:", socket.id);

  socket.on("sendMessage", async (data) => {
    try {
      const match = await Match.findById(data.matchId);
      if (!match) return;

      const receiverId =
        data.senderId === match.user1.toString()
          ? match.user2.toString()
          : match.user1.toString();

      // 💡 Alıcı sohbeti silmişse geri ekle
      if (match.hiddenFor.includes(receiverId)) {
        match.hiddenFor = match.hiddenFor.filter(id => id.toString() !== receiverId);
        await match.save();
      }

      io.emit("receiveMessage", data);
    } catch (err) {
      console.error("❌ Socket mesaj iletim hatası:", err.message);
    }
  });

  socket.on("disconnect", () => {
    console.log("❌ Kullanıcı ayrıldı:", socket.id);
  });
}); // ✅ Bu parantez eksikse o hatayı alırsın

app.use(express.json());
app.use(cors());

app.use("/api/auth", authRoutes);
app.use("/api/personality", personalityRoutes);
app.use("/api/diary", diaryRoutes);
app.use("/api/match", matchRoutes);
app.use("/api/notifications", notificationRoutes);

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
  console.log(`✅ Sunucu çalışıyor: http://localhost:${PORT}`);
});
