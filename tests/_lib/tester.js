"use strict";

var _ = require('lodash');
var inspect = require('./inspect');
var Schema = require('./schema');

var tester = function (testCase) {
	return function (test) {

		testCase.schema.verifier(testCase.options).verify(testCase.value, function (err) {
			if (testCase.expect) {
				test.ok(!err, 'must be valid!');
			} else if (!err) {
				test.ok(false, 'must be inValid');
			} else if (err instanceof Schema.ValidationError) {
				test.ok(true);

				_.each(testCase.vErr, function (v, k) {
					test.ok(_.isEqual(err[k], v), k +': ' + inspect(v) + ' given: ' + inspect(err[k]));
				});

				err = null;
			}

			test.done(err);
		});
	};
};

module.exports = tester;