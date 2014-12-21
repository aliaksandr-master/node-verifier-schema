"use strict";

var extend = require('../lib/utils/extend');

exports.instanceof = function (test) {
	var F = function () {};

	extend(F, Error);

	var f = new F();

	test.ok(f instanceof Error);
	test.done();
};