const mongoose = require('mongoose');

// Définir le schéma pour le transfert d'argent
const transferSchema = new mongoose.Schema({
    date: {
        type: Date,
        default: Date.now, // Défaut à la date actuelle
        required: true
    },
    type: {
        type: String,
        enum: ['depot', 'retrait'], // Les types autorisés
        required: true
    },
    montant: {
        type: Number,
        required: true,
        min: [0, 'Le montant doit être positif.'] // Validation pour le montant
    },
    telephone: {
        type: Number,
        required: true // Téléphone de l'utilisateur cible
    },
    nom: {
        type: String,
        required: true // Nom de l'utilisateur cible
    },
    prenom: {
        type: String,
        required: true // Prénom de l'utilisateur cible
    },
    administrateur: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Référence à l'utilisateur administrateur qui effectue le transfert
        required: true
    },

    utilisateur: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
});

// Créer le modèle à partir du schéma
const Transfer = mongoose.model('Transfer', transferSchema);

module.exports = Transfer;