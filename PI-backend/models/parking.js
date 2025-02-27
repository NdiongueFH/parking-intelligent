const mongoose = require('mongoose');

// Schéma pour la classe Parking
const parkingSchema = new mongoose.Schema({
    nom_du_parking: {
        type: String,
        required: true,
        unique: true // Unicité du nom du parking
    },
    adresse: {
        type: String,
        required: true
    },
    latitude: {
        type: Number,
        required: true
    },
    longitude: {
        type: Number,
        required: true
    },
    capaciteTotale: {
        type: Number,
        required: true
    },
    placesLibres: {
        type: Number,
        default: 0 // Valeur par défaut à 0
    },
    placesReservees: {
        type: Number,
        default: 0 // Valeur par défaut à 0
    }
});

// Création de l'index pour garantir l'unicité soit de la latitude, soit de la longitude
parkingSchema.index({ latitude: 1 }); // Unicité sur la latitude
parkingSchema.index({ longitude: 1 }); // Unicité sur la longitude

// Création du modèle Parking
const Parking = mongoose.model('Parking', parkingSchema);

module.exports = Parking;