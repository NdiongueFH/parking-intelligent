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
            required: true
        },
        jour: {
            type: Number,
            required: true
        },
        semaine: {
            type: Number,
            required: true
        },
        mois: {
            type: Number,
            required: true
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