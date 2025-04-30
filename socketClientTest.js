// File: socketClientTest.js
const io = require('socket.io-client');

const backendUrl = 'http://localhost:5000';

// >>> REPLACE THESE WITH THE ACTUAL _id VALUES YOU GOT FROM REGISTRATION <<<
const testSenderId = '680d20f962a12428ebef969b'; // Use the ID from one of the users
const testRecipientId = '680d1f4662a12428ebef9697'; // Use the ID from the other user

// Make sure sender and recipient are different if you want to simulate a chat between two users

const testRoom = 'room_between_' + testSenderId + '_and_' + testRecipientId;

const socket = io(backendUrl);

socket.on('connect', () => {
  console.log('Connected to backend Socket.IO server');
  console.log('Socket ID:', socket.id);

  console.log('Joining room:', testRoom);
  socket.emit('joinRoom', testRoom);

  setTimeout(() => {
    const messageData = {
      sender: testSenderId,
      recipient: testRecipientId,
      message: 'Hello from the test client with real IDs!',
      room: testRoom
    };
    console.log('Sending message:', messageData);
    socket.emit('sendMessage', messageData);
  }, 1000);
});

socket.on('message', (receivedMessage) => {
  console.log('Message received from server:', receivedMessage);
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected from backend Socket.IO server:', reason);
});

socket.on('connect_error', (error) => {
    console.error('Socket.IO connection error:', error);
});