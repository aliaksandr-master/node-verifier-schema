"use strict";

var _ = require('lodash');
var verifier = require('./verifier');
var builder = require('./builder');

var schemaVerifier = module.exports = function (options) {
	var schemaBuilder = builder(options);

	return function (validation, nestedBuilder) {
		var schema = schemaBuilder(validation, nestedBuilder);

		var schemaVerifier = verifier(options, schema);
		schemaVerifier.schema = schema;

		return schemaVerifier;
	};
};

schemaVerifier.schemaBuilder = builder;
schemaVerifier.schemaVerifier = verifier;
