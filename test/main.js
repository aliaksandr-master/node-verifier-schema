"use strict";

var _ = require('lodash');
var Schema = require('../index');

var inspect = function (value) {
	return '\n' + require('util').inspect(value, {depth: null, colors: true}) + '\n';
};

var consoleInspect = function (value) {
	console.log.apply(console, _.map(arguments, inspect));
};

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

exports.schema = {
	simple: function (test) {
		new Schema().validate('type object').object(function (required, optional) {
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
		var s0 = new Schema().validate('type object').object(function (required, optional) {
			required('first_name',  ['type string', 'min_length 3', 'max_length 20']);
			required('last_name',   ['type string', 'min_length 3', 'max_length 20']);
			optional('middle_name', ['type string', 'min_length 3', 'max_length 20']);
		});

		test.deepEqual(s0, s0.clone());
		test.done();
	},

	nestedSchema: function (test) {
		var s0 = new Schema().object(function (required, optional) {
			required('fio', 'type object', function (required, optional) {
				required('first_name',  ['type string', 'min_length 3', 'max_length 20']);
				required('last_name',   ['type string', 'min_length 3', 'max_length 20']);
				optional('middle_name', ['type string', 'min_length 3', 'max_length 20']);
			});
		});
		//consoleInspect(s0.schema);

		var s1 = new Schema().validate('type object').object(function (required, optional) {
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

		s1.field('fio', null, s0, false);

		//consoleInspect(s1.schema);

		test.ok(true);
		test.done();
	}
};

var s1 = new Schema().object(function (required, optional) {
	required('age');
	optional('school_names');
});

exports.validate_simple = {
	'#1': tester(s1, { expect: false }, undefined),
	'#2': tester(s1, { expect: false }, {}),
	'#3': tester(s1, { expect: false }, []),
	'#4': tester(s1, { expect: false }, null),
	'#5': tester(s1, { expect: false }, 3),
	'#6': tester(s1, { expect: false }, "asdasd"),
	'#7': tester(s1, { expect: true }, {
		'age': null
	}),
	'#8': tester(s1, { expect: false }, {
		'age': undefined
	}),
	'#9': tester(s1, { expect: true }, {
		'age': {}
	}),
	'#10': tester(s1, { expect: true }, {
		'age': {
			'asdasdasd': 'asdasdasd'
		}
	}),
	'#11': tester(s1, { expect: true }, {
		'age': {
			'asdasdasd': 'asdasdasd'
		},
		'school_names': undefined
	}),
	'#12': tester(s1, { expect: false }, {
		'age': {
			'asdasdasd': 'asdasdasd'
		},
		'school_names': undefined,
		'some': 123123
	}),
	'#13': tester(s1, { expect: false }, {
		'age': {
			'asdasdasd': 'asdasdasd'
		},
		'some': 123123
	}),
	'#14': tester(s1, { expect: false }, {
		'age': {
			'asdasdasd': 'asdasdasd'
		},
		'school_names': 123123,
		'some': 123123
	}),
	'#15': tester(s1, { expect: true }, {
		'age': {
			'asdasdasd': 'asdasdasd'
		},
		'school_names': 123123
	})
};

