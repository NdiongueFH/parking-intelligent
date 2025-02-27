const mongoose = require('mongoose');

// Définir le schéma pour PlaceParking
const placeParkingSchema = new mongoose.Schema({
    parkingId: {
        type: mongoose.Schema.Types.ObjectId, // Référence à la collection parkings
        ref: 'Parking', // Le modèle associé à la clé étrangère
        required: true
    },
    nomPlace: {
        type: String,
        required: true,
        unique: true
    },
    statut: {
        type: String,
        enum: ['libre', 'occupee', 'reservee', 'hors service'],
        default: 'libre',
        unique: true
    },
    typeVehicule: {
        type: String,
        enum: ['voiture', 'moto'],
        required: true
    }
}, { timestamps: true });

// Créer le modèle PlaceParking
const PlaceParking = mongoose.model('PlaceParking', placeParkingSchema);

module.exports = PlaceParking;