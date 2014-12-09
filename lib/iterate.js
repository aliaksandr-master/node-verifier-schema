"use strict";

module.exports = function (array, iterator, done) {
	if (!array || !array.length) {
		done();
		return;
	}

	var lastIndex = array.length-1;
	var iterate = function (index) {
		iterator(array[index], index, function (error) {
			if (error || index >= lastIndex) {
				done(error || null);
				return;
			}

			iterate(++index);
		});
	};

	iterate(0);
};
