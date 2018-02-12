/*!
 * Yamlinc
 * Copyright(c) 2016-2017 Javanile.org
 * MIT Licensed
 */

var fs = require("fs"),
    col = require("colors"),
    spawn = require("child_process").spawn;

module.exports = {
    /**
     * Silent print info/error message
     */
    silent: false,

    /**
     * Print error message.
     *
     * @param msg
     */
    error: function (msg, info) {
        if (this.silent) { return; }
        return console.log(col.red.bold(msg + " >>"), col.white(info));
    },

    /**
     *
     * @param key
     * @param msg
     */
    info: function (msg, info) {
        if (this.silent) { return; }
        console.log(col.yellow.bold(msg + " >>"), col.white(info));
    },

    /**
     *
     * @param cmd
     * @param args
     */
    spawn: function (cmd, args) {
        var helpers = this;

        // Running command
        var wrapper = spawn(cmd, args);

        // Attach stdout handler
        wrapper.stdout.on("data", function (data) {
            return process.stdout.write(data.toString());
        });

        // Attach stderr handler
        wrapper.stderr.on("data", function (data) {
            return process.stdout.write(data.toString());
        });

        // Attach exit handler
        wrapper.on("exit", function (code) {
            return helpers.info("Command exit", code);
        });
    }
};