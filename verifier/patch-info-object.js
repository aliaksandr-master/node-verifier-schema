"use strict";
var _ = require('lodash');

module.exports = function (infoObjects, currentPath, schema, ruleErrors) {
	_.each(ruleErrors, function (ruleError) {
		infoObjects.push({
			name: schema.name,
			path: currentPath,
			rule: _.pick(ruleError, ['name', 'params', 'iteration'])
		});
	});

	return infoObjects;
};