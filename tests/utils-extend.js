"use strict";

var extend = require('../lib/utils/extend');

module.exports = {
	'auto': function (test) {
		var F = function () {};

		extend(F, Error);

		var f = new F();

		test.ok(f instanceof Error);
		test.done();
	},

	'byObjectCreate': function (test) {
		var F = function () {};

		extend.byObjectCreate(F, Error);

		var f = new F();

		test.ok(f instanceof Error);
		test.done();
	},

	'byPrototype': function (test) {
		var F = function () {};

		extend.byPrototype(F, Error);

		var f = new F();

		test.ok(f instanceof Error);
		test.done();
	}
};