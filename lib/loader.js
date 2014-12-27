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
		if (!this.KEY_SCHEMA_REG_EXP.test(key)) {
			throw new Error('invalid schema key format. must be match with ' + this.KEY_SCHEMA_REG_EXP.source);
		}

		var schema = new Schema();

		key.replace(this.KEY_SCHEMA_REG_EXP, function (w, isArray, hasOptionalFlag) {
			if (isArray) {
				schema.array();
			}

			if (hasOptionalFlag) {
				schema.optional();
			}
		});

		return schema;
	},

	/**
	 * convert object (JSON) to Schema object
	 *
	 * @method
	 * @param {Object} data
	 * @returns {Schema}
	 */
	toSchema: function (data) {
		var schemaKey = _.keys(data)[0];

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
		var schema = new Schema();
		var name = fieldName.replace(this.KEY_FIELD_REG_EXP, function (w, nameStr, hasArrayFlag, hasOptionalFlag) {
			if (hasOptionalFlag) {
				schema.optional();
			}

			if (hasArrayFlag) {
				schema.array();
			}

			return nameStr;
		});

		return parent.field(name).like(schema);
	}
};

/**
 * load schema by absFilePath
 *
 * @function
 * @param {String} absFilePath - absolute file path (from root).
 * @param {String} [name] - name for register.
 * @returns {Object} JSON
 */
module.exports = function (absFilePath, name) {
	var fileContent = fs.readFileSync(absFilePath, 'utf8'),
		data = yaml.safeLoad(fileContent),
		schema = loader.toSchema(data);

	if (name) {
		Schema.register(name, schema);
	}

	return schema;
};
