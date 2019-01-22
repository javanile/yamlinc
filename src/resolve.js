/*!
 * Yamlinc: v0.2.0
 * Copyright(c) 2016-2019 Javanile
 * MIT Licensed
 */

const fs = require('fs')
    , metacode = require('./metacode')

module.exports = {
    /**
     * Load file and resolve all inclusion.
     *
     * @param file input file to resolve
     * @returns {string} yaml code
     */
    resolve: function (file) {
        let base = dirname(file),
            code = metacode.parse(file),
            data = ''

        try {
            if (this.schema) {
                data = yamljs.safeLoad(code, {
                    schema: this.schema
                });
            }
            else {
                data = yamljs.safeLoad(code);
            }
        } catch (exception) {
            helpers.error('Problem', `Error on file '${file}' ${exception.message}`);
        }

        this.currentResolve = file;
        this.recursiveResolve(data, base);
        this.recursiveSanitize(data);

        return data;
    },


    /**
     * Walk through array and find include tag.
     *
     * @param array  $yaml       reference of an array
     * @param string $includeTag tag to include file
     */
    recursiveResolve: function (data, base) {
        if (typeof data !== 'object') {
            return;
        }

        let includes = {};
        for (let key in data) {
            if (this.isKeyMatchIncludeTag(key)) {
                if (typeof data[key] === "string" && data[key]) {
                    includes = this.recursiveInclude(base, data[key], includes);
                } else if (typeof data[key] === "object") {
                    for (let index in data[key]) {
                        includes = this.recursiveInclude(base, data[key][index], includes);
                    }
                }
                delete data[key];
                continue;
            }
            this.recursiveResolve(data[key], base);
        }

        if (helpers.isNotEmptyObject(includes)) {
            data = Object.assign(data, merge(data, includes));
        } else if (helpers.isNotEmptyArray(includes)) {
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
    recursiveInclude: function (base, file, includes) {
        if (helpers.fileExists(base + '/' + file)) {
            helpers.info('Include', file);

            let include = this.resolve(base + '/' + file);

            if (helpers.isNotEmptyObject(include)) {
                includes = Object.assign(includes, merge(includes, include));
            } else if (helpers.isNotEmptyArray(include)) {
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
}