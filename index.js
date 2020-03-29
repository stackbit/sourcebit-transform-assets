const downloadFile = require("./lib/download-file");
const escapeRegex = require("./lib/escape-regex");
const path = require("path");
const pkg = require("./package.json");

module.exports.name = pkg.name;

module.exports.options = {
  assetPath: {
    default: "assets"
  },
  publicUrl: {
    default: "/assets"
  }
};

module.exports.transform = async ({ data, debug, log, options }) => {
  // Creating a Map where keys are regular expressions that catch URLs with or
  // without protocol, and values are objects with `assetPath` and `publicUrl`
  // keys.
  const assets = data.objects.reduce((result, entry) => {
    const { __metadata: meta } = entry;

    if (!meta || meta.modelName !== "__asset") {
      return result;
    }

    const protocol = new URL(entry.url).protocol;
    const escapedUrl = escapeRegex(entry.url.replace(protocol, ""));
    const regExp = new RegExp(`(http:|https:){0,1}${escapedUrl}`, "gi");
    const assetPath =
      typeof options.assetPath === "function"
        ? options.assetPath(null, entry)
        : options.assetPath;
    const publicUrl =
      typeof options.publicUrl === "function"
        ? options.publicUrl(null, entry, assetPath)
        : options.publicUrl;


    if (assetPath && publicUrl) {
      debug("Found asset %s, %s", assetPath, publicUrl);
      result.set(regExp, { assetPath, publicUrl });
    }

    return result;
  }, new Map());
  const filesToDownload = {};
  const entries = data.objects.map(entry => {
    const replacedFields = {};

    Object.keys(entry).forEach(fieldName => {
      const value = entry[fieldName];
      const { __metadata: meta } = value;
      const isAsset = meta && meta.modelName === "__asset";

      if (isAsset) {
        debug("Found asset entry: %o", value);

        const assetPath =
          typeof options.assetPath === "function"
            ? options.assetPath(entry, value)
            : options.assetPath;
        const publicUrl =
          typeof options.publicUrl === "function"
            ? options.publicUrl(entry, value, assetPath)
            : options.publicUrl;

        if (assetPath && publicUrl) {
          filesToDownload[value.url] = path.join(process.cwd(), assetPath);
          replacedFields[fieldName] = publicUrl;
        }
      } else if (typeof entry[fieldName] === "string") {
        assets.forEach(({ assetPath, publicUrl }, expression) => {
          let isMatch = false;

          const newValue = entry[fieldName].replace(expression, match => {
            isMatch = true;

            // The URL might be protocol-relative, in which case we prepend it
            // with "https:".
            const fullUrl =
              match.indexOf("//") === 0 ? `https:${match}` : match;

            filesToDownload[fullUrl] = path.join(process.cwd(), assetPath);

            return publicUrl;
          });

          if (isMatch) {
            debug("Found asset in string field: %s", entry[fieldName]);

            replacedFields[fieldName] = newValue;
          }
        });
      }
    });

    return {
      ...entry,
      ...replacedFields
    };
  });
  const fileQueue = Object.keys(filesToDownload).map(url => {
    return downloadFile({ localPath: filesToDownload[url], log, url });
  });

  await Promise.all(fileQueue);

  return {
    ...data,
    objects: entries
  };
};

module.exports.getOptionsFromSetup = ({ answers }) => {
  const assetPathFunctionBody = `
return [
  "${answers.assetPath}",
  [asset.__metadata.id, asset.fileName].join("-")
].join("/");
  `;
  const publicUrlFunctionBody = `
return [
  "${answers.publicUrl}",
  [asset.__metadata.id, asset.fileName].join("-")
].join("/");
  `;

  return {
    assetPath: new Function("entry", "asset", assetPathFunctionBody.trim()),
    publicUrl: new Function(
      "entry",
      "asset",
      "assetPath",
      publicUrlFunctionBody.trim()
    )
  };
};

module.exports.getSetup = ({ inquirer }) => {
  return [
    {
      type: "list",
      name: "assetPath",
      message: "Choose a location for the downloaded assets",
      choices: [
        "assets",
        "images",
        new inquirer.Separator(),
        { name: "Other", value: undefined }
      ]
    },
    {
      when: ({ assetPath }) => assetPath === undefined,
      type: "input",
      name: "assetPath",
      message: "Type a location for the downloaded assets"
    },
    {
      default: ({ assetPath }) => `/${assetPath}`,
      type: "input",
      name: "publicUrl",
      message: "Choose the public URL for the assets"
    }
  ];
};
