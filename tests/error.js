"use strict";

var Schema = require('./_lib/schema');

module.exports = {
	'instanceof': function (test) {
		var err0 = new Error('message');
		test.ok(err0 instanceof Error);

		var err1 = new Schema.ValidationError('rule');
		test.ok(err1 instanceof Error);

		test.done();
	}
};
