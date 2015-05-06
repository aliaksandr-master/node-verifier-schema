'use strict';

module.exports = process.env.NODEVERIFIERSCHEMA_COV ? require('./../../lib-cov/utils/extend') : require('./../../lib/utils/extend');
