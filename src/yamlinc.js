/*!
 * Yamlinc: v0.2.0
 * Copyright(c) 2016-2019 Javanile
 * MIT Licensed
 */

const fs = require('fs')
    , resolve = require('path').resolve
    , dirname = require('path').dirname
    , basename = require('path').basename
    , join = require('path').join
    , chokidar = require('chokidar')
    //, merge = require('deepmerge')
    , compiler = require('./compiler')
    , helpers = require('./helpers')
    , tag = require('./tag')
    , cli = require('./cli')

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
    tag: '$include',

    /**
     * Supported file extensions.
     */
    extensions: ['yml', 'yaml', 'json'],

    /**
     * Output mode.  Default: FILE
     */
    output: null,

    /**
     * Supported options.
     */
    options: {
        '-j': 'setJson', '--json': 'setJson',
        '-a': 'setAmend', '--amend': 'setAmend',
        '-S': 'setSchema', '--schema': 'setSchema',
        '-i': 'setInline', '--inline': 'setInline',
        '-o': 'setOutput', '--output': 'setOutput',
        '-s': 'setSilent', '--silent': 'setSilent',
    },

    /**
     * Supported commands.
     */
    commands: {
        '-R': 'runExecutable', '--run': 'runExecutable',
        '-W': 'watchExecutable', '--watch': 'watchExecutable',
        '-v': 'getVersion', '--version': 'getVersion',
        '-h': 'getHelp', '--help': 'getHelp',
    },

    /**
     * Called for retrieve internal debug.
     *
     * @name debugcb
     * @function
     * @param {Object} debug information about the error
     * @return undefined
     */

    /**
     * Command line entry-point.
     *
     * @param {array} args a list of arguments
     * @param {debugcb} cb retrieve debug information
     * @returns {string}
     */
    run: function (args, cb) {
        if (typeof args === 'undefined' || !args || args.length === 0) {
            return helpers.error('Yamlinc', `Missing arguments, try 'yamlinc --help'.`, cb);
        }

        // handle command-line options
        for (let option in this.options) {
            let index = args.indexOf(option)
            if (index > -1) {
                args.splice(index, 1)
                this[this.options[option]](args);
            }
        }

        // prepare running environment
        compiler.setTag(tag(this.tag))
        cli.setExtensions(this.extensions)

        // handle command-line commands
        for (let command in this.commands) {
            let index = args.indexOf(command)
            if (index > -1) {
                args.splice(index, 1)
                return this[this.commands[command]](args, cb)
            }
        }

        // looking for file in arguments
        let files = cli.getFiles(args, this.output, false);
        if (!files) { return helpers.error('Problem', "Missing file name, type: 'yamlinc --help'", cb) }

        // compile yaml files
        return compiler.parse(files, cb);
    },

    /**
     * Run command after compile file.
     */
    runExecutable: function (args, cb) {
        let files = this.getFiles(args, this.output, true);
        if (!files) { return helpers.error('Problem', 'Missing input file on executable.', cb) }

        compiler.parse(files, cb);

        this.spawn(args.shift(), args);
    },

    /**
     * Watch running executable and repeat compile after changes.
     *
     */
    watchExecutable: function (args, cb) {
        let files = cli.getFiles(args, this.output, true);
        if (!files) { return helpers.error('Problem', 'Missing input file to watch.', cb) }

        let match = [];
        for (let i in this.extensions) { match.push('./**/*.*') }

        let watcher = chokidar.watch(match, { persistent: true, usePolling: true })

        compiler.parse(files, cb);

        let cmd = args.shift();

        watcher.on('change', (file) => this.handleFileChange(file, files, cmd, args))
        watcher.on('unlink', (file) => this.handleFileChange(file, files, cmd, args))

        setTimeout(() => { this.watching = true; this.spawn(cmd, args) }, 1000);
        setTimeout(() => { watcher.on('add', (file) => this.handleFileChange(file, files, cmd, args))}, 15000);
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
        })
    },

    /**
     * Handle file changes during watcher.
     *
     * @param file
     * @param files
     * @param cmd
     * @param args
     */
    handleFileChange: function (file, files, cmd, args) {
        if (this.skipFileChange(file, files)) { return }
        helpers.info('Changed', file);
        compiler.parse(files);
        if (!this.running) { this.spawn(cmd, args) }
    },

    /**
     * Skip un-watched files.
     *
     * @param file
     * @returns {boolean|Array|{index: number, input: string}|*}
     */
    skipFileChange: function (file, files) {
        return resolve(file) == resolve(files.output)
            || !file.match(cli.inputFileRegExp)
            || !this.watching;
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
        helpers.silent = true
        this.silent = true
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
        return console.log(helpers.getVersion());
    },

    /**
     * Get software help.
     */
    getHelp: function () {
        let help = join(__dirname, '../help/help.txt');
        return console.log(fs.readFileSync(help).toString());
    }
}
