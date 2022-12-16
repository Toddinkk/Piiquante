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
exports.likeSauce = (req, res) => {
    Sauce.findOne({ _id: req.params.id })
      .then(sauce => {
        // Ici on vérifie si l'utilisateu n'a pas encore liké la sauce et si il a cliqué sur le bouton like
        if (!sauce.usersLiked.includes(req.body.userId) && req.body.like === 1) {
          Sauce.updateOne(
            { _id: req.params.id },
            {
              $inc: { likes: 1 },
              $push: { usersLiked: req.body.userId },
            }
          )
            .then(() => res.status(201).json({ message: "Sauce like +1" }))
            .catch(error => res.status(400).json({ error }));
        }
        // Ici, on vérifie si l'utilisateur a déjà liké la sauce, on remet à 0
        if (sauce.usersLiked.includes(req.body.userId) && req.body.like === 0) {
          Sauce.updateOne(
            { _id: req.params.id },
            {
              $inc: { likes: -1 },
              $pull: { usersLiked: req.body.userId },
            }
          )
            .then(() => res.status(201).json({ message: "Sauce like 0" }))
            .catch(error => res.status(400).json({ error }));
        }
        // si l'utilisateur veut disliker une sauce qu'il n'a pas encore disliké
        if (
          !sauce.usersDisliked.includes(req.body.userId) &&
          req.body.like === -1
        ) {
          Sauce.updateOne(
            { _id: req.params.id },
            {
              $inc: { dislikes: 1 },
              $push: { usersDisliked: req.body.userId },
            }
          )
            .then(() => res.status(201).json({ message: "Sauce dislike +1" }))
            .catch(error => res.status(400).json({ error }));
        }
        // si l'utilisateur veut disliker une sauce qu'il a déjà disliké
        if (
          sauce.usersDisliked.includes(req.body.userId) &&
          req.body.like === 0
        ) {
          Sauce.updateOne(
            { _id: req.params.id },
            {
              $inc: { dislikes: -1 },
              $pull: { usersDisliked: req.body.userId },
            }
          )
            .then(() => res.status(201).json({ message: "Sauce dislike 0" }))
            .catch(error => res.status(400).json({ error }));
        }
      })
      .catch(error => {
        res.status(404).json({ error });
      });
  };