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
    , compiler = require('./compiler')
    , resolver = require('./resolver')
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
                this[this.options[option]](args, index, cb);
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
     * Load file and resolve all inclusion.
     *
     * @param file input file to resolve
     * @returns {string} yaml code
     */
    resolve: function(file) {
        resolver.setTag(tag(this.tag))
        return resolver.parse(file);
    },

    /**
     * Run command after compile file.
     */
    runExecutable: function (args, cb) {
        let files = cli.getFiles(args, this.output, true);
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
        if (!this.running) {
            helpers.info('Command', cmd + ' ' + args.join(' '));
            helpers.spawn(cmd, args, () => { this.running = false })
            this.running = true;
        }
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
    setOutput: function (args, index, cb) {
        if (!args[index]) {
            return helpers.error('Problem', `Missing output file name, type: 'yamlinc --help'.`, cb);
        }

        this.output = args[index]
        args.splice(index, 1)

        if (this.output == '-') {
            this.setSilent()
        }
    },

    /**
     * Set schema to use, relative path only.
     *
     * @param args
     */
    setSchema: function(args) {
        if (!args[index]) {
            return helpers.error('Problem', `Missing schema file name, try: 'yamlinc --help'.`, cb);
        }
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
