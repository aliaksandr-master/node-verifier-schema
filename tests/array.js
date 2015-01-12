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
	'#1': tester({
		schema: s1,
		expect: true,
		value: []
	}),

	'#2': tester({
		schema: s1,
		expect: false,
		value: undefined
	}),

	'check path - valid': tester({
		schema: arrSh1,
		expect: true,
		value: {
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
		}
	}),

	'check path - invalid': tester({
		schema: arrSh1,
		vErr:{
			rule: 'required',
			params: null,
			path: [ 'family', '1', 'first_name' ]
		},
		value: {
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
		}
	})
};

var s2 = new Schema().strict().array(function (required, optional) {
	required('age');
	optional('school_names');
});

exports['validate object-array'] = {
	'#1': tester({
		schema: s2,
		vErr: { 
			rule: 'required', 
			params: null,
			path: []
		},
		value: undefined
	}),

	'#2': tester({
		schema: s2,
		vErr: {
			rule: 'type',
			params: 'array',
			path: []
		},
		value: {}
	}),

	'#3': tester({
		schema: s2,
		expect: true,
		value: []
	}),

	'#4': tester({
		schema: s2,
		vErr: {
			rule: 'type',
			params: 'array',
			path: []
		},
		value: null
	}),

	'#5': tester({
		schema: s2,
		vErr: {
			rule: 'type',
			params: 'array',
			path: []
		},
		value: 3
	}),

	'#6': tester({
		schema: s2,
		vErr: {
			rule: 'type',
			params: 'array',
			path: []
		},
		value: "asdasd"
	}),

	'#7': tester({
		schema: s2,
		vErr: {
			rule: 'type',
			params: 'array',
			path: []
		},
		value: {
			'age': null
		}
	}),

	'#8': tester({
		schema: s2,
		vErr: {
			rule: 'type',
			params: 'array',
			path: []
		},
		value: {
			'age': null,
			'school_names': undefined
		}
	}),

	'#9': tester({
		schema: s2,
		vErr: {
			rule: 'type',
			params: 'array',
			path: []
		},
		value: {
			'age': null,
			'school_names': null,
			'some': 123123
		}
	}),

	'#10': tester({
		schema: s2,
		expect: true,
		value: [
			{
				'age': null
			}
		]
	}),

	'#11': tester({
		schema: s2,
		expect: true,
		value: [
			{
				'age': null,
				'school_names': undefined
			}
		]
	}),
	'#12': tester({
		schema: s2,
		vErr: {
			rule: 'available_fields',
			params: [ 'age', 'school_names' ],
			path: [ '0' ]
		},
		value: [
			{
				'age': null,
				'school_names': null,
				'some': 123123
			}
		]
	}),

	'#13': tester({
		schema: s2,
		expect: true,
		value: [
			{
				'age': null,
				'school_names': null
			},
			{
				'age': null,
				'school_names': null
			}
		]
	}),

	'#14': tester({
		schema: s2,
		expect: true,
		value: [
			{
				'age': null,
				'school_names': null
			},
			{
				'age': null
			}
		]
	}),
	'#15': tester({
		schema: s2,
		expect: true,
		value: [
			{
				'age': null
			},
			{
				'age': null,
				'school_names': null
			}
		]
	}),

	'#16': tester({
		schema: s2,
		vErr: {
			rule: 'required',
			params: null,
			path: [ '0', 'age' ]
		},
		value: [
			{
				'school_names': null
			},
			{
				'age': null,
				'school_names': null
			}
		]
	}),

	'#17': tester({
		schema: s2,
		vErr: {
			rule: 'required',
			params: null,
			path: [ '0', 'age' ]
		},
		value: [
			{},
			{}
		]
	}),

	'#18': tester({
		schema: s2,
		vErr: {
			rule: 'type',
			params: 'object',
			path: [ '0' ]
		},
		value: [ 1, 2, 3 ]
	})
};
