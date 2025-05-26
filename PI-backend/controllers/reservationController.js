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

        let montant = 0;
        let resteMinutes = dureeEnMinutes;

        // Mois (30 jours)
        if (resteMinutes >= 43200 && tarif.tarifDurations.mois) {
            const mois = Math.floor(resteMinutes / 43200);
            montant += mois * tarif.tarifDurations.mois;
            resteMinutes -= mois * 43200;
        }

        // Semaines (7 jours)
        if (resteMinutes >= 10080 && tarif.tarifDurations.semaine) {
            const semaines = Math.floor(resteMinutes / 10080);
            montant += semaines * tarif.tarifDurations.semaine;
            resteMinutes -= semaines * 10080;
        }

        // Jours
        if (resteMinutes >= 1440 && tarif.tarifDurations.jour) {
            const jours = Math.floor(resteMinutes / 1440);
            montant += jours * tarif.tarifDurations.jour;
            resteMinutes -= jours * 1440;
        }

        // Heures
        if (resteMinutes >= 60 && tarif.tarifDurations.heure) {
            const heures = Math.floor(resteMinutes / 60);
            montant += heures * tarif.tarifDurations.heure;
            resteMinutes -= heures * 60;
        }

        // Minutes restantes
        if (resteMinutes > 0 && tarif.tarifDurations.heure) {
            montant += (tarif.tarifDurations.heure / 60) * resteMinutes;
        }

        // ✅ Arrondir le montant total à l'entier supérieur
        montant = Math.ceil(montant);

        // ✅ Calcul des frais de transaction en entier
        const fraisTransaction = Math.ceil(montant * 0.02);

        // ✅ Total à payer
        const montantTotal = montant + fraisTransaction;


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

       // Forcer le montant à être un entier
        montant = Math.ceil(montant); // ou Math.round(montant) selon ta logique métier

        
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
                  <p style="font-size: 16px; color: #333;">Utilisez ce code pour pouvoir acceder au parking. Il ne sera valable que pour la date et l'heure de reservation ! </p>
                  <p><strong>🧾 Numéro de reçu :</strong> ${reservation.numeroRecu}</p>
                  <p><strong>🔐 Code d'accès :</strong> <span style="font-size: 18px; font-weight: bold; color: #e74c3c;">${reservation.codeNumerique}</span></p>
                  <p><strong>📅 Heure d'arrivée :</strong> ${new Date(heureArrivee).toLocaleString()}</p>
                  <p><strong>📅 Heure de départ :</strong> ${new Date(heureDepart).toLocaleString()}</p>
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
        
            if (heureArrivee >= heureDepart) {
                return res.status(400).json({
                    status: 'fail',
                    message: 'L\'heure d\'arrivée doit être strictement inférieure à l\'heure de départ',
                });
            }
        
            const dureeEnMillisecondes = heureDepart - heureArrivee;
            const dureeEnMinutes = Math.floor(dureeEnMillisecondes / (1000 * 60));
        
            // Tarif récupéré
            const tarif = await TarifStationnement.findById(existingReservation.tarifId);
            let montant = 0;
            let resteMinutes = dureeEnMinutes;
        
            if (resteMinutes >= 43200 && tarif.tarifDurations.mois) {
                const mois = Math.floor(resteMinutes / 43200);
                montant += mois * tarif.tarifDurations.mois;
                resteMinutes -= mois * 43200;
            }
        
            if (resteMinutes >= 10080 && tarif.tarifDurations.semaine) {
                const semaines = Math.floor(resteMinutes / 10080);
                montant += semaines * tarif.tarifDurations.semaine;
                resteMinutes -= semaines * 10080;
            }
        
            if (resteMinutes >= 1440 && tarif.tarifDurations.jour) {
                const jours = Math.floor(resteMinutes / 1440);
                montant += jours * tarif.tarifDurations.jour;
                resteMinutes -= jours * 1440;
            }
        
            if (resteMinutes >= 60 && tarif.tarifDurations.heure) {
                const heures = Math.floor(resteMinutes / 60);
                montant += heures * tarif.tarifDurations.heure;
                resteMinutes -= heures * 60;
            }
        
            if (resteMinutes > 0 && tarif.tarifDurations.heure) {
                montant += (tarif.tarifDurations.heure / 60) * resteMinutes;
            }
        
            montant = Math.ceil(montant);
            const fraisTransaction = Math.ceil(montant * 0.02);
            const montantTotal = montant + fraisTransaction;
        
            const dureeFormatted = `${String(Math.floor(dureeEnMinutes / 60)).padStart(2, '0')}:${String(dureeEnMinutes % 60).padStart(2, '0')}:00`;
        
            // Mise à jour
            existingReservation.heureArrivee = heureArrivee;
            existingReservation.heureDepart = heureDepart;
            existingReservation.duree = dureeFormatted;
            existingReservation.heureRestante = dureeEnMinutes;
            existingReservation.montant = montantTotal;
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