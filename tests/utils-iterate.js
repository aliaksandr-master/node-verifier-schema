"use strict";

var _ = require('lodash');
var iterate = require('../lib/utils/iterate');


var obj = {a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8, i: 9, k: 10};
var arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

module.exports = {
	'iterate array - nothing to iterate': function (test) {
		var len = 0;
		var arr = [];
		var count = 0;
		iterate.array(arr, function (value, index, done) {
			count++;
			done();
		}, function (err) {
			test.strictEqual(count, len);
			test.done(err);
		});
	},

	'iterate array - across all items of array': function (test) {
		var len = arr.length;
		var keys = _.keys(arr);
		var count = 0;
		var _keys = [];
		iterate.array(arr, function (value, index, done) {
			count++;
			_keys.push(index);
			done();
		}, function (err) {
			test.strictEqual(count, len);
			test.deepEqual(keys, _keys);
			test.done(err);
		});
	},

	'iterate array - interrupt by error': function (test) {
		var len = arr.length;
		var count = 0;
		iterate.array(arr, function (value, index, done) {
			count++;
			done(count >= len/2 ? true : null);
		}, function (err) {
			test.strictEqual(count, len/2);
			test.ok(typeof err === 'boolean');
			test.done(err instanceof Error ? err : null);
		});
	},

	'iterate object - nothing to iterate': function (test) {
		var obj = {};
		var len = _.size(obj);
		var count = 0;
		iterate.object(obj, function (value, index, done) {
			count++;
			done();
		}, function (err) {
			test.strictEqual(len, count);
			test.done(err);
		});
	},

	'iterate object - across all items of object': function (test) {
		var len = _.size(obj);
		var count = 0;
		iterate.object(obj, function (value, index, done) {
			count++;
			done();
		}, function (err) {
			test.strictEqual(count, len);
			test.done(err);
		});
	},

	'iterate object - interrupt by error': function (test) {
		var len = _.size(obj);
		var count = 0;
		iterate.object(obj, function (value, index, done) {
			count++;
			done(count >= len/2 ? true : null);
		}, function (err) {
			test.strictEqual(count, len/2);
			test.ok(typeof err === 'boolean');
			test.done(err instanceof Error ? err : null);
		});
	}
};
