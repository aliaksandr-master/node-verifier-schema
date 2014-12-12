"use strict";

var Schema = require('./index');
var extend = require('./lib/extend');
var path = require('path');
var _ = require('lodash');
var fs = require('fs');
var yaml = require('js-yaml');

var schemaLoader = module.exports = function (absFilePath, name) {
	if (!(_.isString(absFilePath) && absFilePath && fs.existsSync(absFilePath))) {
		throw new Error('invalid path "' + absFilePath + '"');
	}

	var ext = path.extname(absFilePath);
	var Loader = schemaLoader.map[ext];

	/** @type {LoaderJS} Loader */
	var schema = new Loader(absFilePath).load();

	if (name) {
		Schema.register(name, schema);
	}

	return schema;
};

/**
 * @class LoaderJS
 * @construct
 * @param {!String} filename
 * @this {LoaderYAML}
 *
 * */
var LoaderJS = function LoaderJS (filename) {
	this.filename = filename;
};
LoaderJS.prototype = {
	read: function read () {
		return require(this.filename);
	},

	toSchema: function toSchema (json) {
		return json;
	},

	load: function () {
		var data = this.read();
		return this.toSchema(data);
	}
};


/**
 * @class LoaderYAML
 * @extends LoaderJS
 * @construct
 * @param {!String} filename
 * @this {LoaderYAML}
 *
 * */
var LoaderYAML = extend(function LoaderYAML () {
	LoaderJS.apply(this, arguments);
}, LoaderJS);
_.extend(LoaderYAML.prototype, {
	_parseSchema: function (data) {
		var schema, inner;
		_.each(data, function (v, k) {
			if (schema) {
				return;
			}

			inner = v;
			schema = true;

			k.replace(/^schema(?:\(\s*([^\)'"]+)\s*\))?(\??)$/, function (w, name, hasOptionalFlag) {
				schema = new Schema(name || null);

				if (hasOptionalFlag) {
					schema.optional();
				}
			});
		});

		if (!(schema instanceof Schema)) {
			throw new Error('invalid format. schema declaration must be once');
		}

		return {
			inner: inner,
			schema: schema
		};
	},

	toSchema: function (data) {
		var obj = this._parseSchema(data);

		this._recursiveToSchema(obj.inner, obj.schema);

		return obj.schema;
	},

	_addField: function (fieldName, parent) {
		var name, isRequired = true, isArray = false;

		name = fieldName.replace(/^([^\[\?]+)(\[\])?(\?)?$/, function (w, nameStr, hasArrayFlag, hasOptionalFlag) {
			if (hasOptionalFlag) {
				isRequired = false;
			}

			if (hasArrayFlag) {
				isArray = true;
			}

			return nameStr;
		});

		if (!name) {
			throw new Error('invalid field name format. must match /^.+([])?\\??$/');
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

	_recursiveToSchema: function (inner, parentSchema) {
		var that = this;
		_.each(inner, function (v, k) {
			if (/^=+$/.test(k)) {
				parentSchema.validate(v);
				return;
			}

			var schema = that._addField(k, parentSchema);
			if (_.isArray(v)) {
				schema.validate(v);
				return;
			}

			that._recursiveToSchema(v, schema);
		});
	},

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
});

schemaLoader.LoaderJS = LoaderJS;
schemaLoader.LoaderYAML = LoaderYAML;

schemaLoader.map = {
	'.yaml': LoaderYAML,
	'.yml':  LoaderYAML,
	'.js':   LoaderJS
};