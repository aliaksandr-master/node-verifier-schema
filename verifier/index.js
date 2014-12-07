"use strict";

var _ = require('lodash');
var async = require('async');

var patchInfoObject = require('./patch-info-object');
var finalDone = require('./final-done');
var ERROR_OBJECT = finalDone.ERROR_OBJECT;

var iterator = function (options, type, currentValue, currentPath, infoObjects, filteredValue) {
	return function (_1, schema, done) {
		var value = currentValue[schema.name];
		currentPath += '/' + schema.name;

		if (value === undefined) {
			if (type === 'required') {
				return done(ERROR_OBJECT, patchInfoObject(infoObjects, currentPath, schema, [{ name: 'required' }]));
			}

			return done(null, infoObjects);
		}

		var nestedDone = function (err, infoObjects) {
			if (err) {
				return done(err, infoObjects);
			}

			validateNested(options, schema, value, done, infoObjects);
		};

		if (schema.validation) {
			schema.validation(value, function (err, isValid, info) {
				err = err || (info.length ? ERROR_OBJECT : null);
				nestedDone(err, patchInfoObject(infoObjects, currentPath, schema, info));
			});

			return;
		}

		nestedDone(null, infoObjects);
	};
};

var validateNested = function (options, schema, currentValue, done, infoObjects, currentPath) {
	done = finalDone(done, infoObjects);

	//if (schema.validation) {
	//	schema.validation(currentValue, function (err, isValid, info) {
	//		err = err || (info.length || (isValid != null && !isValid) ? ERROR_OBJECT : null);
	//		done(err, patchInfoObject(infoObjects, currentPath, schema, info));
	//	});
	//	return;
	//}

	if (_.isArray(currentValue)) {
		async.reduce(
			_.map(currentValue, function (v, k) {
				return {
					value: v,
					index: k
				};
			}),
			null,
			function (_1, valueObj, done) {
				validateNested(options, schema, valueObj.value, done, infoObjects, currentPath + '/' + valueObj.index);
			},
			done
		);
		return;
	}

	if (_.difference(_.keys(currentValue), schema.names).length) {
		done(ERROR_OBJECT, patchInfoObject(infoObjects, currentPath, schema, [
			{
				name: 'excess_keys',
				value: _.cloneDeep(currentValue)
			}
		]));
		return;
	}

	if (!schema.hasNested) {
		done(null, infoObjects);
		return;
	}

	var each = [];

	if (!_.isEmpty(schema.optional)) {
		each.push('optional');
	}

	if (!_.isEmpty(schema.required)) {
		each.push('required');
	}

	async.reduce(
		each,
		null,
		function (_1, type, done) {
			async.reduce( schema[type], null, iterator(options, type, currentValue, currentPath, infoObjects), done);
		},
		done
	);
};

module.exports = function (options, schema) {
	if (schema == null || !_.isObject(schema)) {
		throw new Error('schema is not specified');
	}

	return function (value, done) {
		validateNested(options, schema, value, done, [], '', _.isArray(value) ? [] : {});
	};
};
