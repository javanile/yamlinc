/*!
 * Yamlinc: v0.2.0
 * Copyright(c) 2016-2019 Javanile
 * MIT Licensed
 */

const fs = require('fs')
    , cuid = require('cuid')

module.exports = {
    /**
     *
     */
    tag: null,

    /**
     * RegExp to match include tag into yaml code.
     *
     * @returns {RegExp}
     */
    setTag: function(tag) {
        this.tag = tag
    },

    /**
     *
     * @param file
     */
    getTagRegExp: function(file) {
        return this.tag.yamlRegExp
    },

    /**
     * Retrive file meta code.
     *
     * @param file input file to load
     * @returns {string} yaml meta code
     */
    parse: function (file) {
        let expr = this.getTagRegExp(file)
        let code = fs.readFileSync(file).toString()

        return code.replace(expr, (token) => {
            return token.replace(this.tag.name, this.tag.name + '_' + cuid())
        })
    }
}
