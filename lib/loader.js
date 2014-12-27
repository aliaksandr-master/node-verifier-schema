"use strict";

var _ = require('lodash');
var fs = require('fs');
var yaml = require('js-yaml');
var Schema = require('./schema');
var iterate = require('./utils/iterate');

var loader = {

	KEY_FIELD_REG_EXP: /^([^\[\?]*)((?:\[])?)(\??)$/,

	KEY_SCHEMA_REG_EXP: /^schema((?:\[])?)(\??)$/,

	/**
	 * parse schema hash key
	 *
	 * @method
	 * @private
	 * @param {String} key
	 * @returns {Schema}
	 */
	_parseSchemaHashKey: function (key) {
		var schema;

		key.replace(this.KEY_SCHEMA_REG_EXP, function (w, isArray, hasOptionalFlag) {
			schema = new Schema();

			if (isArray) {
				schema.array();
			}

			if (hasOptionalFlag) {
				schema.optional();
			}
		});

		if (schema) {
			return schema;
		}

		throw new Error('invalid schema key format. must be match with ' + this.KEY_SCHEMA_REG_EXP.source);
	},

	/**
	 * convert object (JSON) to Schema object
	 *
	 * @method
	 * @param {Object} data
	 * @returns {Schema}
	 */
	toSchema: function (data) {
		if (!_.isObject(data)) {
			throw new Error('invalid parsed data object');
		}

		var schemaKey = null;
		// find first property
		for (var k in data) {
			if (data.hasOwnProperty(k)) {
				schemaKey = k;
				break;
			}
		}

		var mainSchema = this._parseSchemaHashKey(schemaKey);
		iterate.recursiveEach(data[schemaKey], mainSchema, function (v, k, schema) {
			if (/^=+$/.test(k)) {
				schema.validate(v);
				return;
			}

			schema = this._parseAndAddField(k, schema);
			if (_.isArray(v)) {
				schema.validate(v);
				return;
			}

			return schema;
		}, this);

		return mainSchema;
	},

	/**
	 * parse fieldKey to field schema.
	 * add field schema to parent schema
	 *
	 * @method
	 * @private
	 * @param {String} fieldName
	 * @param {Schema} parent
	 * @returns {Schema} child field schema
	 */
	_parseAndAddField: function (fieldName, parent) {
		var name, isRequired = true, isArray = false;

		name = fieldName.replace(this.KEY_FIELD_REG_EXP, function (w, nameStr, hasArrayFlag, hasOptionalFlag) {
			if (hasOptionalFlag) {
				isRequired = false;
			}

			if (hasArrayFlag) {
				isArray = true;
			}

			return nameStr;
		});

		if (!name) {
			throw new Error('invalid field name format. must match ' + this.KEY_FIELD_REG_EXP.source);
		}

		var schema = new Schema();
		if (!isRequired) {
			schema.optional();
		}

		if (isArray) {
			schema.array();
		}

		return schema.attachTo(parent, name);
	}
};

/**
 * load schema by absFilePath
 *
 * @function
 * @param {String} absFilePath - absolute file path (from root).
 * @param {String} [name] - name for register.
 * @trows {Error} If absFilePath will be invalid.
 * @returns {Object} JSON
 */
module.exports = function (absFilePath, name) {
	if (!_.isString(absFilePath) || !absFilePath) {
		throw new Error('invalid path "' + absFilePath + '"');
	}

	var fileContent = fs.readFileSync(absFilePath, 'utf8'),
		data = yaml.safeLoad(fileContent),
		schema = loader.toSchema(data);

	if (name) {
		Schema.register(name, schema);
	}

	return schema;
};
