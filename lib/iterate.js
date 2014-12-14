"use strict";

var _ = require('lodash');

/**
 * @callback iterateDone
 * @param {?Error} error - for interrupt of iterate stream
 *
 * */

/**
 * @callback iterateIterator
 * @param {?Error} error - for interrupt of iterate stream
 *
 * */

/**
 * iterate of object with async callback function
 *
 * @param {?Object} obj - object for iteration
 * @param {!iterateIterator} iterator - function for iterator
 * @param {!iterateDone} done - constructor of child class.
 */
exports.object = function (obj, iterator, done) {
	if (!obj) {
		done();
		return;
	}

	var keys = _.keys(obj),
		lastIndex = keys.length;
	var iterate = function (index) {
		if (index === lastIndex) {
			return done();
		}

		var key = keys[index];
		iterator(obj[key], key, function (err) {
			if (err) {
				return done(err);
			}

			iterate(++index);
		});
	};

	iterate(0);
};

/**
 * iterate of array with async callback function
 *
 * @param {?Array} array - array for iteration
 * @param {!iterateIterator} iterator - function for iterator
 * @param {!iterateDone} done - constructor of child class.
 */
exports.array = function (array, iterator, done) {
	if (!array || !array.length) {
		done();
		return;
	}

	var lastIndex = array.length;
	var iterate = function (index) {
		if (index === lastIndex) {
			return done();
		}

		iterator(array[index], index, function (err) {
			if (err) {
				return done(err);
			}
			iterate(++index);
		});
	};

	iterate(0);
};


/**
 * recursive iterate array or object.
 * if callback returned null or undefined - interrupt current iteration
 *
 * @param {!Array|Object} obj - array or object for iteration
 * @param {!*} params - recursive params (for example reduce result)
 * @param {!Function} iterator - function for iterator
 * @param {*} [context] - context of iterator.
 */
var recursiveEach = function recursiveEach (obj, params, iterator, context) {
	_.each(obj, function (v, k) {
		var r = iterator.call(context, v, k, params);

		if (r == null) {
			return;
		}

		recursiveEach(v, r, iterator, context);
	});
};

exports.recursiveEach = recursiveEach;
