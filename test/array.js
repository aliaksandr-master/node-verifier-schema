"use strict";

var Schema = require('../index');
var tester = require('./lib/tester');


var s1 = new Schema().array();

//exports['validate value-array'] = {
//	'#1': tester(s1, { expected: true }, []),
//	//'#2': tester(s1, { expected: false }, undefined)
//};


var s2 = new Schema().array(function (required, optional) {
	required('age');
	optional('school_names');
});

exports['validate object-array'] = {
	'#1': tester(s2, { expect: false }, undefined),
	'#2': tester(s2, { expect: false }, {}),
	'#3': tester(s2, { expect: true }, []),
	'#4': tester(s2, { expect: false }, null),
	'#5': tester(s2, { expect: false }, 3),
	'#6': tester(s2, { expect: false }, "asdasd"),
	'#7': tester(s2, { expect: false }, {
		'age': null
	}),
	'#8': tester(s2, { expect: false }, {
		'age': null,
		'school_names': undefined
	}),
	'#9': tester(s2, { expect: false }, {
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
	'#12': tester(s2, { expect: false }, [
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
	'#16': tester(s2, { expect: false }, [
		{
			'school_names': null
		},
		{
			'age': null,
			'school_names': null
		}
	]),
	'#17': tester(s2, { expect: false }, [
		{},
		{}
	]),
	'#18': tester(s2, { expect: false }, [ 1, 2, 3 ])
};
