const mongoose = require('mongoose');

// Fonction pour générer un code numérique aléatoire à 5 chiffres
const generateCodeNumerique = () => {
    return Math.floor(10000 + Math.random() * 90000); // Génère un nombre entre 10000 et 99999
};

// Fonction pour générer un numéro de reçu
const generateNumeroRecu = async() => {
    const lastReservation = await Reservation.findOne().sort({ numeroRecu: -1 }).limit(1);
    const lastNumber = lastReservation ? parseInt(lastReservation.numeroRecu.split('-')[1]) : 0;
    const newNumber = lastNumber + 1;
    return `N-${String(newNumber).padStart(4, '0')}`; // Formater sous la forme N-0000
};

// Fonction pour calculer la durée entre heureArrivée et heureDépart
const calculateDuration = (heureArrivée, heureDépart) => {
    const diff = new Date(heureDépart) - new Date(heureArrivée);
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const reservationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    parkingId: {
        type: mongoose.Schema.ObjectId,
        ref: 'Parking',
        required: true
    },
    tarifId: {
        type: mongoose.Schema.ObjectId,
        ref: 'TarifStationnement',
        required: true
    },
    typeVehicule: {
        type: String,
        enum: ['voiture', 'moto'],
        required: true
    },
    placeId: {
        type: mongoose.Schema.ObjectId,
        ref: 'PlaceParking',
        required: true
    },
    heureArrivee: {
        type: Date,
        required: true
    },
    heureDepart: {
        type: Date,
        required: true
    },
    heureRestante: {
        type: Date,
        required: true
    },
    duree: {
        type: String,
        required: true
    },
    etat: {
        type: String,
        enum: ['En cours', 'Annulée', 'Terminée'],
        required: true
    },
    montant: {
        type: Number,
        required: true
    },
    paiement: {
        type: String,
        enum: ['en ligne'],
        required: true
    },
    numeroImmatriculation: {
        type: String,
        required: true
    },
    codeNumerique: {
        type: Number,
        required: true
    },
    numeroRecu: {
        type: String,
        required: true
    }
}, {
    timestamps: true // Ajoute createdAt et updatedAt automatiquement
});

// Pré-hook Mongoose pour calculer la durée avant la sauvegarde
reservationSchema.pre('save', async function(next) {
    this.duree = calculateDuration(this.heureArrivee, this.heureDepart);
    this.codeNumerique = generateCodeNumerique();
    this.numeroRecu = await generateNumeroRecu();
    next();
});

const Reservation = mongoose.model('Reservation', reservationSchema);

module.exports = Reservation;