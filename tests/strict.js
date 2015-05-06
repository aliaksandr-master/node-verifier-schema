'use strict';

var tester = require('./_lib/tester');
var Schema = require('./_lib/schema');

var sh1 = Schema.create().object(function (r, o) {
	r('some_1');
	r('some_2');
	o('some_3');
});

exports['valid object'] = tester({
	schema: sh1,
	expect: true,
	value: {
		some_1: 1,
		some_2: 2,
		some_3: 3,
		some_4: 3
	}
});



var sh2 = sh1.clone().strict();

exports['invalid object'] = tester({
	schema: sh2,
	vErr: {
		rule: 'available_fields',
		params: [ 'some_1', 'some_2', 'some_3' ],
		path: []
	},
	value: {
		some_1: 1,
		some_2: 2,
		some_3: 3,
		some_4: 3
	}
});



var sh2s = sh2.clone().strict(false);

exports['valid object: disable strict'] = tester({
	schema: sh2s,
	expect: true,
	value: {
		some_1: 1,
		some_2: 2,
		some_3: 3,
		some_4: 3
	}
});



var sh3 = sh1.clone().array();

exports['valid array-object'] = tester({
	schema: sh3,
	expect: true,
	value: [
		{
			some_1: 1,
			some_2: 2,
			some_3: 3,
			some_4: 3
		}
	]
});



var sh4 = sh3.clone().strict();

exports['invalid array-object'] = tester({
	schema: sh4,
	vErr: {
		rule: 'available_fields',
		params: [ 'some_1', 'some_2', 'some_3' ],
		path: [ '0' ]
	},
	value: [
		{
			some_1: 1,
			some_2: 2,
			some_3: 3,
			some_4: 3
		}
	]
});



var sh4s = sh4.clone().strict(false);

exports['valid array-object: disable strict'] = tester({
	schema: sh4s,
	expect: true,
	value: [
		{
			some_1: 1,
			some_2: 2,
			some_3: 3,
			some_4: 3
		}
	]
});
