"use strict";

var _ = require('lodash');
var Schema = require('../index');

module.exports = {
	'Simple Usage: build - equal builds made by different approaches': function (test) {
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

	'Simple Usage: verify - no specified fields': function (test) {
		var sh1 = new Schema().object(function () {
			this.field('first_name');
			this.required('last_name');
			this.optional('middle_name');
		});

		var value = {};
		sh1.verify(value, function (err, isValid, vError) {
			test.ok(!isValid);
			test.equal(vError.ruleName, 'required');
			test.strictEqual(vError.ruleParams, null);
			test.strictEqual(vError.value, undefined);
			test.deepEqual(vError.path, ['first_name']);
			test.done(err);
		});
	},

	'Simple Usage: verify - optional field isn\'t specified': function (test) {
		var sh1 = new Schema().object(function () {
			this.field('first_name');
			this.required('last_name');
			this.optional('middle_name');
		});

		var value = { first_name: 'hello', last_name: 'world' };
		sh1.verify(value, function (err, isValid, vError) {
			test.ok(isValid);
			test.strictEqual(vError, null);
			test.done(err);
		});
	},

	'Simple Usage: verify - correct if all available fields not empty': function (test) {
		var sh1 = new Schema().object(function () {
			this.field('first_name');
			this.required('last_name');
			this.optional('middle_name');
		});

		var value = { first_name: 'hello', last_name: 'world', middle_name: 'param-pam-pam' };
		sh1.verify(value, function (err, isValid, vError) {
			test.ok(isValid);
			test.strictEqual(vError, null);
			test.done(err);
		});
	},

	'Simple Usage: verify - excess field': function (test) {
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
		var _keys = _.keys(value);
		value.excess_field = true;

		sh1.verify(value, function (err, isValid, vError) {
			test.ok(!isValid);
			test.equal(vError.ruleName, 'available_fields');
			test.deepEqual(vError.ruleParams, _keys);
			test.deepEqual(vError.value, value);
			test.deepEqual(vError.path, []);
			test.done(err);
		});
	},

	'Create Schema, Register - equal registering': function (test) {
		var sh1 = new Schema();
		var sh2 = Schema(); // jshint ignore: line
		var sh3 = new Schema('nameForRegister1');
		var sh4 = Schema('nameForRegister2'); // jshint ignore: line
		Schema.register('someSchema1', sh1);
		Schema.register('someSchema2', sh2);

		test.strictEqual(Schema.get('someSchema1'), sh1);
		test.strictEqual(Schema.get('someSchema2'), sh2);
		test.strictEqual(Schema.get('nameForRegister1'), sh3);
		test.strictEqual(Schema.get('nameForRegister2'), sh4);

		test.done();
	},
};