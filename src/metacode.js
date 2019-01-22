/*!
 * Yamlinc: v0.2.0
 * Copyright(c) 2016-2019 Javanile
 * MIT Licensed
 */

/**
 * Retrive file yaml meta code.
 *
 * @param file input file to load
 * @returns {string} yaml meta code
 */
loadMetacode: function (file) {
    let yamlinc = this;
    return fs.readFileSync(file).toString()
        .replace(this.getRegExpIncludeTag(), function (tag) {
            return tag.replace(yamlinc.includeTag, yamlinc.includeTag + '_' + cuid());
        });
},