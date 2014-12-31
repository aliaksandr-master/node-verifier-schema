"use strict";

var _ = require('lodash');
var iterate = require('./utils/iterate');
var extend = require('./utils/extend');
var Verifier = require('node-verifier');

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

Schema.extend = extend.method;

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
	 * compile the verifier
	 *
	 * @method
	 * @this {Schema}
	 * @returns {Schema.SchemaVerifier}
	 * */
	verifier: function (options) {
		return new Schema.SchemaVerifier(this, options);
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
	},

	constructor: Schema
};


var SchemaVerifier = function SchemaVerifier (schema, options) {
	this.options = _.extend({
		ignoreExcess: false
	}, options);

	this.schema = this._compileSchema(schema);
};

SchemaVerifier.prototype = {

	_compileSchema: function (schema) {
		var options = this.options;
		return new Schema().like(schema, function (schema) {
			var validations = _.cloneDeep(schema.validations || []),
				objectRules = [ 'type object' ],
				arrayRules  = [ 'type array' ];

			this.isArray = schema.isArray;

			if (schema.fields) {
				if (!options.ignoreExcess) {
					objectRules.push({ available_fields: _.keys(schema.fields) });
				}

				arrayRules.push({each: objectRules});
			}

			if (schema.isArray) {
				validations.unshift.apply(validations, arrayRules);
			} else if (schema.fields) {
				validations.unshift.apply(validations, objectRules);
			}

			if (schema.isRequired) {
				validations.unshift('required');
			} else {
				validations = {
					any: [ 'type undefined', validations ]
				};
			}

			this.verifierObject = new Verifier(validations);
		});
	},

	_verifySchema: function (schema, value, path, done) {
		var that = this;

		done = this._wrapDone(done, value, path);

		schema.verifierObject.verify(value, function (err) {
			if (err) {
				done(err);
				return;
			}

			if (schema.isArray) {
				iterate.array(value, function (obj, index, done) {
					var objPath = path + SEP + index;
					that._verifyObject(schema, obj, objPath, done);
				}, done);
				return;
			}

			that._verifyObject(schema, value, path, done);
		});
	},

	_verifyObject: function (schema, value, path, done) {
		var that = this;

		iterate.object(schema.fields, function (schema, key, done) {
			that._verifySchema(schema, value[key], path + SEP + key, done);
		}, that._wrapDone(done, value, path));
	},

	_wrapDone: function (done, value, path) {
		return function (err) {
			if (err instanceof Schema.ValidationError && !_.has(err, 'value')) {
				err.value = _.cloneDeep(value);

				if (_.isNumber(err.index)) {
					path = path + SEP + err.index;
				}

				err.path = path.length ? path.replace(SEP_EXP_FIRST, '').split(SEP) : [];

				delete err.index;
			}

			return done(err);
		};
	},

	verify: function (value, done) {
		this._verifySchema(this.schema, value, '', done);
	}
};

SchemaVerifier.extend = extend.method;

Schema.Verifier = Verifier;
Schema.SchemaVerifier = SchemaVerifier;

Schema.utils = {
	extend: extend,
	iterate: iterate
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
Schema.ValidationError = Verifier.ValidationError;

module.exports = Schema;
