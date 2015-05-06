'use strict';

var _ = require('lodash');

/**
 * class extension function
 *
 * @param {!Function} Child - constructor of child class.
 * @param {!Function} Parent - constructor of parent class.
 * @returns {Function} Child constructor
 */
var extend = function extend (Child, Parent) {
	_.extend(Child, Parent);
	Child.prototype = _.create(Parent.prototype, { constructor: Child });
	Child.__super__ = Parent.prototype;

	return Child;
};

extend.method = function extendMethod (proto, stat) {
	proto || (proto = {});

	var Child;
	var Parent = this;

	if (proto && _.has(proto, 'constructor')) {
		Child = proto.constructor;
	} else {
		Child = function () {
			return Parent.apply(this, arguments);
		};
	}

	extend(Child, Parent);

	_.extend(Child, stat);

	_.extend(Child.prototype, proto);

	return Child;
};

module.exports = extend;
