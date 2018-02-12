/*!
 * dockerops
 * Copyright(c) 2016-2017 Javanile.org
 * MIT Licensed
 */

var fs = require("fs"),
    path = require("path"),
    util = require("./util"),
    ops = require("./ops");

module.exports = {

    /**
     * Command line entry-point.
     *
     * @param {array} args a list of arguments
     * @returns {string}
     */
    run: function(args, callback) {
        var opts = {};

        if (typeof args == "undefined" || !args) { args = []; }

        var info = args.indexOf("--info");
        if (info > -1) { opts['showInfo'] = true; args.splice(info, 1); }

        if (args.length === 0 || (args.length === 1 && ops.hasEnvironment(args))) {
            return ops.cmdPs(args, opts, callback);
        }

        var cmd = "ps";

        for (var i in args) {
            if (!args.hasOwnProperty(i)) { continue; }
            if (args[i].charAt(0) != "-") {
                cmd = args[i];
                args.splice(i, 1);
                break;
            }
        }

        var fnc = "cmd" + cmd.charAt(0).toUpperCase() + cmd.slice(1).toLowerCase();

        // Handle as OPS direct command with arguments
        if (typeof ops[fnc] === "function") {
            return ops[fnc](args, opts, callback);
        }

        // Handle internal command
        switch (cmd) {
            case "--help":
                return this.getHelp(args);
            case "--version":
                return this.getVersion();
        }

        // Handle defaults commands
        if (ops.defaults.indexOf(cmd) > -1) {
            return ops.runDefault([cmd].concat(args), opts, callback)
        }

        // Handle as docker-compose service name with default OPS command
        var service = cmd;
        opts['showInfo'] = true;
        if (args.length == 0 || (args.length === 1 && ops.hasEnvironment(args))) { args.push("bash"); }
        return ops.cmdExec([service].concat(args), opts, callback)
    },

    /**
     * Get sotware help.
     *
     * @param args
     */
    getHelp: function (args) {
        var help = path.join(__dirname, "../help/help.txt");
        if (!args[0]) { return console.log(fs.readFileSync(help)+""); }
        help = path.join(__dirname, "../help/" + args[0] + ".txt");
        if (fs.existsSync(help)) { return console.log(fs.readFileSync(help)); }
        return util.err("&cmd-undefined", { cmd: args[0] });
    },

    /**
     * Get software version.
     *
     * @param args
     */
    getVersion: function () {
        var info = JSON.parse(fs.readFileSync(path.join(__dirname, "../package.json")), "utf8");
        return info.name + "@" + info.version;
    }
};
