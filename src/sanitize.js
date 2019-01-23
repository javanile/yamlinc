/*!
 * Yamlinc: v0.2.0
 * Copyright(c) 2016-2019 Javanile
 * MIT Licensed
 */

const values = require('object.values')
    , helpers = require('./helpers')

/**
 * Apply object recursive sanitize.
 *
 * @param data
 * @returns {*}
 */
module.exports = function sanitize(data) {
    if (helpers.isNotEmptyObject(data)) {
        for (let key in data) {
            if (helpers.isObjectizedArray(data[key])) {
                data[key] = values(data[key]);
                continue;
            }
            if (Array.isArray(data[key]) ) {
                for (let arrayKey in data[key] ) {
                    data[key][arrayKey] = sanitize(data[key][arrayKey]);
                }
            } else {
                data[key] = sanitize(data[key]);
            }
        }
    }

    return data;
}
