/*!
 * Yamlinc
 * Copyright(c) 2016-2017 Javanile.org
 * MIT Licensed
 */

var fs = require("fs"),
    col = require("colors"),
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
    error: function (msg, info) {
        if (this.mute) { return; }
        return console.log(col.red.bold(msg + " >>"), col.white(info));
    },

    /**
     *
     * @param key
     * @param msg
     */
    info: function (msg, info) {
        if (this.mute) { return; }
        console.log(col.yellow.bold(msg + " >>"), col.white(info));
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
