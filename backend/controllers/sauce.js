const fs = require('fs');
const sauce = require('../models/sauce');

// Toutes les sauces
exports.getAllSauces = (req, res, next) => {
    sauce.find()
        .then(newSauce => res.status(200).json(newSauce))
        .catch(error => res.status(400).json({ error }));
};

// Sauce spécifique
exports.getOneSauce = (req, res, next) => {
    sauce.findOne({ _id: req.params.id })
        .then(newSauce => res.status(200).json(newSauce))
        .catch(error => res.status(404).json({ error }));
};

// Nouvelle sauce
exports.createSauce = (req, res, next) => {
    const sauceObject = JSON.parse(req.body.sauce);
    const newSauce = new sauce({ 
        ...sauceObject,
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
        likes: 0,
        dislikes: 0,
        usersLiked: '',
        usersDisliked: ''
    });
    newSauce.save()
        .then(() => res.status(201).json({ message: 'Nouvelle sauce insérée avec succès !' }))
        .catch(error => res.status(400).json({ error }));
};

// MAJ sauce existante
exports.updateSauce = (req, res, next) => {
    if(req.file) { // Supprimer l'ancienne image si l'utilisateur la change
        sauce.findOne({ _id: req.params.id })
            .then(newSauce => {
                const last_filename = newSauce.imageUrl.split('/images/')[1];
                fs.unlink('images/' + last_filename, () => {});
            })
            .catch(error => console.log('Echec de la suppression de l\'ancienne image.'));
    }
    setTimeout(() => {
        const sauceObject = req.file ? {
        ...JSON.parse(req.body.sauce),
        imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`
        } : { ...req.body };
        sauce.updateOne({ _id: req.params.id }, { ...sauceObject, _id: req.params.id })
            .then(() => res.status(200).json({ message: 'Objet modifié !'}))
            .catch(error => res.status(400).json({ error }));
    }, 250);
};

// Supprimer sauce
exports.deleteSauce = (req, res, next) => {
    sauce.findOne({ _id: req.params.id })
        .then(newSauce => {
            const filename = newSauce.imageUrl.split('/images/')[1];
            fs.unlink('images/' + filename, () => {
            sauce.deleteOne({ _id: req.params.id })
                .then(() => res.status(200).json({ message: 'Objet supprimé !'}))
                .catch(error => res.status(400).json({ error }));
            });
        })
        .catch(error => res.status(500).json({ error }));
};

// Like/Dislike
exports.likeSauce = (req, res, next) => {
    sauce.findOne({ _id: req.params.id })
        .then(newSauce => {
            let i = 0;
            let tabLikes = []; let tabDislikes = [];
            let already_liked = 0; let already_disliked = 0;
            let type_like = req.body.like;
            let user_id = req.body.userId;

            // Vérifier si l'utilisateur a déjà like/dislike
            if(newSauce.usersLiked) {
                tabLikes = JSON.parse(newSauce.usersLiked);
                while(i < tabLikes.length) {
                    if(tabLikes[i] == user_id) { 
                        if(type_like == 0 || type_like == -1) { // Supprimer userid des 'userLikes' annule/dislike
                            tabLikes.splice(i, 1); 
                            newSauce.likes --;
                        }
                        already_liked = 1;
                    }
                    i ++;
                }
            }
            if(newSauce.usersDisliked) {
                tabDislikes = JSON.parse(newSauce.usersDisliked); i = 0;
                while(i < tabDislikes.length) {
                    if(tabDislikes[i] == user_id) { 
                        if(type_like == 0 || type_like == 1) { // Supprimer userid des 'userDislikes' si annule/like
                            tabDislikes.splice(i, 1); 
                            newSauce.dislikes --;
                        }
                        already_disliked = 1;
                    }
                    i ++;
                }
            }

            // Ajout like/dislike
            if(type_like == 1 && already_liked == 0) {
                tabLikes.push(user_id);
                newSauce.likes ++; 
            }
            if(type_like == -1 && already_disliked == 0) {
                tabDislikes.push(user_id);
                newSauce.dislikes ++; 
            }

            sauce.updateOne({ _id: req.params.id }, { 
                    likes: newSauce.likes, 
                    dislikes: newSauce.dislikes, 
                    usersLiked: JSON.stringify(tabLikes), 
                    usersDisliked: JSON.stringify(tabDislikes)
                })
                .then(() => res.status(200).json({ message: 'Mis à jour ! '}))
                .catch(error => res.status(400).json({ error }));

        })
        .catch(error => res.status(500).json({ error }));
}; 