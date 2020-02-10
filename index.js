const downloadFile = require("./lib/download-file");
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
  const filesToDownload = {};
  const entries = data.objects.map(entry => {
    const replacedFields = {};

    Object.keys(entry).forEach(fieldName => {
      const value = entry[fieldName];
      const { __metadata: meta } = value;
      const isAsset = meta && meta.modelName === "__asset";

      if (!isAsset) {
        return;
      }

      debug("Found asset entry: %o", value);

      const assetPath =
        typeof options.assetPath === "function"
          ? options.assetPath(entry, value)
          : options.assetPath;
      const publicUrl =
        typeof options.publicUrl === "function"
          ? options.publicUrl(entry, value, assetPath)
          : options.publicUrl;

      filesToDownload[value.url] = path.join(process.cwd(), assetPath);
      replacedFields[fieldName] = publicUrl;
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
return '/' + assetPath;
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
        { name: "Other", value: null }
      ]
    },
    {
      when: ({ assetPath }) => assetPath === null,
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
