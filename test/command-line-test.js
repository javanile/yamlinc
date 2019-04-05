'use strict';

var yamlinc = require('../src/yamlinc'),
    helpers = require('../src/helpers'),
    yaml = require('js-yaml'),
    chai = require('chai'),
    fs = require('fs');

chai.use(require('chai-fs'));

yamlinc.setSilent();

describe('Testing Command-line', function () {

    it('Handle input file', function (done) {
        yamlinc.run([], function (debug) {
            chai.assert.equal(debug.error, "Missing arguments, type: 'yamlinc --help'.")
            done()
        });
    });

});
