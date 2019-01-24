/*!
 * Yamlinc: v0.2.0
 * Copyright(c) 2016-2019 Javanile
 * MIT Licensed
 */

const fs = require('fs')
    , join = require('path').join
    , colors = require('colors')
    , spawn = require('child_process').spawn

module.exports = {

    /**
     * Mute print info/error message
     */
    mute: false,

    /**
     * Mute print info/error message
     */
    strict: false,

    /**
     * Print error message.
     *
     * @param type
     * @param error
     * @param callback
     */
    error: function (type, error, callback) {
        if (!this.mute) { console.log(' >',colors.red.bold(type), '|', error) }
        if (this.strict) { process.exit(1) }
        return this.isFunction(callback) && callback({ type: type, error: error });
    },

    /**
     * Print degug or info line.
     *
     * @param msg
     * @param info
     */
    info: function (msg, info) {
        if (this.mute) { return; }
        console.log('  ', colors.gray.bold(msg), ':', info);
    },

    /**
     * Print success line.
     *
     * @param key
     * @param msg
     */
    done: function (msg, info) {
        if (this.mute) { return; }
        console.log('  ', colors.green.bold(msg), ':', info);
    },

    /**
     *
     * @param cmd
     * @param args
     * @param cb
     */
    spawn: function (cmd, args, cb) {
        // Running command
        let wrapper = spawn(cmd, args);

        // Attach stdout handler
        wrapper.stdout.on('data', (data) => {
            return process.stdout.write(data.toString())
        });

        // Attach stderr handler
        wrapper.stderr.on('data', (data) => {
            return process.stdout.write(data.toString())
        });

        // Attach exit handler
        wrapper.on('exit', (code) => {
            this.info('Command', 'exit code ' + code);
            return this.isFunction(cb) ? cb() : null
        })
    },

    /**
     *
     * @param file
     * @returns {*}
     */
    fileExists: function(file) {
        return file && fs.existsSync(file) && fs.lstatSync(file).isFile();
    },

    /**
     * Check if value is an object but not empty.
     */
    isNotEmptyObject: function (value) {
        return value && !Array.isArray(value) && typeof value === 'object' && Object.keys(value).length;
    },

    /**
     * Check if value is an array but not empty.
     */
    isNotEmptyArray: function (value) {
        return value && Array.isArray(value) && value.length > 0;
    },

    /**
     * Check if value is an array or object but not empty.
     */
    isNotEmptyObjectOrArray: function (value) {
        return this.isNotEmptyObject(value) || this.isNotEmptyArray(value)
    },

    /**
     *
     * @param value
     */
    isObjectizedArray: function (value) {
        if (this.isNotEmptyObject(value)) {
            var i = 0;
            for (var key in value) {
                if (key !== ''+i) { return false; }
                i++;
            }
            return true;
        }
        return false;
    },

    /**
     * Check if argument is a function.
     *
     * @param value
     * @returns boolean
     */
    isFunction: function (value) {
        return typeof value === 'function'
    },

    /**
     * Get software version.
     */
    getVersion: function () {
        let info = JSON.parse(fs.readFileSync(join(__dirname, '../package.json')), 'utf8');
        return info.name + '@' + info.version;
    },
}
