var moment = require('moment');

var validators = module.exports = {};

var parseType = function(value, type, format) {
    var parsers = {
        'number': parseFloat,
        'date': function(value, format) {
            var format = format ? format : 'DD-MM-YYYY';
            var date = moment(value, format, true);
            if (!date.isValid()) {
                return false;
            };
            return date._d;
        },
        'string': function(value) {
            return value;
        },
        'boolean': function(value) {
            if (/^true$/.test(value.toString()) || /^false$/.test(value.toString())) {
                return true;
            };
            return false;
        },
        'object': function(value) {
            return value;
        },
        'array': function(value) {
            return value;
        }
    }
    return parsers[type](value, format);
};

var equalType = function(value, type) {
    var comparators = {
        'number': function(value) {
            // check if value is numeric and diferent of NaN
            return (typeof(value) == 'number' && parseFloat(value) == value);
        },
        'date': function(value) {
            return value instanceof Date;
        },
        'boolean': function(value) {
            return value === true;
        },
        'string': function(value) {
            return typeof(value) == 'string';
        },
        'object': function(value) {
            return value instanceof Object;
        },
        'array': function(value) {
            return value instanceof Array;
        }
    }
    return comparators[type](value);
}

validators.validate = function(rules, params) {
    for (var i in rules) {
        var rule = rules[i];
        var value = params[i];
        if (rule) {
            if (rule.required) {
                if (!value) {
                    return {
                        isValid: false,
                        message: i + ', required.'
                    };
                }
            }
            if (rule.type && value) {
                var newValue = parseType(value, rule.type, rule.format);
                // if value is not required but has been sent, will be checked for correct type
                if (value && !equalType(newValue, rule.type)) {
                    var message = i + ', must be ' + rule.type;
                    if (rule.format) {
                        message += ' and must be in this format: ' + rule.format;
                    };
                    message += '.'
                    return {
                        isValid: false,
                        message: message
                    };
                }
            }
        }
    }
    return {
        isValid: true
    };
};
