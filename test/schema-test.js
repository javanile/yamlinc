'use strict';

var yamlinc = require('../src/yamlinc'),
    yaml = require('js-yaml'),
    chai = require('chai'),
    fs = require('fs'),
    join = require('path').join;

chai.use(require('chai-fs'));

yamlinc.setSilent();

describe('Testing Schema', function () {

    it('Handle Schema File', function (done) {

        yamlinc.run([
            '--schema',
            './node_modules/cloudformation-schema-js-yaml',
            join(__dirname, 'samples/sample7-cloudfront.yaml'),
          ], (debug) => {
            var incCompiled = fs.readFileSync(__dirname + '/../' + debug.incFile)
            var yamlLoad = yaml.safeLoad(
              fs.readFileSync(__dirname + '/samples/sample7/sample7-cloudfront.yaml'), {
                schema: require('cloudformation-schema-js-yaml')
              }
            )
            var header = '## --------------------\n' +
                         '## DON\'T EDIT THIS FILE\n' +
                         '## --------------------\n' +
                         '## Engine: yamlinc@0.1.6\n' +
                         '## Source: ' + __dirname + '/samples/sample7/sample7-cloudfront.yaml' + '\n\n'
            var yamlDumpWitHeader = header + yaml.safeDump(yamlLoad)
            chai.assert.deepEqual(incCompiled.toString(), yamlDumpWitHeader);
            done();
        });
    });

});
