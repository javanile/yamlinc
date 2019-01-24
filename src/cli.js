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
     * RegExp to catch supported files.
     */
    inputFileRegExp: null,

    /**
     * Set supported extensions files.
     *
     * @param Array extensions
     */
    setExtensions: function(extensions) {
        this.inputFileRegExp = new RegExp('\\.(' + extensions.join('|') + ')$', 'i')
    },

    /**
     * Get input file to parse inside command-line arguments.
     *
     * @param args
     * @returns {*}
     */
    getInputFile: function (args) {
        // Go in reverse since the filename is supposed to be last
        for (let index = args.length - 1; index >= 0; index--) {

            if (this.isInputFile(args, index)) {
                let file = args[index];
                args.splice(index, 1);
                return file;
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
     * Get input file and incFile by cli arguments.
     *
     * @param args
     * @returns {{file: string, incFile: string}}
     */
    getFiles: function (args, absolute) {
        for (let index in args) {
            console.log(args[index]);
            if (this.isInputFile(args, index)) {
                let file = args[index];
                args[index] = this.getOutputFile(file, absolute);
                return {input: file, output: args[index]};
            }
        }
    },

    /**
     * Get .inc.yml file base on input.
     *
     * @param file
     * @param absolute
     * @returns {void|string}
     */
    getOutputFile: function (file, absolute) {
        if (this.outputMode === 'STDOUT') {
            return ''
        }
        if (!!this.outputFileName) {
            return this.outputFileName
        }

        for (let i in this.extensions) {
            if (this.extensions.hasOwnProperty(i)) {
                let rule = new RegExp('\\.(' + this.extensions[i] + ')$', 'i')
                if (file.match(rule)) {
                    return (!!absolute ? file : basename(file)).replace(rule, '.inc.$1')
                }
            }
        }
    },
}
