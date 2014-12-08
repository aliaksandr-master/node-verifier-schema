"use strict";

var _ = require('lodash');
var Schema = require('./Schema');


var schemaBuilder = function schemaBuilder (options) {
	return function (validation, nested) {
		var schema = new Schema(null, null, options);
		schema.validate(validation);
		schema.nested(nested);

		console.log(require('util').inspect(schema, { depth: null, colors: true }));
		return schema;
	};
};

module.exports = schemaBuilder;
module.exports.Schema = Schema;