/*!
 * Yamlinc: v0.2.0
 * Copyright(c) 2016-2019 Javanile
 * MIT Licensed
 */

const fs = require('fs')
    //, mkdirp = require('mkdirp').sync
    , dirname = require('path').dirname
    , basename = require('path').basename
    , join = require('path').join
    //, merge = require('deepmerge')
    //, yamljs = require('js-yaml')
    , helpers = require('./helpers')
    , values = require('object.values')
    , chokidar = require('chokidar')
    , cuid = require('cuid')
    , EOL = require('os').EOL

module.exports = {

    /**
     * Output in JSON format.
     */
    json: false,

    /**
     * Enable amend mode, block if errors occur.
     */
    amend: false,

    /**
     * Disable output print-out.
     */
    silent: false,

    /**
     * Check watcher is running.
     */
    watching: false,

    /**
     * Check command spawn is running.
     */
    running: false,

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
    extensions: ['yml', 'yaml', 'json'],

    /**
     * RegExp to catch supported files.
     */
    extensionsRule: new RegExp('\\.(yml|yaml|json)$', 'i'),

    /**
     * RegExp to catch .inc.* files.
     */
    incExtensionsRule: new RegExp('\\.inc\\.(yml|yaml|json)$', 'i'),

    /**
     * Output mode.  Default: FILE
     *
     * Possible modes:
     * FILE
     * STDOUT
     */
    outputMode: 'FILE',

    /**
     * Output file name.  Default: <inputFilePrefix>.inc.<inputFileSuffix>
     */
    outputFileName: '',

    /**
     * Output file name.  Default: <inputFilePrefix>.inc.<inputFileSuffix>
     */
    currentResolve: null,

    /**
     * Supported options.
     */
    options: {
        '-j': 'setJson', '--json': 'setJson',
        '-a': 'setAmend', '--amend': 'setAmend',
        '-S': 'setSchema', '--schema': 'setSchema',
        '-o': 'setOutput', '--output': 'setOutput',
        '-s': 'setSilent', '--silent': 'setSilent',
    },

    /**
     * Supported commands.
     */
    commands: {
        '-R': 'runExecutable', '--run': 'runExecutable',
        '-W': 'watchExcutable', '--watch': 'watchExcutable',
        '-v': 'getVersion', '--version': 'getVersion',
        '-h': 'getHelp', '--help': 'getHelp',
    },

    /**
     * Called for retrieve internal debug.
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
        if (typeof args === "undefined" || !args || args.length === 0) {
            return helpers.error("Problem", "Missing arguments, type: 'yamlinc --help'.", callback);
        }

        // handle command-line options
        for (let option in this.options) {
            if (args.indexOf(option) > -1) {
                this[this.options[option]](args);
            }
        }

        // handle command-line commands
        for (let command in this.commands) {
            if (args.indexOf(command) > -1) {
                return this[this.commands[command]](args, callback);
            }
        }

        // looking for file in arguments
        let file = this.getInputFile(args);
        if (!file) {
            return helpers.error("Problem", "Missing file name, type: 'yamlinc --help'", callback);
        }

        // generate name of .inc.yml output file
        let incFile = this.getIncFile(file);

        // compile yaml files
        return this.compile(file, incFile, callback);
    },

    /**
     * Run command after compile file.
     */
    runExecutable: function (args, callback) {
        let input = this.getInputFiles(args, true);
        if (!input) {
            return helpers.error('Problem', 'missing input file to exec.', callback);
        }

        this.compile(input.file, input.incFile, callback);

        let cmd = args.shift();

        this.spawn(cmd, args);
    },

    /**
     *
     */
    watchExecutable: function (args, callback) {
        args.splice(args.indexOf('--watch'), 1);

        let input = this.getInputFiles(args, true);
        if (!input) {
            return helpers.error('Problem', 'missing input file to watch.', callback);
        }

        let match = [];
        for (let i in this.extensions) {
            match.push('./**/*.*');
        }

        let watcher = chokidar.watch(match, {
            persistent: true,
            usePolling: true
        });

        this.compile(input.file, input.incFile, callback);

        let cmd = args.shift();

        watcher
            .on('change', (file) => { this.handleFileChange(file, input, cmd, args) })
            .on('unlink', (file) => { this.handleFileChange(file, input, cmd, args) });

        setTimeout(() => {
            watcher.on('add', (file) => {
                this.handleFileChange(file, input, cmd, args);
            });
        }, 15000);

        setTimeout(() => {
            this.watching = true;
            this.spawn(cmd, args);
        }, 1000);
    },

    /**
     * Repeat spawn command
     */
    spawn: function (cmd, args) {
        if (this.running) { return; }

        this.running = true;
        helpers.info('Command', cmd + ' ' + args.join(' '));
        helpers.spawn(cmd, args, () => {
            this.running = false;
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
        if (!this.running) {
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
            || !this.watching;
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
     * Set JSON mode.
     *
     * @param args
     */
    setJson: function (args) {
        this.json = true;
    },

    /**
     * Set strict mode.
     *
     * @param args
     */
    setAmend: function (args) {
        helpers.amend = true;
        this.amend = true;
    },

    /**
     * Set silent mode.
     *
     * @param args
     */
    setSilent: function (args) {
        args.splice(args.indexOf('--silent'), 1);
        args.splice(args.indexOf('-s'), 1);
        helpers.silent = true;
        this.silent = true;
    },

    /**
     * Set output mode.
     *
     * @param args
     */
    setOutput: function (args) {
        let index = args.indexOf('--output');
        if (index < 0) index = args.indexOf('-o');
        if (index < 0) return;

        if (args[index + 1] === null || args[index + 1] === undefined ||
            args[index + 2] === null || args[index + 2] === undefined) {
            this.strict = true;
            helpers.strict = true;
            helpers.error('Problem', `Missing output file name, type: 'yamlinc --help'.`);
        } else {
            if (args[index + 1] === '-') {
                this.setSilent();
                this.outputMode = 'STDOUT'
                this.outputFileName = '';
            } else {
                this.outputMode = 'FILE';
                this.outputFileName = args[index + 1];
            }
        }
    },

    /**
     * Set schema to use, relative path only.
     *
     * @param args
     */
    setSchema: function(args) {
        args = helpers.removeArguments(args, ['--schema', ])
        let index = args.indexOf('--schema');
        if (index < 0) index = args.indexOf('-s');
        if (index < 0) return;
        const path = require('path');
        const schemaPath = args[index + 1];
        const fullPath = path.join(process.cwd(), schemaPath);
        this.schema = require(fullPath);
    },

    /**
     * Get software version.
     */
    getVersion: function () {
        let info = JSON.parse(fs.readFileSync(join(__dirname, '../package.json')), 'utf8');
        return info.name + '@' + info.version;
    },

    /**
     * Get software help.
     */
    getHelp: function () {
        let help = join(__dirname, '../help/help.txt');
        return console.log(fs.readFileSync(help) + '');
    }
};
