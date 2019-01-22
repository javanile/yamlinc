/*!
 * Yamlinc: v0.2.0
 * Copyright(c) 2016-2019 Javanile
 * MIT Licensed
 */

/**
 * Apply object sanitize.
 *
 * @param data
 * @returns {*}
 */
recursiveSanitize: function(data) {
    if (!helpers.isNotEmptyObject(data)) { return data; }

    for (let key in data) {
        if (helpers.isObjectizedArray(data[key])) {
            data[key] = values(data[key]);
            continue;
        }

        if (Array.isArray(data[key]) ) {
            for( let arrKey in data[key] ) {
                data[key][arrKey] = this.recursiveSanitize( data[key][arrKey] );
            }
        } else {
            data[key] = this.recursiveSanitize(data[key]);
        }
    }

    return data;
},