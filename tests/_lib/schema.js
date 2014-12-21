"use strict";

module.exports = process.env.NODEVERIFIERSCHEMA_COV ? require('./../../lib-cov/schema') : require('./../../lib/schema');
