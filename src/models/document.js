const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    title: { type: String, required: true, index: 'text' },
    fileUrl: { type: String, required: true }, // URL to the document file (e.g., PDF)
    uploadedBy: { type: String },
    uploadDate: { type: Date, default: Date.now },
    // Add any other relevant fields for documents
    subject: { type: String, index: 'text' },
    fileType: { type: String },
});

documentSchema.post('save', function (doc) {
    console.log('Document saved:', doc);
});

documentSchema.pre('findOneAndUpdate', function (next) {
    console.log('About to update:', this.getUpdate());
    next();
});

module.exports = mongoose.model('Document', documentSchema);