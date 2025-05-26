const User = require('../models/userModel');
const ResetToken = require('../models/ResetToken');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const Transfer = require('../models/transferModel');
const TokenBlacklist = require('../models/tokenBlacklistModel');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');

// Fonction utilitaire pour créer un token JWT
const signToken = id => {
    console.log('JWT_EXPIRES_IN:', process.env.JWT_EXPIRES_IN); // Debug
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '1h' // Défaut à '1h' si l'env est mal configuré
    });
};

// Fonction utilitaire pour envoyer le token en réponse
const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);

    // Enlever le mot de passe de la sortie
    user.mot_de_passe = undefined;

    res.status(statusCode).json({
        status: 'success',
        message: 'Connexion réussie', // Message personnalisé
        token, // Envoie du token
        data: {
            user
        }
    });
};


// Inscription d'un nouvel utilisateur
exports.signup = async(req, res) => {
    try {
        // Définir le rôle par défaut à 'utilisateur' si aucun rôle n'est fourni
        if (!req.body.role) {
            req.body.role = 'utilisateur';
        }

        // S'assurer qu'un utilisateur normal n'a pas de carte RFID
        if (req.body.role === 'utilisateur') {
            req.body.carteRfid = undefined; // Forcer la valeur à undefined pour éviter les erreurs
        }

        // Définir le solde par défaut selon le rôle
        let solde = (req.body.role === 'administrateur') ? 2000000 : 0;

        // Créer un nouvel utilisateur
        const newUser = await User.create({
            nom: req.body.nom,
            prenom: req.body.prenom,
            telephone: req.body.telephone,
            email: req.body.email,
            mot_de_passe: req.body.mot_de_passe,
            adresse: req.body.adresse,
            role: req.body.role,
            carteRfid: req.body.carteRfid, // La carte RFID est undefined si le rôle est 'utilisateur'
            solde // Ajouter le solde
        });

        // Répondre avec les informations de l'utilisateur sans envoyer de token
        res.status(201).json({
            status: 'success',
            message: 'Inscription réussie',
            data: {
                user: newUser
            }
        });
    } catch (err) {
        let errorMessage = 'Une erreur est survenue lors de l\'inscription';

        // Vérification des erreurs de duplication
        if (err.code === 11000) {
            if (err.keyPattern && err.keyPattern.email) {
                errorMessage = 'Cet email est déjà utilisé. Veuillez en choisir un autre.';
            } else if (err.keyPattern && err.keyPattern.telephone) {
                errorMessage = 'Ce numéro de téléphone est déjà associé à un compte.';
            } else if (err.keyPattern && err.keyPattern.carteRfid) {
                errorMessage = 'Cette carte RFID est déjà utilisée. Veuillez en choisir une autre.';
            }
        }

        // Répondre avec un message d'erreur personnalisé
        res.status(400).json({
            status: 'fail',
            message: errorMessage
        });
    }
};



// Connexion utilisateur par email/mot de passe
exports.login = async(req, res) => {
    try {
        const { email, mot_de_passe } = req.body;

        // Vérifier si l'email et le mot de passe existent
        if (!email || !mot_de_passe) {
            return res.status(400).json({
                status: 'fail',
                message: 'Veuillez fournir un email et un mot de passe'
            });
        }

        // Vérifier si l'utilisateur existe && mot de passe correct
        const user = await User.findOne({ email }).select('+mot_de_passe');

        if (!user || !(await user.comparePassword(mot_de_passe))) {
            return res.status(401).json({
                status: 'fail',
                message: 'Email ou mot de passe incorrect'
            });
        }

        // Si tout est correct, envoyer le token au client
        createSendToken(user, 200, res);
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

// Connexion administrateur par carte RFID
exports.loginRfid = async(req, res) => {
    try {
        const { carteRfid } = req.body;

        // Vérifier si la carte RFID existe
        if (!carteRfid) {
            return res.status(400).json({
                status: 'fail',
                message: 'Veuillez fournir une carte RFID'
            });
        }

        // Vérifier si un administrateur avec cette carte RFID existe
        const admin = await User.findOne({
            carteRfid,
            role: 'administrateur'
        });

        if (!admin) {
            return res.status(401).json({
                status: 'fail',
                message: 'Carte RFID non reconnue ou non autorisée'
            });
        }

        // Si tout est correct, envoyer le token au client
        createSendToken(admin, 200, res);
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

// Middleware pour protéger les routes
exports.protect = async(req, res, next) => {
    try {
        // 1) Vérifier si le token existe
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({
                status: 'fail',
                message: 'Vous n\'êtes pas connecté. Veuillez vous connecter pour accéder à cette ressource.'
            });
        }

        // 2) Vérifier si le token est valide
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // 3) Vérifier si l'utilisateur existe toujours
        const currentUser = await User.findById(decoded.id);
        if (!currentUser) {
            return res.status(401).json({
                status: 'fail',
                message: 'L\'utilisateur appartenant à ce token n\'existe plus.'
            });
        }

        // 4) Attacher l'utilisateur à la requête
        req.user = currentUser;
        next();
    } catch (err) {
        res.status(401).json({
            status: 'fail',
            message: 'Token invalide ou expiré'
        });
    }
};

// Obtenir les informations de l'utilisateur connecté
exports.getMe = (req, res) => {
    res.status(200).json({
        status: 'success',
        data: {
            user: req.user // Utilisateur connecté
        }
    });
};

// Middleware de restriction basé sur les rôles
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        // Vérification de l'existence de req.user
        if (!req.user) {
            return res.status(401).json({
                status: 'fail',
                message: 'Utilisateur non authentifié'
            });
        }

        // Vérification de l'existence du rôle
        if (!req.user.role) {
            return res.status(403).json({
                status: 'fail',
                message: 'Rôle utilisateur non défini'
            });
        }

        // Vérification des permissions
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                status: 'fail',
                message: 'Vous n\'avez pas la permission d\'effectuer cette action'
            });
        }

        next();
    };
};


// Obtenir tous les utilisateurs
exports.getAllUsers = async(req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 }); // <- tri ici

        res.status(200).json({
            status: 'success',
            results: users.length,
            data: {
                users
            }
        });
    } catch (err) {
        res.status(404).json({
            status: 'fail',
            message: err.message
        });
    }
};

// Obtenir un utilisateur par ID
exports.getUser = async(req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                status: 'fail',
                message: 'Aucun utilisateur trouvé avec cet ID'
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                user
            }
        });
    } catch (err) {
        res.status(404).json({
            status: 'fail',
            message: err.message
        });
    }
};

// Rechercher un utilisateur par téléphone
exports.getUserByTelephone = async(req, res) => {
    try {
        const { telephone } = req.params; // Récupère le numéro de téléphone depuis les paramètres de la requête

        // Vérifie si le téléphone est fourni
        if (!telephone) {
            return res.status(400).json({
                status: 'fail',
                message: 'Veuillez fournir un numéro de téléphone.'
            });
        }

        // Recherche l'utilisateur par téléphone
        const user = await User.findOne({ telephone });

        if (!user) {
            return res.status(404).json({
                status: 'fail',
                message: 'Aucun utilisateur trouvé avec ce numéro de téléphone.'
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                user
            }
        });
    } catch (err) {
        res.status(500).json({
            status: 'fail',
            message: 'Erreur lors de la recherche de l\'utilisateur.',
            error: err.message
        });
    }
};

// Mettre à jour un utilisateur
exports.updateUser = async(req, res) => {
    try {
        // Empêcher la mise à jour du mot de passe ici
        if (req.body.mot_de_passe) {
            return res.status(400).json({
                status: 'fail',
                message: 'Cette route n\'est pas pour les mises à jour de mot de passe. Utilisez /updatePassword.'
            });
        }

        // Vérification de cohérence pour carteRfid
        if (req.body.role === 'utilisateur' && req.body.carteRfid) {
            delete req.body.carteRfid;
        }

        const user = await User.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        if (!user) {
            return res.status(404).json({
                status: 'fail',
                message: 'Aucun utilisateur trouvé avec cet ID'
            });
        }

        res.status(200).json({
            status: 'success',
            data: {
                user
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

// Supprimer un utilisateur
exports.deleteUser = async(req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({
                status: 'fail',
                message: 'Aucun utilisateur trouvé avec cet ID'
            });
        }

        res.status(200).json({
            status: 'success',
            message: 'Utilisateur supprimé avec succès'
        });

    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};

// Mettre à jour son propre profil (pour l'utilisateur connecté)
exports.updateMe = async(req, res) => {
    try {
        console.log('User ID:', req.user.id); // Debugger la valeur de req.user.id

        // Empêcher la mise à jour du mot de passe ici
        if (req.body.mot_de_passe) {
            return res.status(400).json({
                status: 'fail',
                message: 'Cette route n\'est pas pour les mises à jour de mot de passe. Utilisez /updatePassword.'
            });
        }

        // Filtrer les champs non autorisés
        const filteredBody = {};
        const allowedFields = ['nom', 'prenom', 'telephone', 'email', 'adresse'];
        Object.keys(req.body).forEach(el => {
            if (allowedFields.includes(el)) filteredBody[el] = req.body[el];
        });

        // Mettre à jour le document utilisateur
        const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            status: 'success',
            data: {
                user: updatedUser
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};


// Mettre à jour son propre mot de passe
exports.updatePassword = async(req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;

        // Vérifier que tous les champs nécessaires sont fournis
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({
                status: 'fail',
                message: 'Veuillez fournir votre mot de passe actuel, le nouveau mot de passe et la confirmation du nouveau mot de passe'
            });
        }

        // Vérifier que le nouveau mot de passe et sa confirmation correspondent
        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                status: 'fail',
                message: 'Le nouveau mot de passe et sa confirmation ne correspondent pas'
            });
        }

        // Obtenir l'utilisateur de la collection
        const user = await User.findById(req.user.id).select('+mot_de_passe');

        // Vérifier si le mot de passe actuel est correct
        if (!(await user.comparePassword(currentPassword))) {
            return res.status(401).json({
                status: 'fail',
                message: 'Votre mot de passe actuel est incorrect'
            });
        }

        // Si tout est correct, mettre à jour le mot de passe
        user.mot_de_passe = newPassword;
        await user.save();

        // Connecter l'utilisateur, envoyer JWT
        createSendToken(user, 200, res);
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};


// Méthode pour gérer la déconnexion
exports.logout = async(req, res, next) => {
    try {
        // Récupérer le token de l'en-tête Authorization
        const token = req.headers.authorization.split(' ')[1]; // "Bearer <token>"

        // Vérifier si le token est fourni
        if (!token) {
            return res.status(400).json({
                status: 'fail',
                message: 'Token manquant',
            });
        }

        // Ajouter le token à la blacklist avec une expiration (par exemple, 7 jours)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // Définir l'expiration à 7 jours

        await TokenBlacklist.create({ token, expiresAt });

        // Répondre que la déconnexion a réussi
        res.status(200).json({
            status: 'success',
            message: 'Déconnexion réussie',
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Erreur lors de la déconnexion',
        });
    }
};

// Méthode de dépôt
exports.deposit = async(req, res) => {
    const { telephone, montant } = req.body;

    // Validation des données
    if (!telephone || !montant || montant <= 0) {
        return res.status(400).json({
            status: 'fail',
            message: 'Veuillez fournir un numéro de téléphone valide et un montant positif pour le dépôt.'
        });
    }

    try {
        const user = await User.findOne({ telephone });

        if (!user) {
            return res.status(404).json({
                status: 'fail',
                message: 'Utilisateur non trouvé avec ce numéro de téléphone.'
            });
        }

        const admin = req.user; // L'administrateur effectue l'opération
        if (admin.role !== 'administrateur') {
            return res.status(403).json({
                status: 'fail',
                message: 'Seul un administrateur peut effectuer un dépôt.'
            });
        }

        // Mettre à jour les soldes
        user.solde += montant; // Créditer l'utilisateur
        admin.solde -= montant; // Débiter l'administrateur du montant

        await user.save();
        await admin.save();

        // Créer un enregistrement de transfert
        await Transfer.create({
            type: 'depot',
            montant,
            telephone: user.telephone,
            nom: user.nom,
            prenom: user.prenom,
            administrateur: admin._id,
            utilisateur: user._id // <-- AJOUT OBLIGATOIRE

        });

        res.status(200).json({
            status: 'success',
            message: 'Dépôt réussi.',
            data: {
                montant,
                soldeUtilisateur: user.solde,
                soldeAdministrateur: admin.solde
            }
        });
    } catch (err) {
        res.status(500).json({
            status: 'fail',
            message: 'Erreur lors du dépôt.',
            error: err.message
        });
    }
};
// Méthode de retrait// Méthode de retrait
exports.withdraw = async(req, res) => {
    const { telephone, montant } = req.body;

    // Validation des données
    if (!telephone || !montant || montant <= 0) {
        return res.status(400).json({
            status: 'fail',
            message: 'Veuillez fournir un numéro de téléphone valide et un montant positif pour le retrait.'
        });
    }

    try {
        const user = await User.findOne({ telephone });

        if (!user) {
            return res.status(404).json({
                status: 'fail',
                message: 'Utilisateur non trouvé avec ce numéro de téléphone.'
            });
        }

        if (user.solde < montant) {
            return res.status(400).json({
                status: 'fail',
                message: 'Solde insuffisant pour le retrait.'
            });
        }

        const admin = req.user; // L'administrateur effectue l'opération
        if (admin.role !== 'administrateur') {
            return res.status(403).json({
                status: 'fail',
                message: 'Seul un administrateur peut effectuer un retrait.'
            });
        }

        // Mettre à jour les soldes
        user.solde -= montant; // Débiter l'utilisateur
        admin.solde += montant; // Créditer l'administrateur du montant

        await user.save();
        await admin.save();

        // Créer un enregistrement de transfert
        await Transfer.create({
            type: 'retrait',
            montant,
            telephone: user.telephone,
            nom: user.nom,
            prenom: user.prenom,
            administrateur: admin._id,
            utilisateur: user._id // <-- AJOUT OBLIGATOIRE

        });

        res.status(200).json({
            status: 'success',
            message: 'Retrait réussi.',
            data: {
                montant,
                soldeUtilisateur: user.solde,
                soldeAdministrateur: admin.solde
            }
        });
    } catch (err) {
        res.status(500).json({
            status: 'fail',
            message: 'Erreur lors du retrait.',
            error: err.message
        });
    }
};


// Obtenir le total des utilisateurs
exports.getTotalUsers = async(req, res) => {
    try {
        const totalUsers = await User.countDocuments({ role: 'utilisateur' });
        res.status(200).json({
            status: 'success',
            totalUsers
        });
    } catch (err) {
        res.status(500).json({
            status: 'fail',
            message: 'Erreur lors de la récupération du total des utilisateurs.',
            error: err.message
        });
    }
};

// Obtenir le total des administrateurs
exports.getTotalAdmins = async(req, res) => {
    try {
        const totalAdmins = await User.countDocuments({ role: 'administrateur' });
        res.status(200).json({
            status: 'success',
            totalAdmins
        });
    } catch (err) {
        res.status(500).json({
            status: 'fail',
            message: 'Erreur lors de la récupération du total des administrateurs.',
            error: err.message
        });
    }
};



exports.forgotPassword = async (req, res) => {
    try {
      const { email } = req.body;
  
      if (!email) {
        return res.status(400).json({ message: 'Email requis' });
      }
  
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }
  
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 3600000); // 1 heure
  
      await ResetToken.create({ userId: user._id, token, expiresAt });
  
      // Envoi de l'email avec le lien de réinitialisation
      await sendResetEmail(user.email, token);
  
      return res.json({
        message: 'Un email de réinitialisation a été envoyé.',
      });
  
    } catch (error) {
      console.error('Erreur dans forgotPassword:', error);
      return res.status(500).json({ message: 'Erreur serveur' });
    }
  };
  
  exports.resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;
  
    // Vérifie que le nouveau mot de passe est valide
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: 'Mot de passe trop court (min. 6 caractères)' });
    }
  
    try {
      // Recherche du token dans la base
      const reset = await ResetToken.findOne({ token });
      if (!reset || reset.expiresAt < new Date()) {
        return res.status(400).json({ message: 'Token invalide ou expiré' });
      }
  
      // Recherche de l'utilisateur associé
      const user = await User.findById(reset.userId);
      if (!user) {
        return res.status(404).json({ message: 'Utilisateur non trouvé' });
      }
  
      // Affecte le mot de passe en clair (sera hashé automatiquement par le middleware)
      user.mot_de_passe = newPassword;
      await user.save();
  
      // Supprime tous les tokens liés à cet utilisateur
      await ResetToken.deleteMany({ userId: user._id });
  
      // Réponse au client
      return res.json({ message: 'Mot de passe réinitialisé avec succès' });
  
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Erreur serveur" });
    }
  };
  
  const sendResetEmail = async (email, token) => {
    const nodemailer = require('nodemailer');
  
    let transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  
    const resetUrl = `https://parking-intelligent.vercel.app/reset-password?token=${token}`;
  
    let mailOptions = {
      from: '"Parking Intelligent" <hawa.ndiongue@gmail.com>',
      to: email,
      subject: '🔐 Réinitialisation de votre mot de passe',
      html: `
        <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 30px;">
          <div style="max-width: 600px; margin: auto; background: white; border-radius: 10px; padding: 30px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
            <h2 style="text-align: center; color: #2c3e50;">🔐 Réinitialisation de mot de passe</h2>
            <p style="font-size: 16px; color: #333;">Bonjour <strong>cher utilisateur</strong>,</p>
            <p style="font-size: 16px; color: #333;">Vous avez demandé la réinitialisation de votre mot de passe.</p>
            <p style="font-size: 16px; color: #333;">Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe. Ce lien est valable pendant <strong>1 heure</strong>.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="padding: 12px 25px; background-color: #3498db; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">Réinitialiser</a>
            </div>
            <p style="font-size: 14px; color: #999;">Si vous n'avez pas fait cette demande, vous pouvez ignorer ce message.</p>
            <hr style="margin-top: 40px; border: none; border-top: 1px solid #eee;">
            <p style="font-size: 12px; color: #aaa; text-align: center;">
              &copy; 2025 Parking Intelligent - Tous droits réservés
            </p>
          </div>
        </div>
      `
    };
  
    try {
      let info = await transporter.sendMail(mailOptions);
      console.log('Email envoyé:', info.messageId);
    } catch (error) {
      console.error('Erreur envoi email:', error);
    }
  };
  
  

  