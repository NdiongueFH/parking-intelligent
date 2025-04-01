// Importation des dépendances
const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const { SerialPort, ReadlineParser } = require('serialport');
const http = require('http'); // Importer le module HTTP
const socketIo = require('socket.io'); // Importer Socket.io
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const parkingRoutes = require('./routes/parkingRoutes');
const placeParkingRoutes = require('./routes/placeParkingRoutes');
const tarifRoutes = require('./routes/tarifRoutes');
const reservationRoutes = require('./routes/reservationRoutes');
const amendeRoutes = require('./routes/amendeRoutes');
const transferRoutes = require('./routes/transferRoutes');
const PlaceParking = require('./models/placeParking');
const Parking = require('./models/parking');
const Reservation = require('./models/reservationModel');


dotenv.config();


const app = express(); // Créer une instance de l'application Express

const server = http.createServer(app); // Créer une instance de serveur HTTP avec Express


// Créer une instance de Socket.io
const io = socketIo(server, {
    cors: {
        origin: "http://localhost:4200", // Autoriser votre application Angular
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type"],
        credentials: true,
    }
});


// Utiliser CORS pour permettre les requêtes depuis différents domaines
// Middleware CORS
app.use(cors({
    origin: "http://localhost:4200", // Autoriser votre application Angular
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
}));


// Middleware pour gérer les données JSON dans les requêtes
app.use(express.json());

// Connexion à MongoDB via Mongoose
mongoose.connect('mongodb://localhost:27017/Smart-Parking')
    .then(() => console.log('Connexion à MongoDB réussie'))
    .catch((err) => {
        console.error('Erreur de connexion à MongoDB', err);
        process.exit(1);
    });

// Récupérer la clé secrète pour JWT depuis le fichier .env
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
    console.error('Erreur : JWT_SECRET n\'est pas défini dans le fichier .env');
    process.exit(1);
}

// Utilisation des routes d'utilisateur et d'authentification
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/transfers', transferRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/parkings', parkingRoutes);
app.use('/api/v1/place-parking', placeParkingRoutes);
app.use('/api/v1/tarifs', tarifRoutes);
app.use('/api/v1/reservations', reservationRoutes);
app.use('/api/v1/amendes', amendeRoutes);

// Route de base pour vérifier que le serveur fonctionne
app.get('/', (req, res) => {
    res.send('API de gestion des utilisateurs et des parkings');
});

// Gestion des erreurs non gérées
app.all('*', (req, res, next) => {
    res.status(404).json({
        status: 'fail',
        message: `La route ${req.originalUrl} n'existe pas sur ce serveur`,
    });
});

// Middleware de gestion des erreurs
app.use((err, req, res, next) => {
    console.error('Erreur:', err);
    res.status(err.statusCode || 500).json({
        status: 'error',
        message: err.message || 'Une erreur interne est survenue',
    });
});

// Configuration du port série pour récupérer les données de l'Arduino
const portName = process.env.SERIAL_PORT || '/dev/ttyACM0'; // Le port série
const port = new SerialPort({
    path: portName,
    baudRate: 9600,
});

// Utilisation de la nouvelle syntaxe pour le parser
const parser = port.pipe(new ReadlineParser({ delimiter: '\n' }));

// Émettre les données via Socket.io dès qu'elles sont reçues
parser.on('data', async(data) => {
    console.log('Données reçues de l\'Arduino :', data.trim());

    // Exemple de correspondance pour l'UID de la carte RFID
    const matchRfid = data.trim().match(/UID de la carte: (\w+)/);
    if (matchRfid) {
        const rfidUid = matchRfid[1]; // Capture l'UID

        // Émettre l'UID via Socket.IO
        io.emit('rfidScanned', rfidUid);
        console.log('UID émis:', rfidUid);
    }

    // Gestion des données de capteurs (votre code existant)
    const matchCapteur = data.trim().match(/Capteur (\d+): Statut de la place: (\w+)/);
    if (matchCapteur) {
        const capteurId = parseInt(matchCapteur[1], 10);
        const statut = matchCapteur[2];

        try {
            const place = await PlaceParking.findOne({ capteurId });
            if (place) {
                place.statut = statut;
                await place.save();

                io.emit('majEtatParking', {
                    placeId: place._id,
                    statut: place.statut,
                    nomPlace: place.nomPlace,
                });
            }
        } catch (err) {
            console.error('Erreur lors de la mise à jour de la place:', err);
        }
    }

    // Nouvelle logique de validation de code
    const matchCode = data.trim().match(/^CODE:(\d{5})$/); // Modifier la longueur si nécessaire
    if (matchCode) {
        const code = matchCode[1];

        try {
            // Rechercher une réservation avec l'état 'En cours' et le codeNumerique correspondant
            const reservation = await Reservation.findOne({
                codeNumerique: code,
                etat: 'En cours'
            });

            if (reservation) {
                // Code valide
                console.log('Réservation trouvée pour le code:', code);
                port.write('VALIDE\n', (err) => {
                    if (err) {
                        console.error('Erreur lors de l\'envoi de la réponse VALIDE:', err);
                    }
                });
                // Mettre à jour le statut de la place...
            } else {
                // Code invalide
                console.log('Aucune réservation valide trouvée pour le code:', code);
                port.write('INVALIDE\n', (err) => {
                    if (err) {
                        console.error('Erreur lors de l\'envoi de la réponse INVALIDE:', err);
                    }
                });
            }
        } catch (err) {
            console.error('Erreur lors de la validation du code:', err);
            port.write('INVALIDE\n', (err) => {
                if (err) {
                    console.error('Erreur lors de l\'envoi de la réponse INVALIDE:', err);
                }
            });
        }
    }
});

// Démarrer le serveur sur le port spécifié
const portHttp = process.env.PORT || 3000;
server.listen(portHttp, () => {
    console.log(`Serveur en écoute sur le port ${portHttp}`);
});