'use strict';

var yamlinc = require('../'),
    join = require('path').join,
    yamljs = require('js-yaml'),
    chai = require('chai'),
    fs = require('fs');

chai.use(require('chai-fs'));

yamlinc.setSilent();

describe('Testing File Extensions', function () {

    it('Handle Extensions', function (done) {
        let files = {
            'samples/sample1/sample1.yml':  /\.inc\.yml$/,
            'samples/sample2/sample2.YAML': /\.inc\.YAML/,
            'samples/sample3/sample3.Yml':  /\.inc\.Yml$/,
            'samples/sample4/sample4.yaml': /\.inc\.yaml$/,
            'samples/sample5/sample5.Yaml': /\.inc\.Yaml$/,
            'samples/sample6/sample6.YML':  /\.inc\.YML$/,
        }

        for (let file in files) {
            yamlinc.run([join(__dirname, file)], (debug) => {
                chai.assert.match(debug.output, files[file])
                fs.unlinkSync(join(process.cwd(), debug.output))
                if (file == 'samples/sample6/sample6.YML') { done() }
            })
        }
    })

})
