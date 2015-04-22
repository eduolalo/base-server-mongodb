var _ = require('underscore');
var redis = require('redis');

function getModel(name) {
    return require(process.cwd() + '/move/models/' + name);
};
var config = require(process.cwd() + '/config.js');

var error = require(process.cwd() + '/lib/error');

function allowedPath(path) {
    var paths  = [
        '/signup',
        '/login',
        '/cardCharge'
    ];

    for (var p in paths) {
        if (path.indexOf(paths[p]) >= 0) {
            return true;
        }
    }

    return false;
}

module.exports = {
    checkUser: function(req, res, next) {
        var dt = new Date();
        console.log(dt);
        console.log('req.path ---> ',req.path);
        console.log('req.params ---> ',req.params);
        console.log('req.query --->', JSON.stringify(req.query));
        console.log('req.body --->', JSON.stringify(req.body));
        console.log('req.files --->', JSON.stringify(req.files));
        if(allowedPath(req.path)) {
            next();
            return;
        };
        if (!req.args.token) {
            res.status(400).json({
                error: {
                    code: 1000,
                    message: 'Credentials are required.'
                }
            });
            return;
        };
        // code for check users
        next();
    },
    preread: function(req, res) {
        var instance = this;
        if (instance['read']) {
            req['args'] = req.query;
            this.checkUser(req, res, function() {
                instance['read'](req, res);
            });
        }
    },
    precreate: function(req, res) {
        var instance = this;
        if (instance['create']) {
            req['args'] = req.body;
            if ('model' in req.body) {
                req['args'] = JSON.parse(req.body.model);
                delete req.args._id;
                req['body'] = req.args;
            }
            this.checkUser(req, res, function() {
                instance['create'](req, res);
            });
        }
    },
    preupdate: function(req, res) {
        var instance = this;
        if (instance['update']) {
            req['args'] = req.body;
            if ('model' in req.body) {
                req['args'] = JSON.parse(req.body.model);
                delete req.args._id;
                req['body'] = req.args;
            }
            this.checkUser(req, res, function() {
                instance['update'](req, res);
            });
        }
    },
    predestroy: function(req, res) {
        var instance = this;
        if (instance['destroy']) {
            req['args'] = req.query;
            this.checkUser(req, res, function() {
                instance['destroy'](req, res);
            });
        }
    },
    extend: function(object, args) {
        var instance = _.extend(object, this);
        if (args != undefined) {
            instance['settings'] = {
                loginRequired: args.loginRequired || false,
                logoutRequired: args.logoutRequired || false
            }
        }
        return instance;
    }
};
