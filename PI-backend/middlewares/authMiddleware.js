const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const TokenBlacklist = require('../models/tokenBlacklistModel');

const verifyToken = async(req, res, next) => {
    try {
        // Récupération du token depuis l'en-tête Authorization
        let token;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1]; // Extraction du token
        }

        // Si aucun token n'est fourni, retourner une erreur
        if (!token) {
            return res.status(401).json({
                status: 'fail',
                message: 'Vous n\'êtes pas connecté. Veuillez vous connecter pour accéder à cette ressource.'
            });
        }

        // Vérification si le token est en blacklist
        const isBlacklisted = await TokenBlacklist.findOne({ token });
        if (isBlacklisted) {
            return res.status(401).json({
                status: 'fail',
                message: 'Token révoqué. Veuillez vous reconnecter.'
            });
        }

        // Vérification du token à l’aide de JWT
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Recherche de l'utilisateur correspondant au token
        const currentUser = await User.findById(decoded.id);
        if (!currentUser) {
            return res.status(401).json({
                status: 'fail',
                message: 'L\'utilisateur appartenant à ce token n\'existe plus.'
            });
        }

        // Si l'utilisateur existe, on attache l'utilisateur au `req`
        req.user = currentUser;
        next(); // Passage à la suite du middleware/routeur

    } catch (err) {
        return res.status(401).json({
            status: 'fail',
            message: 'Token invalide ou expiré'
        });
    }
};
module.exports = { verifyToken };