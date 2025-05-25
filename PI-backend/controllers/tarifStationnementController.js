const TarifStationnement = require('../models/tarifStationnementModel');
const Parking = require('../models/parking');
const { protect, restrictTo } = require('../controllers/userController'); // Utilisation des middlewares d'authentification et de rôle

// Ajouter un tarif pour un parking
exports.addTarifStationnement = async(req, res) => {
    try {
        // Vérifier si le parking existe
        const parking = await Parking.findById(req.body.parkingId);
        if (!parking) {
            return res.status(404).json({
                status: 'fail',
                message: 'Parking non trouvé'
            });
        }

        // Vérifier si le type de véhicule est valide
        const typesVehiculesValides = ['voiture', 'moto'];
        if (!typesVehiculesValides.includes(req.body.typeVehicule)) {
            return res.status(400).json({
                status: 'fail',
                message: 'Le type de véhicule doit être "voiture" ou "moto"'
            });
        }

        // Vérifier si un tarif existe déjà pour ce parking et ce type de véhicule
        const existingTarif = await TarifStationnement.findOne({
            parkingId: req.body.parkingId,
            typeVehicule: req.body.typeVehicule
        });

        if (existingTarif) {
            return res.status(400).json({
                status: 'fail',
                message: 'Un tarif pour ce type de véhicule existe déjà dans ce parking.'
            });
        }

        // Vérifier que tous les tarifs sont non négatifs
        const { heure, jour, semaine, mois } = req.body.tarifDurations;
        if (heure < 0 || jour < 0 || semaine < 0 || mois < 0) {
            return res.status(400).json({
                status: 'fail',
                message: 'Les tarifs ne peuvent pas être négatifs.'
            });
        }

        // Créer le tarif
        const tarif = await TarifStationnement.create({
            parkingId: req.body.parkingId,
            typeVehicule: req.body.typeVehicule,
            tarifDurations: {
                heure,
                jour,
                semaine,
                mois
            }
        });

        res.status(201).json({
            status: 'success',
            data: {
                tarif
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

// Mettre à jour un tarif spécifique
exports.updateTarif = async(req, res) => {
    try {
        // Vérifier si le type de véhicule est valide
        const typesVehiculesValides = ['voiture', 'moto'];
        if (req.body.typeVehicule && !typesVehiculesValides.includes(req.body.typeVehicule)) {
            return res.status(400).json({
                status: 'fail',
                message: 'Le type de véhicule doit être "voiture" ou "moto"'
            });
        }

        // Vérifier que tous les tarifs sont non négatifs
        if (req.body.tarifDurations) {
            const { heure, jour, semaine, mois } = req.body.tarifDurations;
            if (heure < 0 || jour < 0 || semaine < 0 || mois < 0) {
                return res.status(400).json({
                    status: 'fail',
                    message: 'Les tarifs ne peuvent pas être négatifs.'
                });
            }
        }

        // Mettre à jour le tarif
        const tarif = await TarifStationnement.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!tarif) {
            return res.status(404).json({
                status: 'fail',
                message: 'Tarif non trouvé'
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                tarif
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};



// Récupérer tous les tarifs pour un parking spécifique
exports.getTarifsByParkingId = async(req, res) => {
    try {
        const tarifs = await TarifStationnement.find({ parkingId: req.params.parkingId });

        if (!tarifs || tarifs.length === 0) {
            return res.status(404).json({
                status: 'fail',
                message: 'Aucun tarif trouvé pour ce parking'
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                tarifs
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

// Récupérer un tarif spécifique par ID
exports.getTarifById = async(req, res) => {
    try {
        const tarif = await TarifStationnement.findById(req.params.id);

        if (!tarif) {
            return res.status(404).json({
                status: 'fail',
                message: 'Tarif non trouvé'
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                tarif
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};



// Supprimer un tarif spécifique
exports.deleteTarif = async(req, res) => {
    try {
        const tarif = await TarifStationnement.findByIdAndDelete(req.params.id);

        if (!tarif) {
            return res.status(404).json({
                status: 'fail',
                message: 'Tarif non trouvé'
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Tarif supprimé avec succès'
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};