"use strict";

var _ = require('lodash');
var iterate = require('./utils/iterate');
var extend = require('./utils/extend');

/**
 * @callback processFunction
 * @param {Schema} - schema for clone
 * @this {Schema} - this schema
 * @this {Schema}
 * */

/**
 * @callback builderFunction
 * @param {Schema#required} - schema for clone
 * @param {Schema#optional} - schema for clone
 * @this {Schema} - this schema
 * @this {Schema}
 * */

/**
 * @callback verifyCallback
 * @param {?Error} error
 * @param {Boolean} isValid
 * @param {?Schema.ValidationResultError} validationError
 * */

/**
 * @callback verifierDone
 * @param {?Error|Boolean|Schema.ValidationError|Schema.ValidationResultError} error - to interrupt validation stream (plain true), or value validation error, or Error of logic
 * */

/**
 * @callback validator
 * @param {array} validations - validations of this schema
 * @returns {validation}
 * */

/**
 * @callback verifierCallback
 * @param {*} value
 * @param {userValidationDone} done
 * */

/**
 * @callback validation
 * @param {*} value
 * @param {Object} options
 * @param {userValidationDone} done
 * */

/**
 * @callback userValidationDone
 * @param {?Error|Schema.ValidationError|Boolean} err
 * @param {?Boolean} isValid=true
 * @param {?Schema.ValidationError}
 * */

var SEP = '/';
var SEP_EXP_FIRST = /^\//;

/**
 * Create instance of Schema
 *
 * @constructor
 * @this {Schema}
 * @class Schema
 * @param {string} [name] - register name
 * @property {Boolean} isRequired=true
 * @property {?Boolean} isArray=false
 * @property {?Object} fields=undefined
 * @property {?Array} validations=[]
 * @returns {Schema}
 */
function Schema (name) {
	if (!(this instanceof Schema)) {
		return new Schema(name);
	}

	if (name != null) {
		Schema.register(name, this);
	}
}

Schema.prototype = {

	/**
	 * set validate options. can be called several times
	 *
	 * @method
	 * @this {Schema}
	 * @param {*} validations - validation options.
	 * @returns {Schema} @this
	 */
	validate: function (validations) {
		if (!validations) {
			return this;
		}

		if (!this.validations) {
			this.validations = [];
		}

		var that = this;
		_.isArray(validations) || (validations = [validations]);

		_.each(validations, function (validation) {
			that.validations.push(validation);
		});

		return this;
	},

	/**
	 * set nested fields builder
	 *
	 * @method
	 * @this {Schema}
	 * @param {builderFunction} builder - builder function.
	 * @returns {Schema} @this
	 */
	object: function (builder) {
		builder.call(this, this.required.bind(this), this.optional.bind(this));
		this.array(false);

		return this;
	},

	/**
	 * set nested fields builder with type array
	 *
	 * @method
	 * @this {Schema}
	 * @param {?Boolean} [flagOrBuilder]
	 * @throws {TypeError} If nested is not a function if specified
	 * @returns {Schema} @this
	 */
	array: function (flagOrBuilder) {
		if (_.isFunction(flagOrBuilder)) {
			this.object(flagOrBuilder);
		}

		if (flagOrBuilder == null || flagOrBuilder) {
			this.isArray = true;
		} else {
			delete this.isArray;
		}

		return this;
	},

	isArray: false,

	/**
	 * add new nested schema with construct
	 *
	 * @method
	 * @this {Schema}
	 * @param {String} fieldName
	 * @returns {Schema}
	 */
	field: function (fieldName) {
		if (!this.fields) {
			this.fields = {};
		}

		var schema = new Schema();

		this.fields[fieldName] = schema;

		return schema;
	},

	/**
	 * clone this schema
	 *
	 * @method
	 * @this {Schema}
	 * @returns {Schema} new object (clone)
	 */
	clone: function () {
		return new Schema().like(this);
	},

	/**
	 * clone schema to this schema object
	 *
	 * @method
	 * @this {Schema}
	 * @param {Schema} schema
	 * @param {processFunction} [process]
	 * @returns {Schema} new object (clone)
	 */
	like: function (schema, process) {
		var that = this;

		if (!(schema instanceof Schema)) {
			throw new Error('first argument must be instance of Schema');
		}

		if (process) {
			var r = process.call(this, schema);

			if (r != null && !r) {
				return this;
			}
		}

		_.each(schema.fields, function (fieldSchema, fieldName) {
			that.field(fieldName).like(fieldSchema, process);
		});

		if (process) {
			return this;
		}

		_.each(schema, function (value, key) {
			if (/^(_.*|fields)$/.test(key)) {
				return;
			}

			that[key] = _.cloneDeep(value);
		});

		return this;
	},

	/**
	 * clone schema to this schema object
	 *
	 * @private
	 * @method
	 * @this {Schema}
	 * @param {function} validator
	 * @param {Object} options
	 * @returns {Schema} this object
	 */
	_compile: function (validator, options) {
		_.each(this.fields, function (fieldSchema) {
			fieldSchema._compile(validator, options);
		});

		var validations = validator(_.cloneDeep(this.validations), options);
		if (validations != null) {
			if (_.isFunction(validations)) {
				validations = [validations];
			}

			if (!_.isArray(validations)) {
				throw new Error('invalid validation rule type after user-validator mapping');
			}

			this.validations = validations;
		}

		return this;
	},

	/**
	 * verify value. compare schema with some object.
	 *
	 * @method
	 * @this {Schema}
	 * @param {*} value - value to check.
	 * @param {?Object} [options] - validation options, default is plain object.
	 * @param {?validator} [options.validator] - custom validation mapper
	 * @param {verifyCallback} done - done-callback.
	 * */
	verify: function (value, options, done) {
		if (_.isFunction(options)) {
			var opt = done;
			done = options;
			options = opt;
			opt = null;
		}

		Schema.verify(this, value, done, options);
	},

	/**
	 * compile the verifier
	 *
	 * @method
	 * @this {Schema}
	 * @param {!validator} validator - custom validation mapper
	 * @param {?Object} [options] - validation options, default is plain object.
	 * @returns {verifierCallback}
	 * */
	compile: function (validator, options) {
		options || (options = {});
		var schema = this.clone()._compile(validator, options);

		return function (value, done) {
			return schema.verify(value, options, done);
		};
	},

	/**
	 * add new required nested schema by construct
	 *
	 * @method
	 * @this {Schema}
	 * @param {?String} [name] - field name.
	 * @param {?*} [validation] - validation options.
	 * @returns {Schema}
	 */
	required: function (name, validation) {
		if (name == null && validation == null) {
			delete this.isRequired;
			return this;
		}

		return this.field(name).validate(validation);
	},

	isRequired: true,

	/**
	 * add new optional nested schema by construct
	 *
	 * @method
	 * @this {Schema}
	 * @param {?String} [name] - field name.
	 * @param {?*} [validation] - validation options.
	 * @returns {Schema}
	 */
	optional: function (name, validation) {
		if (name == null && validation == null) {
			this.isRequired = false;
			return this;
		}

		return this.field(name).validate(validation).optional();
	}
};


/**
 * verify value. compare schema with some object.
 *
 * @static
 * @method
 * @param {!Schema} schema to validate.
 * @param {*} value - value to check.
 * @param {!verifyCallback} done - done-callback.
 * @param {?Object} [options] - validation options, default is plain object.
 * @param {validator} [options.validator] - custom validation mapper
 * @param {Boolean} [options.ignoreExcess] - ignore excess fields
 */
Schema.verify = function (schema, value, done, options) {
	options || (options = {});

	if (!(schema instanceof Schema) || !_.isFunction(done)) {
		throw new TypeError('invalid signature: first argument must be instance of Schema. callback must be function');
	}

	Schema.verifier.verifySchema(schema, value, options, '', function (err) {
		err = err === true ? null : err;

		if (err instanceof Schema.ValidationResultError) {
			done(null, false, err);
			return;
		}

		if (err) {
			done(err, false, null);
			return;
		}

		done(null, true, null);
	});
};

/**
 * @namespace
 * @static
 * */
Schema.verifier = {
	/**
	 * verify object
	 *
	 * @method
	 * @param {Schema} schema to validate.
	 * @param {*} value - value to check
	 * @param {Object} options - validation options
	 * @param {verifierDone} done - done-callback
	 */
	verifySchema: function (schema, value, options, path, done) {
		var that = this;

		iterate.array([
			this.checkRequired,
			this.checkIsArray,
			this.checkValidations,
			this.checkObject
		], function (method, _2, done) {
			method.call(that, schema, value, options, path, done);
		}, this._doneWrap(done));
	},

	/**
	 * check isRequired flag with value
	 *
	 * @method
	 * @param {Schema} schema to validate.
	 * @param {*} value - value to check
	 * @param {Object} options - validation options
	 * @param {verifierDone} done - done-callback
	 */
	checkRequired: function (schema, value, options, path, done) {
		if (value !== undefined) {
			done();
			return;
		}

		if (schema.isRequired) {
			done(new Schema.ValidationResultError('required', true, value, null, path));
			return;
		}

		done(true);
	},


	/**
	 * check self validation of value
	 *
	 * @method
	 * @param {Schema} schema to validate.
	 * @param {*} value - value to check
	 * @param {Object} options - validation options
	 * @param {verifierDone} done - done-callback
	 */
	checkValidations: function (schema, value, options, path, done) {
		this.validationCall(schema, schema.validations, value, options, path, done);
	},

	/**
	 * check validation of value
	 *
	 * @method
	 * @param {Schema} schema
	 * @param {?Array} validations.
	 * @param {*} value
	 * @param {Object} options
	 * @param {verifierDone} done - done-callback
	 */
	validationCall: function (schema, validations, value, options, path, done) {
		if (_.isEmpty(validations)) {
			done();
			return;
		}

		if (options.validator) {
			validations = options.validator(validations, options);
			if (_.isFunction(validations)) {
				validations = [validations];
			}

			if (!_.isArray(validations)) {
				done(new Error('invalid validation rule type after user-validator mapping'));
				return;
			}
		}

		iterate.array(validations, function (validation, index, done) {
			validation(value, function (err, isValid, validationError) {
				if (err) {
					if (err instanceof Schema.ValidationError) {
						err = new Schema.ValidationResultError(err.rule, err.params, value, err.index, path);
					}
					done(err);
					return;
				}

				if (isValid == null || isValid) {
					done();
					return;
				}

				validationError || (validationError = {});
				done(new Schema.ValidationResultError(validationError.rule, validationError.params, value, null, path));
			});
		}, done);
	},

	/**
	 * verify inner object
	 *
	 * @method
	 * @param {Schema} schema to validate.
	 * @param {*} value - value to check
	 * @param {Object} options - validation options
	 * @param {verifierDone} done - done-callback
	 */
	checkObject: function (schema, value, options, path, done) {
		var that = this;

		if (!schema.isArray) {
			this.validateFields(schema, value, options, path, done);
			return;
		}

		iterate.array(value, function (value, index, done) {
			that.validateFields(schema, value, options, path+SEP+index, done);
		}, done);
	},

	/**
	 * check is array flag
	 *
	 * @method
	 * @param {Schema} schema to validate.
	 * @param {*} value - value to check
	 * @param {Object} options - validation options
	 * @param {verifierDone} done - done-callback
	 */
	checkIsArray: function (schema, value, options, path, done) {
		if (Boolean(schema.isArray) === _.isArray(value)) {
			done();
			return;
		}

		done(new Schema.ValidationResultError('type', schema.isArray ? 'array' : 'object', value, null, path));
	},

	/**
	 * verify inner fields
	 *
	 * @method
	 * @param {Schema} schema to validate.
	 * @param {*} value - value to check
	 * @param {Object} options - validation options
	 * @param {verifierDone} done - done-callback
	 */
	validateFields: function (schema, value, options, path, done) {
		var that = this;
		iterate.array([
			this.checkFieldsExists,
			this.checkExcessFields,
			this.checkNestedFields
		], function (method, _2, done) {
			method.call(that, schema, value, options, path, done);
		}, this._doneWrap(done));
	},

	_doneWrap: function (done) {
		return function (err) {
			if (err === true) {
				done();
				return;
			}

			done(err);
		};
	},

	/**
	 * check nested fields
	 *
	 * @method
	 * @param {Schema} schema to validate.
	 * @param {*} value - value to check
	 * @param {Object} options - validation options
	 * @param {verifierDone} done - done-callback
	 */
	checkNestedFields: function (schema, value, options, path, done) {
		var that = this;
		iterate.object(schema.fields, function (fieldSchema, name, done) {
			that.verifySchema(fieldSchema, value[name], options, path+SEP+name, done);
		}, done);
	},

	/**
	 * check exists of fields and correct data type
	 *
	 * @method
	 * @param {Schema} schema to validate.
	 * @param {*} value - value to check
	 * @param {Object} options - validation options
	 * @param {verifierDone} done - done-callback
	 */
	checkFieldsExists: function (schema, value, options, path, done) {
		if (!schema.fields) {
			done(true);
			return;
		}

		if (_.isObject(value)) {
			done();
			return;
		}

		done(new Schema.ValidationResultError('type', 'object', value, null, path));
	},

	/**
	 * find the excess fields, that not defined
	 *
	 * @method
	 * @param {Schema} schema to validate.
	 * @param {*} value - value to check
	 * @param {Object} options - validation options
	 * @param {verifierDone} done - done-callback
	 */
	checkExcessFields: function (schema, value, options, path, done) {
		if (options.ignoreExcess) {
			done();
			return;
		}

		var hasExcessFields = _.any(value, function (v, k) {
			return !_.has(schema.fields, k);
		});

		if (!hasExcessFields) {
			done();
			return;
		}

		done(new Schema.ValidationResultError('available_fields', _.keys(schema.fields), value, null, path));
	}
};

var register = {};

/**
 * Schema register
 *
 * @static
 * @param {!String} name - name to register.
 * @param {!Schema} schema - schema for register
 * @throws {TypeError} If invalid name type
 * @throws {TypeError} If schema name type
 * @throws {ReferenceError} If schema was already registered
 * @returns {Schema}
 */
Schema.register = function (name, schema) {
	if (!name || !_.isString(name)) {
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
 * @param {String} name - name to register.
 * @param {?Boolean} [strict=true] - strict mode (throw ReferenceError)
 * @throws {TypeError} If invalid name type
 * @throws {ReferenceError} If schema was not registered before
 * @returns {Schema}
 */
Schema.get = function (name, strict) {
	if (!name || !_.isString(name)) {
		throw new TypeError('invalid name type, must be string');
	}

	if ((strict == null || strict) && !register.hasOwnProperty(name)) {
		throw new ReferenceError('schema "' + name + '" was not registered');
	}

	return register[name];
};

/**
 * Create instance of Schema.ValidationError. Error object for info about miss value
 *
 * @constructor
 * @static
 * @extends Error
 * @this {Schema.ValidationError}
 * @class Schema.ValidationError
 * @param {string} rule - rule name, that failed
 * @param {*} params - params of rule, that failed
 * @param {?Number} [index=null] - index of array, default null
 * @property {String} name
 * @property {?Number} index
 * @property {String} rule
 * @property {*} params
 * @returns {Schema.ValidationError}
 */
Schema.ValidationError = function ValidationError (rule, params, index) {
	if (!(this instanceof Schema.ValidationError)) {
		return new Schema.ValidationError(rule, params, index);
	}

	if (!rule || !_.isString(rule)) {
		throw new TypeError('invalid rule name, must be non-empty string');
	}

	rule || (rule = 'unknown');
	this.rule = rule;
	this.params = params;
	this.index = index;
	this.name = 'ValidationError';
	Error.call(this);

	return this;
};
extend(Schema.ValidationError, Error);

/**
 * Create instance of Schema.ValidationError. Error object for info about failed value
 *
 * @constructor
 * @static
 * @extends Schema.ValidationError
 * @this {Schema.ValidationResultError}
 * @class Schema.ValidationResultError
 * @param {String} rule - name of the failed rule
 * @param {?*} params - params of the failed rule
 * @param {*} value - value that failed
 * @param {?Number} [index=null] - index of array, default null
 * @param {?String} path -  schema path
 * @property {String} name
 * @property {String} rule
 * @property {?Number} index
 * @property {*} params - clone
 * @property {*} value - clone
 * @property {?Array} path
 * @returns {Schema.ValidationResultError}
 */
Schema.ValidationResultError = function ValidationResultError (rule, params, value, index, path) {
	if (!(this instanceof Schema.ValidationResultError)) {
		return new Schema.ValidationResultError(rule, params, value, index, path);
	}

	index = _.isNumber(index) && !_.isNaN(index) ? index : null;
	if (index != null && _.isArray(value)) {
		value = value[index];
	}

	value = _.cloneDeep(value);
	params = _.cloneDeep(params);

	var pathArray;
	if (_.isString(path) && path.length) {
		if (index != null) {
			path += SEP + index;
		}
		pathArray = path.replace(SEP_EXP_FIRST, '').split(SEP);
	} else {
		pathArray = [];
	}

	Schema.ValidationError.call(this, rule, params);
	this.name = 'ValidationResultError';
	this.value = value;
	this.index = index;
	this.path = pathArray;

	return this;
};
extend(Schema.ValidationResultError, Schema.ValidationError);

module.exports = Schema;
