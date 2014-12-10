"use strict";

var byObjectCreate = function (Child, Parent) {
	Child.prototype = Object.create(Parent.prototype);
	return Child;
};

var byPrototype = function (Child, Parent) {
	var Surrogate = function () {};
	Surrogate.prototype = Parent.prototype;
	Child.prototype = new Surrogate();
	return Child;
};

module.exports = Object.create ? byObjectCreate : byPrototype;
module.exports.byPrototype = byPrototype;
module.exports.byObjectCreate = byObjectCreate;
