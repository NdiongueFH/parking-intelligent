const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    nom: {
        type: String,
        required: [true, 'Le nom est obligatoire']
    },
    prenom: {
        type: String,
        required: [true, 'Le prénom est obligatoire']
    },
    telephone: {
        type: Number,
        required: [true, 'Le numéro de téléphone est obligatoire'],
        unique: true,
        validate: {
            validator: function(v) {
                return /^\d{9}$/.test(v.toString()); // Validation pour 9 chiffres
            },
            message: 'Veuillez entrer un numéro valide (9 chiffres)' // Message d'erreur personnalisé
        }
    },
    email: {
        type: String,
        required: [true, 'L\'email est obligatoire'],
        unique: true,
        lowercase: true,
        validate: {
            validator: function(v) {
                return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
            },
            message: props => `${props.value} n'est pas un email valide!`
        }
    },
    mot_de_passe: {
        type: String,
        required: [true, 'Le mot de passe est obligatoire'],
        minlength: [8, 'Le mot de passe doit contenir au moins 8 caractères']
    },
    adresse: {
        type: String,
        required: [true, 'L\'adresse est obligatoire']
    },
    role: {
        type: String,
        enum: ['utilisateur', 'administrateur'],
        default: 'utilisateur'
    },
    carteRfid: {
        type: String,
        unique: true,
        sparse: true, // Permet d'avoir plusieurs documents avec carteRfid: null
        required: function() {
            return this.role === 'administrateur';
        },
        validate: {
            validator: function(v) {
                if (this.role === 'administrateur') {
                    return v && v.length > 0;
                }
                return true; // Pas de validation pour les utilisateurs normaux
            },
            message: props =>

                this.role === 'administrateur' ?
                'La carte RFID est obligatoire pour les administrateurs' : 'Les utilisateurs normaux ne doivent pas avoir de carte RFID'
        }
    },

    solde: {
        type: Number,
        default: 0, // La valeur par défaut sera définie lors de la création de l'utilisateur
        required: true,
        validate: {
            validator: function(v) {
                return v >= 0; // Validation pour s'assurer que le solde est positif
            },
            message: props => 'Le solde doit être un nombre positif.'
        }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Middleware pre-save pour hacher le mot de passe avant l'enregistrement
userSchema.pre('save', async function(next) {
    if (!this.isModified('mot_de_passe')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.mot_de_passe = await bcrypt.hash(this.mot_de_passe, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Méthode pour comparer les mots de passe
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.mot_de_passe);
};

// Middleware pre-update pour mettre à jour le champ updatedAt
userSchema.pre('findOneAndUpdate', function(next) {
    this.set({ updatedAt: Date.now() });
    next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;