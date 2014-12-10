"use strict";

var inspect = function (value) {
	return '\n' + require('util').inspect(value, {depth: null, colors: true}) + '\n';
};

module.exports = inspect;
