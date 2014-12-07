"use strict";

var _ = require('lodash');
var ERROR_OBJECT = { error: true };

module.exports = function (done, infoObjects) {
	return function (err) {
		var valid = !infoObjects.length;

		if (err === ERROR_OBJECT) {
			err = null;
			valid = false;
		}

		done(err, valid, infoObjects);
	};
};
module.exports.ERROR_OBJECT = ERROR_OBJECT;