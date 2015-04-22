'use strict';

module.exports.log =  function(errString, code) {
    var error = new Error(errString);
    if (code) error.code = code;
    console.error(Date(), error);
    console.error(error.stack);
};
