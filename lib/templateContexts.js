var TemplateContexts = {};

var contextFiles = [];

TemplateContexts.init = function() {
    if (arguments.length > 0) {
        if (arguments[0] instanceof Array) {
            for (var i in arguments[0]) {
                contextFiles.push(arguments[0][i]);
            }
        } else {
            contextFiles.push(arguments[0]);
        }
    } else {
        throw 'Template Contexts not provided';
    }
}

TemplateContexts.add = function(file) {
    contextFiles.push(file);
}

TemplateContexts.remove = function(file) {
    var index = contextFiles.indexOf(file)
    contextFiles.splice(index, 1);
}

TemplateContexts.render = function(req, params) {
    var data = {};
    for (var i in contextFiles) {
        var c = require(contextFiles[i])(req) || {};
        for (var j in c) {
            data[j] = c[j];
        }
    }
    for (var i in params) {
        data[i] = params[i];
    }
    data.user = req.user;
    return data;
}

module.exports = TemplateContexts;
