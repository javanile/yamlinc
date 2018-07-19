/*!
 * Yamlinc: v0.0.64
 * Copyright(c) 2016-2018 Javanile.org
 * MIT Licensed
 */

const fs = require("fs"),
      realpath = require("fs").realpathSync,
      mkdirp = require('mkdirp').sync,
      dirname = require("path").dirname,
      basename = require("path").basename,
      join = require("path").join,
      merge = require("deepmerge"),
      yamljs = require("js-yaml"),
      helpers = require("./helpers"),
      values = require('object.values'),
      chokidar = require("chokidar"),
      cuid = require('cuid'),
      EOL = require('os').EOL;

module.exports = {

    /**
     * Disable output print-out.
     */
    mute: false,

    /**
     * Check watcher is running.
     */
    watchRunning: false,

    /**
     * Check command spawn is running.
     */
    spawnRunning: false,

    /**
     * Define the include tag.
     */
    includeTag: '$include',

    /**
     * RegExp version of include tag.
     */
    escapeTag: '\\$include',

    /**
     * Supported file extensions.
     */
    extensions: ['yml', 'yaml'],

    /**
     * RegExp to catch supported files.
     */
    extensionsRule: new RegExp('\\.(yml|yaml)$', 'i'),

    /**
     * RegExp to catch .inc.* files.
     */
    incExtensionsRule: new RegExp('\\.inc\\.(yml|yaml)$', 'i'),

    /**
     * Output mode.  Default: FILE
     *
     * Possible modes:
     * FILE
     * STDOUT
     */
    outputMode: 'FILE',

    /**
     * Output file name.  Default: <inputfileprefix>.inc.<inputfilesuffix>
     */
    outputFileName: '',

    /**
     * Supported options.
     */
    options: {
        '-o': 'setOutput',
        '--mute': 'setMute',
        '--output': 'setOutput',
    },

    /**
     * Supported commands.
     */
    commands: {
        '--help': 'getHelp',
        '--version': 'getVersion',
        '--watch': 'runCommandWatch',
        '--exec': 'runCommandExec'
    },

    /**
     * Called for retrive internal debug.
     *
     * @name debugCallback
     * @function
     * @param {Object} debug information about the error
     * @return undefined
     */

    /**
     * Command line entry-point.
     *
     * @param {array} args a list of arguments
     * @param {debugCallback} callback retrieve debug information
     * @returns {string}
     */
    run: function (args, callback) {
        if (typeof args == "undefined" || !args || args.length === 0) {
            return helpers.error("Yamlinc", "Missing arguments, type: yamlinc --help", callback);
        }

        // handle command-line options
        for (var option in this.options) {
            if (args.indexOf(option) > -1) {
                this[this.options[option]](args);
            }
        }

        // handle command-line commands
        for (var command in this.commands) {
            if (args.indexOf(command) > -1) {
                return this[this.commands[command]](args, callback);
            }
        }

        // looking for file in arguments
        var file = this.getInputFile(args);
        if (!file) {
            return helpers.error("Arguments error", "missing file name.", callback);
        }

        // generate name of .inc.yml output file
        var incFile = this.getIncFile(file);

        // compile yaml files
        return this.compile(file, incFile, callback);
    },

    /**
     * Load file and resolve all inclusion.
     *
     * @param file input file to resolve
     * @returns {string} yaml code
     */
    resolve: function(file) {
        var base = dirname(file),
            code = this.loadMetacode(file),
            data = yamljs.safeLoad(code);

        this.recursiveResolve(data, base);
        this.recursiveSanitize(data);

        return data;
    },

    /**
     * Retrive file yaml meta code.
     *
     * @param file input file to load
     * @returns {string} yaml meta code
     */
    loadMetacode: function (file) {
        var yamlinc = this;
        return fs.readFileSync(file).toString()
            .replace(this.getRegExpIncludeTag(), function (tag) {
                return tag.replace(yamlinc.includeTag, yamlinc.includeTag + '_' + cuid());
            });
    },

    /**
     * Walk through array and find include tag.
     *
     * @param array  $yaml       reference of an array
     * @param string $includeTag tag to include file
     */
    recursiveResolve: function(data, base) {
        if (typeof data !== 'object') { return; }

        var includes = {};
        for (var key in data) {
            if (this.isKeyMatchIncludeTag(key)) {
                if (typeof data[key] === "string" && data[key]) {
                    includes = this.recursiveInclude(base + '/' + data[key], includes);
                } else if (typeof data[key] === "object") {
                    for (var index in data[key]) {
                        includes = this.recursiveInclude(base + '/' + data[key][index], includes);
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
    recursiveInclude: function (file, includes) {
        if (helpers.fileExists(file)) {
            helpers.info("Include", file);
            var include = this.resolve(file);
            if (helpers.isNotEmptyObject(include)) {
                includes = Object.assign(includes, merge(includes, include));
            } else if (helpers.isNotEmptyArray(include)) {
                includes = Object.assign(includes, merge(includes, include));
            }
        }
        return includes;
    },

    /**
     *
     */
    runCommandWatch: function (args, callback) {
        var yamlinc = this;
        args.splice(args.indexOf('--watch'), 1);

        var input = this.getInputFiles(args);
        if (!input) {
            return helpers.error('File error', 'missing input file to watch.', callback);
        }

        var match = [];
        for (var i in this.extensions) {
            match.push('./**/*.*');
        }

        var watcher = chokidar.watch(match, {
            persistent: true,
            usePolling: true
        });

        this.compile(input.file, input.incFile, callback);

        var cmd = args.shift();

        watcher
            .on('change', function(file) { yamlinc.handleFileChange(file, input, cmd, args); })
            .on('unlink', function(file) { yamlinc.handleFileChange(file, input, cmd, args); });

        setTimeout(function() {
            watcher.on('add', function(file) {
                yamlinc.handleFileChange(file, input, cmd, args);
            });
        }, 15000);

        setTimeout(function(){
            yamlinc.watchRunning = true;
            yamlinc.spawnLoop(cmd, args);
        }, 1000);
    },

    /**
     *
     */
    runCommandExec: function (args, callback) {
        var yamlinc = this;
        args.splice(args.indexOf('--exec'), 1);

        var input = this.getInputFiles(args);
        if (!input) {
            return helpers.error('File error', 'missing input file to exec.', callback);
        }

        this.compile(input.file, input.incFile, callback);

        var cmd = args.shift();

        helpers.info('Command', cmd + ' ' + args.join(' '));
        helpers.spawn(cmd, args);
    },

    /**
     *
     */
    spawnLoop: function (cmd, args) {
        if (this.spawnRunning) { return; }

        var yamlinc = this;
        this.spawnRunning = true;
        helpers.info('Command', cmd + ' ' + args.join(' '));
        helpers.spawn(cmd, args, function(){
            yamlinc.spawnRunning = false;
        });
    },

    /**
     * Handle file changes during watcher.
     *
     * @param file
     * @param input
     * @param cmd
     * @param args
     */
    handleFileChange: function (file, input, cmd, args) {
        if (this.skipFileChange(file)) { return; }
        helpers.info('Changed', file);
        this.compile(input.file, input.incFile);
        if (!this.spawnRunning) {
            this.spawnLoop(cmd, args);
        }
    },

    /**
     * Skip un-watched files.
     *
     * @param file
     * @returns {boolean|Array|{index: number, input: string}|*}
     */
    skipFileChange: function (file) {
        return file.match(this.incExtensionsRule)
            || !file.match(this.extensionsRule)
            || !this.watchRunning;
    },

    /**
     * Compile yaml file.
     *
     * @param file
     * @param incFile
     * @param callback
     * @returns {*}
     */
    compile: function (file, incFile, callback) {
        if (!helpers.fileExists(file)) {
            return helpers.error('File error', "file '" + file + "' not found.", callback);
        }

        // Compile and prepare disclaimer
        helpers.info("Analize", file);
        var data = this.resolve(file);
        var disclaimer = [
            "## --------------------",
            "## DON'T EDIT THIS FILE",
            "## --------------------",
            "## Engine: " + this.getVersion(),
            "## Source: " + file,
        ];

        // Print-out compiled code into file
        helpers.info("Compile", incFile);
        var code = data ? yamljs.safeDump(data) : 'empty: true' + EOL;

        if (this.outputMode === 'FILE') {
            mkdirp(dirname(incFile));
            fs.writeFileSync(incFile, disclaimer.join(EOL) + EOL + EOL + code);
        } else {
            process.stdout.write(incFile);
            process.stdout.write(disclaimer.join(EOL) + EOL + EOL + code);
        }

        // Trigger debugger callback
        return helpers.isFunction(callback)
            && callback({ file: file, incFile: incFile });
    },

    /**
     * Apply object sanitize.
     *
     * @param data
     * @returns {*}
     */
    recursiveSanitize: function(data) {
        if (!helpers.isNotEmptyObject(data)) { return data; }

        for (var key in data) {
            if (helpers.isObjectizedArray(data[key])) {
                data[key] = values(data[key]);
                continue;
            }
			
            if( Array.isArray(data[key]) ) {
                for( var arrKey in data[key] ) {
                    data[key][arrKey] = this.recursiveSanitize( data[key][arrKey] );
                }
            } else {
                data[key] = this.recursiveSanitize(data[key]);
            }
        }

        return data;
    },

    /**
     * RegExp to match include tag into yaml code.
     *
     * @returns {RegExp}
     */
    getRegExpIncludeTag: function () {
        return new RegExp('^[ \\t]*' + this.escapeTag + '[ \\t]*:', 'gmi');
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
    },

    /**
     * Get input file to parse inside command-line arguments.
     *
     * @param args
     * @returns {*}
     */
    getInputFile: function (args) {
        // Go in reverse since the filename is supposed to be last
        for (var index = args.length - 1; index >= 0; index--) {
            if (this.isArgumentInputFile(args, index)) {
                var file = args[index];
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
        return args.hasOwnProperty(i)
            && args[i].charAt(0) != '-'
            && args[i].match(this.extensionsRule);
    },

    /**
     * Get input file and incFile by cli arguments.
     *
     * @param args
     * @returns {{file: string, incFile: string}}
     */
    getInputFiles: function (args) {
        for (var i in args) {
            if (this.isArgumentInputFile(args, i)) {
                var file = args[i];
                args[i] = this.getIncFile(file);
                return { file: file, incFile: args[i] };
            }
        }
    },

    /**
     * Get .inc.yml file base on input.
     *
     * @param file
     * @returns {void|string}
     */
    getIncFile: function (file) {
        if (this.outputMode === 'STDOUT') return '';

        if (this.outputFileName && this.outputFileName !== '') return this.outputFileName
        else {
            for (var i in this.extensions) {
                if (this.extensions.hasOwnProperty(i)) {
                    var rule = new RegExp('\\.(' + this.extensions[i] + ')$', 'i');
                    if (file.match(rule)) { return basename(file).replace(rule, '.inc.$1'); }
                }
            }
        }
    },

    /**
     * Set mute mode.
     *
     * @param args
     */
    setMute: function (args) {
        args.splice(args.indexOf('--mute'), 1);
        helpers.mute = true;
        this.mute = true;
    },

    /**
     * Set output mode.
     *
     * @param args
     */
    setOutput: function (args) {
        var index = args.indexOf('--output');
        if (index < 0) index = args.indexOf('-o');
        if (index < 0) return;

        if (args[index + 1] === null || args[index + 1] === undefined ||
            args[index + 2] === null || args[index + 2] === undefined) {
            helpers.error("Yamlinc", "Missing arguments, type: yamlinc --help");
        } else {
            if (args[index + 1] === '-') {
                this.outputMode = 'STDOUT'
                this.outputFileName = '';
            } else {
                this.outputMode = 'FILE';
                this.outputFileName = args[index + 1];
            }
        }
    },

    /**
     * Get sotware help.
     *
     * @param args
     */
    getHelp: function (args) {
        var help = join(__dirname, "../help/help.txt");
        return console.log(fs.readFileSync(help)+"");
    },

    /**
     * Get software version.
     *
     * @param args
     */
    getVersion: function () {
        var info = JSON.parse(fs.readFileSync(join(__dirname, "../package.json")), "utf8");
        return info.name + "@" + info.version;
    }
};
