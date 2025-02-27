const User = require('../models/userModel');
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
// Inscription d'un nouvel utilisateur
exports.signup = async(req, res) => {
    try {
        // S'assurer qu'un utilisateur normal n'a pas de carte RFID
        if (req.body.role === 'utilisateur' && req.body.carteRfid) {
            delete req.body.carteRfid;
        }

        // Créer un nouvel utilisateur
        const newUser = await User.create({
            nom: req.body.nom,
            prenom: req.body.prenom,
            telephone: req.body.telephone,
            email: req.body.email,
            mot_de_passe: req.body.mot_de_passe,
            adresse: req.body.adresse,
            role: req.body.role,
            carteRfid: req.body.carteRfid
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
        res.status(400).json({
            status: 'fail',
            message: err.message
        });
    }
};




// Connexion utilisateur par email/mot de passe

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
// Middleware d'authentification
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
        const users = await User.find();

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