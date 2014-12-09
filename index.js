"use strict";

var _ = require('lodash');
var Schema = require('./lib/Schema');

var verifier = function (schema, options) {
	var schemaVerifier = function (value, done) {
		schema.verify(value, options, done);
	};

	schemaVerifier.schema = schema;

	return schemaVerifier;
};

module.exports = function (options) {
	return function (validation, nestedBuilder, nestedTypeIsArray) {
		var schema = Schema.build(validation, nestedBuilder, nestedTypeIsArray, options);

		return verifier(schema, options);
	};
};

module.exports.Schema = Schema;
