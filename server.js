const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');

// Import routes
const studySessionRoutes = require('./src/routes/studySessionRoutes');
const resourceRoutes = require('./src/routes/resourceRoutes');
const userRoutes = require('./src/routes/userRoutes');
const searchRoutes = require('./src/routes/searchRoutes');
const interestRoutes = require('./src/routes/interestRoutes');
const buddyRoutes = require('./src/routes/buddyRoutes');
const googleAuthRoutes = require('./src/routes/googleAuthRoutes');
const profileRoutes = require('./src/routes/profileRoutes');
const chatRoutes = require('./src/routes/chatRoutes');
const postRoutes = require('./src/routes/postRoutes');

const Message = require('./src/models/Message');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
    },
});
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Connect to MongoDB
mongoose
    .connect(process.env.MONGO_URI || process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('Could not connect to MongoDB:', err));

// Use routes
app.use('/api/users', userRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/sessions', studySessionRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/interests', interestRoutes);
app.use('/api/buddies', buddyRoutes);
app.use('/api/auth', googleAuthRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/posts', postRoutes);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src', 'views'));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.get("/", (req, res) => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  res.render("home", { base_url: baseUrl });
});

io.on('connection', (socket) => {
    console.log('a user connected:', socket.id);
    socket.on('joinRoom', (room) => {
        socket.join(room);
        console.log(`User ${socket.id} joined room ${room}`);
    });
    socket.on('sendMessage', async (data) => {
        const { sender, recipient, message, room } = data;
        try {
            const newMessage = new Message({
                sender,
                recipient,
                message,
            });
            await newMessage.save();
            io.to(room).emit('message', {
                sender,
                recipient,
                message,
                timestamp: newMessage.timestamp,
            });
        } catch (error) {
            console.error('Error saving/sending message:', error);
        }
    });
    socket.on('disconnect', () => {
        console.log('user disconnected:', socket.id);
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
