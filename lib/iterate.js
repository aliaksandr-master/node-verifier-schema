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
