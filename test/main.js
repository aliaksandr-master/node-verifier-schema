"use strict";

var _ = require('lodash');

var inspect = function (value) {
	return '\n' + require('util').inspect(value, {depth: null, colors: true}) + '\n';
};

var consoleInspect = function (value) {
	console.log.apply(console, _.map(arguments, inspect));
};

var validator = require('node-verifier');
var schemaBuilder = require('../index');

var tester = function (name, schemeValidator, testCase, objectForValidate) {

	return function (test) {
		schemeValidator(objectForValidate, function (err, valid, info) {
			if (err) {
				console.log('unexpected error', inspect(err));
			}

			test.equal(valid, testCase.expect, 'invalid result in '+name + ' ' + inspect(info));
			test.done(err);
		});
	};
};

var _schemaBuilder = schemaBuilder({
	validator: validator()
});

var validateSchema1 = _schemaBuilder('type object', function (required, optional) {
	required('fio', 'type object', function (required, optional) {
		required('first_name',  ['type string', 'min_length 3', 'max_length 20']);
		required('last_name',   ['type string', 'min_length 3', 'max_length 20']);
		optional('middle_name', ['type string', 'min_length 3', 'max_length 20']);
	});
	required('age', ['type number', 'max_value 100', 'min_value 16']);
	required('family', ['type array', 'min_length 2', {each: ['type object']}], function (required, optional) {
		required('first_name',  ['type string', 'min_length 3', 'max_length 20']);
		required('last_name',   ['type string', 'min_length 3', 'max_length 20']);
		optional('middle_name', ['type string', 'min_length 3', 'max_length 20']);
		optional('age', ['type number', 'max_value 100', 'min_value 16']);
	});
	required('school_names', ['type array', 'min_length 2', 'not empty', {each: ['type string', 'min_length 3', 'max_length 20']}]);
});

var validateSchema2 = _schemaBuilder('type object');

exports.schema = {
	simple: function (test) {
		//_schemaBuilder('type object', function (required, optional) {
		//	required('fio', 'type object', function (required, optional) {
		//		required('first_name',  ['type string', 'min_length 3', 'max_length 20']);
		//		required('last_name',   ['type string', 'min_length 3', 'max_length 20']);
		//		optional('middle_name', ['type string', 'min_length 3', 'max_length 20']);
		//	});
		//	required('age', ['type number', 'max_value 100', 'min_value 16']);
		//	required('family', ['type array', 'min_length 2', {each: ['type object']}], function (required, optional) {
		//		required('first_name',  ['type string', 'min_length 3', 'max_length 20']);
		//		required('last_name',   ['type string', 'min_length 3', 'max_length 20']);
		//		optional('middle_name', ['type string', 'min_length 3', 'max_length 20']);
		//		optional('age', ['type number', 'max_value 100', 'min_value 16']);
		//	});
		//	required('school_names', ['type array', 'min_length 2', 'not empty', {each: ['type string', 'min_length 3', 'max_length 20']}]);
		//});
		test.ok(true);
		test.done();
	},

	clone: function (test) {
		var s0 = _schemaBuilder('type object', function (required, optional) {
			required('first_name',  ['type string', 'min_length 3', 'max_length 20']);
			required('last_name',   ['type string', 'min_length 3', 'max_length 20']);
			optional('middle_name', ['type string', 'min_length 3', 'max_length 20']);
		});

		test.deepEqual(s0.schema, s0.schema.clone());
		test.done();
	},

	nestedSchema: function (test) {
		var s0 = _schemaBuilder(null, function (required, optional) {
			required('fio', 'type object', function (required, optional) {
				required('first_name',  ['type string', 'min_length 3', 'max_length 20']);
				required('last_name',   ['type string', 'min_length 3', 'max_length 20']);
				optional('middle_name', ['type string', 'min_length 3', 'max_length 20']);
			});
		});
		//consoleInspect(s0.schema);

		var s1 = _schemaBuilder('type object', function (required, optional) {
			required('age', ['type number', 'max_value 100', 'min_value 16']);
			required('family', ['type array', 'min_length 2', {each: ['type object']}], function (required, optional) {
				required('first_name',  ['type string', 'min_length 3', 'max_length 20']);
				required('last_name',   ['type string', 'min_length 3', 'max_length 20']);
				optional('middle_name', ['type string', 'min_length 3', 'max_length 20']);
				optional('age', ['type number', 'max_value 100', 'min_value 16']);
			});
			required('school_names', ['type array', 'min_length 2', 'not empty', {each: ['type string', 'min_length 3', 'max_length 20']}]);
		});
		//consoleInspect(s1.schema);

		s1.schema.field('fio', false, null, s0.schema, false);

		//consoleInspect(s1.schema);

		test.ok(true);
		test.done();
	},
};

exports.validate = {
	'#0-1': tester('#0-1', validateSchema2, { expect: true }, {}),
	//'#0-2': tester('#0-2', validateSchema2, { expect: false }, []),
	//'#0-3': tester('#0-3', validateSchema2, { expect: false }, 1),

	//'#1': tester('#1', validateSchema1, { expect: true }, {
	//	fio: {
	//		first_name: 'hello',
	//		last_name: 'hello',
	//		middle_name: 'hello'
	//	},
	//	age: 17,
	//	family: [
	//		{
	//			first_name: 'hello',
	//			last_name: 'hello',
	//			middle_name: 'hello'
	//		},
	//		{
	//			first_name: 'hello',
	//			last_name: 'hello',
	//			middle_name: 'hello'
	//		}
	//	],
	//	school_names: [
	//		'school 1', 'school 10', 'school 12'
	//	]
	//}),
	//
	//'#2': tester('#2', validateSchema1, { expect: false }, {
	//	fio: {
	//		first_name: 'hello',
	//		last_name: 'hello',
	//		middle_name: 'hello'
	//	},
	//	age: 17,
	//	school_names: [
	//		'school 1', 'school 10', 'school 12'
	//	]
	//}),
	//
	//'#3': tester('#1', validateSchema1, { expect: false }, {
	//	fio: {
	//		first_name: 'hello',
	//		last_name: 'hello',
	//		middle_name: 'hello'
	//	},
	//	hello: 'world',
	//	age: 17,
	//	family: [
	//		{
	//			first_name: 'hello',
	//			last_name: 'hello',
	//			middle_name: 'hello'
	//		},
	//		{
	//			first_name: 'hello',
	//			last_name: 'hello',
	//			middle_name: 'hello'
	//		}
	//	],
	//	school_names: [
	//		'school 1', 'school 10', 'school 12'
	//	]
	//}),
};

