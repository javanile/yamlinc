/*!
 * dockerops
 * Copyright(c) 2016-2017 Javanile.org
 * MIT Licensed
 */

var fs = require("fs"),
    join = require("path").join,
    spawn = require("child_process").spawn,
    exec = require("child_process").execSync,
    user = require('username'),
    base = require("path").basename,
    util = require("./util");

module.exports = {

    /**
     * Contain current working direcotry.
     *
     * @var string
     */
    cwd: process.cwd(),

    /**
     * Contain current working direcotry.
     *
     * @var array
     */
    environments: ["--dev", "--demo", "--test", "--uat", "--prod"],

    /**
     * Defaults docker-compose commands.
     *
     * @var array
     */
    defaults: [
        "build", "bundle", "config", "create", "down", "events",
        "exec", "help", "kill", "logs", "pause", "port", "ps",
        "pull", "push", "restart", "rm", "run", "scale",
        "start", "stop", "unpause", "up", "version"
    ],

    /**
     * Perform "docker-compose up" base command.
     *
     * @param args
     */
    cmdUp: function (args, opts, callback) {
        var params = [];
        var tail = [].concat(args);
        if (this.hasEnvironment(tail)) {
            params = params.concat(this.getEnvironmentParams(tail));
            tail = this.removeEnvironment(tail);
        }

        params.push("up");
        params.push("-d");
        params.push("--remove-orphans");

        if (tail) { params = params.concat(tail); }

        return this.compose(params, opts, callback);
    },

    /**
     * Perform "docker-compose build" base command.
     *
     * @param args
     */
    cmdBuild: function (args, opts, callback) {
        var params = [];
        var tail = [].concat(args);
        if (this.hasEnvironment(tail)) {
            params = params.concat(this.getEnvironmentParams(tail));
            tail = this.removeEnvironment(tail);
        }

        params.push("build");

        if (args) { params = params.concat(tail); }

        return this.compose(params, opts, callback);
    },

    /**
     * Perform "docker-compose ps" base command.
     *
     * @param args
     */
    cmdPs: function (args, opts, callback) {
        var params = [];
        var tail = [].concat(args);
        if (this.hasEnvironment(tail)) {
            params = params.concat(this.getEnvironmentParams(tail));
            tail = this.removeEnvironment(tail);
        }

        params.push("ps");
        params = params.concat(tail);

        //opts["hideStdErr"] = false;

        return this.compose(params, opts, callback);
    },

    /**
     * Perform "docker-compose run" base command.
     *
     * @param args
     */
    cmdStop: function (args, opts, callback) {
        if (args && args.indexOf("--all") > -1) {
            return this.dockerStopAll(args, opts, callback)
        }

        var params = [];
        var tail = [].concat(args);
        if (this.hasEnvironment(tail)) {
            params = params.concat(this.getEnvironmentParams(tail));
            tail = this.removeEnvironment(tail);
        }

        params.push("stop");
        params = params.concat(tail);

        return this.compose(params, opts, callback);
    },

    /**
     * Perform "docker-compose run" base command.
     *
     * @param args
     */
    cmdRm: function (args, opts, callback) {
        if (args && args.indexOf("--all") > -1) {
            return this.dockerRmAll(args, opts, callback)
        }

        var params = [];
        var tail = [].concat(args);
        if (this.hasEnvironment(args)) {
            params = params.concat(this.getEnvironmentParams(tail));
            tail = this.removeEnvironment(tail);
        }

        params.push("rm");
        params.push("-f");
        params = params.concat(tail);

        return this.compose(params, opts, callback);
    },

    /**
     * Perform "docker-compose run" base command.
     *
     * @param args
     */
    cmdRun: function (args, opts, callback) {
        var params = [];
        var tail = [].concat(args);
        if (this.hasEnvironment(tail)) {
            params = params.concat(this.getEnvironmentParams(tail));
            tail = this.removeEnvironment(tail);
        }

        params.push("run");

        if (tail) { params = params.concat(tail); }

        return this.compose(params, opts, callback);
    },

    /**
     * Perform "docker-compose exec" base command.
     *
     * @param args
     */
    cmdExec: function (args, opts, callback) {
        var params = [];
        var tail = [].concat(args);
        if (this.hasEnvironment(tail)) {
            params = params.concat(this.getEnvironmentParams(tail));
            tail = this.removeEnvironment(tail);
        }

        params.push("exec");

        for (var i in tail) {
            if (!tail.hasOwnProperty(i)) { continue; }
            if (tail[i] == "--mysql-import") {
                var next = parseInt(i) + 1;
                if (!tail[next]) {
                    return util.err("File to import missing, type filename after --mysql-import");
                }
                if (tail.indexOf("bash") == -1) { params.push("bash"); }
                params.push("-c");
                params.push('"mysql -h127.0.0.1 -uroot -p\\$MYSQL_ROOT_PASSWORD \\$MYSQL_DATABASE < ' + tail[next] + '"');
                delete tail[next];
                continue;
            }
            params.push(tail[i]);
        }

        return this.compose(params, opts, callback);
    },

    /**
     * Perform "docker-compose exec" base command.
     *
     * @param args
     */
    cmdDebug: function (args, opts, callback) {
        var params = [];
        var tail = [].concat(args);
        if (this.hasEnvironment(tail)) {
            params = params.concat(this.getEnvironmentParams(tail));
            tail = this.removeEnvironment(tail);
        }

        params.push("up");

        if (tail) { params = params.concat(tail); }

        return this.compose(params, opts, callback);
    },

    /**
     * Perform "docker-compose exec" base command.
     *
     * @param args
     */
    cmdFormat: function (args, opts, callback) {
        var ops = this;
        return ops.cmdStop(args, opts, function () {
            ops.cmdRm(args, opts, function () {
                ops.cmdBuild(args, opts, function () {
                    ops.cmdUp(args, opts);
                });
            });
        });
    },

    /**
     * Perform "docker-compose up" base command.
     *
     * @param args
     */
    runDefault: function (args, opts, callback) {
        var params = [];
        var tail = [].concat(args);
        if (this.hasEnvironment(tail)) {
            params = params.concat(this.getEnvironmentParams(tail));
            tail = this.removeEnvironment(tail);
        }

        if (tail) { params = params.concat(tail); }

        return this.compose(params, opts, callback);
    },

    /**
     * Perform "docker-compose" base command.
     *
     * @param args
     */
    compose: function (params, opts, callback) {
        return this.exec("docker-compose", params, opts, function (output) {
            if (typeof callback === "function") {
                callback(output);
            }
        });
    },

    /**
     * Stop all running containers.
     *
     */
    dockerStopAll: function (args, opts, callback) {
        opts["showInfo"] = true;
        var containers = exec("docker ps -q -a") + "";
        containers = containers.trim().split("\n");
        opts["hideStdOut"] = true;
        return this.exec("docker", ["stop"].concat(containers), opts, callback);
    },

    /**
     * Stop all running containers.
     *
     */
    dockerRmAll: function (args, opts, callback) {
        opts['showInfo'] = true;
        var containers = exec("docker ps -q -a") + "";
        containers = containers.trim().split("\n");
        opts['hideStdOut'] = true;
        return this.exec("docker", ["stop"].concat(containers), opts, callback);
    },

    /**
     * Check if args contain envrironment specification.
     *
     */
    hasEnvironment: function (args) {
        for (var i in this.environments) {
            if (args.indexOf(this.environments[i]) > -1) {
                return true;
            }
        }
        return false;
    },

    /**
     * Get docker-compose argument based on environment.
     *
     */
    getEnvironmentParams: function (args) {
        var params = []

        if (fs.existsSync(join(this.cwd, "docker-compose.yml"))) {
            params = params.concat(["-f", "docker-compose.yml"]);
        }

        for (var i in args) {
            var env = args[i];
            if (this.environments.indexOf(env) > -1) {
                var file = "docker-compose." + env.substr(2) + ".yml";
                if (fs.existsSync(join(this.cwd, file))) {
                    params = params.concat(["-f", file]);
                }
            }
        }

        return params;
    },

    /**
     * Remove environmnent argument on a list of args.
     *
     */
    removeEnvironment: function (args) {
        for (var i in this.environments) {
            var env = args.indexOf(this.environments[i]);
            if (env > -1) { args.splice(env, 1); }
        }
        return args;
    },

    /**
     * Exec command with spawn.
     */
    exec: function (cmd, params, opts, callback) {
        process.env["DOCKEROPS_HOST_USER"] = user.sync();
        process.env["DOCKEROPS_HOST_GROUP"] = util.getGroup();

        // Raw command
        var rawCommand = cmd + " " + params.join(" ");

        // Check info
        var info = util.isEnabled(opts, "showInfo");
        if (info) { util.info("spawn", rawCommand); }

        // Running command
        var wrapper = spawn(cmd, params);

        // Attach stdout handler
        wrapper.stdout.on("data", function (data) {
            if (util.isEnabled(opts, "hideStdOut")) { return; }
            process.stdout.write(data.toString());
        });

        // Attach stderr handler
        wrapper.stderr.on("data", function (data) {
            if (util.isEnabled(opts, "hideStdErr")) { return; }
            var msg = data.toString();
            var err = msg.match(/error/i);
            if (!info && err) { util.info("spawn", rawCommand); info = true; }
            if (msg.length < 100 && err) { return util.err(msg); }
            return process.stdout.write(msg);
        });

        // Attach exit handler
        wrapper.on("exit", function (code) {
            var code = code.toString();
            if (info) {
                var msg = "sounds like success.";
                if (code != "0") { msg = "some error occurred."; }
                util.info("exit",  "(code=" + code + ") " + msg);
            }
            if (typeof callback === "function") {
                callback();
            }
        });

        return rawCommand;
    }
};
