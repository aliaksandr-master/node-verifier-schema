"use strict";

/**
 * class extension function
 *
 * @param {!Function} Child - constructor of child class.
 * @param {!Function} Parent - constructor of parent class.
 * @returns {Function} Child constructor
 */
module.exports = function (Child, Parent) {
	var Surrogate = function () {};
	Surrogate.prototype = Parent.prototype;
	Child.prototype = new Surrogate();

	return Child;
};
