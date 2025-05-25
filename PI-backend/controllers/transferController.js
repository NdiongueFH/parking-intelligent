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


// Méthode pour obtenir les transactions de l'utilisateur connecté
exports.getUserTransfers = async (req, res) => {
    try {
        const userId = req.user._id; // Nécessite un middleware d'authentification

        const transfers = await Transfer.find({ utilisateur: userId }).populate('administrateur', 'nom prenom');

        res.status(200).json({
            status: 'success',
            results: transfers.length,
            data: { transfers }
        });
    } catch (err) {
        console.error("Erreur lors de la récupération des transactions:", err);
        res.status(500).json({
            status: 'fail',
            message: 'Erreur lors de la récupération des transactions de l\'utilisateur.',
            error: err.message
        });
    }
};


exports.getTodayTotals = async (req, res) => {
    try {
      const userId = req.user._id;
  
      // Début et fin de la journée actuelle
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
  
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
  
      const todayTransfers = await Transfer.find({
        utilisateur: userId,
        date: { $gte: startOfDay, $lte: endOfDay }
      });
  
      // Calcul des totaux
      let totalDepot = 0;
      let totalRetrait = 0;
  
      todayTransfers.forEach(t => {
        if (t.type === 'depot') totalDepot += t.montant;
        if (t.type === 'retrait') totalRetrait += t.montant;
      });
  
      return res.status(200).json({
        status: 'success',
        data: {
          totalDepot,
          totalRetrait
        }
      });
  
    } catch (err) {
      console.error('Erreur lors du calcul des totaux journaliers :', err);
      return res.status(500).json({
        status: 'fail',
        message: 'Erreur serveur.',
        error: err.message
      });
    }
  };

