const Reservation = require('../models/reservationModel');
const Parking = require('../models/parking');
const PlaceParking = require('../models/placeParking');
const TarifStationnement = require('../models/tarifStationnementModel');
const User = require('../models/userModel'); // Assurez-vous d'importer le modèle User
const nodemailer = require('nodemailer');

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

        // Log pour déboguer
        console.log("Recherche de tarif avec parkingId:", req.body.parkingId);
        console.log("Type de véhicule passé:", req.body.typeVehicule);


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
        const dureeEnJours = Math.floor(dureeEnMinutes / 1440); // Conversion en jours

        let montant = 0;

        // Gestion des durées de 30 jours ou plus
        if (dureeEnMinutes >= 43200) { // 30 jours
            montant = tarif.tarifDurations.mois;
            const joursSup = dureeEnJours - 30; // Jours après le premier mois
            if (joursSup > 0) {
                montant += (tarif.tarifDurations.jour / 1440) * (joursSup * 1440);
            }
        }
        // Gestion des durées de 7 jours ou plus
        else if (dureeEnMinutes >= 10080) { // 7 jours
            montant = tarif.tarifDurations.semaine;
            const joursSup = dureeEnJours - 7; // Jours après la première semaine
            if (joursSup > 0) {
                montant += (tarif.tarifDurations.jour / 1440) * (joursSup * 1440);
            }
        }
        // Gestion des durées de 24 heures ou plus
        else if (dureeEnMinutes >= 1440) { // 24 heures
            montant = tarif.tarifDurations.jour; // Montant pour une journée
        }
        // Gestion des durées d'1 heure ou plus
        else if (dureeEnMinutes >= 60) { // 1 heure
            montant = tarif.tarifDurations.heure * (dureeEnMinutes / 60); // Règle de trois pour le tarif horaire
        }
        // Gestion des durées de moins d'1 heure
        else { // Moins d'une heure
            montant = (tarif.tarifDurations.heure / 60) * dureeEnMinutes; // Règle de trois pour le tarif horaire
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

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: process.env.EMAIL_USER,
              pass: process.env.EMAIL_PASS,
            },
          });

          const email = user.email;
          const prenom = user.prenom; // ou user.nom selon ton modèle
          const codeReservation = codeNumerique; // déjà généré plus haut

        
          const mailOptions = {
            from: '"Parking Intelligent" <hawa.ndiongue@gmail.com>',
            to: email,
            subject: '✅ Confirmation de votre réservation',
            html: `
              <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 30px;">
                <div style="max-width: 600px; margin: auto; background: white; border-radius: 10px; padding: 30px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                  <h2 style="text-align: center; color: #27ae60;">✅ Réservation Confirmée</h2>
                  <p style="font-size: 16px; color: #333;">Bonjour <strong>${prenom}</strong>,</p>
                  <p style="font-size: 16px; color: #333;">Votre réservation a bien été enregistrée.</p>
                  <p><strong>🧾 Numéro de reçu :</strong> ${numeroRecu}</p>
                  <p><strong>🔐 Code d'accès :</strong> <span style="font-size: 18px; font-weight: bold; color: #e74c3c;">${codeReservation}</span></p>
                  <p><strong>📅 Heure d'arrivée :</strong> ${new Date(heureArrivee).toLocaleString()}</p>
                  <p><strong>📅 Heure de départ :</strong> ${new Date(heureDepart).toLocaleString()}</p>
                  <p><strong>💰 Montant payé :</strong> ${montant.toFixed(2)} FCFA</p>
                  <p style="margin-top: 20px; font-size: 14px; color: #999;">Merci pour votre confiance !</p>
                  <hr style="margin-top: 40px; border: none; border-top: 1px solid #eee;">
                  <p style="font-size: 12px; color: #aaa; text-align: center;">
                    &copy; 2025 Parking Intelligent - Tous droits réservés
                  </p>
                </div>
              </div>
            `
          };

          // Envoyer l'e-mail
          await transporter.sendMail(mailOptions);
        

        // Émettre l’événement WebSocket pour mise à jour en temps réel
        const io = req.app.get('io');
        io.emit('majEtatParking', {
            placeId: place._id,
            statut: place.statut,
            nomPlace: place.nomPlace,
        });

       

       


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
            if (place.statut !== 'reservee') {
                return res.status(400).json({
                    status: 'fail',
                    message: 'La réservation ne peut être modifiée que si la place est réservée.',
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
            console.log("Tarif récupéré:", tarif);
            console.log("Durée en minutes:", dureeEnMinutes);
            let montant = 0;

            // Calculer le montant basé sur la durée
            if (dureeEnMinutes >= 43200) { // 30 jours
                montant = tarif.tarifDurations.mois;
            } else if (dureeEnMinutes >= 10080) { // 7 jours
                montant = tarif.tarifDurations.semaine;
            } else if (dureeEnMinutes >= 1440) { // 24 heures
                montant = tarif.tarifDurations.jour; // Montant pour une journée
            } else if (dureeEnMinutes >= 60) { // 1 heure
                montant = tarif.tarifDurations.heure * (dureeEnMinutes / 60); // Règle de trois pour le tarif horaire
            } else { // Moins d'une heure
                montant = (tarif.tarifDurations.heure / 60) * dureeEnMinutes; // Règle de trois pour le tarif horaire
            }

            // Calculer les frais de transaction
            const fraisTransaction = montant * 0.02; // Par exemple, 2% du montant
            const montantTotal = montant + fraisTransaction;

            // Mettre à jour les données de réservation
            updateData.duree = dureeEnMinutes;
            updateData.montant = montantTotal; // Inclure le montant total avec frais
        }

        // Mise à jour des informations si fournies
        if (updateData.numeroImmatriculation) {
            existingReservation.numeroImmatriculation = updateData.numeroImmatriculation;
        }
        if (updateData.typeVehicule) {
            existingReservation.typeVehicule = updateData.typeVehicule;
        }

        const updatedReservation = await Reservation.findByIdAndUpdate(id, {
            ...existingReservation.toObject(),
            ...updateData
        }, {
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
        console.error(err); // Pour le débogage
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

        // Vérifier que l'état de la réservation est 'En cours'
        if (canceledReservation.etat !== 'En cours') {
            return res.status(400).json({
                status: 'fail',
                message: 'La réservation ne peut être annulée que si elle est en cours'
            });
        }

        // Vérifier le statut de la place de parking
        const place = await PlaceParking.findById(canceledReservation.placeId);
        if (!place) {
            return res.status(404).json({
                status: 'fail',
                message: 'Place de parking non trouvée'
            });
        }

        // Vérifier que la place est toujours 'reservee'
        if (place.statut !== 'reservee') {
            return res.status(400).json({
                status: 'fail',
                message: 'La réservation ne peut être annulée que si la place est toujours réservée'
            });
        }

        // Vérifier si l'heure d'arrivée est dans le futur
        const maintenant = new Date();
        const heureArrivee = new Date(canceledReservation.heureArrivee);

        if (heureArrivee > maintenant) {
            canceledReservation.codeNumerique = null; // Invalider le code numérique
        }

        // Mettre à jour l'état de la réservation à 'Annulée'
        canceledReservation.etat = 'Annulée';
        await canceledReservation.save();

        // Libérer la place de parking
        place.statut = 'libre';
        await place.save();

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
        const reservations = await Reservation.find({ userId })
            .sort({ createdAt: -1 }) // <- tri décroissant
            .populate('parkingId', 'nom_du_parking adresse') // Peupler les informations du parking
            .populate('userId', 'nom prenom telephone') // Peupler les informations de l'utilisateur
            .populate('placeId', 'nomPlace statut'); // Peupler les informations de la place, si nécessaire

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
            .sort({ createdAt: -1 }) // <- tri décroissant 
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

// Vérifier le code numérique d'une réservation
exports.verifyCode = async(req, res) => {
    try {
        const { codeNumerique } = req.params; // Récupérer le code numérique à vérifier

        // Rechercher une réservation correspondant au code numérique
        const reservation = await Reservation.findOne({ codeNumerique });

        // Vérifier si la réservation existe
        if (!reservation) {
            return res.status(404).json({
                status: 'fail',
                message: 'Code numérique invalide',
            });
        }

        // Vérifier si l'heure actuelle est supérieure à l'heure de départ
        const maintenant = new Date();
        const heureDepart = new Date(reservation.heureDepart);

        if (maintenant > heureDepart) {
            reservation.codeNumerique = null; // Invalider le code numérique
            await reservation.save();
            return res.status(400).json({
                status: 'fail',
                message: 'Le code numérique est invalide car l\'heure de départ est déjà passée.',
            });
        }

        // Retourner les informations si le code numérique est trouvé et valide
        res.status(200).json({
            status: 'success',
            message: 'Code numérique valide',
            data: reservation, // Retourne les informations de la réservation si nécessaire
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message,
        });
    }
};





// Fonction pour invalider le code numérique si l'heure de départ est atteinte
const invalidateExpiredCodes = async() => {
    const now = new Date();
    const expiredReservations = await Reservation.find({
        heureDepart: { $lte: now },
        etat: 'En cours',
    });

    for (const reservation of expiredReservations) {
        reservation.codeNumerique = null; // Invalider le code numérique
        reservation.etat = 'Terminée'; // Optionnel : changer l'état si nécessaire
        await reservation.save();
    }
};



// Appeler cette fonction à intervalles réguliers
setInterval(invalidateExpiredCodes, 60000); // Par exemple, toutes les minutes