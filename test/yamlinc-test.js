'use strict';

var yamlinc = require('../src/yamlinc'),
    helpers = require('../src/helpers'),
    yaml = require('yamljs'),
    chai = require('chai');

chai.use(require('chai-fs'));

helpers.silent = true;

describe('Testing Yamlinc', function () {

    describe('Testing Parser', function () {

        it('Simple inclusion', function () {
            chai.assert.deepEqual(
                yamlinc.resolve(__dirname + '/samples/sample1.yml'),
                yaml.load(__dirname + '/samples/sample1-verify.yml')
            );
        });

        it('Large inclusion', function () {
            chai.assert.deepEqual(
                yamlinc.resolve(__dirname + '/samples/sample2.yml'),
                yaml.load(__dirname + '/samples/sample2-verify.yml')
            );
        });

        it('Multiple inclusion', function () {
            chai.assert.deepEqual(
                yamlinc.resolve(__dirname + '/samples/sample3.yml'),
                yaml.load(__dirname + '/samples/sample3-verify.yml')
            );
        });

        it('Inside list inclusion', function () {
            chai.assert.deepEqual(
                yamlinc.resolve(__dirname + '/samples/sample4.yml'),
                yaml.load(__dirname + '/samples/sample4-verify.yml')
            );
        });

    });

    describe('Testing Command-line', function () {

        it('Simple inclusion', function () {
            chai.assert.deepEqual(
                yamlinc.resolve(__dirname + '/samples/sample1.yml'),
                yaml.load(__dirname + '/samples/sample1-verify.yml')
            );
        });

        it('Large inclusion', function () {
            chai.assert.deepEqual(
                yamlinc.resolve(__dirname + '/samples/sample2.yml'),
                yaml.load(__dirname + '/samples/sample2-verify.yml')
            );
        });

        it('Multiple inclusion', function () {
            chai.assert.deepEqual(
                yamlinc.resolve(__dirname + '/samples/sample3.yml'),
                yaml.load(__dirname + '/samples/sample3-verify.yml')
            );
        });

        it('Inside list inclusion', function () {
            chai.assert.deepEqual(
                yamlinc.resolve(__dirname + '/samples/sample4.yml'),
                yaml.load(__dirname + '/samples/sample4-verify.yml')
            );
        });

    });

});