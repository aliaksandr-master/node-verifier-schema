"use strict";

var _ = require('lodash');

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
