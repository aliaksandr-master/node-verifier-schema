"use strict";

var Schema = require('./_lib/schema');
var tester = require('./_lib/tester');

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

exports['validate object'] = {
	'#1': tester(s1, { expect: false, validationError: { rule: 'required', params: true, path: [ ] } }, undefined),
	'#2': tester(s1, { expect: false, validationError: { rule: 'required', params: true, path: [ 'age' ] } }, {}),
	'#3': tester(s1, { expect: false, validationError: { rule: 'type', params: 'object', path: [ ] } }, []),
	'#4': tester(s1, { expect: false, validationError: { rule: 'type', params: 'object', path: [ ] } }, null),
	'#5': tester(s1, { expect: false, validationError: { rule: 'type', params: 'object', path: [ ] } }, 3),
	'#6': tester(s1, { expect: false, validationError: { rule: 'type', params: 'object', path: [ ] } }, "asdasd"),
	'#7': tester(s1, { expect: true }, {
		'age': null
	}),
	'#8': tester(s1, { expect: false, validationError: { rule: 'required', params: true, path: [ 'age' ] } }, {
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
	'#12': tester(s1, { expect: false, validationError: { rule: 'available_fields', params: ['age', 'school_names'], path: [ ] } }, {
		'age': {
			'asdasdasd': 'asdasdasd'
		},
		'school_names': undefined,
		'some': 123123
	}),
	'#12-ignore': tester(s1, { expect: true, options: { ignoreExcess: true } }, {
		'age': {
			'asdasdasd': 'asdasdasd'
		},
		'school_names': undefined,
		'some': 123123
	}),
	'#13': tester(s1, { expect: false, validationError: { rule: 'available_fields', params: ['age', 'school_names'], path: [ ] } }, {
		'age': {
			'asdasdasd': 'asdasdasd'
		},
		'some': 123123
	}),
	'#14': tester(s1, { expect: false, validationError: { rule: 'available_fields', params: ['age', 'school_names'], path: [ ] } }, {
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
