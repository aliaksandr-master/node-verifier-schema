"use strict";

var _ = require('lodash');
var inspect = require('./inspect');

var tester = function (schema, testCase, objectForValidate) {

	return function (test) {
		schema.verify(objectForValidate, testCase.options, function (err, isValid, validationError) {
			if (err) {
				console.log('unexpected error', inspect(err));
			}

			if (testCase.validationError != null) {
				_.each(testCase.validationError, function (v, k) {
					test.deepEqual(validationError[k], v);
				});
			}

			test.strictEqual(isValid, testCase.expect, 'invalid result ' + inspect(err) + inspect(isValid) + inspect(validationError));
			test.done(err);
		});
	};
};

module.exports = tester;