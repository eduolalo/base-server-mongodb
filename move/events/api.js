'use strict';

function getHandler(name) {
    return require(process.cwd() + '/move/operations/api/v1/handlers/' +name);
};

module.exports.init = function(app) {
    app.on({
        // 'all /v1/signup': getHandler('signup')
    });
};
