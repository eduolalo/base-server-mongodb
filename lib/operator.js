var _ = require('underscore');

var willy = require('./willy');

var controller = willy.Controller.extend({});

module.exports.Base = _.extend(controller, {
    parseData: function(req, res, next) {
        var data = {};
        for (var i in req.body) {
            data[i] = req.body[i];
        }
        for (var i in req.query) {
            data[i] = req.query[i];
        }
        if (data.hasOwnProperty('model')) {
            var m = JSON.parse(data.model);
            for (var i in m) {
                data[i] = m[i];
            }
        }
        req.data = data;
        next(req, res);
    },
    verifySession: function(req, res, next) {
        if (this.settings.loginRequired) {
            if (!req.session.userId) {
                res.redirect('/signin' + (req.url ? '?next=' + req.url : ''));
            } else {
                next(req, res);
            }
        } else if (this.settings.logoutRequired) {
            if (req.session.userId) {
                res.redirect('/home');
            } else {
                next(req, res);
            }
        } else {
            next(req, res);
        }
    },
    dumpUser: function(req, res, next) {
        if (req.session && req.session.userId && !req.user) {
            var User = require(process.cwd() + '/move/models/User.js');
            User.findById(req.session.userId, function(err, model) {
                if (err) {
                    delete req.session['userId'];
                    res.redirect('/signin');
                } else {
                    req['user'] = model.toObject();
                    next(req, res);
                }
            }).populate('type card address.country');
        } else {
            // delete req.session['userId'];
            next(req, res);
        }
    }
});
