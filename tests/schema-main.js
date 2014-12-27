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
	'rule name is not string': function (test) {
		test.throws(function () {
			var err = new Schema.ValidationError(null, null, null);
		});

		test.throws(function () {
			var err = new Schema.ValidationResultError(null, null, null, null, null);
		});

		test.done();
	},
	'empty rule': function (test) {
		test.throws(function () {
			var err = new Schema.ValidationError('', null, null);
		});

		test.throws(function () {
			var err = new Schema.ValidationResultError('', null, null, null, null);
		});

		test.done();
	},
	'create Error': function (test) {
		var err;
		err = new Schema.ValidationError('hello', null, null);
		test.ok(err instanceof Error);
		test.ok(err instanceof Schema.ValidationError);
		test.ok(!(err instanceof Schema.ValidationResultError));

		err = Schema.ValidationError('hello', null, null);
		test.ok(err instanceof Error);
		test.ok(err instanceof Schema.ValidationError);
		test.ok(!(err instanceof Schema.ValidationResultError));

		err = new Schema.ValidationResultError('hello', null, null);
		test.ok(err instanceof Error);
		test.ok(err instanceof Schema.ValidationError);
		test.ok(err instanceof Schema.ValidationResultError);

		err = Schema.ValidationResultError('hello', null, null);
		test.ok(err instanceof Error);
		test.ok(err instanceof Schema.ValidationError);
		test.ok(err instanceof Schema.ValidationResultError);

		test.done();
	}
};