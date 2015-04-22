var express = require("express");
var _ = require('underscore');
var crypto = require('crypto');
var moment = require('moment');
var Chance = require('chance');

module.exports.App = function(params) {
    var app = express();

    app['urls'] = {};

    app.urls['load'] = function(resourceUri, controller) {
        var verbs = {
            'read': 'get',
            'create': 'post',
            'update': 'put',
            'destroy': 'delete'
        };
        for (var handler in verbs) {
            var method = verbs[handler];
            if (controller[handler]) {
                app[method](resourceUri, _.bind(controller["pre" + handler], controller));
            }
        }
    };

    var addListener = function(evt, fn) {
        evt = evt.split(' ');
        var method = evt[0];
        var uri = evt[1];
        if (method == 'all') {
            app.urls.load(uri, fn);
        } else {
            app[method](uri, fn);
        }
    };

    app.on = function() {
        var data = arguments[0];
        var fn = arguments[1] || null;
        if (fn) {
            addListener(data, fn);
        } else {
            for(var i in data) {
                addListener(i, data[i]);
            }
        }
    };

    return app;
};

module.exports.Controller = {
    settings: {
        loginRequired: false,
        logoutRequired: false
    },
    parseData: function(req, res, next) {
        next(req, res);
    },
    dumpUser: function(req, res, next) {
        next(req, res);
    },
    verifySession: function(req, res, next) {
        next(req, res);
    },
    preread: function(request, response) {
        var instance = this;
        if (instance['read']) {
            request['args'] = request.query;
            instance.parseData(request, response, function() {
                instance.verifySession(request, response, function() {
                    instance.dumpUser(request, response, function() {
                        instance['read'](request, response);
                    });
                });
            });
        }
    },
    precreate: function(request, response) {
        var instance = this;
        if (instance['create']) {
            request['args'] = request.body;
            if ('model' in request.body) {
                request['args'] = JSON.parse(request.body.model);
            }
            instance.parseData(request, response, function() {
                instance.verifySession(request, response, function() {
                    instance.dumpUser(request, response, function() {
                        instance['create'](request, response);
                    });
                });
            });
        }
    },
    preupdate: function(request, response) {
        var instance = this;
        if (instance['update']) {
            request['args'] = request.body;
            if ('model' in request.body) {
                request['args'] = JSON.parse(request.body.model);
            }
            instance.parseData(request, response, function() {
                instance.verifySession(request, response, function() {
                    instance.dumpUser(request, response, function() {
                        instance['update'](request, response);
                    });
                });
            });
        }
    },
    predestroy: function(request, response) {
        var instance = this;
        if (instance['destroy']) {
            request['args'] = request.query;
            instance.parseData(request, response, function() {
                instance.verifySession(request, response, function() {
                    instance.dumpUser(request, response, function() {
                        instance['destroy'](request, response);
                    });
                });
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

module.exports.alphanumeric = function(length) {
    var m = length || 6,
        s = '',
        r = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (var i=0; i < m; i++) {
        s += r.charAt(Math.floor(Math.random()*r.length));
    }
    return s;
};

module.exports.sha1 = function(string) {
    var shasum = crypto.createHash('sha1').update(string);
    return shasum.digest('hex');
};

module.exports.generateToken = function() {
    var date = new Date();
    var shasum = crypto.createHash('sha1').update(date.getTime().toString());
    return shasum.digest('hex');
};

function formatDates(obj, format, locale) {
    format = format ? format : 'MMM DD, YYYY';
    moment.locale('es');
    for (var i in obj) {
        var item = obj[i];
        if (item instanceof Object) {
            formatDates(item, format, locale);
        }
    }
    if (locale) {
        moment.locale(locale);
    };
    if (obj.createdAt) {
        obj.createdAt = moment(obj.createdAt).format(format);
    };
    if (obj.updatedAt) {
        obj.updatedAt = moment(obj.updatedAt).format(format);
    };
    if (obj.date) {
        obj.date = moment(obj.date).format(format);
    };
    return obj;
};
module.exports.formatDates = formatDates;

module.exports.removeAttr = function(obj, attrs) {
    if (typeof(attrs) === 'string') {
        attrs = [attrs];
    };
    for (var a in attrs) {
        if(obj[attrs[a]]) {
            delete obj[attrs[a]];
        };
    };
    return obj;
};

module.exports.random = function(len) {
    var pool = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var chance = new Chance();
    len = len || 5;
    var rand = chance.string({
        length: len,
        pool: pool
    });
    return rand;
};
