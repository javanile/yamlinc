/*!
 * Yamlinc: v0.2.0
 * Copyright(c) 2016-2019 Javanile
 * MIT Licensed
 */

const fs = require('fs')
    , dirname = require('path').dirname
    , basename = require('path').basename
    , join = require('path').join
    , chokidar = require('chokidar')
    //, merge = require('deepmerge')
    , helpers = require('./helpers')

module.exports = {

    /**
     * Supported file extensions.
     */
    extensions: null,

    /**
     * RegExp to catch supported files.
     */
    inputFileRegExp: null,

    /**
     * Set supported extensions files.
     *
     * @param Array extensions
     */
    setExtensions: function(extensions) {
        this.extensions = extensions
        this.inputFileRegExp = new RegExp('\\.(' + extensions.join('|') + ')$', 'i')
    },

    /**
     * Get input file and incFile by cli arguments.
     *
     * @param args
     * @returns {{file: string, incFile: string}}
     */
    getFiles: function (args, output, absolute) {
        // Go in reverse since the filename is supposed to be last
        for (let index = args.length - 1; index >= 0; index--) {
            if (this.isInputFile(args, index)) {
                let file = args[index]
                args[index] = this.getOutputFile(file, output, absolute)
                return { input: file, output: args[index] }
            }
        }
    },

    /**
     * Check argument by index if is an input file.
     *
     * @param args
     * @param i
     * @returns {boolean}
     */
    isInputFile: function (args, i) {
        return args.hasOwnProperty(i)
            && args[i].charAt(0) !== '-'
            && args[i].match(this.inputFileRegExp);
    },

    /**
     * Get .inc.yml file base on input and output.
     *
     * @param file
     * @param absolute
     * @returns {void|string}
     */
    getOutputFile: function (file, output, absolute) {
        if (!!output) { return output }

        for (let index in this.extensions) {
            if (this.extensions.hasOwnProperty(index)) {
                let rule = new RegExp('\\.(' + this.extensions[index] + ')$', 'i')
                if (file.match(rule)) {
                    return (!!absolute ? file : basename(file)).replace(rule, '.inc.$1')
                }
            }
        }
    }
}
