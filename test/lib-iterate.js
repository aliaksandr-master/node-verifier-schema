"use strict";

var iterate = require('../lib/iterate');

module.exports = {
	'iterate all': function (test) {
		var len = 30;
		var arr = new Array(len);
		var count = 0;
		iterate(arr, function (value, index, done) {
			count++;
			done();
		}, function () {
			test.equal(count, len);
			test.done();
		});
	},

	'iterate interrupt by error': function (test) {
		var len = 30;
		var arr = new Array(len);
		var count = 0;
		iterate(arr, function (value, index, done) {
			count++;
			done(count >= len/2 ? true : null);
		}, function (err) {
			test.equal(count, len/2);
			test.ok(typeof err === 'boolean');
			test.done(err instanceof Error ? err : null);
		});
	}
};
