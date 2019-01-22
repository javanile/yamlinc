/*!
 * Yamlinc: v0.2.0
 * Copyright(c) 2016-2019 Javanile
 * MIT Licensed
 */

const fs = require('fs')
    , cuid = require('cuid')

module.exports = {
    /**
     * RegExp to match include tag into yaml code.
     *
     * @returns {RegExp}
     */
    getRegExpIncludeTag: function () {
        return new RegExp('^[ \\t]*' + this.escapeTag + '[ \\t]*:', 'gmi');
    },

    /**
     * Retrive file meta code.
     *
     * @param file input file to load
     * @returns {string} yaml meta code
     */
    parse: function (file, tag) {
        let code = fs.readFileSync(file).toString(),
            expr = this.getRegExpIncludeTag(file, includeTag)

        return code.replace(expr, (token) => token.replace(tag, tag + '_' + cuid()))
    }
}
