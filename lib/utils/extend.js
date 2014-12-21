"use strict";

var _ = require('lodash');

/**
 * class extension function
 *
 * @param {!Function} Child - constructor of child class.
 * @param {!Function} Parent - constructor of parent class.
 * @returns {Function} Child constructor
 */
module.exports = function (Child, Parent) {
	_.extend(Child, Parent);
	Child.prototype = _.create(Parent.prototype, { constructor: Child });
	Child.__super__ = Parent.prototype;

	return Child;
};
