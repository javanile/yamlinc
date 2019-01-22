'use strict';

var yamlinc = require('../src/yamlinc'),
    helpers = require('../src/helpers'),
    yaml = require('js-yaml'),
    chai = require('chai'),
    fs = require('fs');

chai.use(require('chai-fs'));

yamlinc.mute = true;
helpers.mute = true;

describe('Testing Parser', function () {

    it('Simple inclusion', function () {
        chai.assert.deepEqual(
            yamlinc.resolve(__dirname + '/samples/sample1.yml'),
            yaml.safeLoad(fs.readFileSync(__dirname + '/samples/sample1-verify.yml'))
        );
    });

    it('Large inclusion', function () {
        chai.assert.deepEqual(
            yamlinc.resolve(__dirname + '/samples/sample2.YAML'),
            yaml.safeLoad(fs.readFileSync(__dirname + '/samples/sample2-verify.yml'))
        );
    });

    it('Multiple inclusion', function () {
        chai.assert.deepEqual(
            yamlinc.resolve(__dirname + '/samples/sample3.Yml'),
            yaml.safeLoad(fs.readFileSync(__dirname + '/samples/sample3-verify.yml'))
        );
    });

    /*
    it('Inside list inclusion', function () {
        chai.assert.deepEqual(
            yamlinc.resolve(__dirname + '/samples/sample4.yaml'),
            yaml.load(__dirname + '/samples/sample4-verify.yml')
        );
    });
    */

    it('Include and merge', function () {
        chai.assert.deepEqual(
            yamlinc.resolve(__dirname + '/samples/sample5.Yaml'),
            yaml.safeLoad(fs.readFileSync(__dirname + '/samples/sample5-verify.yml'))
        );
    });

    it('Include array of objects', function () {
        chai.assert.deepEqual(
            yamlinc.resolve(__dirname + '/samples/sample6.YML'),
            yaml.safeLoad(fs.readFileSync(__dirname + '/samples/sample6-verify.yml'))
        );
    });

});