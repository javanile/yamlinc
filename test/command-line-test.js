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
            chai.assert.equal(debug.error, "Missing arguments, type: 'yamlinc --help'.")
            done()
        });
    });


    it('Handle schema file', function (done) {
        yamlinc.mute = false;
        yamlinc.run([
            '--schema',
            './node_modules/cloudformation-schema-js-yaml',
            __dirname + '/samples/sample7/sample7-cloudfront.yaml',
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
                         '## Engine: ' + helpers.getVersion() + '\n' +
                         '## Source: ' + __dirname + '/samples/sample7/sample7-cloudfront.yaml' + '\n\n'
            var yamlDumpWitHeader = header + yaml.safeDump(yamlLoad)
            chai.assert.deepEqual(incCompiled.toString(), yamlDumpWitHeader);
            done();
        });
    });

});
