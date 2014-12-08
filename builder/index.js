"use strict";

var _ = require('lodash');
var Schema = require('./Schema');


var schemaBuilder = function schemaBuilder (options) {
	options = _.extend({
		validator: null,
		separator: '/'
	}, options);

	var patchValidation,
		addNew,
		shuttle,
		patchNested,
		shuttleOptional,
		shuttleRequired;

	shuttle = function (type) {
		return function (name, validation, nestedBuilder) {
			if (!name) {
				throw new Error('scheme field name must be specified');
			}

			var schemaObject = { name: name };

			schemaObject.path = (this.path ? this.path : '') + options.separator + schemaObject.name;

			addNew(this, type, patchNested(
				patchValidation(schemaObject, validation),
				nestedBuilder
			));
		};
	};

	shuttleOptional = shuttle('optional');
	shuttleRequired = shuttle('required');

	patchValidation = function (schemaObject, validation) {
		if (validation) {
			if (_.isFunction(validation)) {
				schemaObject.validation = validation;
			} else {
				schemaObject.validation = options.validator ? options.validator(validation) : validation;
			}
		}

		return schemaObject;
	};

	patchNested = function (schemaObject, nestedBuilder) {

		if (nestedBuilder) {
			nestedBuilder(shuttleRequired.bind(schemaObject), shuttleOptional.bind(schemaObject));
		}

		return schemaObject;
	};

	addNew = function (that, type, schemaObject) {
		if (that[type] == null) {
			that[type] = [];
		}

		if (that.names == null) {
			that.names = [];
		}

		that.hasNested = true;
		that[type].push(schemaObject);
		that.names.push(schemaObject.name);
	};

	return function (validation, nestedBuilder) {
		var schema = new Schema();
		schema = patchValidation(schema, validation);
		schema = patchNested(schema, nestedBuilder);
		return schema;
	};
};

module.exports = schemaBuilder;
module.exports.Schema = Schema;