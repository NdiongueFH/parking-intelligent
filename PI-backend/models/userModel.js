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
                return /^\d{9,15}$/.test(v.toString());
            },
            message: props => `${props.value} n'est pas un numéro de téléphone valide!`
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
        minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères']
    },
    adresse: { // Changement ici de "num_immatri" à "adresse"
        type: String,
        required: [true, 'L\'adresse est obligatoire'] // Message d'erreur adapté
    },
    role: {
        type: String,
        enum: ['utilisateur', 'administrateur'],
        default: 'utilisateur'
    },
    carteRfid: {
        type: String,
        required: function() {
            return this.role === 'administrateur';
        },
        validate: {
            validator: function(v) {
                // Si l'utilisateur est un administrateur, la carte RFID est obligatoire
                if (this.role === 'administrateur') {
                    return v && v.length > 0;
                }
                // Si l'utilisateur est un utilisateur normal, la carte RFID doit être absente
                return v === undefined || v === null || v === '';
            },
            message: props =>
                this.role === 'administrateur' ?
                'La carte RFID est obligatoire pour les administrateurs' : 'Les utilisateurs normaux ne doivent pas avoir de carte RFID'
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
    // Si le mot de passe n'a pas été modifié, passer à l'étape suivante
    if (!this.isModified('mot_de_passe')) return next();

    try {
        // Générer un sel et hacher le mot de passe
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