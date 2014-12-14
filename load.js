"use strict";

var _ = require('lodash');
var path = require('path');
var fs = require('fs');
var yaml = require('js-yaml');
var Schema = require('./index');
var iterate = require('./lib/iterate');

/**
 * @class LoaderYAML
 * @construct
 * @param {!String} filename
 * @this {LoaderYAML}
 * */
var LoaderYAML = function LoaderYAML (filename) {
	this.filename = filename;
};
LoaderYAML.prototype = {
	/**
	 * load file adn convert to Schema type
	 * @method load
	 * @this {LoaderYAML}
	 * @returns {Schema}
	 */
	load: function () {
		var data = this.read();
		return this.toSchema(data);
	},

	KEY_FIELD_REG_EXP: /^([^\[\?]*)(\[])?(\?)?$/,

	KEY_SCHEMA_REG_EXP: /^schema(?:\(\s*([^\)'"]+)\s*\))?(\??)$/,

	/**
	 * parse schema hash key
	 *
	 * @method
	 * @private
	 * @this {LoaderYAML}
	 * @param {String} key
	 * @returns {Schema}
	 */
	_parseSchemaHashKey: function (key) {
		var schema;

		String(key).replace(this.KEY_SCHEMA_REG_EXP, function (w, name, hasOptionalFlag) {
			schema = new Schema(name || null);

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
	 * @this {LoaderYAML}
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
	 * @this {LoaderYAML}
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
	},

	/**
	 * read file
	 *
	 * @method
	 * @private
	 * @this {LoaderYAML}
	 * @returns {Object} JSON
	 */
	read: function () {
		var data = null;
		var fileContent = fs.readFileSync(this.filename, 'utf8');

		try {
			data = yaml.safeLoad(fileContent);
		} catch (e) {
			data = null;
			console.error(e);
			throw e;
		}

		return data;
	}
};

/**
 * load schema by absFilePath
 *
 * @function
 * @param {String} absFilePath - absolute file path (from root).
 * @param {String} [name] - name for register.
 * @trows {Error} If absFilePath will be invalid.
 * @this {LoaderYAML}
 * @returns {Object} JSON
 */
var schemaLoader = function (absFilePath, name) {
	if (
		!_.isString(absFilePath) ||
		!absFilePath ||
		!_.has(schemaLoader.map, path.extname(absFilePath)) ||
		!fs.existsSync(absFilePath)
	) {
		throw new Error('invalid path "' + absFilePath + '"');
	}

	var schema;
	var Loader = schemaLoader.map[path.extname(absFilePath)];
	if (!Loader) {
		schema = require(absFilePath);
	} else {
		schema = new Loader(absFilePath).load();
	}

	if (!(schema instanceof Schema)) {
		throw new Error('obtained schema is not instance of Schema');
	}

	if (name) {
		Schema.register(name, schema);
	}

	return schema;
};

/**
 * @static
 * */
schemaLoader.map = {
	'.yaml': LoaderYAML,
	'.yml':  LoaderYAML,
	'.js':   null
};

/**
 * @static
 * */
schemaLoader.LoaderYAML = LoaderYAML;


/**
 * @exports
 * */
module.exports = schemaLoader;