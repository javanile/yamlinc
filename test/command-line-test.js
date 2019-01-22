'use strict';

var yamlinc = require('../src/yamlinc'),
    helpers = require('../src/helpers'),
    yaml = require('js-yaml'),
    chai = require('chai'),
    fs = require('fs');

chai.use(require('chai-fs'));

yamlinc.mute = true;
helpers.mute = true;

describe('Testing Command-line', function () {

    it('Handle input file', function (done) {
        yamlinc.run([], function (debug) {
            chai.assert.equal(debug.error, "Missing arguments, type: 'yamlinc --help'.");
            done();
        });
    });

    it('Handle extensions', function (done) {
        yamlinc.run([__dirname + '/samples/sample1.yml'], function (debug) {
            chai.assert.match(debug.incFile, /\.inc\.yml$/);
            fs.unlinkSync(process.cwd() + '/' + debug.incFile);
        });
        yamlinc.run([__dirname + '/samples/sample2.YAML'], function (debug) {
            chai.assert.match(debug.incFile, /\.inc\.YAML/);
            fs.unlinkSync(process.cwd() + '/' + debug.incFile);
        });
        yamlinc.run([__dirname + '/samples/sample3.Yml'], function (debug) {
            chai.assert.match(debug.incFile, /\.inc\.Yml$/);
            fs.unlinkSync(process.cwd() + '/' + debug.incFile);
        });
        yamlinc.run([__dirname + '/samples/sample4.yaml'], function (debug) {
            chai.assert.match(debug.incFile, /\.inc\.yaml$/);
            fs.unlinkSync(process.cwd() + '/' + debug.incFile);
        });
        yamlinc.run([__dirname + '/samples/sample5.Yaml'], function (debug) {
            chai.assert.match(debug.incFile, /\.inc\.Yaml$/);
            fs.unlinkSync(process.cwd() + '/' + debug.incFile);
        });
        yamlinc.run([__dirname + '/samples/sample6.YML'], function (debug) {
            chai.assert.match(debug.incFile, /\.inc\.YML$/);
            fs.unlinkSync(process.cwd() + '/' + debug.incFile);
            done();
        });
    });

    it('Handle schema file', function (done) {
        yamlinc.mute = false;
        yamlinc.run([
            '--schema',
            './node_modules/cloudformation-schema-js-yaml',
            __dirname + '/samples/sample7-cloudfront.yaml',
          ], function (debug) {
            var incCompiled = fs.readFileSync(__dirname + '/../' + debug.incFile)
            var yamlLoad = yaml.safeLoad(
              fs.readFileSync(__dirname + '/samples/sample7-cloudfront.yaml'), {
                schema: require('cloudformation-schema-js-yaml')
              }
            )
            var header = '## --------------------\n' +
                         '## DON\'T EDIT THIS FILE\n' +
                         '## --------------------\n' +
                         '## Engine: yamlinc@0.1.6\n' +
                         '## Source: ' + __dirname + '/samples/sample7-cloudfront.yaml' + '\n\n'
            var yamlDumpWitHeader = header + yaml.safeDump(yamlLoad)
            chai.assert.deepEqual(incCompiled.toString(), yamlDumpWitHeader);
            done();
        });
    });

});
