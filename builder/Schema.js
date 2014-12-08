"use strict";

var _ = require('lodash');

/**
 * Create instance of Schema
 *
 * @constructor
 * @this {Schema}
 * @class Schema
 * @param {string} name - field name, optional.
 * @param {Schema} parentNode - .
 * @param {object} options - hash of options { separator: '/', validator: function (validate) { return validate; } }.
 * @throws {TypeError} If parent node hasn't Schema type
 * @throws {Error} If name not specified, when parent node pass as arguments
 * @throws {TypeError} If is not string type
 * @return {Schema}
 */
function Schema (name, parent, options) {
	if (!(this instanceof Schema)) {
		return new Schema(name, parent, options);
	}

	this._options = _.extend({}, Schema.options, options);

	if (parent) {
		if (!(parent instanceof Schema)) {
			throw new TypeError('parent node must be instance of Schema');
		}

		if (!name) {
			throw new Error('scheme field name must be specified');
		}

		if (!_.isString(name)) {
			throw new TypeError('scheme field name must be string, "' + Object.prototype.toString.call(name) + '" given');
		}
	}

	if (parent) {
		if (parent.name) {
			this.path = (parent.path || []).concat(parent.name);
		}
	}

	if (name != null) {
		this.name = name || '';
	}
}

Schema.prototype = {
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

			this.validations.push(this._options.validator ? this._options.validator(validation) : validation);
		}

		return this;
	},

	/**
	 * set nested fields builder
	 *
	 * @method
	 * @param {Function} nested - builder function, has two functions in arguments [required, options].
	 * @param {Boolean} nestedTypeIsArray - set type Array of current object of Schema.
	 * @throws {TypeError} If nested is not a function if specified
	 * @return {Schema}
	 */
	nested: function (nested, nestedTypeIsArray) {
		if (nested) {
			if (!_.isFunction(nested)) {
				throw new TypeError('nested builder must be function');
			}

			nested.call(this, this.required.bind(this), this.optional.bind(this));
		}

		if (nestedTypeIsArray) {
			this.isArray = true;
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
		var schema = new Schema(name, this, this._options);

		this._addNestedSchema(schema, name, isRequired);

		schema.validate(validation).nested(nested, nestedTypeIsArray);

		return schema;
	},

	_addNestedSchema: function (schema, name, isRequired) {
		if (isRequired || isRequired == null) {
			schema.isRequired = true;
		}

		if (!this.keys) {
			this.keys = [];
		} else if (_.contains(this.keys, schema.name)) {
			throw new Error('duplicate key "' + schema.name + '" in schema (path: "' + this.path + '")');
		}

		this.keys.push(schema.name);

		if (!this.fields) {
			this.fields = [];
		}

		this.fields.push(schema);
	},

	schema: function (name, isRequired, validation, schema) {
		if (_.isString(schema)) {
			schema = Schema.get(schema);
		}

		if (!(schema instanceof Schema)) {
			throw new TypeError('argument must be instance of Schema');
		}

		var recursiveIterate = function (schema, parent) {
			var _schema = new Schema(schema.name, parent, parent.options);

			if (schema.validations) {
				_schema.validations = _.clone(schema.validations);
			}

			if (schema.keys) {
				_schema.keys = _.clone(schema.keys);
			}

			if (schema.isRequired) {
				_schema.isRequired = true;
			}

			_.each(schema.fields, function (field) {
				field = recursiveIterate(field, _schema);
				_schema._addNestedSchema(field, field.name, field.isRequired);
			});

			return _schema;
		};

		var _schema = recursiveIterate(schema, this);

		_schema.validate(validation);

		this._addNestedSchema(_schema, name, isRequired);
	},

	//clean: function () {
	//	_.each(this.fields, function (schema) {
	//		schema.clean();
	//	});
	//
	//	return this;
	//},

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
 * @param {Boolean} nestedTypeArray - [optional] - set type Array of current object of Schema.
 * @param {Object} options - [optional] - options of schema creation
 * @return {Schema}
 */
Schema.build = function (validation, nested, nestedTypeArray, options) {
	var schema = new Schema(null, null, options);
	schema.validate(validation);
	schema.nested(nested, nestedTypeArray);
	//schema.clean();

	console.log(require('util').inspect(schema, { depth: null, colors: true }));
	return schema;
};

Schema.options = {
	separator: '/',
	validator: null
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
