'use strict';

var _ = require('lodash');
var inspect = require('./inspect');
var Schema = require('./schema');

var tester = function (testCase) {
	return function (test) {

		var method = testCase.schema.verify.bind(testCase.schema);

		if (testCase.options) {
			var vrfr = testCase.schema.verifier(testCase.options);

			method = vrfr.verify.bind(vrfr);
		}

		method(testCase.value, function (err) {
			if (testCase.expect) {
				test.ok(!err, 'must be valid!');

				if (err instanceof Schema.ValidationError) {
					console.log('>>error:', inspect(err));
					err = null;
				}
			} else if (!err) {
				test.ok(false, 'must be inValid');
			} else if (err instanceof Schema.ValidationError) {
				test.ok(true);

				_.each(testCase.vErr, function (v, k) {
					test.ok(_.isEqual(err[k], v), k + ': ' + inspect(v) + ' given: ' + inspect(err[k]));
				});

				err = null;
			}

			test.done(err);
		});
	};
};

module.exports = tester;
