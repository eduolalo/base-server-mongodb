'use strict';

function getHandler(name) {
    return require(process.cwd() + '/move/operations/web/handlers/' +name);
};

module.exports.init = function(app) {
    app.on({
        // 'all /:id/emailverification': getHandler('emailVerification')
    });
};
