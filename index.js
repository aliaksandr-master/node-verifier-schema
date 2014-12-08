"use strict";

var _ = require('lodash');
var verifier = require('./verifier');
var Schema = require('./builder/Schema');

var schemaVerifier = module.exports = function (options) {
	return function (validation, nestedBuilder, nestedTypeIsArray) {
		var schema = Schema.build(validation, nestedBuilder, nestedTypeIsArray, options);

		var schemaVerifier = verifier(options, schema);
		schemaVerifier.schema = schema;

		return schemaVerifier;
	};
};

schemaVerifier.schemaVerifier = verifier;
schemaVerifier.Schema = Schema;
