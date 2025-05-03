# Guade Study Buddy API

Guade Study Buddy is a collaborative platform that connects students for academic growth through study sessions, buddy groups, shared resources, and meaningful interactions. This backend provides a robust API for authentication, user management, group creation, interest tracking, session scheduling, and real-time communication.
Key Key Features

## 🚀 Features

- 👥 User Authentication & Authorization
- 📚 Study Session Management
- 👥 Buddy Group System
- 💬 Real-time Chat
- 📝 Posts and Comments
- 🔍 Search Functionality
- 📅 Session Scheduling
- 🎯 Interest-based Matching

## 🛠️ Technologies and packages used in our backend app

| **Technology**            | **Purpose**                                                                                   |
| ------------------------- | --------------------------------------------------------------------------------------------- |
| **Node.js**               | Runtime environment for running JavaScript on the server.                                     |
| **Express.js**            | Minimalist web framework for building RESTful APIs and handling routes/middleware.            |
| **MongoDB**               | NoSQL database for storing user profiles, sessions, interests, and resources.                 |
| **Mongoose**              | ODM (Object Data Modeling) library for interacting with MongoDB in an object-oriented manner. |
| **JWT (JSON Web Tokens)** | For user authentication and session management.                                               |
| **Multer**                | For handling file uploads (e.g., profile pictures, documents, videos).                        |
| **Socket.io**             | Enables real-time features like notifications via WebSocket.                                  |
| **Google OAuth**          | Enables users to sign in securely using their Google accounts.                                |
| **Nodemailer**            | Used for sending emails (e.g., notifications, verifications).                                 |
| **bcryptjs**              | For securely hashing and comparing passwords.                                                 |
| **dotenv**                | Manages environment variables securely through `.env` file.                                   |
| **express-validator**     | Validates and sanitizes user input (e.g., login forms, profile data).                         |
| **Morgan**                | HTTP request logger middleware — logs API calls for debugging.                                |
| **Nodemon** (Dev Tool)    | Automatically restarts server during development on file changes.                             |
| **RESTful API**           | Architectural style used for designing the backend endpoints.                                 |
| **MVC Architecture**      | Codebase is structured using Model-View-Controller for separation of concerns.                |
| **File System (fs)**      | For managing local file operations such as saving/deleting uploads.                           |
| **Postman**               | API testing and debugging tool used to interact with our backend endpoints.                  |


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

### User Authentication Routes
| Method | Endpoint                           | Description                                 |
| ------ | ---------------------------------- | ------------------------------------------- |
| POST   | `/api/users/register`              | Register a new user                         |
| POST   | `/api/users/login`                 | Log in a user and receive JWT token         |
| POST   | `/api/users/forgot-password`       | Request password reset via email            |
| POST   | `/api/users/reset-password/:token` | Reset password using the provided token     |
| POST   | `/api/users/signout`               | Sign out the user (requires authentication) |

### Google Authentication Route
| Method | Endpoint                   | Description                           |
| ------ | -------------------------- | ------------------------------------- |
| POST   | `/api/google/google-login` | Log in or register via Google account |

### Buddy System Routes

| Method | Endpoint                                | Description                                 |
| ------ | --------------------------------------- | ------------------------------------------- |
| POST   | `/api/buddies/groups`                   | Create a new buddy group                    |
| GET    | `/api/buddies/groups`                   | List all buddy groups                       |
| GET    | `/api/buddies/groups/:groupId`          | Get details of a specific buddy group       |
| POST   | `/api/buddies/groups/:groupId/join`     | Join a specific buddy group                 |
| POST   | `/api/buddies/groups/:groupId/invite`   | Invite a user to a buddy group              |
| POST   | `/api/buddies/groups/:groupId/request`  | Request to join a buddy group               |
| GET    | `/api/buddies/groups/:groupId/requests` | List join requests for a buddy group        |
| POST   | `/api/buddies/groups/:groupId/approve`  | Approve a join request to a buddy group     |
| POST   | `/api/buddies/groups/:groupId/decline`  | Decline a join request to a buddy group     |
| GET    | `/api/buddies/popular`                  | Get a list of popular buddies               |
| GET    | `/api/buddies/my`                       | Get the current user's buddies              |
| GET    | `/api/buddies/search`                   | Search for buddies                          |
| GET    | `/api/buddies/:userId`                  | Get a specific user's buddy profile         |
| GET    | `/api/buddies/requests`                 | Get buddy requests sent to the current user |


### Chat Routes

| Method | Endpoint             | Description                       |
| ------ | -------------------- | --------------------------------- |
| GET    | `/api/chat/messages` | Get chat messages (authenticated) |


### Interest & Notification Routes

| Method | Endpoint                                 | Description                                               |
| ------ | ---------------------------------------- | --------------------------------------------------------- |
| PUT    | `/api/interest/test`                     | Test route to check if interest routes work               |
| POST   | `/api/interest/:sessionId`               | Express interest in a study session (authenticated)       |
| PUT    | `/api/interest/:sessionId/users/:userId` | Update a user's interest status (authenticated)           |
| DELETE | `/api/interest/:sessionId`               | Cancel user's interest in a session (authenticated)       |
| GET    | `/api/interest/user`                     | Get current user's interests (authenticated)              |
| GET    | `/api/interest/:sessionId/all`           | Get all interests for a specific session (authenticated)  |
| GET    | `/api/interest/notifications`            | Get user's interest-related notifications (authenticated) |
| PUT    | `/api/interest/notifications/read`       | Mark notifications as read (authenticated)                |

### Post Routes (Interest & Notifications)

| Method | Endpoint                             | Description                                            |
| ------ | ------------------------------------ | ------------------------------------------------------ |
| PUT    | `/api/post/test`                     | Test route to verify post routes work                  |
| POST   | `/api/post/:sessionId`               | Express interest in a session (authenticated)          |
| PUT    | `/api/post/:sessionId/users/:userId` | Update interest status for a user (authenticated)      |
| DELETE | `/api/post/:sessionId`               | Cancel interest in a session (authenticated)           |
| GET    | `/api/post/user`                     | Retrieve user's interested sessions (authenticated)    |
| GET    | `/api/post/:sessionId/all`           | Retrieve all interests for a session (authenticated)   |
| GET    | `/api/post/notifications`            | Get notifications related to interests (authenticated) |
| PUT    | `/api/post/notifications/read`       | Mark notifications as read (authenticated)             |

### Profile Route

| Method | Endpoint       | Description                                                                             |
| ------ | -------------- | --------------------------------------------------------------------------------------- |
| PUT    | `/api/profile` | Edit user profile including profile picture (authenticated, uses `multipart/form-data`) |

### Resource Routes

   Articles 

| Method | Endpoint                      | Description             |
| ------ | ----------------------------- | ----------------------- |
| GET    | `/api/resources/articles`     | Retrieve all articles   |
| POST   | `/api/resources/articles`     | Create a new article    |
| PUT    | `/api/resources/articles/:id` | Update an article by ID |
| DELETE | `/api/resources/articles/:id` | Delete an article by ID |

  Documents 

| Method | Endpoint                       | Description                             |
| ------ | ------------------------------ | --------------------------------------- |
| GET    | `/api/resources/documents`     | Retrieve all documents                  |
| POST   | `/api/resources/documents`     | Upload and create a new document (file) |
| PUT    | `/api/resources/documents/:id` | Update a document and replace file      |
| DELETE | `/api/resources/documents/:id` | Delete a document by ID                 |

  Videos 

| Method | Endpoint                    | Description                     |
| ------ | --------------------------- | ------------------------------- |
| GET    | `/api/resources/videos`     | Retrieve all videos             |
| POST   | `/api/resources/videos`     | Upload and create a new video   |
| PUT    | `/api/resources/videos/:id` | Update a video and replace file |
| DELETE | `/api/resources/videos/:id` | Delete a video by ID            |

   Search (resource)

| Method | Endpoint                | Description                 |
| ------ | ----------------------- | --------------------------- |
| GET    | `/api/resources/search` | Search across all resources |

### Search Routes

| Method | Endpoint                         | Description                                   |
| ------ | -------------------------------- | --------------------------------------------- |
| GET    | `/api/search/advanced`           | Perform advanced search with multiple filters |
| GET    | `/api/search/text`               | Full-text search across sessions              |
| GET    | `/api/search/subject/:subject`   | Get sessions filtered by subject              |
| GET    | `/api/search/course/:courseCode` | Get sessions filtered by course code          |
| GET    | `/api/search/date-range`         | Get sessions within a specific date range     |
| GET    | `/api/search/available-spots`    | Get sessions that have available spots        |

### Study sessions Routes 
    Filter and search routes 

| Method | Endpoint                                                  | Description                         |
| ------ | --------------------------------------------------------- | ----------------------------------- |
| GET    | `/api/study-sessions/filter/subject/:subject`             | Filter sessions by subject          |
| GET    | `/api/study-sessions/filter/course/:courseCode`           | Filter sessions by course code      |
| GET    | `/api/study-sessions/filter/type/:sessionType`            | Filter sessions by session type     |
| GET    | `/api/study-sessions/filter/status/:status`               | Filter sessions by status           |
| GET    | `/api/study-sessions/filter/date-range?startDate&endDate` | Filter sessions within a date range |
| GET    | `/api/study-sessions/search/:query`                       | Search sessions by keyword          |

   session managment 

| Method | Endpoint                  | Description                |
| ------ | ------------------------- | -------------------------- |
| POST   | `/api/study-sessions/`    | Create a new study session |
| GET    | `/api/study-sessions/`    | Get all sessions           |
| GET    | `/api/study-sessions/:id` | Get session by ID          |
| PUT    | `/api/study-sessions/:id` | Update session by ID       |
| DELETE | `/api/study-sessions/:id` | Delete session by ID       |

   session details and updates 

| Method | Endpoint                                                | Description                    |
| ------ | ------------------------------------------------------- | ------------------------------ |
| PUT    | `/api/study-sessions/sessions/:sessionId/topics`        | Update session topics          |
| PUT    | `/api/study-sessions/sessions/:sessionId/group-details` | Update session's group details |

  Group- specfic routes 

| Method | Endpoint                                       | Description                       |
| ------ | ---------------------------------------------- | --------------------------------- |
| GET    | `/api/study-sessions/groups/:groupId/next`     | Get next session for a group      |
| GET    | `/api/study-sessions/groups/:groupId/upcoming` | Get upcoming sessions for a group |

   Time based and interest routes 

| Method | Endpoint                                          | Description                                |
| ------ | ------------------------------------------------- | ------------------------------------------ |
| GET    | `/api/study-sessions/upcoming/hour`               | Get upcoming sessions within the next hour |
| GET    | `/api/study-sessions/user/interests`              | Get sessions the user is interested in     |
| POST   | `/api/study-sessions/:sessionId/interest`         | Express interest in a session              |
| PUT    | `/api/study-sessions/:sessionId/interest/:userId` | Update interest status                     |
| GET    | `/api/study-sessions/:sessionId/interests`        | Get all interests for a session            |


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
