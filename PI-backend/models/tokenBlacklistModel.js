const mongoose = require('mongoose');

const tokenBlacklistSchema = new mongoose.Schema({
    token: {
        type: String,
        required: true,
        unique: true, // Assurez-vous qu'un même token ne peut pas être ajouté plusieurs fois
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
});

// Définir une expiration automatique du document (après l'expiration du token)
tokenBlacklistSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const TokenBlacklist = mongoose.model('TokenBlacklist', tokenBlacklistSchema);

module.exports = TokenBlacklist;