"use strict";

var Schema = require('../index');

module.exports = {
	'instance of Error': function (test) {
		var err0 = new Error();
		test.ok(err0 instanceof Error);

		var err1 = new Schema.ValidationError();
		test.ok(err1 instanceof Error);

		var err2 = new Schema.ValidationResultError();
		test.ok(err2 instanceof Error);

		test.done();
	},

	'instance of ValidationError': function (test) {
		var err1 = new Schema.ValidationError();
		test.ok(err1 instanceof Schema.ValidationError);

		var err2 = new Schema.ValidationResultError();
		test.ok(err2 instanceof Schema.ValidationError);

		test.done();
	},

	'instance of ValidationResultError': function (test) {
		var err1 = new Schema.ValidationResultError();
		test.ok(err1 instanceof Schema.ValidationResultError);

		test.done();
	}
};