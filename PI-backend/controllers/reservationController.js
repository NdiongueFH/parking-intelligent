const Reservation = require('../models/reservationModel');
const Parking = require('../models/parking');
const PlaceParking = require('../models/placeParking');
const TarifStationnement = require('../models/tarifStationnementModel');


// Ajouter une réservation
// Ajouter une réservation
exports.addReservation = async(req, res) => {
    try {
        // 1. Vérifier que la date et l'heure d'arrivée sont supérieures ou égales à la date et l'heure actuelles
        const heureArrivée = new Date(req.body.heureArrivée);
        const maintenant = new Date();

        // Comparer la date et l'heure d'arrivée avec la date et l'heure actuelles
        if (heureArrivée < maintenant) {
            return res.status(400).json({
                status: 'fail',
                message: 'La date et l\'heure d\'arrivée doivent être égales ou après l\'heure actuelle.',
            });
        }

        // 2. Récupérer le parking en utilisant l'id de parking
        const parking = await Parking.findById(req.body.parkingId);
        if (!parking) {
            return res.status(404).json({
                status: 'fail',
                message: 'Parking non trouvé',
            });
        }

        // 3. Récupérer les tarifs pour le type de véhicule spécifié
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

        // 4. Récupérer les informations de la place de parking
        const place = await PlaceParking.findById(req.body.placeId);
        if (!place) {
            return res.status(404).json({
                status: 'fail',
                message: 'Place de parking non trouvée',
            });
        }

        // Vérifier que la place est libre avant de la réserver
        if (place.statut === 'reservee') {
            throw new Error('Place de parking déjà réservée');
        }

        // 5. Calculer la durée de la réservation (heureArrivée - heureDépart)
        const heureDépart = new Date(req.body.heureDépart);

        // Vérifier que l'heure d'arrivée est bien inférieure à l'heure de départ
        if (heureArrivée >= heureDépart) {
            return res.status(400).json({
                status: 'fail',
                message: 'L\'heure d\'arrivée doit être strictement inférieure à l\'heure de départ',
            });
        }

        // Calcul de la durée en millisecondes
        const dureeEnMillisecondes = heureDépart - heureArrivée;

        // Convertir la durée en minutes
        const dureeEnMinutes = Math.floor(dureeEnMillisecondes / (1000 * 60)); // 1 minute = 60000 millisecondes

        // 6. Calculer le montant en fonction de la durée et du tarif
        let montant = 0;

        if (dureeEnMinutes >= 1440) { // Si la durée est supérieure ou égale à un jour (1440 minutes)
            montant = tarif.tarifDurations.jour * Math.ceil(dureeEnMinutes / 1440); // Tarif journalier
        } else if (dureeEnMinutes >= 60) { // Si la durée est en heures (>= 60 minutes)
            montant = tarif.tarifDurations.heure * Math.ceil(dureeEnMinutes / 60); // Tarif horaire
        } else {
            montant = tarif.tarifDurations.heure; // Minimum de 1 heure
        }

        // 7. Générer le code numérique (code aléatoire à 5 chiffres)
        const codeNumerique = Math.floor(10000 + Math.random() * 90000); // Générer un code numérique aléatoire

        // 8. Générer le numéro de reçu (N-0001, N-0002, etc.)
        const lastReservation = await Reservation.findOne().sort({ reservationId: -1 }).limit(1); // Chercher la dernière réservation
        const numeroRecu = lastReservation ? `N-${String(lastReservation.reservationId + 1).padStart(4, '0')}` : 'N-0001';

        // 9. Créer une nouvelle réservation
        const reservation = await Reservation.create({
            userId: req.body.userId,
            parkingId: req.body.parkingId,
            tarifId: tarif._id, // Utilisation de l'ID du tarif trouvé
            typeVehicule: req.body.typeVehicule,
            placeId: req.body.placeId,
            heureArrivée: req.body.heureArrivée,
            heureDépart: req.body.heureDépart,
            heureRestante: req.body.heureRestante,
            duree: dureeEnMinutes, // Durée en minutes (en tant que nombre entier)
            statut: req.body.paiement === 'en ligne' ? 'confirmée' : 'en attente',
            etat: 'En cours', // Par défaut
            montant: montant, // Calcul du montant
            paiement: req.body.paiement,
            codeNumerique: codeNumerique,
            numeroRecu: numeroRecu,
        });

        // 10. Mettre à jour le statut de la place de parking à "reservee" si ce n'est pas déjà réservé
        place.statut = 'reservee';
        await place.save();

        // 11. Planifier la mise à jour du statut de la place à "libre" à la fin de la réservation
        setTimeout(async() => {
            place.statut = 'libre';
            await place.save();
            console.log(`Place ${place.nomPlace} mise à jour à "libre" à la fin de la réservation.`);
        }, dureeEnMillisecondes);

        // 12. Renvoyer la réponse avec les informations demandées, y compris le nom du parking et le nom de la place
        res.status(201).json({
            status: 'success',
            message: 'Réservation effectuée avec succès',
            data: {
                parkingNom: parking.nom_du_parking, // Nom du parking
                placeNom: place.nomPlace, // Nom de la place
                typeVehicule: reservation.typeVehicule, // Type de véhicule
                duree: dureeEnMinutes, // Durée correcte en minutes (et non pas en chaîne de caractères)
                montant: reservation.montant, // Montant calculé
                codeNumerique: reservation.codeNumerique, // Code numérique
                numeroRecu: reservation.numeroRecu // Numéro de reçu
            },
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

        const updateData = {...req.body };

        if (updateData.heureArrivée || updateData.heureDépart) {
            const heureArrivée = new Date(updateData.heureArrivée || existingReservation.heureArrivée);
            const heureDépart = new Date(updateData.heureDépart || existingReservation.heureDépart);

            // Vérifier que les dates sont valides
            if (isNaN(heureArrivée.getTime()) || isNaN(heureDépart.getTime())) {
                return res.status(400).json({
                    status: 'fail',
                    message: 'Les heures d\'arrivée ou de départ sont invalides',
                });
            }

            const dureeEnMillisecondes = heureDépart - heureArrivée;
            const dureeEnMinutes = Math.floor(dureeEnMillisecondes / (1000 * 60));

            updateData.duree = dureeEnMinutes;

            const tarif = await TarifStationnement.findById(existingReservation.tarifId);

            if (tarif) {
                let montant = 0;
                if (dureeEnMinutes >= 1440) {
                    montant = tarif.tarifDurations.jour * Math.ceil(dureeEnMinutes / 1440);
                } else if (dureeEnMinutes >= 60) {
                    montant = tarif.tarifDurations.heure * Math.ceil(dureeEnMinutes / 60);
                } else {
                    montant = tarif.tarifDurations.heure;
                }

                updateData.montant = montant;
            } else {
                return res.status(404).json({
                    status: 'fail',
                    message: 'Tarif non trouvé pour cette réservation',
                });
            }
        }

        const updatedReservation = await Reservation.findByIdAndUpdate(id, updateData, {
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


// 3. Annuler une réservation
exports.cancelReservation = async(req, res) => {
    try {
        const { id } = req.params;

        // Récupérer la réservation pour vérifier l'état de la place avant l'annulation
        const canceledReservation = await Reservation.findById(id);

        if (!canceledReservation) {
            return res.status(404).json({
                status: 'fail',
                message: 'Réservation non trouvée'
            });
        }

        // Mettre à jour l'état de la réservation à 'Annulée'
        canceledReservation.etat = 'Annulee'; // La réservation est annulée

        // Récupérer la place de parking associée à cette réservation
        const place = await PlaceParking.findById(canceledReservation.placeId);

        if (!place) {
            return res.status(404).json({
                status: 'fail',
                message: 'Place de parking non trouvée'
            });
        }

        // Mettre à jour l'état de la place de parking à 'libre'
        place.statut = 'libre';
        await place.save(); // Sauvegarder la place mise à jour

        // Sauvegarder la réservation mise à jour
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


// 4. Lister toutes les réservations d'un utilisateur spécifique
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