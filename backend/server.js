const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Socket.io logic
const leaderboardData = [
  { name: "Alisher T.", score: 950, status: "tugatdi" },
  { name: "Malika B.", score: 820, status: "tugatdi" },
  { name: "Jasur K.", score: 750, status: "yechmoqda..." }
];

io.on('connection', (socket) => {
  console.log('Foydalanuvchi ulandi:', socket.id);
  
  // Initial leaderboard send
  socket.emit('leaderboard_update', leaderboardData);

  socket.on('submit_score', (data) => {
    // In a real app, you'd save this to DB first
    console.log('Yangi natija:', data);
    const existingIndex = leaderboardData.findIndex(p => p.name === data.name);
    if (existingIndex !== -1) {
      leaderboardData[existingIndex].score = data.score;
      leaderboardData[existingIndex].status = "tugatdi";
    } else {
      leaderboardData.push({ ...data, status: "tugatdi" });
    }
    
    // Broadcast to all clients
    io.emit('leaderboard_update', leaderboardData.sort((a,b) => b.score - a.score));
  });

  socket.on('disconnect', () => {
    console.log('Foydalanuvchi uzildi');
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/courses', require('./routes/courses'));
app.use('/api/stats', require('./routes/stats'));
// app.use('/api/ai', require('./routes/ai'));

app.get('/', (req, res) => {
  res.json({ message: 'Med-Zukkoo Full-Stack API is running', version: '2.0', socket: 'active' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Serverda xatolik yuz berdi' });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

