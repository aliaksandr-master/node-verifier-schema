"use strict";

var Schema = require('./_lib/schema');
var tester = require('./_lib/tester');


var s1 = new Schema().array();

var arrSh1 = new Schema().object(function (r, o) {
	r('fio').object(function (r, o) {
		r('first_name');
		r('last_name');
		o('middle_name');
	});
	r('age');
	r('family').array(function (r, o) {
		r('first_name');
		r('last_name');
		o('middle_name');
		o('age');
	});
	r('education').array(function (r, o) {
		r('name');
		r('type');
		o('classes').array();
	});
});

exports['validate value-array'] = {
	'#1': tester(s1, { expect: true }, []),
	'#2': tester(s1, { expect: false }, undefined),

	'check path - valid': tester(arrSh1, { expect: true }, {
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
			}
		]
	}),

	'check path - invalid': tester(arrSh1, { expect: false, validationError: { rule: 'required', ruleParams: true, path: [ 'family', '1', 'first_name' ] } }, {
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
				classes: [ 1, 2, 3 ]
			}
		]
	})
};

var s2 = new Schema().array(function (required, optional) {
	required('age');
	optional('school_names');
});

exports['validate object-array'] = {
	'#1': tester(s2, { expect: false, validationError: { rule: 'required', ruleParams: true, path: [ ] } }, undefined),
	'#2': tester(s2, { expect: false, validationError: { rule: 'type', ruleParams: 'array', path: [ ] } }, {}),
	'#3': tester(s2, { expect: true }, []),
	'#4': tester(s2, { expect: false, validationError: { rule: 'type', ruleParams: 'array', path: [ ] } }, null),
	'#5': tester(s2, { expect: false, validationError: { rule: 'type', ruleParams: 'array', path: [ ] } }, 3),
	'#6': tester(s2, { expect: false, validationError: { rule: 'type', ruleParams: 'array', path: [ ] } }, "asdasd"),
	'#7': tester(s2, { expect: false, validationError: { rule: 'type', ruleParams: 'array', path: [ ] } }, {
		'age': null
	}),
	'#8': tester(s2, { expect: false, validationError: { rule: 'type', ruleParams: 'array', path: [ ] } }, {
		'age': null,
		'school_names': undefined
	}),
	'#9': tester(s2, { expect: false, validationError: { rule: 'type', ruleParams: 'array', path: [ ] } }, {
		'age': null,
		'school_names': null,
		'some': 123123
	}),
	'#10': tester(s2, { expect: true }, [
		{
			'age': null
		}
	]),
	'#11': tester(s2, { expect: true }, [
		{
			'age': null,
			'school_names': undefined
		}
	]),
	'#12': tester(s2, { expect: false, validationError: { rule: 'available_fields', ruleParams: [ 'age', 'school_names' ], path: [ '0' ] } }, [
		{
			'age': null,
			'school_names': null,
			'some': 123123
		}
	]),
	'#13': tester(s2, { expect: true }, [
		{
			'age': null,
			'school_names': null
		},
		{
			'age': null,
			'school_names': null
		}
	]),
	'#14': tester(s2, { expect: true }, [
		{
			'age': null,
			'school_names': null
		},
		{
			'age': null
		}
	]),
	'#15': tester(s2, { expect: true }, [
		{
			'age': null
		},
		{
			'age': null,
			'school_names': null
		}
	]),
	'#16': tester(s2, { expect: false, validationError: { rule: 'required', ruleParams: true, path: [ '0', 'age' ] } }, [
		{
			'school_names': null
		},
		{
			'age': null,
			'school_names': null
		}
	]),
	'#17': tester(s2, { expect: false, validationError: { rule: 'required', ruleParams: true, path: [ '0', 'age' ] } }, [
		{},
		{}
	]),
	'#18': tester(s2, { expect: false, validationError: { rule: 'type', ruleParams: 'object', path: [ '0' ] } },
		[ 1, 2, 3 ]
	)
};
