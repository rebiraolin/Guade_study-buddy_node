const Article = require('../models/article');
const mongoose = require('mongoose');
const Document = require('../models/document');
const Video = require('../models/video');
const multer = require('multer');
const path = require('path');
const fsPromises = require('fs/promises');
const fs = require('fs'); // For existsSync
const fsSync = require('fs');

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

const getArticles = async (req, res) => {
    try {
        const articles = await Article.find();
        res.status(200).json(articles);
    } catch (error) {
        console.error('Error fetching articles:', error);
        res.status(500).json({ message: 'Failed to fetch articles' });
    }
};

const createArticle = async (req, res) => {
    try {
        const newArticle = new Article(req.body);
        const savedArticle = await newArticle.save();
        res.status(201).json(savedArticle); // 201 Created status code
    } catch (error) {
        console.error('Error creating article:', error);
        res.status(500).json({ message: 'Failed to create article' });
    }
};
const updateArticle = async (req, res) => {
    const { id } = req.params;
    try {
        const updatedArticle = await Article.findByIdAndUpdate(id, req.body, {
            new: true,
        });
        if (!updatedArticle) {
            return res.status(404).json({ message: 'Article not found' });
        }
        res.status(200).json(updatedArticle);
    } catch (error) {
        console.error('Error updating article:', error);
        res.status(500).json({ message: 'Failed to update article' });
    }
};
const deleteArticle = async (req, res) => {
    const { id } = req.params;
    try {
        const deletedArticle = await Article.findByIdAndDelete(id);
        if (!deletedArticle) {
            return res.status(404).json({ message: 'Article not found' });
        }
        res.status(200).json({ message: 'Article deleted successfully' });
    } catch (error) {
        console.error('Error deleting article:', error);
        res.status(500).json({ message: 'Failed to delete article' });
    }
};
const createDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a document file' });
        }

        const newDocument = new Document({
            title: req.body.title, // Ensure title comes from the request body
            fileUrl: `/uploads/${req.file.filename}`, // Correct use of template literal
            uploadedBy: req.body.uploadedBy,
            fileType: req.body.fileType,
            subject: req.body.subject,
        });

        const savedDocument = await newDocument.save();
        res.status(201).json(savedDocument);
    } catch (error) {
        console.error('Error creating document:', error);
        res.status(500).json({ message: 'Failed to create document' });
    }
};
const createVideo = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'Please upload a video file' });
        }

        const newVideo = new Video({
            title: req.body.title,
            videoUrl: `/uploads/videos/${req.file.filename}`, // Store the path to the uploaded video
            uploadedBy: req.body.uploadedBy,
            duration: req.body.duration,
            subject: req.body.subject,
        });

        const savedVideo = await newVideo.save();
        res.status(201).json(savedVideo);
    } catch (error) {
        console.error('Error creating video:', error);
        res.status(500).json({ message: 'Failed to create video' });
    }
};

const getDocuments = async (req, res) => {
    try {
        const documents = await Document.find();
        res.status(200).json(documents);
    } catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({ message: 'Failed to fetch documents' });
    }
};
const updateDocument = async (req, res) => {
    const { id } = req.params;
    console.log('Updating document with ID:', id);
    try {
        const existingDocument = await Document.findById(id);
        if (!existingDocument) {
            return res.status(404).json({ message: 'Document not found' });
        }
        console.log('Existing document:', existingDocument);

        let updatedFields = { ...req.body };
        console.log('Request body:', req.body);

        if (req.file) {
            const oldFilePath = path.join(__dirname, '..', existingDocument.fileUrl);
            console.log('Old document path:', oldFilePath);

            if (fsSync.existsSync(oldFilePath)) {
                try {
                    await fsPromises.unlink(oldFilePath);
                    console.log('Old document file deleted.');
                } catch (unlinkErr) {
                    console.warn('Error deleting old document file:', unlinkErr.message);
                }
            } else {
                console.warn('Old document file does not exist:', oldFilePath);
            }
            updatedFields.fileUrl = `/uploads/${req.file.filename}`; // Correct use of template literal
        }

        console.log('Updated fields before saving:', updatedFields);

        const updatedDocument = await Document.findByIdAndUpdate(
            id,
            updatedFields,
            {
                new: true,
                runValidators: true,
            }
        );

        console.log('Result of findByIdAndUpdate:', updatedDocument);

        if (!updatedDocument) {
            return res
                .status(500)
                .json({ message: 'Failed to update document in the database' });
        }

        res.status(200).json(updatedDocument);
    } catch (error) {
        console.error('Error updating document:', error);
        if (error.name === 'CastError') {
            return res.status(400).json({ message: 'Invalid document ID' });
        } else if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Failed to update document' });
    }
};
const deleteDocument = async (req, res) => {
    const { id } = req.params;
    try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid ID format' });
        }

        const deletedDocument = await Document.findByIdAndDelete(id);
        if (!deletedDocument) {
            return res.status(404).json({ message: 'Document not found' });
        }

        // Only attempt to delete the file if it exists
        const filePath = path.join(__dirname, '..', deletedDocument.fileUrl || '');
        if (deletedDocument.fileUrl && fs.existsSync(filePath)) {
            await fsPromises.unlink(filePath);
        }

        res.status(200).json({ message: 'Document deleted successfully' });
    } catch (error) {
        console.error('Error deleting document:', error);
        res.status(500).json({ message: 'Failed to delete document' });
    }
};
const getVideos = async (req, res) => {
    try {
        const videos = await Video.find();
        res.status(200).json(videos);
    } catch (error) {
        console.error('Error fetching videos:', error);
        res.status(500).json({ message: 'Failed to fetch videos' });
    }
};
const updateVideo = async (req, res) => {
    const { id } = req.params;

    try {
        const existingVideo = await Video.findById(id);
        if (!existingVideo) {
            return res.status(404).json({ message: 'Video not found' });
        }

        let updatedFields = { ...req.body };

        if (req.file) {
            const oldFilePath = path.join(__dirname, '..', existingVideo.videoUrl);
            console.log('Old video path:', oldFilePath);

            if (fsSync.existsSync(oldFilePath)) {
                try {
                    await fsPromises.unlink(oldFilePath);
                    console.log('Old video deleted successfully.');
                } catch (err) {
                    console.warn('Could not delete old video file:', err.message);
                }
            } else {
                console.warn('Old video file does not exist:', oldFilePath);
            }

            updatedFields.videoUrl = `/uploads/videos/${req.file.filename}`;
        }

        const updatedVideo = await Video.findByIdAndUpdate(id, updatedFields, {
            new: true,
        });

        res.status(200).json(updatedVideo);
    } catch (error) {
        console.error('Error updating video:', error);
        res.status(500).json({ message: 'Failed to update video' });
    }
};
const deleteVideo = async (req, res) => {
    const { id } = req.params;

    try {
        const deletedVideo = await Video.findByIdAndDelete(id);
        if (!deletedVideo) {
            return res.status(404).json({ message: 'Video not found' });
        }

        const filePath = path.join(__dirname, '..', deletedVideo.videoUrl);
        console.log('Old video path:', filePath);

        if (fsSync.existsSync(filePath)) {
            try {
                await fsPromises.unlink(filePath);
                console.log('Video file deleted from server.');
            } catch (unlinkErr) {
                console.warn('Could not delete video file:', unlinkErr.message);
            }
        } else {
            console.warn('Old video file does not exist:', filePath);
        }

        res.status(200).json({ message: 'Video deleted successfully' });
    } catch (error) {
        console.error('Error deleting video:', error);
        res.status(500).json({ message: 'Failed to delete video' });
    }
};

const searchResources = async (req, res) => {
    const { query } = req.query;
    if (!query) {
        return res.status(400).json({ message: 'Search query is required' });
    }

    try {
        const articles = await Article.find({ $text: { $search: query } });
        const documents = await Document.find({ $text: { $search: query } });
        const videos = await Video.find({ $text: { $search: query } });

        const results = [...articles, ...documents, ...videos];
        res.status(200).json(results);
    } catch (error) {
        console.error('Error searching resources:', error);
        res.status(500).json({ message: 'Failed to search resources' });
    }
};

module.exports = {
    getArticles,
    createArticle,
    updateArticle,
    deleteArticle,
    getDocuments,
    createDocument,
    updateDocument,
    deleteDocument,
    getVideos,
    createVideo,
    updateVideo,
    deleteVideo,
    searchResources,
};