"use strict";

var Schema = require('./_lib/schema');

exports['schema nested object build validation'] = {
	'builder isn\'t string/schema/function': function (test) {
		var sh1 = new Schema();

		test.throws(function () {
			sh1.object(null);
		});
		test.done();
	}
};

exports['check compile return value'] = {
	'isn\'t array/function': function (test) {
		var sh1 = new Schema().validate(function (value, done) {
			done();
		});

		test.throws(function () {
			sh1.compile(function () {
				return {};
			});
		});

		test.done();
	}
};

exports['schema - like'] = {
	'process': function (test) {
		var sh1 = new Schema();
		var sh2 = new Schema().array();

		sh1.like(sh2, function (schema) {
			return false;
		});

		test.ok(!sh1.isArray);

		test.done();
	},
	'throw if schema isn\'t Schema': function (test) {
		var sh2 = new Schema().array();

		test.throws(function () {
			sh2.like(null);
		});

		test.done();
	}
};

exports['required'] = {
	'set required': function (test) {
		var sh1 = new Schema();
		sh1.optional();
		sh1.required();
		sh1.optional();
		sh1.required();

		test.ok(sh1.isRequired);

		test.done();
	},
	'set optional': function (test) {
		var sh1 = new Schema();
		sh1.optional();
		sh1.required();
		sh1.optional();

		test.ok(!sh1.isRequired);

		test.done();
	}
};

exports['register'] = {
	'add: name is not string': function (test) {
		var sc1 = new Schema();

		test.throws(function () {
			Schema.register(null, sc1);
		});

		test.done();
	},
	'add: empty name': function (test) {
		var sc1 = new Schema();

		test.throws(function () {
			Schema.register('', sc1);
		});

		test.done();
	},
	'add: schema is not a Schema instance': function (test) {
		test.throws(function () {
			Schema.register('_some_1', null);
		});

		test.done();
	},
	'add: schema exists': function (test) {
		var sc1 = new Schema();
		var sc2 = new Schema();
		Schema.register('_some_1', sc1);

		test.throws(function () {
			Schema.register('_some_1', sc2);
		});

		test.done();
	},
	'get: name is not string': function (test) {
		test.throws(function () {
			Schema.get();
		});

		test.done();
	},
	'get: empty name': function (test) {
		test.throws(function () {
			Schema.get('');
		});

		test.done();
	},
	'get: no schema defined': function (test) {
		test.throws(function () {
			Schema.get('_some_2');
		});

		test.done();
	}
};

exports['validation error'] = {
	'create Error': function (test) {
		var err;
		err = new Schema.ValidationError('hello', null, null);
		test.ok(err instanceof Error);
		test.ok(err instanceof Schema.ValidationError);

		err = Schema.ValidationError('hello', null, null);
		test.ok(err instanceof Error);
		test.ok(err instanceof Schema.ValidationError);

		test.done();
	}
};