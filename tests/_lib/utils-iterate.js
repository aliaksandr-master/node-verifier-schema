"use strict";

module.exports = process.env.NODEVERIFIERSCHEMA_COV ? require('./../../lib-cov/utils/iterate') : require('./../../lib/utils/iterate');
