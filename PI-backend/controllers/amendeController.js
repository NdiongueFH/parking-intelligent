const Amende = require('../models/amendeModel');
const Reservation = require('../models/reservationModel'); // Pour vérifier que la réservation existe
const Parking = require('../models/parking'); // Si nécessaire pour des vérifications supplémentaires

// Créer une amende
exports.createAmende = async(req, res) => {
    try {
        const { duree, montant, typeInfraction, typeVehicule, parkingId } = req.body;

        // Vérifier que le parking existe
        const parking = await Parking.findById(parkingId);
        if (!parking) {
            return res.status(404).json({
                status: 'fail',
                message: 'Parking non trouvé'
            });
        }

        // Vérifier que le montant n'est pas négatif
        if (montant < 0) {
            return res.status(400).json({
                status: 'fail',
                message: 'Le montant de l\'amende ne peut pas être négatif.'
            });
        }

        // Vérifier l'unicité de la combinaison typeInfraction et typeVehicule
        const existingAmende = await Amende.findOne({ typeInfraction, typeVehicule });
        if (existingAmende) {
            return res.status(400).json({
                status: 'fail',
                message: 'Cette combinaison de type d\'infraction et de type de véhicule existe déjà.'
            });
        }

        // Créer une nouvelle amende
        const amende = await Amende.create({
            duree,
            montant,
            typeInfraction,
            typeVehicule,
            parkingId,
        });

        res.status(201).json({
            status: 'success',
            message: 'Amende créée avec succès',
            data: {
                amende
            }
        });

    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

// Modifier une amende
exports.updateAmende = async(req, res) => {
    try {
        const { id } = req.params;
        const { duree, montant, typeInfraction, typeVehicule } = req.body;

        // Vérifier que le montant n'est pas négatif
        if (montant < 0) {
            return res.status(400).json({
                status: 'fail',
                message: 'Le montant de l\'amende ne peut pas être négatif.'
            });
        }

        const updatedAmende = await Amende.findByIdAndUpdate(id, {
            duree,
            montant,
            typeInfraction,
            typeVehicule
        }, { new: true, runValidators: true });

        if (!updatedAmende) {
            return res.status(404).json({
                status: 'fail',
                message: 'Amende non trouvée'
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                amende: updatedAmende
            }
        });

    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

// Assigner une amende à une réservation (en reliant l'amende à une réservation spécifique)
exports.assignAmendeToReservation = async(req, res) => {
    try {
        const { amendeId, reservationId } = req.body;

        // Vérifier que la réservation existe
        const reservation = await Reservation.findById(reservationId);
        if (!reservation) {
            return res.status(404).json({
                status: 'fail',
                message: 'Réservation non trouvée'
            });
        }

        // Vérifier que l'amende existe
        const amende = await Amende.findById(amendeId);
        if (!amende) {
            return res.status(404).json({
                status: 'fail',
                message: 'Amende non trouvée'
            });
        }

        // Assigner l'amende à la réservation
        amende.reservationId = reservationId; // Si vous souhaitez ajouter cette logique
        await amende.save();

        res.status(200).json({
            status: 'success',
            message: 'Amende assignée à la réservation avec succès',
            data: {
                amende
            }
        });

    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

// Récupérer toutes les amendes
exports.getAllAmendes = async(req, res) => {
    try {
        const amendes = await Amende.find();

        if (amendes.length === 0) {
            return res.status(404).json({
                status: 'fail',
                message: 'Aucune amende trouvée'
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                amendes
            }
        });

    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

// Récupérer les amendes par reservationId
exports.getAmendesByReservationId = async(req, res) => {
    try {
        const { reservationId } = req.params;

        const amendes = await Amende.find({ reservationId });

        if (amendes.length === 0) {
            return res.status(404).json({
                status: 'fail',
                message: 'Aucune amende trouvée pour cette réservation'
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                amendes
            }
        });

    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

// Récupérer une amende par son ID
exports.getAmendeById = async(req, res) => {
    try {
        const { id } = req.params;

        const amende = await Amende.findById(id);

        if (!amende) {
            return res.status(404).json({
                status: 'fail',
                message: 'Amende non trouvée'
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                amende
            }
        });

    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

// Supprimer une amende
exports.deleteAmende = async(req, res) => {
    try {
        const { id } = req.params;

        const deletedAmende = await Amende.findByIdAndDelete(id);

        if (!deletedAmende) {
            return res.status(404).json({
                status: 'fail',
                message: 'Amende non trouvée'
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Amende supprimée avec succès'
        });

    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};