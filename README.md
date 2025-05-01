# Guade Study Buddy API

A comprehensive backend API for the Study Buddy application, designed to facilitate collaborative learning and study group management.

## 🚀 Features

- 👥 User Authentication & Authorization
- 📚 Study Session Management
- 👥 Buddy Group System
- 💬 Real-time Chat
- 📝 Posts and Comments
- 🔍 Search Functionality
- 📅 Session Scheduling
- 🎯 Interest-based Matching

## 🛠️ Technologies

- Node.js
- Express.js
- MongoDB with Mongoose
- Socket.IO for real-time communication
- JWT for authentication
- Google Auth for social login
- Nodemailer for email notifications
## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn
## ⚙️ Installation

1. Clone the repository:
```bash
git clone <https://github.com/rebiraolin/Guade_study-buddy_node.git>
cd study-buddy-api
```

2. Install dependencies:
```bash
npm install
```
3. Create a `.env` file in the root directory with the following variables:
```env
MONGODB_URI=mongodb://your_mongodb_uri
JWT_SECRET=your_jwt_secret
PORT=5000
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
EMAIL_SERVICE=your_email_service
EMAIL_USER=your_email_username
EMAIL_PASSWORD=your_email_password
```

4. Start the server:
```bash
# Development mode
npm run dev

# Production mode
npm start
```

## 🔌 API Endpoints

### Authentication

POST /api/users/register - Register a new user
POST /api/users/login - Login user
POST /api/users/forgot-password - Request password reset
POST /api/users/reset-password/:token - Reset password
POST /api/users/signout - Sign out user

### Study Sessions

GET /api/sessions - Get all sessions
POST /api/sessions - Create a new session
GET /api/sessions/:id - Get session by ID
PUT /api/sessions/:id - Update session
DELETE /api/sessions/:id - Delete session
GET /api/sessions/upcoming/hour - Get upcoming sessions

### Buddy Groups

POST /api/buddies/groups - Create a buddy group
GET /api/buddies/groups - List buddy groups
GET /api/buddies/groups/:groupId - Get group details
POST /api/buddies/groups/:groupId/join - Join a group
POST /api/buddies/groups/:groupId/invite - Invite to group
POST /api/buddies/groups/:groupId/request - Request to join

### Posts

GET /api/posts - Get all posts
POST /api/posts - Create a post
GET /api/posts/:id - Get post by ID
PUT /api/posts/:id - Update post
DELETE /api/posts/:id - Delete post
POST /api/posts/:id/comments - Add comment

### Chat

GET /api/chat/messages - Get chat messages
## 🔒 Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:
Authorization: Bearer <your_token>
## 📱 Real-time Features

The API uses Socket.IO for real-time features:
- Chat messages
- Study session updates
- Group notifications
- Online status

## 🧪 Testing

Run the test suite:
```bash
npm test
```

## 📦 Project Structure
study-buddy-api/
├── src/
│ ├── config/
│ ├── controllers/
│ ├── middleware/
│ ├── models/
│ ├── routes/
│ ├── utils/
│ └── views/
├── server.js
├── package.json
└── README.md
## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/ amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull request
## 🙏 Acknowledgments

- Node.js community
- MongoDB team
- Express.js contributors