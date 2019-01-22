'use strict';

var yamlinc = require('../src/yamlinc'),
    helpers = require('../src/helpers'),
    yaml = require('js-yaml'),
    chai = require('chai'),
    fs = require('fs');

chai.use(require('chai-fs'));

yamlinc.mute = true;
helpers.mute = true;

describe('Merging', function () {

    it('Merge two files', function () {
        chai.assert.deepEqual(
            yamlinc.resolve(__dirname + '/samples/merge2files.yml'),
            yaml.safeLoad(fs.readFileSync(__dirname + '/samples/merge2files-verify.yml'))
        );
    });

});
