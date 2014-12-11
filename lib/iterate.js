"use strict";

var _ = require('lodash');

var map = function (obj, iterator, done, async) {
	if (_.isEmpty(obj)) {
		return done();
	}

	var isArray = _.isArray(obj),
		keys,
		lastIndex,
		results;

	if (isArray) {
		lastIndex = obj.length;
		results = [];
	} else {
		keys = _.keys(obj);
		lastIndex = keys.length;
		results = {};
	}

	var _done = function (err) {
		keys = null;
		obj = null;
		done(err, results);
		results = null;
	};

	var iterate = function (index) {
		if (index === lastIndex) {
			_done(null);
			return;
		}

		var key = isArray ? index : keys[index];
		iterator.call(results, obj[key], key, function (err, result) {
			if (err) {
				_done(err);
				return;
			}

			results[key] = result;

			iterate(++index);
		});
	};

	if (async) {
		if (typeof process === 'undefined') {
			setTimeout(function () {
				iterate(0);
			}, 0);
			return;
		}
		process.nextTick(function () {
			iterate(0);
		});
		return;
	}

	iterate(0);
};

exports.map = map;

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
