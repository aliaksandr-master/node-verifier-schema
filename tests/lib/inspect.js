"use strict";

var inspect = function (value, log) {
	var str = '\n' + require('util').inspect(value, {depth: null, colors: true}) + '\n';

	if (log) {
		console.log(str);
	}

	return str;
};

module.exports = inspect;
