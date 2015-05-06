'use strict';

var _ = require('lodash');
var Schema = require('./_lib/schema');
var async = require('async');

exports['Simple Usage'] = {
	'build - equal builds made by different approaches': function (test) {
		var sh1 = new Schema().object(function (required, optional) {
			this.field('first_name');
			required('last_name');
			optional('middle_name');
		});
		var sh2 = new Schema().object(function () {
			this.required('first_name');
			this.field('last_name');
			this.optional('middle_name');
		});
		var sh3 = new Schema().object(function () {
			this.field('first_name');
			this.field('last_name');
			this.field('middle_name').optional();
		});
		var sh4 = new Schema();

		sh4.required('first_name');
		sh4.field('last_name');
		sh4.optional('middle_name');

		test.deepEqual(sh1, sh2);
		test.deepEqual(sh1, sh3);
		test.deepEqual(sh1, sh4);

		test.done();
	},
	'verify - no specified fields': function (test) {
		var sh1 = new Schema().object(function () {
			this.field('first_name');
			this.required('last_name');
			this.optional('middle_name');
		});

		sh1.verifier().verify({}, function (err) {
			test.ok(!!err);

			test.equal(err.rule, 'required');
			test.strictEqual(err.params, null);
			test.strictEqual(err.value, undefined);
			test.deepEqual(err.path, [ 'first_name' ]);

			test.done();
		});
	},
	'verify - optional field isn\'t specified': function (test) {
		var sh1 = new Schema().object(function () {
			this.field('first_name');
			this.required('last_name');
			this.optional('middle_name');
		});
		var value = {
			first_name: 'hello',
			last_name: 'world'
		};

		sh1.verifier().verify(value, function (err) {
			test.ok(!err);
			test.equal(err, null);
			test.done(err);
		});
	},
	'verify - correct if all available fields not empty': function (test) {
		var sh1 = new Schema().object(function () {
			this.field('first_name');
			this.required('last_name');
			this.optional('middle_name');
		});
		var value = {
			first_name: 'hello',
			last_name: 'world',
			middle_name: 'param-pam-pam'
		};

		sh1.verifier().verify(value, function (err) {
			test.ok(!err);
			test.equal(err, null);
			test.done(err);
		});
	},
	'verify - excess field': function (test) {
		//console.log(123);
		var sh1 = new Schema().strict().object(function () {
			this.field('first_name');
			this.required('last_name');
			this.optional('middle_name');
		});

		var value = {
			first_name: 'hello',
			last_name: 'world',
			middle_name: 'param-pam-pam'
		};
		var _keys = _.keys(value);

		value.excess_field = true;

		sh1.verify(value, function (err) {
			test.ok(!!err);
			test.equal(err.rule, 'available_fields');
			test.deepEqual(err.params, _keys);
			test.deepEqual(err.value, value);
			test.deepEqual(err.path, []);
			test.done();
		});
	},
	'verify - ignore excess field': function (test) {
		var sh1 = new Schema().object(function () {
			this.field('first_name');
			this.required('last_name');
			this.optional('middle_name');
		});

		var value = {
			first_name: 'hello',
			last_name: 'world',
			middle_name: 'param-pam-pam'
		};

		value.excess_field = true;

		sh1.verifier({ ignoreExcess: true }).verify(value, function (err) {
			test.ok(!err);
			test.equal(err, null);
			test.done();
		});
	}
};

exports['Create Schema, Register'] = {
	'equal registering': function (test) {
		var sh1 = new Schema();
		var sh2 = Schema.create();
		var sh3 = new Schema('nameForRegister1');
		var sh4 = Schema.create('nameForRegister2');

		Schema.register('someSchema1', sh1);
		Schema.register('someSchema2', sh2);

		test.strictEqual(Schema.get('someSchema1'), sh1);
		test.strictEqual(Schema.get('someSchema2'), sh2);
		test.strictEqual(Schema.get('nameForRegister1'), sh3);
		test.strictEqual(Schema.get('nameForRegister2'), sh4);

		test.done();
	}
};

exports['Object Schema Building: like'] = {
	'example': function (test) {
		var sh1 = new Schema().object(function () {
			this.field('hello');
			this.field('world');
		});
		var sh2 = new Schema().array(function () {
			this.field('some');
		});

		sh2.field('myField').like(sh1);

		// equal
		var test1 = new Schema().array(function () {
			this.field('some');
			this.field('myField').object(function () {
				this.field('hello');
				this.field('world');
			});
		});

		test.deepEqual(test1, sh2);

		var sh3 = new Schema().array(function () {
			this.field('some');
		});

		sh1.like(sh3);

		var test2 = new Schema().array(function () {
			this.field('hello');
			this.field('world');
			this.field('some');
		});

		test.deepEqual(test2, sh1);

		test.done();
	},
	'typical': function (test) {
		var sh1s1 = new Schema().object(function () {
			this.field('hello');
			this.field('world');
		});
		var sh1s2 = new Schema('attachExampleSchema').object(function () {
			this.field('hello');
			this.field('world');
		});
		var sh2 = new Schema().array(function () {
			this.field('some');
		});


		// ATTACH
		sh1s1.field('myField').like(sh2);
		Schema.get('attachExampleSchema').field('myField').like(sh2);


		// EQUAL
		var sh3 = new Schema('Hello').object(function () {
			this.field('hello');
			this.field('world');
			this.field('myField').array(function () {
				this.field('some');
			});
		});

		test.deepEqual(sh1s1, sh3);
		test.deepEqual(sh1s2, sh3);

		test.done();
	}
};

exports['Object Schema Building: object'] = {
	'typical': function (test) {
		var sh1 = new Schema().object(function (r, o) {
			r('my1');
			o('world1');
		});
		var sh4 = new Schema().object(function (r, o) {
			r('my2');
			o('world2');
		});
		var sc1 = new Schema('hello2').like(sh4);

		sc1.field('some1');
		sc1.field('some2');

		var sc2 = new Schema();

		sc2.like(sc1); // add sh1

		var sc3 = new Schema();

		sc3.like(Schema.get('hello2')); // add sc1
		sh1.field('inner').like(sc3);

		var testSc = new Schema().object(function (r, o) {
			r('my1');
			o('world1');
			r('inner').object(function (r, o) {
				r('my2');
				o('world2');
				r('some1');
				r('some2');
			});
		});

		test.deepEqual(sh1, testSc);
		test.done();
	}
};

exports['Object Schema Building: required and optional'] = {
	optional: function (test) {
		var sc1 = new Schema();

		sc1.field('some').optional();

		var sc2 = new Schema();

		sc2.optional('some');

		test.deepEqual(sc2, sc1);

		test.done();
	},
	required: function (test) {
		var sc1 = new Schema();

		sc1.field('some');

		var sc2 = new Schema();

		sc2.required('some');

		test.deepEqual(sc2, sc1);

		test.done();
	}
};
