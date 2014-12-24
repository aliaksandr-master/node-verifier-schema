"use strict";

var _ = require('lodash');
var Schema = require('./_lib/schema');
var Verifier = require('node-verifier');

var schema = new Schema().validate('type object').object(function (r, o) {
	r('fio', 'type object').object(function (r, o) {
		r('first_name',  ['type string', 'min_length 3', 'max_length 20']);
		r('last_name',   ['type string', 'min_length 3', 'max_length 20']);
		o('middle_name', ['type string', 'min_length 3', 'max_length 20']);
	});
	r('age', ['type number', 'max_value 100', 'min_value 16']);
	r('family', ['type array', 'min_length 2', {each: 'type object'}]).array(function (r, o) {
		r('first_name',  ['type string', 'min_length 3', 'max_length 20']);
		r('last_name',   ['type string', 'min_length 3', 'max_length 20']);
		o('middle_name', ['type string', 'min_length 3', 'max_length 20']);
		o('age', ['type number', 'max_value 100', 'min_value 10']);
	});
	r('education', ['type array', 'min_length 2', 'not empty', {each: ['type object']}]).array(function (r, o) {
		r('name', 'type string');
		r('type', 'type string');
		o('classes').array();
	});
});

var validValue = {
	'fio': {
		'first_name': 'Homer',
		'last_name': 'Simpson'
	},
	'age': 46,
	'family': [
		{
			'first_name': 'Bart',
			'last_name': 'Simpson',
			'age': 13
		},
		{
			'first_name': 'Lisa',
			'last_name': 'Simpson',
			'age': 11
		},
		{
			'first_name': 'Marge',
			'last_name': 'Simpson',
			'age': 43
		}
	],
	'education': [
		{
			name: 'school 4',
			type: 'school',
			classes: [1, 2, 3]
		},
		{
			name: 'school 5',
			type: 'school',
			classes: [4, 5, 6]
		}
	]
};

var verifier = schema.compile(function (validations) {
	if (validations == null) {
		return validations;
	}

	var verifier = new Verifier(validations);

	return function (value, done) {
		verifier.verify(value, function (err) {
			if (err instanceof Verifier.ValidationError) {
				done(new Schema.ValidationError(err.rule, err.params, err.index));
				err = null;
				return;
			}

			done(err);
		});
	};
});

exports['node-verifier'] = {
	'valid': function (test) {
		var value = _.cloneDeep(validValue);
		verifier(value, function (err, isValid, validationError) {
			test.ok(isValid);
			test.done(err);
		});
	},
	'invalid - type': function (test) {
		verifier(3, function (err, isValid, validationError) {
			console.log(validationError);
			test.ok(validationError.rule === 'type');
			test.ok(validationError.params === 'object');
			test.ok(!isValid);
			test.ok(_.isEqual(validationError.path, []));
			test.done(err);
		});
	},
	'invalid - required': function (test) {
		var value = _.cloneDeep(validValue);
		delete value.education;
		verifier(value, function (err, isValid, validationError) {
			test.ok(validationError.rule === 'required');
			test.ok(validationError.params === true);
			test.ok(_.isEqual(validationError.path, ['education']));
			test.ok(!isValid);
			test.done(err);
		});
	},
	'invalid - required nested': function (test) {
		var value = _.cloneDeep(validValue);
		delete value.family[2].first_name;
		verifier(value, function (err, isValid, validationError) {
			test.ok(validationError.rule === 'required');
			test.ok(validationError.params === true);
			test.ok(_.isEqual(validationError.path, ['family', '2', 'first_name']));
			test.ok(!isValid);
			test.done(err);
		});
	},
	'invalid - type nested': function (test) {
		var value = _.cloneDeep(validValue);
		value.family[1] = null;
		verifier(value, function (err, isValid, validationError) {
			//console.log(validationError);
			//test.ok(validationError.rule === 'type');
			//test.ok(validationError.params === '[object object]');
			test.ok(_.isEqual(validationError.path, ['family', '1']));
			test.ok(!isValid);
			test.done(err);
		});
	}
};