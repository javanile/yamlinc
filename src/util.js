/*!
 * dockerops
 * Copyright(c) 2016-2017 Javanile.org
 * MIT Licensed
 */

var fs = require("fs"),
    join = require("path").join,
    spawn = require("child_process").spawn,
    exec = require("child_process").execSync,
    wrap = require('wordwrap'),
    user = require("username"),
    col = require("colors");

module.exports = {

    /**
     * Print error message.
     *
     * @param msg
     */
    err: function (msg, tokens) {
        return console.log(
            col.red.bold("<<error>>"),
            col.white(this.indent(this.applyTokens(msg, tokens), 12))
        );
    },

    /**
     *
     * @param key
     * @param msg
     */
    info: function (key, msg) {
        var offset = 11 + key.length;
        var column = process.stdout.columns - offset;
        msg = this.indent(wrap(column)(msg), offset);
        console.log(col.yellow.bold("<<info>> "+key+":"), col.white(msg));
    },

    /**
     *
     * @param opts
     * @param key
     */
    isEnabled: function (opts, key) {
        return typeof opts[key] != "undefined" && opts[key]
    },

    /**
     *
     * @param token
     */
    applyTokens: function (msg, tokens) {
        for (token in tokens) {
            if (tokens.hasOwnProperty(token)) {
                msg = msg.replace("${"+token+"}", tokens[token]);
            }
        }
        return msg;
    },

    /**
     *
     */
    indent: function (msg, offset) {
        return msg.trim().split("\n").join("\n" + this.pad(offset));
    },

    /**
     *
     */
    pad: function (len) {
        var str = "";
        for (var i = 0; i < len; i++) { str += " "; }
        return str;
    },

    /**
     *
     */
    trim: function (str) {
        return str.trim();
    },

    /**
     *
     * @param file
     */
    loadJson: function (file) {
        return require(file);
    },

    /**
     *
     * @param file
     * @param info
     */
    saveJson: function (file, info) {
        fs.writeFileSync(file, JSON.stringify(info, null, 4));
    },

    /**
     *
     */
    getGroup: function () {
        return exec("id -g -n");
    }
};


