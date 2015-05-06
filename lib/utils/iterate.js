'use strict';

var _ = require('lodash');

module.exports = require('async-iterate');

/**
 * recursive iterate array or object.
 * if callback returned null or undefined - interrupt current iteration
 *
 * @param {!Array|Object} obj - array or object for iteration
 * @param {!*} params - recursive params (for example reduce result)
 * @param {!Function} iterator - function for iterator
 * @param {*} [context] - context of iterator.
 * @returns
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

module.exports.recursiveEach = recursiveEach;
