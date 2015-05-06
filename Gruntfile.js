'use strict';

module.exports = require('grunto')(function (grunt) {

	grunt.registerTask('test', [
		'eslint:lib',
		'eslint:other',
		'nodeunit'
	]);

	return {
		eslint: {
			lib: [
				'lib/**/*.js'
			],
			other: [
				'**/*.js',
				'!lib/**/*.js',
				'!node_modules/**/*',
				'!lib-cov/**/*'
			]
		},
		nodeunit: {
			tests: [
				'tests/*.js'
			]
		}
	};
});
