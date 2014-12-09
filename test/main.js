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

var tester = function (schema, testCase, objectForValidate) {

	return function (test) {
		schema.verify(objectForValidate, function (err, isValid, validationError) {
			if (err) {
				console.log('unexpected error', inspect(err));
			}

			test.equal(isValid, testCase.expect, 'invalid result ' + inspect(err) + inspect(isValid) + inspect(validationError));
			test.done(err);
		});
	};
};

var _schemaBuilder = schemaBuilder({
	validator: validator()
});

exports.schema = {
	simple: function (test) {
		_schemaBuilder('type object', function (required, optional) {
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
	}
};

var s1 = schemaBuilder.Schema().build(function (required, optional) {
	required('age');
	optional('school_names');
});

exports.validate = {
	'simple #1': tester(s1, { expect: true }, undefined),
	'simple #2': tester(s1, { expect: false }, {}),
	'simple #3': tester(s1, { expect: false }, []),
	'simple #4': tester(s1, { expect: false }, null),
	'simple #5': tester(s1, { expect: false }, 3),
	'simple #6': tester(s1, { expect: false }, "asdasd"),
	'simple #7': tester(s1, { expect: true }, {
		'age': null
	}),
	'simple #8': tester(s1, { expect: false }, {
		'age': undefined
	}),
	'simple #9': tester(s1, { expect: true }, {
		'age': {}
	}),
	'simple #10': tester(s1, { expect: true }, {
		'age': {
			'asdasdasd': 'asdasdasd'
		}
	}),
	'simple #11': tester(s1, { expect: true }, {
		'age': {
			'asdasdasd': 'asdasdasd'
		},
		'school_names': undefined
	}),
	'simple #12': tester(s1, { expect: false }, {
		'age': {
			'asdasdasd': 'asdasdasd'
		},
		'school_names': undefined,
		'some': 123123
	}),
	'simple #13': tester(s1, { expect: false }, {
		'age': {
			'asdasdasd': 'asdasdasd'
		},
		'some': 123123
	}),
	'simple #14': tester(s1, { expect: false }, {
		'age': {
			'asdasdasd': 'asdasdasd'
		},
		'school_names': 123123,
		'some': 123123
	}),
	'simple #15': tester(s1, { expect: true }, {
		'age': {
			'asdasdasd': 'asdasdasd'
		},
		'school_names': 123123
	})
};

