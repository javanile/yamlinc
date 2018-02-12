/*!
 * Yamlinc
 * Copyright(c) 2016-2017 Javanile.org
 * MIT Licensed
 */

var fs = require("fs"),
    col = require("colors");

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
    }
};
