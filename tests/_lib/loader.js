"use strict";

module.exports = process.env.NODEVERIFIERSCHEMA_COV ? require('./../../lib-cov/loader') : require('./../../lib/loader');
