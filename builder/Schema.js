"use strict";

var _ = require('lodash');

/**
 * Create instance of Schema
 *
 * @constructor
 * @this {Schema}
 * @class Schema
 * @throws {TypeError} If parent node hasn't Schema type
 * @throws {Error} If name not specified, when parent node pass as arguments
 * @throws {TypeError} If is not string type
 * @return {Schema}
 */
function Schema () {
	if (!(this instanceof Schema)) {
		return new Schema();
	}
}

Schema.prototype = {

	attach: function (schema, name) {
		if (!(schema instanceof Schema)) {
			throw new TypeError('attach: schema node must be instance of Schema');
		}

		schema.attachTo(this, name);

		schema = null;
		return this;
	},

	attachTo: function (schema, name) {
		if (!(schema instanceof Schema)) {
			throw new TypeError('attachTo: schema node must be instance of Schema');
		}

		if (!name || !_.isString(name)) {
			throw new Error('attach: invalid scheme field name must be non-empty string, "' + name + '" ' + Object.prototype.toString.call(name) + ' given');
		}

		this.name = name;
		this.path = (schema.path || []).concat(name);
		//this.slug = '/' + this.path.join('/');

		schema._addField(this, name);

		schema = null;
		return this;
	},

	_addField: function (schema, name) {
		if (!this.keys) {
			this.keys = [];
		} else if (_.contains(this.keys, name)) {
			throw new Error('duplicate key "' + schema.slug + '"');
		}

		this.keys.push(name);

		if (!this.fields) {
			this.fields = [];
		}

		this.fields.push(schema);
		schema = null;
	},

	setRequired: function (isRequired) {
		if (isRequired == null || isRequired) {
			this.isRequired = true;
		}

		return this;
	},

	typeArray: function (nestedTypeIsArray) {
		if (nestedTypeIsArray) {
			this.isArray = true;
		}

		return this;
	},

	/**
	 * set validate options. can be called several times
	 *
	 * @method
	 * @param {Array|Object|String|Function} validation - validation options.
	 * @return {Schema}
	 */
	validate: function (validation) {
		if (validation) {
			if (!this.validations) {
				this.validations = [];
			}

			if (!_.isArray(validation)) {
				this.validations.push(validation);
			} else {
				this.validations = this.validations.concat(validation);
			}
		}

		return this;
	},

	/**
	 * set nested fields builder
	 *
	 * @method
	 * @param {Function} nested - builder function, has two functions in arguments [required, options].
	 * @throws {TypeError} If nested is not a function if specified
	 * @return {Schema}
	 */
	build: function (builder) {
		if (builder) {
			if (!_.isFunction(builder)) {
				throw new TypeError('nested builder must be function');
			}

			builder.call(this, this.required.bind(this), this.optional.bind(this));
		}

		return this;
	},

	/**
	 * add new nested schema by construct
	 *
	 * @method
	 * @param {String} name - [required] - field name.
	 * @param {Boolean} isRequired - [optional] - is required flag, default is true
	 * @param {Array|String|Object|Function} validation - [optional] - validation options.
	 * @param {Function} nested - [optional] - builder function, has two functions in arguments [required, options].
	 * @param {Boolean} nestedTypeIsArray - [optional] - set type Array of current object of Schema.
	 * @return {Schema}
	 */
	field: function (name, isRequired, validation, nested, nestedTypeIsArray) {
		if (_.isString(nested)) {
			nested = Schema.get(nested);
		}

		var isSchema = nested instanceof Schema;
		var schema = (isSchema ? nested.clone() : new Schema())
			.attachTo(this, name);

		if (!isSchema) {
			schema.build(nested);
		}

		schema
			.validate(validation)
			.setRequired(isRequired)
			.typeArray(nestedTypeIsArray);

		nested = null;
		return schema;
	},

	clone: function () {
		var clone = new Schema();

		_.each(this.fields, function (fieldSchema) {
			fieldSchema
				.clone()
				.attachTo(clone, fieldSchema.name)
			;
		});

		clone.validations = _.cloneDeep(this.validations);

		if (this.isArray) {
			clone.isArray = true;
		}

		if (this.isRequired) {
			clone.isRequired = true;
		}

		return clone;
	},

	/**
	 * add new required nested schema by construct
	 *
	 * @method
	 * @param {String} name - [required] - field name.
	 * @param {Array|String|Object|Function} validation - [optional] - validation options.
	 * @param {Function} nested - [optional] - builder function, has two functions in arguments [required, options].
	 * @param {Boolean} nestedTypeIsArray - [optional] - set type Array of current object of Schema.
	 * @return {Schema}
	 */
	required: function (name, validation, nested, nestedTypeIsArray) {
		return this.field(name, true, validation, nested, nestedTypeIsArray);
	},


	/**
	 * add new optional nested schema by construct
	 *
	 * @method
	 * @param {String} name - [required] - field name.
	 * @param {Array|String|Object|Function} validation - [optional] - validation options.
	 * @param {Function} nested - [optional] - builder function, has two functions in arguments [required, options].
	 * @param {Boolean} nestedTypeIsArray - [optional] - set type Array of current object of Schema.
	 * @return {Schema}
	 */
	optional: function (name, validation, nested, nestedTypeIsArray) {
		return this.field(name, false, validation, nested, nestedTypeIsArray);
	}
};



/**
 * Schema builder. return new Schema instance;
 *
 * @static
 * @param {Array|String|Object|Function} validation - [optional] - validation options.
 * @param {Function} nested - [optional] - builder function, has two functions in arguments [required, options].
 * @param {Boolean} nestedTypeIsArray - [optional] - set type Array of current object of Schema.
 * @return {Schema}
 */
Schema.build = function (validation, nested, nestedTypeIsArray) {
	return new Schema()
		.build(nested)
		.validate(validation)
		.typeArray(nestedTypeIsArray);
};

Schema.create = function (name, validation, nested, nestedTypeIsArray) {
	var schema = Schema.build(validation, nested, nestedTypeIsArray);
	return Schema.register(name, schema);
};

var register = {};

Schema.register = function (name, schema) {
	if (!_.isString(name)) {
		throw new TypeError('invalid name type, must be string');
	}

	if (!(schema instanceof Schema)) {
		throw new TypeError('invalid schema type, must be instance of Schema');
	}

	if (register.hasOwnProperty(name)) {
		throw new ReferenceError('schema "' + name + '" was already registered');
	}

	register[name] = schema;
	return schema;
};

Schema.get = function (name) {
	if (!_.isString(name)) {
		throw new TypeError('invalid name type, must be string');
	}

	if (!register.hasOwnProperty(name)) {
		throw new ReferenceError('schema "' + name + '" was not registered');
	}

	return register[name];
};

module.exports = Schema;
