"use strict";

var _ = require('lodash');
var tester = require('./_lib/tester');
var Schema = require('./_lib/schema');

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

exports['node-verifier'] = {

	'valid': tester({
		schema: schema,
		expect: true,
		value: _.cloneDeep(validValue)
	}),

	'invalid - type': tester({
		schema: schema,
		validationError: {
			rule: 'type',
			params: 'object',
			path: []
		},
		value: 3
	}),

	'invalid - required': tester({
		schema: schema,
		vErr: {
			rule: 'required',
			params: null,
			path: [ 'education' ]
		},
		value: (function () {
			var value = _.cloneDeep(validValue);
			delete value.education;
			return value;
		})()
	}),

	'invalid - required nested': tester({
		schema: schema,
		vErr: {
			rule: 'required',
			params: null,
			path: ['family', '2', 'first_name']
		},
		value:  (function () {
			var value = _.cloneDeep(validValue);
			delete value.family[2].first_name;
			return value;
		})()
	}),

	'invalid - type nested': tester({
		schema: schema,
		vErr: {
			rule: 'each',
			params: { type: 'object' },
			path: ['family', '1']
		},
		value: (function () {
			var value = _.cloneDeep(validValue);
			value.family[1] = null;
			return value;
		})()
	})
};