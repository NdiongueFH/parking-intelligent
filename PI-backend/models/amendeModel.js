const mongoose = require('mongoose');

const amendeSchema = new mongoose.Schema({
    parkingId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Parking', // Assurez-vous que le modèle Parking est bien défini
        required: true, // Rend ce champ obligatoire
    },
    duree: {
        type: String, // Format "HH:mm:ss"
        required: true,
    },
    montant: {
        type: Number,
        required: true,
        min: 0 // Assure que le montant ne soit pas négatif
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

// Ajouter une contrainte d'unicité sur `typeInfraction` et `typeVehicule` uniquement
amendeSchema.index({ typeInfraction: 1, typeVehicule: 1 }, { unique: true });

// Création du modèle Amende
const Amende = mongoose.model('Amende', amendeSchema);

module.exports = Amende;