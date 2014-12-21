"use strict";

var util = require('util');

module.exports = function (value, log) {
	var str = '\n' + util.inspect(value, {depth: null, colors: true}) + '\n';

	if (log) {
		console.log(str);
	}

	return str;
};
