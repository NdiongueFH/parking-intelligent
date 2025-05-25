const mongoose = require('mongoose');

// Schéma pour PlaceParking
const placeParkingSchema = new mongoose.Schema({
    parkingId: {
        type: mongoose.Schema.Types.ObjectId, // Référence à la collection parkings
        ref: 'Parking', // Le modèle associé à la clé étrangère
        required: true
    },
    nomPlace: {
        type: String,
        required: true,
    },
    statut: {
        type: String,
        enum: ['libre', 'occupee', 'reservee'],
        default: 'libre',
    },
    typeVehicule: {
        type: String,
        enum: ['voiture', 'moto'],
        required: true
    },
    capteurId: {
        type: Number, // Le numéro du capteur (par exemple, Capteur 1, Capteur 2, ...)
    },
    dateMiseAJour: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Ajouter un index composé pour garantir l'unicité du nom de la place par parking
placeParkingSchema.index({ parkingId: 1, nomPlace: 1 }, { unique: true });

// Créer le modèle PlaceParking
const PlaceParking = mongoose.model('PlaceParking', placeParkingSchema);

module.exports = PlaceParking;