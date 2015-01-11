"use strict";

var Schema = require('./_lib/schema');
var tester = require('./_lib/tester');

exports.schema = {
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

var s1 = new Schema().strict().object(function (required, optional) {
	required('age');
	optional('school_names');
});

var s2 = new Schema().object(function (required, optional) {
	required('age');
	optional('school_names');
});

exports['validate object'] = {
	'#1': tester({
		schema: s1,
		vErr: {
			rule: 'required',
			params: null,
			path: []
		},
		value: undefined
	}),

	'#2': tester({
		schema: s1,
		vErr: {
			rule: 'required',
			params: null,
			path: [ 'age' ]
		},
		value: {}
	}),

	'#3': tester({
		schema: s1,
		vErr: {
			rule: 'type',
			params: 'object',
			path: []
		},
		value: []
	}),

	'#4': tester({
		schema: s1,
		vErr: {
			rule: 'type',
			params: 'object',
			path: []
		},
		value: null
	}),

	'#5': tester({
		schema: s1,
		vErr: {
			rule: 'type',
			params: 'object',
			path: []
		},
		value: 3
	}),

	'#6': tester({
		schema: s1,
		vErr: {
			rule: 'type',
			params: 'object',
			path: []
		},
		value: "asdasd"
	}),

	'#7': tester({
		schema: s1,
		expect: true,
		value: {
			'age': null
		}
	}),

	'#8': tester({
		schema: s1,
		vErr: {
			rule: 'required',
			params: null,
			path: [ 'age' ]
		},
		value: {
			'age': undefined
		}
	}),

	'#9': tester({
		schema: s1,
		expect: true,
		value: {
			'age': {}
		}
	}),

	'#10': tester({
		schema: s1,
		expect: true,
		value: {
			'age': {
				'asdasdasd': 'asdasdasd'
			}
		}
	}),

	'#11': tester({
		schema: s1,
		expect: true,
		value: {
			'age': {
				'asdasdasd': 'asdasdasd'
			},
			'school_names': undefined
		}
	}),

	'#12': tester({
		schema: s1,
		vErr: {
			rule: 'available_fields',
			params: ['age', 'school_names'],
			path: []
		},
		value: {
			'age': {
				'asdasdasd': 'asdasdasd'
			},
			'school_names': undefined,
			'some': 123123
		}
	}),

	'#12-ignore': tester({
		schema: s2,
		expect: true,
		value: {
			'age': {
				'asdasdasd': 'asdasdasd'
			},
			'school_names': undefined,
			'some': 123123
		}
	}),

	'#13': tester({
		schema: s1,
		vErr: {
			rule: 'available_fields',
			params: ['age', 'school_names'],
			path: []
		},
		value: {
			'age': {
				'asdasdasd': 'asdasdasd'
			},
			'some': 123123
		}
	}),

	'#14': tester({
		schema: s1,
		vErr: {
			rule: 'available_fields',
			params: ['age', 'school_names'],
			path: []
		},
		value: {
			'age': {
				'asdasdasd': 'asdasdasd'
			},
			'school_names': 123123,
			'some': 123123
		}
	}),

	'#15': tester({
		schema: s1,
		expect: true,
		value: {
			'age': {
				'asdasdasd': 'asdasdasd'
			},
			'school_names': 123123
		}
	})
};
