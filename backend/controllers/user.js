const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const validator = require('email-validator');
const user = require('../models/user');

exports.signup = (req, res, next) => {
    console.log('bonjour');
        bcrypt.hash(req.body.password, 10)
            .then(hash => {
                const myUser = new user({
                    email: req.body.email,
                    password: hash
                });
                console.log(myUser.email);
                console.log(myUser.password);
            myUser.save()
                .then(() => res.status(201).json({ message: 'Utilisateur créé.' }))
                .catch(error => res.status(400).json({ error }));
            })
            .catch(error => res.status(500).json({ error }));
};

exports.login = (req, res, next) => {
    user.findOne({ email: req.body.email })
        .then(myUser => {
            if(!myUser) { return res.status(401).json({ error: 'Utilisateur non trouvé.' }); }
            bcrypt.compare(req.body.password, myUser.password)
            .then(valid => {
                if(!valid) { return res.status(401).json({ error: 'Mot de passe incorrect.' }); }
                const newToken = jwt.sign({ userId: myUser._id }, 'RANDOM_TOKEN_SECRET', { expiresIn: '24h' });
                res.setHeader('Authorization', 'Bearer '+ newToken);
                res.status(200).json({
                    userId: myUser._id,
                    token: newToken
                });
            })
            .catch(error => res.status(500).json({ error }));
        })
        .catch(error => res.status(500).json({ error }));
};