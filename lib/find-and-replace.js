const path = require('path');

function findAndReplaceInEntry({ assets, debug, depth = 1, entry, filesToDownload, options }) {
    return Object.keys(entry).reduce((replacedFields, fieldName) => {
        if (fieldName === '__metadata') return replacedFields;

        const value = entry[fieldName];
        const { __metadata: meta } = value;
        const isAsset = meta && meta.modelName === '__asset';

        if (isAsset) {
            debug('Found asset entry: %o', value);

            const assetPath =
                typeof options.assetPath === 'function' ? options.assetPath(entry, value) : path.join(options.assetPath, value.fileName);
            const publicUrl =
                typeof options.publicUrl === 'function'
                    ? options.publicUrl(entry, value, assetPath)
                    : `${options.publicUrl}/${value.fileName}`;

            filesToDownload[value.url] = path.join(process.cwd(), assetPath);

            return {
                ...replacedFields,
                [fieldName]: publicUrl
            };
        }

        if (typeof value === 'string') {
            let matchValue;

            assets.forEach(({ assetPath, publicUrl }, expression) => {
                let isMatch = false;

                const newValue = value.replace(expression, match => {
                    isMatch = true;

                    // The URL might be protocol-relative, in which case we prepend it
                    // with "https:".
                    const fullUrl = match.indexOf('//') === 0 ? `https:${match}` : match;

                    filesToDownload[fullUrl] = path.join(process.cwd(), assetPath);

                    return publicUrl;
                });

                if (isMatch) {
                    debug('Found asset in string field: %s', value);

                    matchValue = newValue;

                    return true;
                }
            });

            return matchValue
                ? {
                      ...replacedFields,
                      [fieldName]: matchValue
                  }
                : replacedFields;
        }

        if (value && value.toString() === '[object Object]' && depth < options.maximumSearchDepth) {
            return {
                ...replacedFields,
                [fieldName]: findAndReplaceInEntry({
                    assets,
                    debug,
                    depth: depth + 1,
                    entry: value,
                    filesToDownload,
                    options
                })
            };
        }

        return { ...replacedFields, [fieldName]: value };
    }, {});
}

module.exports.findAndReplaceInEntry = findAndReplaceInEntry;
