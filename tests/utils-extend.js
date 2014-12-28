"use strict";

var extend = require('./_lib/utils-extend');

exports.instanceof = function (test) {
	var F = function () {};

	extend(F, Error);

	var f = new F();

	test.ok(f instanceof Error);
	test.done();
};

exports.method = function (test) {
	var A = function () {
		this.a = 234;
	};
	var C = function () {
		A.apply(this, arguments);
		this.c = 123;
	};
	C.extend = extend.method;
	extend(C, A);

	var D = C.extend({
		constructor: function () {
			C.apply(this, arguments);
			this.d = 345;
		}
	});

	var E = D.extend();

	var e = new E();
	test.ok(e.c === 123);
	test.ok(e.d === 345);
	test.ok(e.a === 234);
	test.ok(e instanceof E);
	test.ok(e instanceof D);
	test.ok(e instanceof C);
	test.ok(e instanceof A);
	test.done();
};