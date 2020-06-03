const express = require('express');
const bodyParser = require('body-parser');
const authenticate = require('../authenticate');
const cors = require('./cors');

const Favourites = require('../models/favourites');

const favouriteRouter = express.Router();

favouriteRouter.use(bodyParser.json());

favouriteRouter.route('/')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, authenticate.verifyUser, (req, res, next) => {
    Favourites.findOne({user: req.user._id})
    .populate('user')
    .populate('dishes')
    .then((favs) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(favs);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favourites.findOne({user: req.user._id})
    .then((fav) => {
        if (fav) {
            for (var i=0; i<req.body.length; i++) {
                if (fav.dishes.indexOf(req.body[i]._id) === -1) {
                    fav.dishes.push(req.body[i]._id);
                }
            }
            fav.save()
            .then((fav) => {
                console.log('Favourite Created ', fav)
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(fav);
            }, (err) => next(err));
        }
        else {
            Favourites.create({"user": req.user._id, "dishes": req.body})
            .then((fav) => {
                console.log('Favourite Created ', fav)
                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.json(fav);
            }, (err) => next(err));
        }
    }, (err) => next(err))
    .catch((err) => next(err));
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    res.statusCode = 403;
    res.end('PUT operation not supported on /favourites');
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favourites.findOneAndRemove({"user": req.user._id})
    .then((resp) => {
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(resp);
    }, (err) => next(err))
    .catch((err) => next(err));
});

favouriteRouter.route('/:favouriteId')
.options(cors.corsWithOptions, (req, res) => { res.sendStatus(200); })
.get(cors.cors, (req, res, next) => {
    Favourites.findById(req.params.favouriteId)
    .then((fav) => {
        if (!(fav.user.equals(req.user._id))) {
            var err = new Error('Only accessed user can perform this action');
            err.status = 400;
            return next(err);
        }
        res.statusCode = 200;
        res.setHeader('Content-Type', 'application/json');
        res.json(fav);
    }, (err) => next(err))
    .catch((err) => next(err));
})
.post(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favourites.findById(req.user._id)
    .then((fav) => {
        if (fav == null) {
            let newFav = {};
            newFav.user = req.user._id;
            Favourites.create(newFav)
            .then((fav) => {
                console.log('Favourite Created ', newFav);
                fav.dishes.push(req.params.favouriteId);
                fav.save()
                .then((fav) => {
                    Favourites.findById(fav._id)
                    .then((fav) => {
                        res.statusCode = 200;
                        res.setHeader('Content-Type', 'application/json');
                        res.json(fav);
                    })
                }, (err) => next(err));
            }, (err) => next(err))
            .catch((err) => next(err));
        }
        else {
            var err = new Error('Dish ' + req.params.favouriteId + ' already exsits');
            err.status = 404;
            return next(err);
        }
    });
})
.put(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favourites.findByIdAndUpdate(req.params.favouriteId, {
        $set: req.body
    }, { new: true })
    .then((leader))
})
.delete(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    Favourites.findOne({user: req.user._id})
    .then((fav) => {
        fav.dishes.remove(req.params.favouriteId);
        fav.save()
        .then((resp) => {
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.json(resp);
        }, (err) => next(err));
    })
    .catch((err) => next(err));
});

module.exports = favouriteRouter;