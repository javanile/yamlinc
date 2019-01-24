/*!
 * Yamlinc: v0.2.0
 * Copyright(c) 2016-2019 Javanile
 * MIT Licensed
 */

const fs = require('fs')
    , yamljs = require('js-yaml')
    , dirname = require('path').dirname
    , basename = require('path').basename
    , join = require('path').join
    , deepmerge = require('deepmerge')
    , sanitize = require('./sanitize')
    , metacode = require('./metacode')
    , helpers = require('./helpers')

module.exports = {

    /**
     *
     */
    tag: null,

    /**
     *
     */
    setTag: function(tag) {
        this.tag = tag
        metacode.setTag(tag)
    },

    /**
     * Load file and resolve all inclusion.
     *
     * @param file input file to resolve
     * @returns {string} yaml code
     */
    parse: function (file) {
        let code = metacode.parse(file),
            opts = {},
            data = ''

        try {
            if (this.schema) { opts.schema = this.schema }
            data = yamljs.safeLoad(code, opts);
        } catch (error) {
            helpers.error('Problem', `Error on file '${file}' ${error.message}`);
        }

        this.resolve(data, file)

        sanitize(data)

        return data
    },

    /**
     * Walk through array and find include tag.
     *
     * @param array  $yaml       reference of an array
     * @param string $includeTag tag to include file
     */
    resolve: function (data, file) {
        if (typeof data !== 'object') { return }

        let includes = {}
        let path = dirname(file)
        for (let key in data) {
            if (this.isMetaTag(key)) {
                if (typeof data[key] === 'string' && data[key]) {
                    includes = this.include(path, data[key], file, includes);
                } else if (typeof data[key] === 'object') {
                    for (let index in data[key]) {
                        includes = this.include(path, data[key][index], file, includes);
                    }
                }
                delete data[key];
                continue;
            }
            this.resolve(data[key], file);
        }

        if (helpers.isNotEmptyObjectOrArray(includes)) {
            data = Object.assign(data, deepmerge(data, includes));
        }

        return data;
    },

    /**
     *
     * @param file
     * @param includes
     * @returns {*}
     */
    include: function (path, name, current, includes) {
        let file = join(path, name)

        if (helpers.fileExists(file)) {
            helpers.info('Include', file)
            let include = this.parse(file)
            if (helpers.isNotEmptyObjectOrArray(include)) {
                includes = Object.assign(includes, deepmerge(includes, include));
            }
        } else {
            let code = fs.readFileSync(current).toString()
            let line = (code.substr(0, code.indexOf(name)).match(/\n/g) || []).length + 1;
            helpers.error('Problem', `File not found '${name}' on '${current}' at line ${line}.`);
        }

        return includes
    },

    /**
     * Check if object key match include tag.
     *
     * @param key
     * @param includeTag
     * @returns {Array|{index: number, input: string}|*}
     */
    isMetaTag: function (tag) {
        return tag.match(this.tag.metaRegExp);
    }
}
