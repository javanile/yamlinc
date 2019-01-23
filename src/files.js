/*!
 * Yamlinc: v0.2.0
 * Copyright(c) 2016-2019 Javanile
 * MIT Licensed
 */


/**
 * Get input file to parse inside command-line arguments.
 *
 * @param args
 * @returns {*}
 */
getInputFile: function (args) {
    // Go in reverse since the filename is supposed to be last
    for (let index = args.length - 1; index >= 0; index--) {
        if (this.isArgumentInputFile(args, index)) {
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
isArgumentInputFile: function (args, i) {
    /**
     * RegExp to catch supported files.
     */
    extensionsRule: new RegExp('\\.(yml|yaml|json)$', 'i'),

    return args.hasOwnProperty(i)
        && args[i].charAt(0) !== '-'
        && args[i].match(this.extensionsRule);
},

/**
 * Get input file and incFile by cli arguments.
 *
 * @param args
 * @returns {{file: string, incFile: string}}
 */
getInputFiles: function (args, absolute) {
    for (let i in args) {
        if (this.isArgumentInputFile(args, i)) {
            let file = args[i];
            args[i] = this.getIncFile(file, absolute);
            return { file: file, incFile: args[i] };
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
getIncFile: function (file, absolute) {
    if (this.outputMode === 'STDOUT') { return '' }
    if (!!this.outputFileName) { return this.outputFileName }

    for (let i in this.extensions) {
        if (this.extensions.hasOwnProperty(i)) {
            let rule = new RegExp('\\.(' + this.extensions[i] + ')$', 'i')
            if (file.match(rule)) { return (!!absolute ? file : basename(file)).replace(rule, '.inc.$1') }
        }
    }
},
