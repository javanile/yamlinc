/*!
 * Yamlinc: v0.2.0
 * Copyright(c) 2016-2019 Javanile
 * MIT Licensed
 */

/**
 * Build tag .
 *
 * @param data
 * @returns {*}
 */
module.exports = (tag) => {
    let escaped = tag.replace(/\$/, '\\$')

    return {
        name: tag,
        escaped: escaped,
        yamlRegExp: new RegExp('^[ \\t]*' + escaped + '[ \\t]*:', 'gmi')
    }
}
