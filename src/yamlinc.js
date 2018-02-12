/*!
 * Yamlinc
 * Copyright(c) 2016-2018 Javanile.org
 * MIT Licensed
 */

var fs = require("fs"),
    realpath = require("fs").realpathSync,
    dirname = require("path").dirname,
    join = require("path").join,
    yamljs = require("yamljs"),
    helpers = require("./helpers");

var watcher = require("chokidar").watch("./**/*.yml", {
    persistent: true,
    usePolling: true
});

module.exports = {

    /**
     *
     */
    watcherEnabled: false,

    /**
     * Command line entry-point.
     *
     * @param {array} args a list of arguments
     * @returns {string}
     */
    run: function(args, callback) {
        if (typeof args == "undefined" || !args || args.length === 0) {
            return helpers.error("Arguments error", "type: yamlinc --help");
        }

        //
        var commands = {
            '--help': 'getHelp',
            '--version': 'getVersion',
            '--watch': 'runCommandWatcher'
        }
        for (command in commands) {
            if (args.indexOf(command) > -1) {
                return this[commands[command]](args);
            }
        }

        // looking for file in parameters
        var file = null;
        for (var i in args) {
            if (!args.hasOwnProperty(i)) { continue; }
            if (args[i].charAt(0) != "-" && args[i].match(/\.yml$/)) {
                file = args[i]; args.splice(i, 1); break;
            }
        }

        //
        if (!file) {
            return helpers.error("Arguments error", "missing file name.");
        }

        //
        if (!fs.existsSync(file)) {
            return helpers.error("File error", "file '"+file+"' not found.");
        }

        // Compile yaml files
        helpers.info("Analize file", file);
        var data = this.resolve(file);

        // Save compiled single file
        var fileInc = file.replace(/\.yml$/, '.inc.yml');
        helpers.info("Compile file", fileInc);
        fs.writeFileSync(fileInc, yamljs.stringify(data, 10));
    },

    /**
     *
     * @param file
     * @param includeTag
     * @returns {*}
     */
    resolve: function(file, includeTag)
    {
        if (typeof includeTag === "undefined") { includeTag = '$include'; }
        var path = dirname(realpath(file));
        var data = yamljs.load(file);
        this.recursiveResolve(data, path, includeTag);
        return data;
    },

    /**
     * Walk through array and find include tag.
     *
     * @param array  $yaml       reference of an array
     * @param string $path       base path for relative inclusion
     * @param string $includeTag tag to include file
     */
    recursiveResolve: function(data, path, includeTag) {
        if (typeof data !== 'object') {
            return;
        }
        var includes = {};
        for (var key in data) {
            if (key === includeTag) {
                if (typeof data[key] === "string" && data[key]) {
                    file = realpath(path + '/' + data[key]);
                    if (file && fs.existsSync(file)) {
                        helpers.info("Include file", file);
                        var include = this.resolve(file, includeTag);
                        includes = Object.assign(includes, include);
                    }
                } else if (typeof data[key] === "object") {
                    for (var index in data[key]) {
                        file = realpath(path + '/' + data[key][index]);
                        if (file && fs.existsSync(file)) {
                            helpers.info("Include file", file);
                            var include = this.resolve(file, includeTag);
                            includes = Object.assign(includes, include);
                        }
                    }
                }
                delete data[includeTag];
                continue;
            }
            this.recursiveResolve(data[key], path, includeTag);
        }

        if (includes && Object.keys(includes).length) {
            data = Object.assign(data, includes);
        }
    },

    /**
     *
     */
    runCommandWatcher: function (args) {
        var yamlinc = this;
        args.splice(args.indexOf("--watch"), 1);

        var file = null;
        var fileInc = null;
        for (var i in args) {
            if (!args.hasOwnProperty(i)) { continue; }
            if (args[i].charAt(0) != "-" && args[i].match(/\.yml$/)) {
                file = realpath(args[i]);
                fileInc = file.replace(/\.yml$/, '.inc.yml');
                args[i] = fileInc; break;
            }
        }

        //
        watcher
            .on('add', function(change) { yamlinc.handleFileChange(change, file, fileInc); })
            .on('change', function(change) { yamlinc.handleFileChange(change, file, fileInc); })
            .on('unlink', function(change) { yamlinc.handleFileChange(change, file, fileInc); });

        //
        this.directCompile(file, fileInc);

        //
        var cmd = args.shift();
        setTimeout(function(){
            yamlinc.watcherEnabled = true;
            helpers.info("Command exec", cmd + " " + args.join(" "));
            helpers.spawn(cmd, args);
        }, 1000);
    },

    /**
     *
     */
    handleFileChange: function (change, file, fileInc) {
        if (!this.watcherEnabled || change.match(/\.inc\.yml$/)) { return; }
        helpers.info('Changed file', realpath(change));
        this.directCompile(file, fileInc);
    },

    /**
     *
     */
    directCompile: function (file, fileInc) {
        helpers.info("Analize file", file);
        var data = this.resolve(file);
        helpers.info("Compile file", fileInc);
        fs.writeFileSync(fileInc, yamljs.stringify(data, 10));
    },

    /**
     * Get sotware help.
     *
     * @param args
     */
    getHelp: function (args) {
        var help = join(__dirname, "../help/help.txt");
        return console.log(fs.readFileSync(help)+"");
    },

    /**
     * Get software version.
     *
     * @param args
     */
    getVersion: function () {
        var info = JSON.parse(fs.readFileSync(join(__dirname, "../package.json")), "utf8");
        return info.name + "@" + info.version;
    }
};
