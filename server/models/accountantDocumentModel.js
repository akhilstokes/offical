const mongoose = require('mongoose');

const accountantDocumentSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: ['invoice', 'bill', 'receipt', 'contract', 'tax', 'bank', 'other'],
        default: 'other'
    },
    description: {
        type: String,
        trim: true
    },
    reference: {
        type: String,
        trim: true
    },
    date: {
        type: Date
    },
    fileUrl: {
        type: String,
        required: true
    },
    fileName: {
        type: String
    },
    fileSize: {
        type: Number
    },
    mimetype: {
        type: String
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('AccountantDocument', accountantDocumentSchema);
