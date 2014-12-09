"use strict";

var _ = require('lodash');
var iterate = require('./lib/iterate');

/**
 * Create instance of Schema
 *
 * @constructors
 * @this {Schema}
 * @class Schema
 * @param {string} [name] - register name
 * @return {Schema}
 */
function Schema (name) {
	if (!(this instanceof Schema)) {
		return new Schema(name);
	}

	if (name != null) {
		Schema.register(name, this);
	}

	this.isRequired = true;
}

Schema.prototype = {

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
		if (_.isString(schema)) {
			schema = Schema.get(schema);
		}

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
	 * @method
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

		this.hasNested = true;

		this.keys.push(name);

		if (!this.fields) {
			this.fields = [];
		}

		this.fields.push(schema);
		schema = null;

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
	 * @param {Function|Schema} builderOrSchema - builder function, has two functions in arguments [required, options].
	 * @throws {TypeError} If nested is not a function if specified
	 * @return {Schema} @this
	 */
	object: function (builderOrSchema) {
		if (this.hasNested) {
			throw new Error('object already defined');
		}

		if (builderOrSchema instanceof Schema) {
			return this._similar(builderOrSchema);
		}

		if (!_.isFunction(builderOrSchema)) {
			throw new TypeError('nested builder must be function');
		}

		builderOrSchema.call(this, this.required.bind(this), this.optional.bind(this));

		return this;
	},

	/**
	 * set nested fields builder with type array
	 *
	 * @method
	 * @param {Function|Schema|Boolean} builderOrSchema - builder function, has two functions in arguments [required, options].
	 * @throws {TypeError} If nested is not a function if specified
	 * @return {Schema} @this
	 */
	array: function (builderOrSchema) {
		if (_.isFunction(builderOrSchema) || builderOrSchema instanceof Schema) {
			this.object(builderOrSchema);
		}

		this.isArray = builderOrSchema == null ? true : Boolean(builderOrSchema);

		return this;
	},

	/**
	 * add new nested schema by construct
	 *
	 * @method
	 * @param {String} name - field name.
	 * @return {Schema} @this
	 */
	field: function (name) {
		return new Schema().attachTo(this, name);
	},

	/**
	 * clone this schema
	 *
	 * @method
	 * @return {Schema} new object (clone)
	 */
	clone: function () {
		var clone = new Schema()._similar(this);

		if (this.isArray != null) {
			clone.isArray = this.isArray;
		}

		if (this.isRequired != null) {
			clone.isRequired = this.isRequired;
		}

		return clone;
	},

	/**
	 * clone schema to this schema object
	 *
	 * @private
	 * @method
	 * @return {Schema} new object (clone)
	 */
	_similar: function (schema) {
		var that = this;

		_.each(schema.fields, function (fieldSchema) {
			fieldSchema.clone().attachTo(that, fieldSchema.name);
		});

		if (schema.validations != null) {
			this.validations = _.cloneDeep(schema.validations);
		}

		if (schema.isRequired != null) {
			this.isRequired = schema.isRequired;
		}

		return this;
	},

	/**
	 * verify value. compare schema with some object.
	 *
	 * @private
	 * @method
	 * @param {*} value - value for check.
	 * @param {Object} [options] - validation options, default is plain object.
	 * @param {Function} done - done-callback.
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

			iterate(validations, function (validation, index, done) {
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
	 * @param {*} value - value for check
	 * @param {Object} options - validation options
	 * @param {Function} done - done-callback
	 */
	_validationInner: function (value, options, done) {
		var that = this;

		if (Boolean(this.isArray) !== _.isArray(value)) {
			done(new Schema.ValidationError('type', this.isArray ? 'array' : 'object', this.path, value));
			return;
		}

		if (this.isArray) {
			iterate(value, function (value, index, done) {
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
	 * @param {*} value - value for check
	 * @param {Object} options - validation options
	 * @param {Function} done - done-callback
	 */
	_validateFields: function (value, options, done) {
		if (!this.hasNested) {
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

		iterate(this.fields, function (fieldSchema, index, done) {
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
	 * @param {String} [name] - field name.
	 * @param {*} [validation] - validation options.
	 * @return {Schema}
	 */
	required: function (name, validation) {
		if (!arguments.length) {
			this.isRequired = true;
			return this;
		}

		return this.field(name).validate(validation);
	},

	/**
	 * add new optional nested schema by construct
	 *
	 * @method
	 * @param {String} [name] - field name.
	 * @param {*} [validation] - validation options.
	 * @return {Schema}
	 */
	optional: function (name, validation) {
		if (!arguments.length) {
			this.isRequired = false;
			return this;
		}

		var schema = this.field(name).validate(validation);
		schema.isRequired = false;
		return schema;
	}
};

var register = {};

/**
 * Schema register
 *
 * @static
 * @param {String} name - name for register.
 * @param {Schema} schema - schema for register
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
 * @param {String} name - name for register.
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
Schema.errorMessage = function (ruleName, ruleParams, path, value) {
	var map = Schema.errorMessageMap[ruleName];
	return map ? map(ruleName, ruleParams, path, value) : 'invalid value ' + ruleName + ' in ' + path;
};

/**
 * Create instance of Schema.ValidationError. Error object for info about miss value
 *
 * @constructors
 * @this {Schema.ValidationError}
 * @class Schema.ValidationError
 * @param {string} ruleName - rule name, that failed
 * @param {*} ruleParams - params of rule, that failed
 * @param {Array|null} path -  schema path
 * @param {*} value - value, that failed
 * @return {Schema.ValidationError}
 */
Schema.ValidationError = function ValidationError (ruleName, ruleParams, path, value) {
	if (!(this instanceof ValidationError)) {
		return new Schema.ValidationError(ruleName, ruleParams, path, value);
	}

	ruleName || (ruleName = 'unknown');
	path || (path = []);
	value = _.cloneDeep(value);

	var message = Schema.errorMessage(ruleName, ruleParams, path, value);
	Error.call(this, message);
	this.message = message;
	this.type = this.name = 'ValidationError';
	this.value = value;
	this.path = path;
	this.ruleName = ruleName;
	this.ruleParams = ruleParams;
};

require('util').inherits(Schema.ValidationError, Error);

module.exports = Schema;
