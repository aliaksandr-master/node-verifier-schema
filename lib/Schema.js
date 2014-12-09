"use strict";

var _ = require('lodash');
var async = require('async');

/**
 * Create instance of Schema
 *
 * @constructors
 * @this {Schema}
 * @class Schema
 * @return {Schema}
 */
function Schema () {
	if (!(this instanceof Schema)) {
		return new Schema();
	}
}

Schema.prototype = {
	/**
	 * attach schema to this object
	 *
	 * @method
	 * @param {Schema} schema - object for attach.
	 * @param {String} name - field name for attach.
	 * @throws {TypeError} If schema isn't Schema type
	 * @throws {TypeError} If name empty or isn't String type
	 * @return {Schema} @this
	 */
	attach: function (schema, name) {
		if (!(schema instanceof Schema)) {
			throw new TypeError('schema node must be instance of Schema');
		}

		schema.attachTo(this, name);

		schema = null;

		return this;
	},

	/**
	 * attach this object to schema
	 *
	 * @method
	 * @param {Schema} schema - attach destination object.
	 * @param {String} name - field name for attach.
	 * @throws {TypeError} If schema isn't Schema type
	 * @throws {TypeError} If name empty or isn't String type
	 * @throws {Error} If schema already has the same key name
	 * @return {Schema} @this
	 */
	attachTo: function (schema, name) {
		if (!(schema instanceof Schema)) {
			throw new TypeError('schema node must be instance of Schema');
		}

		if (!name || !_.isString(name)) {
			throw new TypeError('invalid scheme field name must be non-empty string, "' + name + '" ' + Object.prototype.toString.call(name) + ' given');
		}

		this.name = name;
		this.path = (schema.path || []).concat(name);

		schema._addField(this, name);

		schema = null;

		return this;
	},


	/**
	 * @private
	 * @param {Schema} schema - attach destination object.
	 * @param {String} name - field name for attach.
	 * @throws {Error} If schema already has the same key name
	 * @return {Schema} @this
	 */
	_addField: function (schema, name) {
		if (!this.keys) {
			this.keys = [];
		} else if (_.contains(this.keys, name)) {
			throw new Error('duplicate key "' + name + '" at "/' + (schema.path && schema.path.join('/')) + '"');
		}

		this.keys.push(name);

		if (!this.fields) {
			this.fields = [];
		}

		this.fields.push(schema);
		schema = null;

		return this;
	},

	/**
	 * @param {Boolean} isRequired - flag.
	 * @return {Schema} @this
	 */
	setRequired: function (isRequired) {
		this.isRequired = Boolean(isRequired);

		return this;
	},

	/**
	 * @param {Boolean} nestedTypeIsArray - flag.
	 * @return {Schema} @this
	 */
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
	 * @return {Schema} @this
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
	 * @param {Function} builder - builder function, has two functions in arguments [required, options].
	 * @throws {TypeError} If nested is not a function if specified
	 * @return {Schema} @this
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
	 * @param {Function|Schema} nested - [optional] - builder function, has two functions in arguments [required, options].
	 * @param {Boolean} nestedTypeIsArray - [optional] - set type Array of current object of Schema.
	 * @return {Schema} @this
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

	/**
	 * clone this schema
	 *
	 * @method
	 * @return {Schema} new object (clone)
	 */
	clone: function () {
		var clone = new Schema();

		_.each(this.fields, function (fieldSchema) {
			fieldSchema.clone().attachTo(clone, fieldSchema.name);
		});

		if (this.validations !== undefined) {
			clone.validations = _.cloneDeep(this.validations);
		}

		if (this.isArray !== undefined) {
			clone.isArray = this.isArray;
		}

		if (this.isRequired !== undefined) {
			clone.isRequired = this.isRequired;
		}

		return clone;
	},

	/**
	 * verify value. compare schema with some object.
	 *
	 * @private
	 * @method
	 * @param {*} value - [required] - value for check.
	 * @param {Object} options - [optional] - validation options, default is plain object.
	 * @param {Function} done - [required] - done-callback.
	 */
	verify: function (value, options, done) {
		if (_.isFunction(options)) {
			done = options;
			options = null;
		}

		options || (options = {});

		if (!_.isFunction(done)) {
			throw new Error('schema verify callback must be function, ' + (typeof done) + ' given');
		}

		var that = this;

		var _done = function (err) {
			if (err instanceof Schema.ValidationError) {
				done(null, false, err);
				return;
			}

			if (err) {
				done(err, false, null);
				return;
			}

			done(null, true, null);
		};

		if (value === undefined) {
			if (this.isRequired) {
				_done(new Schema.ValidationError('required', null, this.path, value));
				return;
			}

			_done();
			return;
		}

		var validations = this.validations;
		if (!_.isEmpty(validations)) {
			if (options.validator) {
				validations = options.validator(validations);
			}

			async.reduce(validations, null, function (info, validation, done) {
				validation(value, function (err, isValid, validationError) {
					validationError || (validationError = {});

					if (err) {
						done(err);
						return;
					}

					if (!isValid) {
						done(new Schema.ValidationError(validationError.ruleName, validationError.ruleParams, that.path, value));
						return;
					}

					done(null);
				});
			}, function (err) {
				if (err) {
					done(err);
					return;
				}

				that._validationInner(value, options, _done);
			});
			return;
		}

		that._validationInner(value, options, _done);
	},

	/**
	 * verify inner object
	 *
	 * @private
	 * @method
	 * @param {*} value - [required] - value for check
	 * @param {Object} options - [required] - validation options
	 * @param {Function} done - [required] - done-callback
	 */
	_validationInner: function (value, options, done) {
		var that = this;

		if (this.isArray) {
			if (!_.isArray(value)) {
				done(new Schema.ValidationError('type', 'array', this.path, value));
				return;
			}

			async.reduce(value, null, function (_1, value, done) {
				that._validateFields(value, options, done);
			}, done);

			return;
		}

		that._validateFields(value, options, done);
	},

	/**
	 * verify inner fields
	 *
	 * @private
	 * @method
	 * @param {*} value - [required] - value for check
	 * @param {Object} options - [required] - validation options
	 * @param {Function} done - [required] - done-callback
	 */
	_validateFields: function (value, options, done) {
		if (_.isEmpty(this.fields)) {
			done();
			return;
		}

		if (!_.isObject(value)) {
			done(new Schema.ValidationError('type', 'object', this.path, value));
			return;
		}

		var diff = _.difference(_.keys(value), this.keys);
		if (diff.length) {
			done(new Schema.ValidationError('unexpected_keys', null, this.path, value));
			return;
		}

		async.reduce(this.fields, null, function (_1, fieldSchema, done) {
			var fieldValue = value[fieldSchema.name];
			fieldSchema.verify(fieldValue, options, function (err, isValid, validationError) {
				err = err || validationError;
				if (err) {
					done(err);
					return;
				}

				if (isValid == null || isValid) {
					done();
					return;
				}

				done(new Schema.ValidationError(null, null, fieldSchema.path, fieldValue));
			});
		}, done);
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
 * @param {Function|Schema} nested - [optional] - builder function, has two functions in arguments [required, options].
 * @param {Boolean} nestedTypeIsArray - [optional] - set type Array of current object of Schema.
 * @return {Schema}
 */
Schema.build = function (validation, nested, nestedTypeIsArray) {
	return new Schema()
		.build(nested)
		.validate(validation)
		.typeArray(nestedTypeIsArray);
};



/**
 * Schema builder. return new Schema instance; register this schema
 *
 * @static
 * @param {String} name - [required] - name for register.
 * @param {Array|String|Object|Function} validation - [optional] - validation options.
 * @param {Function|Schema} nested - [optional] - builder function, has two functions in arguments [required, options].
 * @param {Boolean} nestedTypeIsArray - [optional] - set type Array of current object of Schema.
 * @return {Schema}
 */
Schema.create = function (name, validation, nested, nestedTypeIsArray) {
	var schema = Schema.build(validation, nested, nestedTypeIsArray);
	return Schema.register(name, schema);
};

var register = {};


/**
 * Schema register
 *
 * @static
 * @param {String} name - [required] - name for register.
 * @param {Schema} schema - [required] - schema for register
 * @throws {TypeError} If invalid name type
 * @throws {TypeError} If schema name type
 * @throws {ReferenceError} If schema was already registered
 * @return {Schema}
 */
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

/**
 * get registered schema
 *
 * @static
 * @param {String} name - [required] - name for register.
 * @throws {TypeError} If invalid name type
 * @throws {ReferenceError} If schema was not registered before
 * @return {Schema}
 */
Schema.get = function (name) {
	if (!_.isString(name)) {
		throw new TypeError('invalid name type, must be string');
	}

	if (!register.hasOwnProperty(name)) {
		throw new ReferenceError('schema "' + name + '" was not registered');
	}

	return register[name];
};

Schema.errorMessageMap = {};

Schema.ValidationError = function ValidationError (ruleName, ruleParams, path, value) {
	ruleName || (ruleName = 'unknown');
	path || (path = []);
	value = _.cloneDeep(value);

	var map = Schema.errorMessageMap[ruleName];

	var message = map ? map(ruleName, ruleParams, path, value) : 'invalid value ' + ruleName + ' in ' + path;
	Error.call(this, message);
	this.type = this.name = 'ValidationError';
	this.value = value;
	this.path = path;
	this.ruleName = ruleName;
	this.ruleParams = ruleParams;
};

require('util').inherits(Schema.ValidationError, Error);

module.exports = Schema;
