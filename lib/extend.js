"use strict";

/**
 * class extension function
 *
 * @param {!Function} Child - constructor of child class.
 * @param {!Function} Parent - constructor of parent class.
 * @returns {Function} Child constructor
 */
var byObjectCreate = function (Child, Parent) {
	Child.prototype = Object.create(Parent.prototype);
	return Child;
};

/**
 * class extension function
 *
 * @param {!Function} Child - constructor of child class.
 * @param {!Function} Parent - constructor of parent class.
 * @returns {Function} Child constructor
 */
var byPrototype = function (Child, Parent) {
	var Surrogate = function () {};
	Surrogate.prototype = Parent.prototype;
	Child.prototype = new Surrogate();
	return Child;
};

/**
 * class extension function
 *
 * @param {!Function} Child - constructor of child class.
 * @param {!Function} Parent - constructor of parent class.
 * @returns {Function} Child constructor
 */
module.exports = function (Child, Parent) {
	return Object.create ? byObjectCreate(Child, Parent) : byPrototype(Child, Parent);
};

module.exports.byPrototype = byPrototype;

module.exports.byObjectCreate = byObjectCreate;
