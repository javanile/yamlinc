/*!
 * Yamlinc: v0.2.0
 * Copyright(c) 2016-2019 Javanile
 * MIT Licensed
 */

const fs = require('fs')
    , yamljs = require('js-yaml')
    , dirname = require('path').dirname
    , sanitize = require('./sanitize')
    , metacode = require('./metacode')
    , helpers = require('./helpers')

module.exports = {
    /**
     * Output file name.  Default: <inputFilePrefix>.inc.<inputFileSuffix>
     */
    current: null,

    /**
     *
     */
    setTag: function(tag) {
        metacode.setTag(tag)
    },

    /**
     * Load file and resolve all inclusion.
     *
     * @param file input file to resolve
     * @returns {string} yaml code
     */
    parse: function (file) {
        let path = dirname(file),
            code = metacode.parse(file),
            opts = {},
            data = ''

        try {
            if (this.schema) { opts.schema = this.schema }
            data = yamljs.safeLoad(code, opts);
        } catch (error) {
            helpers.error('Problem', `Error on file '${file}' ${error.message}`);
        }

        this.current = file;
        this.resolve(data, path);

        sanitize(data);

        return data;
    },

    /**
     * Walk through array and find include tag.
     *
     * @param array  $yaml       reference of an array
     * @param string $includeTag tag to include file
     */
    resolve: function (data, path) {
        if (typeof data !== 'object') {
            return;
        }

        let includes = {};
        for (let key in data) {
            if (this.isKeyMatchIncludeTag(key)) {
                if (typeof data[key] === "string" && data[key]) {
                    includes = this.include(path, data[key], includes);
                } else if (typeof data[key] === "object") {
                    for (let index in data[key]) {
                        includes = this.include(path, data[key][index], includes);
                    }
                }
                delete data[key];
                continue;
            }
            this.resolve(data[key], path);
        }

        if (helpers.isNotEmptyObjectOrArray(includes)) {
            data = Object.assign(data, merge(data, includes));
        }

        return data;
    },

    /**
     *
     * @param file
     * @param includes
     * @returns {*}
     */
    include: function (base, file, includes) {
        if (helpers.fileExists(base + '/' + file)) {
            helpers.info('Include', file);

            let include = this.resolve(base + '/' + file);

            if (helpers.isNotEmptyObjectOrArray(include)) {
                includes = Object.assign(includes, merge(includes, include));
            }

            return includes;
        }

        // Detect file not found on resolve file
        let code = fs.readFileSync(this.currentResolve).toString();
        let line = (code.substr(0, code.indexOf(file)).match(/\n/g) || []).length + 1;
        helpers.error('Problem', `file not found '${file}' on '${this.currentResolve}' at line ${line}.`);

        return includes;
    },

    /**
     * Check if object key match include tag.
     *
     * @param key
     * @param includeTag
     * @returns {Array|{index: number, input: string}|*}
     */
    isKeyMatchIncludeTag: function (key) {
        return key.match(new RegExp('^' + this.escapeTag + '_[a-z0-9]{25}$'));
    }
}
