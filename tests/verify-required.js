'use strict';

var tester = require('./_lib/tester');
var Schema = require('./_lib/schema');

var schemaWithValidation1 = new Schema().object(function (req, opt) {
	opt('orderby', [
		'type string',
		{ contains: [ 'ASC', 'DESC' ] }
	]);
});

exports['base usage'] = {
	'valid - optional - undefined': tester({
		schema: new Schema().optional('orderby'),
		expect: true,
		value: {}
	}),

	'valid - optional - has value': tester({
		schema: new Schema().optional('orderby'),
		expect: true,
		value: { orderby: 123 }
	}),

	'valid - optional validate - undefined': tester({
		schema: schemaWithValidation1,
		expect: true,
		value: {}
	}),

	'valid - optional validate - has value': tester({
		schema: schemaWithValidation1,
		expect: true,
		value: {
			orderby: 'ASC'
		}
	}),

	'invalid - optional validate - null': tester({
		schema: schemaWithValidation1,
		vErr: {
			rule: 'type',
			params: 'string',
			path: [ 'orderby' ]
		},
		value: {
			orderby: null
		}
	}),

	'invalid - optional validate - has value': tester({
		schema: schemaWithValidation1,
		vErr: {
			rule: 'contains',
			params: [ 'ASC', 'DESC' ],
			path: [ 'orderby' ]
		},
		value: { orderby: 'asc' }
	})

};
