/*!
 * Yamlinc: v0.0.64
 * Copyright(c) 2016-2018 Javanile.org
 * MIT Licensed
 */

var fs = require("fs"),
    colors = require("colors"),
    spawn = require("child_process").spawn,
    basename = require("path").basename;

module.exports = {

    /**
     * Mute print info/error message
     */
    mute: false,

    /**
     * Print error message.
     *
     * @param msg
     */
    error: function (type, error, callback) {
        if (!this.mute) { console.log(colors.red.bold(type + ' >>'), colors.white(error)) }
        return this.isFunction(callback) && callback({ type: type, error: error });
    },

    /**
     *
     * @param key
     * @param msg
     */
    info: function (msg, info) {
        if (this.mute) { return; }
        console.log(colors.yellow.bold(msg + " >>"), colors.white(info));
    },

    /**
     *
     * @param cmd
     * @param args
     */
    spawn: function (cmd, args, cb) {
        var helpers = this;

        // Running command
        var wrapper = spawn(cmd, args);

        // Attach stdout handler
        wrapper.stdout.on('data', function (data) {
            return process.stdout.write(data.toString());
        });

        // Attach stderr handler
        wrapper.stderr.on('data', function (data) {
            return process.stdout.write(data.toString());
        });

        // Attach exit handler
        wrapper.on('exit', function (code) {
            helpers.info('Command', 'exit code ' + code);
            return typeof cb == 'function' ? cb() : null;
        });
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
     *
     */
    isNotEmptyObject: function (value) {
        return value
            && !Array.isArray(value)
            && typeof value === 'object'
            && Object.keys(value).length;
    },

    /**
     *
     */
    isNotEmptyArray: function (value) {
        return value
            && Array.isArray(value)
            && value.length > 0;
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
     *
     */
    isFunction: function (value) {
        return typeof value === "function";
    }
};
