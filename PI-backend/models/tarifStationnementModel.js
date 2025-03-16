const mongoose = require('mongoose');

const tarifStationnementSchema = new mongoose.Schema({
    parkingId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Parking',
        required: true,
    },
    typeVehicule: {
        type: String,
        required: true,
        enum: ['voiture', 'moto'] // Définit l'énumération des types de véhicules
    },
    tarifDurations: {
        heure: {
            type: Number,
            required: true,
            min: 0 // Assure que le tarif ne soit pas négatif
        },
        jour: {
            type: Number,
            required: true,
            min: 0 // Assure que le tarif ne soit pas négatif
        },
        semaine: {
            type: Number,
            required: true,
            min: 0 // Assure que le tarif ne soit pas négatif
        },
        mois: {
            type: Number,
            required: true,
            min: 0 // Assure que le tarif ne soit pas négatif
        }
    }
}, {
    // Ajout de l'index unique pour 'parkingId' et 'typeVehicule'
    indexes: [{
        fields: { parkingId: 1, typeVehicule: 1 },
        unique: true
    }]
});

const TarifStationnement = mongoose.model('TarifStationnement', tarifStationnementSchema);

module.exports = TarifStationnement;