#!/usr/bin/env node

var throng = require('throng');

var WORKERS = process.env.WEB_CONCURRENCY || 1;
process.chdir(__dirname);
console.log('Project path: ', process.cwd());   

function start() {

    // 3th party libraries
    var express = require('express');
    var session = require('express-session');
    var mongoose = require('mongoose');
    var swig = require('swig');
    var admin = require('yama');

    // Local libraries
    var willy = require('./lib/willy');
    var config = require('./config');
    var templateContexts = require('./lib/templateContexts');
    var i18n = require('./lib/i18n');

    //Routers
    var apiV1 = require(process.cwd() + '/move/events/api');
    var web = require(process.cwd() + '/move/events/web');

    //Mongo conect
    var mongo = config.mongo;
    var connection = 'mongodb://' + mongo.user + ':' + mongo.password + '@' + mongo.host + ':' + mongo.port + '/' + mongo.db;
    mongoose.connect(connection);

    // Initialize app
    var app = new willy.App({
        basepath: __dirname
    });

    app.use(require('body-parser')());
    app.use(require('method-override')());
    app.use(require('multer')({
        'dest': './public/images'
    }));
    app.use(require('cookie-parser')(config.cookie));

    // Cross domain
    app.use(function(req, res, next) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
        next();
    });

    // Init internacionalitation
    app.use(i18n.init());

    //Swig tamplates
    app.engine('html', swig.renderFile);
    app.set('view engine', 'html');
    app.set('views', process.cwd() + '/move/views');
    app.set('view cache', false);
    swig.setDefaults({
        cache: false
    });

    // Statics/images
    app.use('/images', express.static(process.cwd() + '/public/images', {
        index: false,
        extencions: ['jpeg','jpg','png']
    }));

    // Public sourcess
    app.use('/public', express.static(process.cwd() + '/public', {
        index: false
    }));

    admin.init({
        path: process.cwd(),
        express: app,
        mongoose: mongoose,
        models: [
            process.cwd() + '/move/models'
        ],
        url: '/backdoor',
        templates: '/backdoor',
        media: '/public/backdoor'
    });

    console.log('API v1');
    apiV1.init(app);

    console.log('Web init');
    web.init(app);

    // Error handlers
    app.get('*', function(req, res, next) {
        var err = new Error();
        err.status = 404;
        next(err);
    });

    app.use(function(err, req, res, next) {
        if(err.status == 404) {
            res.status(404).send({error: req.url+' not found'});
        } else {
            res.status(err.status || 500).send({error: err.stack});
        }
    });


    console.log('Server listening port: ',config.port);
    app.listen(config.port);
};

// Heroku clustering
if (process.env.NODE_ENV && process.env.NODE_ENV === 'production') {
    throng(start, {
        workers: WORKERS,
        lifetime: Infinity
    });
} else {
    start();
};
