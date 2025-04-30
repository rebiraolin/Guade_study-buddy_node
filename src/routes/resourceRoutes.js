const express = require('express');
const router = express.Router();
const resourceController = require('../controllers/resourceController');
const multer = require('multer');
const path = require('path');

// Configure multer for file storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let uploadDir = 'uploads/';
    if (file.fieldname === 'videoFile') {
      uploadDir = 'uploads/videos/';
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const uploadMiddleware = multer({ storage: storage });

router.get('/articles', resourceController.getArticles);
router.post('/articles', resourceController.createArticle);
router.put('/articles/:id', resourceController.updateArticle);
router.delete('/articles/:id', resourceController.deleteArticle);

// Documents
router.get('/documents', resourceController.getDocuments);
router.post(
  '/documents',
  uploadMiddleware.single('fileUrl'),
  resourceController.createDocument
);
router.put(
  '/documents/:id',
  uploadMiddleware.single('fileUrl'),
  resourceController.updateDocument
); // Handle file update
router.delete('/documents/:id', resourceController.deleteDocument);

// Videos
router.get('/videos', resourceController.getVideos);
router.post(
  '/videos',
  uploadMiddleware.single('videoFile'),
  resourceController.createVideo
);
router.put(
  '/videos/:id',
  uploadMiddleware.single('videoFile'),
  resourceController.updateVideo
); // Handle file update
router.delete('/videos/:id', resourceController.deleteVideo);

router.get('/search', resourceController.searchResources);

module.exports = router;
