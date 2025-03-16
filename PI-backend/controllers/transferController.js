const Transfer = require('../models/transferModel');

// Méthode pour obtenir la liste des transactions
exports.getAllTransfers = async(req, res) => {
    try {
        const transfers = await Transfer.find().populate('administrateur', 'nom prenom');
        res.status(200).json({
            status: 'success',
            results: transfers.length,
            data: {
                transfers
            }
        });
    } catch (err) {
        console.error("Error retrieving transfers:", err);
        res.status(500).json({
            status: 'fail',
            message: 'Erreur lors de la récupération des transactions.',
            error: err.message
        });
    }
};