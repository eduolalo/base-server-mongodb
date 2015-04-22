console.log('Enviroment: ', process.env.NODE_ENV || 'development');

module.exports = (function(enviroment) {
	var configFile = require('./cfg/' + enviroment + '.js');
	configFile.env = enviroment;
	return configFile;
})((process.env.NODE_ENV || 'development'));
