const Reservation = require('../models/reservationModel');
const Parking = require('../models/parking');
const PlaceParking = require('../models/placeParking');
const TarifStationnement = require('../models/tarifStationnementModel');
const User = require('../models/userModel'); // Assurez-vous d'importer le modèle User

// Ajouter une réservation
exports.addReservation = async(req, res) => {
    try {
        const heureArrivee = new Date(req.body.heureArrivee);
        const maintenant = new Date();

        if (heureArrivee < maintenant) {
            return res.status(400).json({
                status: 'fail',
                message: 'La date et l\'heure d\'arrivée doivent être égales ou après l\'heure actuelle.',
            });
        }

        const parking = await Parking.findById(req.body.parkingId);
        if (!parking) {
            return res.status(404).json({
                status: 'fail',
                message: 'Parking non trouvé',
            });
        }

        const tarif = await TarifStationnement.findOne({
            parkingId: req.body.parkingId,
            typeVehicule: req.body.typeVehicule
        });
        if (!tarif) {
            return res.status(404).json({
                status: 'fail',
                message: `Tarif pour ${req.body.typeVehicule} non trouvé dans ce parking`,
            });
        }

        const place = await PlaceParking.findById(req.body.placeId);
        if (!place) {
            return res.status(404).json({
                status: 'fail',
                message: 'Place de parking non trouvée',
            });
        }

        if (place.statut === 'reservee' || place.statut === 'occupee') {
            return res.status(400).json({
                status: 'fail',
                message: 'Place de parking déjà réservée ou occupée',
            });
        }

        const heureDepart = new Date(req.body.heureDepart);
        if (heureArrivee >= heureDepart) {
            return res.status(400).json({
                status: 'fail',
                message: 'L\'heure d\'arrivée doit être strictement inférieure à l\'heure de départ',
            });
        }

        // Calculer le montant
        const dureeEnMillisecondes = heureDepart - heureArrivee;
        const dureeEnMinutes = Math.floor(dureeEnMillisecondes / (1000 * 60));

        let montant = 0;
        if (dureeEnMinutes >= 1440) {
            montant = tarif.tarifDurations.jour * Math.ceil(dureeEnMinutes / 1440);
        } else if (dureeEnMinutes >= 60) {
            montant = tarif.tarifDurations.heure * Math.ceil(dureeEnMinutes / 60);
        } else {
            montant = tarif.tarifDurations.heure; // Minimum de 1 heure
        }

        const user = await User.findById(req.body.userId);
        if (!user) {
            return res.status(404).json({
                status: 'fail',
                message: 'Utilisateur non trouvé',
            });
        }

        if (user.role === 'utilisateur' && user.solde < montant) {
            return res.status(400).json({
                status: 'fail',
                message: 'Le montant de votre solde ne vous permet pas de faire cette réservation, veuillez faire un dépôt.',
            });
        }

        const fraisTransaction = montant * 0.02;
        const montantTotal = montant + fraisTransaction;

        // Calculer le temps restant en minutes
        const tempsRestant = Math.floor(dureeEnMillisecondes / (1000 * 60));

        // 7. Générer le code numérique (code aléatoire à 5 chiffres)
        const codeNumerique = Math.floor(10000 + Math.random() * 90000); // Générer un code numérique aléatoire

        // 8. Générer le numéro de reçu (N-0001, N-0002, etc.)
        const lastReservation = await Reservation.findOne().sort({ reservationId: -1 }).limit(1); // Chercher la dernière réservation
        const numeroRecu = lastReservation ? `N-${String(lastReservation.reservationId + 1).padStart(4, '0')}` : 'N-0001';

        // Créer une nouvelle réservation
        const reservation = new Reservation({
            userId: req.body.userId,
            parkingId: req.body.parkingId,
            tarifId: tarif._id,
            typeVehicule: req.body.typeVehicule,
            placeId: req.body.placeId,
            numeroImmatriculation: req.body.numeroImmatriculation,
            heureArrivee: req.body.heureArrivee,
            heureDepart: req.body.heureDepart,
            heureRestante: tempsRestant, // Calculé automatiquement dans le modèle
            duree: `${String(Math.floor(dureeEnMinutes / 60)).padStart(2, '0')}:${String(dureeEnMinutes % 60).padStart(2, '0')}:00`, // Format HH:mm:ss
            etat: 'En cours',
            montant: montantTotal,
            paiement: 'en ligne', // Paiement uniquement en ligne
            codeNumerique: codeNumerique,
            numeroRecu: numeroRecu,
        });

        await reservation.save();


        // Mettre à jour le solde de l'utilisateur
        user.solde -= montantTotal; // Déduire le montant total du solde
        await user.save(); // Sauvegarder les modifications

        // Mettre à jour la place de parking à "reservee"
        place.statut = 'reservee';
        await place.save();

        // Vérifier et gérer les amendes après la période de réservation
        setTimeout(async() => {
            const currentTime = new Date();
            if (currentTime >= heureDepart) {
                // Vérifier si la réservation est toujours "occupée"
                const updatedReservation = await Reservation.findById(reservation._id);
                if (updatedReservation && updatedReservation.etat === 'En cours') {
                    const amende = await Amende.findOne({
                        typeInfraction: 'Dépassement de durée',
                        typeVehicule: req.body.typeVehicule
                    });

                    if (amende) {
                        // Créer une nouvelle amende pour cette réservation
                        await Amende.create({
                            duree: `${dureeEnMinutes} minutes`,
                            montant: amende.montant,
                            typeInfraction: amende.typeInfraction,
                            typeVehicule: req.body.typeVehicule,
                            reservationId: reservation._id
                        });
                    }
                }

                // Mettre à jour la place à "libre"
                place.statut = 'libre';
                await place.save();
                console.log(`Place ${place.nomPlace} mise à jour à "libre" après la réservation.`);
            }
        }, dureeEnMillisecondes);

        // Renvoyer la réponse avec les informations de la réservation
        res.status(201).json({
            status: 'success',
            message: 'Réservation effectuée avec succès',
            data: reservation,
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message,
        });
    }
};

// Modifier une réservation
exports.updateReservation = async(req, res) => {
    try {
        const { id } = req.params;
        const existingReservation = await Reservation.findById(id);

        if (!existingReservation) {
            return res.status(404).json({
                status: 'fail',
                message: 'Réservation non trouvée',
            });
        }

        if (existingReservation.etat !== 'En cours') {
            return res.status(400).json({
                status: 'fail',
                message: 'La réservation ne peut être modifiée que si elle est en cours',
            });
        }

        const updateData = {...req.body };

        if (updateData.heureArrivee || updateData.heureDepart) {
            const heureArrivee = new Date(updateData.heureArrivee || existingReservation.heureArrivee);
            const heureDepart = new Date(updateData.heureDepart || existingReservation.heureDepart);

            if (isNaN(heureArrivee.getTime()) || isNaN(heureDepart.getTime())) {
                return res.status(400).json({
                    status: 'fail',
                    message: 'Les heures d\'arrivée ou de départ sont invalides',
                });
            }

            const place = await PlaceParking.findById(existingReservation.placeId);
            if (place.statut === 'reservee' || place.statut === 'occupee') {
                return res.status(400).json({
                    status: 'fail',
                    message: 'La place est déjà réservée ou occupée.',
                });
            }

            const dureeEnMillisecondes = heureDepart - heureArrivee;
            const dureeEnMinutes = Math.floor(dureeEnMillisecondes / (1000 * 60));

            if (heureArrivee >= heureDepart) {
                return res.status(400).json({
                    status: 'fail',
                    message: 'L\'heure d\'arrivée doit être strictement inférieure à l\'heure de départ',
                });
            }

            const tarif = await TarifStationnement.findById(existingReservation.tarifId);
            let montant = 0;
            if (dureeEnMinutes >= 1440) {
                montant = tarif.tarifDurations.jour * Math.ceil(dureeEnMinutes / 1440);
            } else if (dureeEnMinutes >= 60) {
                montant = tarif.tarifDurations.heure * Math.ceil(dureeEnMinutes / 60);
            } else {
                montant = tarif.tarifDurations.heure; // Minimum de 1 heure
            }

            // Mettre à jour les données de réservation
            updateData.duree = dureeEnMinutes;
            updateData.montant = montant;
        }

        // Mettre à jour le numéro d'immatriculation et le type de véhicule si fournis
        if (updateData.immatriculation) {
            existingReservation.immatriculation = updateData.immatriculation;
        }
        if (updateData.typeVehicule) {
            existingReservation.typeVehicule = updateData.typeVehicule;
        }

        const updatedReservation = await Reservation.findByIdAndUpdate(id, {...existingReservation, ...updateData }, {
            new: true,
            runValidators: true,
        });

        res.status(200).json({
            status: 'success',
            data: {
                reservation: updatedReservation,
            },
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message,
        });
    }
};

// Annuler une réservation
exports.cancelReservation = async(req, res) => {
    try {
        const { id } = req.params;
        const canceledReservation = await Reservation.findById(id);

        if (!canceledReservation) {
            return res.status(404).json({
                status: 'fail',
                message: 'Réservation non trouvée'
            });
        }

        if (canceledReservation.etat !== 'En cours') {
            return res.status(400).json({
                status: 'fail',
                message: 'La réservation ne peut être annulée que si elle est en cours'
            });
        }

        canceledReservation.etat = 'Annulee';

        const place = await PlaceParking.findById(canceledReservation.placeId);
        if (!place) {
            return res.status(404).json({
                status: 'fail',
                message: 'Place de parking non trouvée'
            });
        }

        place.statut = 'libre';
        await place.save();
        await canceledReservation.save();

        res.status(200).json({
            status: 'success',
            message: 'Réservation annulée avec succès',
            data: {
                reservation: canceledReservation
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

// Lister toutes les réservations d'un utilisateur spécifique
exports.getReservationsByUser = async(req, res) => {
    try {
        const { userId } = req.params;
        const reservations = await Reservation.find({ userId });

        if (!reservations || reservations.length === 0) {
            return res.status(404).json({
                status: 'fail',
                message: 'Aucune réservation trouvée pour cet utilisateur'
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                reservations
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

// Lister toutes les réservations
exports.getAllReservations = async(req, res) => {
    try {
        const reservations = await Reservation.find()
            .populate('parkingId', 'nom_du_parking adresse')
            .populate('userId', 'nom prenom telephone')
            .populate('placeId', 'nomPlace statut');

        if (!reservations || reservations.length === 0) {
            return res.status(404).json({
                status: 'fail',
                message: 'Aucune réservation trouvée'
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                reservations
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};