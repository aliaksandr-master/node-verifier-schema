"use strict";

var _ = require('lodash');

function Schema (name, parentPath, options) {
	this.hasNested = false;

	this._options = _.extend({
		validator: null,
		separator: '/'
	}, options);

	this.nestedNames = [];
	this.nestedRequiredSchems = [];
	this.nestedOptionalSchems = [];
	this.validations = [];

	parentPath = parentPath ? parentPath : '';
	name = name || '';
	if (parentPath && !name) {
		throw new Error('scheme field name must be specified');
	}

	if (name) {
		this.name = name;
		this.path = parentPath + this._options.separator + name;
	}
}

Schema.prototype = {
	validate: function (validation) {
		if (validation) {
			this.validations.push(this._options.validator ? this._options.validator(validation) : validation);
		}

		return this;
	},

	nested: function (nested) {
		var that = this;
		if (nested) {
			nested.call(this, function (name, validation, nested) {
				return that.required(name)
					.validate(validation)
					.nested(nested);
			}, function (name, validation, nested) {
				return that.optional(name)
					.validate(validation)
					.nested(nested);
			});
		}

		return this;
	},

	required: function (name) {
		var schema = new Schema(name, this.path, this._options);
		this.hasNested = true;
		this.nestedRequiredSchems.push(schema);
		this.nestedNames.push(schema.name);

		return schema;
	},

	optional: function (name) {
		var schema = new Schema(name, this.path, this._options);
		this.hasNested = true;
		this.nestedOptionalSchems.push(schema);
		this.nestedNames.push(schema.name);

		return schema;
	}
};

module.exports = Schema;