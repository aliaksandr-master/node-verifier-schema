"use strict";

var Schema = require('../../../index');

module.exports = new Schema().validate('type object').object(function (r, o) {
	r('fio', 'type object').object(function (r, o) {
		r('first_name',  ['type string', 'min_length 3', 'max_length 20']);
		r('last_name',   ['type string', 'min_length 3', 'max_length 20']);
		o('middle_name', ['type string', 'min_length 3', 'max_length 20']);
	});
	r('age', ['type number', 'max_value 100', 'min_value 16']);
	r('family', ['type array', 'min_length 2', {each: ['type object']}]).array(function (r, o) {
		r('first_name',  ['type string', 'min_length 3', 'max_length 20']);
		r('last_name',   ['type string', 'min_length 3', 'max_length 20']);
		o('middle_name', ['type string', 'min_length 3', 'max_length 20']);
		o('age', ['type number', 'max_value 100', 'min_value 16']);
	});
	r('education', ['type array', 'min_length 2', 'not empty', {each: ['type string', 'min_length 3', 'max_length 20']}]).array(function (r, o) {
		r('name', 'type string');
		r('type', 'type string');
		o('classes').array();
	});
});
