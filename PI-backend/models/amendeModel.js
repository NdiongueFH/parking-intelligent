const mongoose = require('mongoose');

const amendeSchema = new mongoose.Schema({
    reservationId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Reservation',
        required: false,
    },
    duree: {
        type: String, // Format "HH:mm:ss"
        required: true,
    },
    montant: {
        type: Number,
        required: true,
    },
    typeInfraction: {
        type: String,
        required: true,
    },
    typeVehicule: {
        type: String,
        enum: ['voiture', 'moto'],
        required: true,
    }
}, {
    timestamps: true, // Ajoute les champs createdAt et updatedAt
});

// Ajouter une contrainte d'unicité sur `reservationId` et `typeVehicule`
amendeSchema.index({ reservationId: 1, typeVehicule: 1 }, { unique: true });

// Création du modèle Amende
const Amende = mongoose.model('Amende', amendeSchema);

module.exports = Amende;