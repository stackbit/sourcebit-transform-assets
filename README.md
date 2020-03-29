# sourcebit-transform-assets

[![npm version](https://badge.fury.io/js/sourcebit-transform-assets.svg)](https://badge.fury.io/js/sourcebit-transform-assets)

> A Sourcebit plugin for downloading remote assets

## 👩‍🏫 Introduction

This plugin looks for any assets that have been used in an entry, downloads the asset file to the local filesystem and replaces its URL in the referencing objects so that a local URL is used instead.

**🚨 Caveat**: The current version of this plugin is only capable of replacing assets when they are referenced from a field that is explicitly marked as containing assets. If an object contains an asset URL as part of a free-form field, like a string or a Markdown field, the remote URL will not be replaced.

## 🏗 Installation

To install the plugin and add it to your project, run:

```
npm install sourcebit-transform-assets --save
```

> 💡 You don't need to run this command if you start Sourcebit using the [interactive setup process](#%EF%B8%8F-interactive-setup-process), as the CLI will install the plugin for you and add it as a dependency to your project.

## ⚙️ Configuration

The plugin accepts the following configuration parameters. They can be supplied in any of the following ways:

- In the `options` object of the plugin configuration block inside `sourcebit.js`, with the value of the _Property_ column as a key;
- As an environment variable named after the _Env variable_ column, when running the `sourcebit fetch` command;
- As part of a `.env` file, with the value of the _Env variable_ column separated by the value with an equals sign (e.g. `MY_VARIABLE=my-value`);
- As a CLI parameter, when running the `sourcebit fetch` command, using the value of the _Parameter_ column as the name of the parameter (e.g. `sourcebit fetch --my-parameter`).

| Property    | Type            | Visibility | Default value | Env variable | Parameter | Description                                                                                       |
| ----------- | --------------- | ---------- | ------------- | ------------ | --------- | ------------------------------------------------------------------------------------------------- |
| `assetPath` | String/Function | Public     | `assets`      |              |           | A function that determines the full path for each asset detected (see [`assetPath`](#assetpath)). |
| `publicUrl` | String/Function | Public     | `/assets`     |              |           | A function that determines the public URL for each asset (see [`publicUrl`](#publicUrl)).         |

### `assetPath`

If `assetPath` is defined as a string, its value will be used as the path for the asset.

If `assetPath` is a function, it will be invoked for each asset detected with two parameters:

- `entry` (Object): The entry in which the asset was detected
- `asset` (Object): The normalized asset object

Its return value will be used as the path for the asset. If its return empty string then the asset is skipped from donwload.

### `publicUrl`

If `publicUrl` is defined as a string, its value will replace the original URL of the asset in any objects.

If `publicUrl` is a function, it will be invoked for each asset detected with two parameters:

- `entry` (Object): The entry in which the asset was detected
- `asset` (Object): The normalized asset object
- `assetPath` (String): The local path where the asset has been saved

Its return value will replace the original URL of the asset in any objects. If its return empty string then the asset is skipped from donwload.

### 👀 Example configuration

_`assetPath` and `publicUrl` as strings_

```js
module.exports = {
  plugins: [
    {
      module: require("sourcebit-transform-assets"),
      options: {
        assetPath: "assets",
        publicUrl: "/assets"
      }
    }
  ]
};
```

_`assetPath` and `publicUrl` as functions_

```js
module.exports = {
  plugins: [
    {
      module: require("sourcebit-transform-assets"),
      options: {
        assetPath: function(entry, asset) {
          return `my-assets/${entry.someField}-${asset.fileName}`;
        },
        publicUrl: function(entry, asset, assetPath) {
          return `https://something.example.com/public/${assetPath}`;
        }
      }
    }
  ]
};
```

### 🧞‍♂️ Interactive setup process

This plugin offers an interactive setup process via the `npx create-sourcebit` command. It asks users to choose the `assetPath` and `publicUrl` options.

## 📥 Input

This plugin expects the following data buckets to exist:

- `models`: An array of content models

## 📤 Output

This plugin creates files on disk, in locations defined by the `assetPath` option.
