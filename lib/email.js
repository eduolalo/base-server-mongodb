'use strict';

var mandrill = require('mandrill-api');
var swig = require('swig');
var fs = require('fs');
var _ = require('underscore');

var config = require(process.cwd() + '/config');
var i18n = require('./i18n');

var mandrill_client = new mandrill.Mandrill(config.mandrill.apiKey);

var mail = {
    renderMail: function(filename, content) {
        var template = swig.compileFile(process.cwd() + '/move/views/emails/html/' + filename + '.html');
        content = content || {};
        content.__ = i18n.__;
        return template(content);
    },
    send: function(params, callback) {
        var errorLog = (process.cwd() + '/emails.log');
        var content = {
            'html': params.body,
            'text': params.text || '',
            'subject': params.subject,
            'from_email': 'debito_norepply@debito.com',
            'to': [{
                'email': params.email,
                'name': params.name, 
                'type': 'to'
            }],
            'important': params.important || false,
        };
        mandrill_client.messages.send({
            message: content,
            async: false
        }, function(res) {
            if (res[0].status == 'invalid') {
                    var date = new Date();
                    var message = date.getTime() + ' ' +date + ' - Error datail: ' + JSON.stringify(res) + '\n';
                    fs.appendFile(errorLog, message, {
                        'encoding': 'utf8'
                    },function(fsErr) {
                        var emailErr = _.clone(res[0]);
                        emailErr.logCode = date.getTime();
                        emailErr.emailParams = params;
                        if (callback) {
                            callback(emailErr, null);
                        };
                        return;
                    });
            } else {

                if (callback) {
                    callback(null, res[0]);
                };
            };

        }, function(err) {
            var date = new Date();
            var message = date.getTime() + ' ' + date + ' - Error datail: ' + err.name + ' - ' + err.message + '\n';  
            fs.appendFile(errorLog, message, {
                'encoding': 'utf8'
            },function(fsErr) {
                var emailErr = _.clone(err);
                emailErr.logCode = date.getTime();
                emailErr.emailParams = params;
                if (callback) {
                    callback(emailErr, null);
                };
            });
        });
    }
};

module.exports = mail;
