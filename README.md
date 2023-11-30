[English](README.md) / [日本語](README.ja.md)

---

# Cubism MotionSync Plugin for Web

This is a Cubism SDK plugin for using the motion-sync function in Cubism SDK for Web.

## License

Please read [License](LICENSE.md) before use.


## Notice

Please read [Notice](NOTICE.md) before use.


## Structure

### Dependencies

#### Cubism SDK for Web

This plugin is a Cubism SDK plugin for Cubism SDK for Web.

You need the Cubism SDK for Web package to use it.

If you are looking for the SDK package download page, please visit the [Download page](https://www.live2d.com/download/cubism-sdk/download-web/).

#### Live2D Cubism MotionSync Core

A library that provides the motion-sync function. Live2D Cubism MotionSync Core is not included in this repository.

To download the plugin package that includes Live2D Cubism MotionSync Core, please refer to [this](https://www.live2d.com/sdk/download/motionsync/) page.

### Directory structure

```
.
├─ .vscode          # Project settings directory for Visual Studio Code
├─ Core             # Directory containing Live2D Cubism MotionSync Core
├─ Framework        # Directory containing the main source code of the motion-sync function
└─ Samples
   ├─ Resources     # Directory containing resources such as model files and images
   └─ TypeScript    # Directory containing the TypeScript sample projects
```

## Branch

If you are looking for the latest features and fixes, please check the `develop` branch.

The `master` branch is synchronized with the `develop` branch for each official plugin release.

## Development environment construction

1. Please check `Development environment construction` in `README.md` of Cubism SDK for Web.

### Steps required after development environment construction

If you want to use this plugin as is, the following steps are required:

#### Directory structure

To run this plugin, you first need to place Cubism SDK for Web and this plugin in the following directory structure.
After placing them, open the directory in which they are placed in Visual Studio Code.

```
.
├─ .vscode                              # Project settings directory for Visual Studio Code (†1)
│
├─ CubismSdkForWeb                      # Root directory of Cubism SDK for Web (†2)
│   └─ ...                              # Directory structure of Cubism SDK for Web
│
└─ CubismSdkMotionSyncPluginForWeb      # Root directory of this plugin
    ├─ .vscode                          # Project settings directory for Visual Studio Code
    ├─ Core                             # Directory containing Live2D Cubism MotionSync Core
    ├─ Framework                        # Directory containing the main source code of the motion-sync function
    └─ Samples
        ├─ Resources                    # Directory containing resources such as model files and images
        └─ TypeScript                   # Directory containing TypeScript sample projects
```

†1 Creates in [Creating launch.json](#creating-launchjson) section.
†2 By default, it must be fixed with the name `Cubism SdkForWeb`.

If you want to change the name of the root directory of the Cubism SDK for Web, you need to modify the name of `CubismSdkForWeb` used in the following location in the root directory of this plugin.

* Framework/tsconfig.json

If you want to run Samples, you need to make additional changes to the relevant parts of the following files.

* Samples/TypeScript/Demo/index.html
* Samples/TypeScript/Demo/tsconfig.json
* Samples/TypeScript/Demo/webpack.config.js

If you want to change the directory structure, you can do so by editing the above file.

### Checking the operation of the sample demo

#### Creating launch.json

Create a `.vscode` directory in the **directory where Cubism SDK for Web and this plugin are placed** and copy `launch.json` from the root directory of Cubism SDK for Web.
Once the copy is complete, modify the `url` key as follows. Replace `CubismWebMotionSyncComponents` with the name of the root directory of this plugin.

```
"url": "http://localhost:5000/CubismWebMotionSyncComponents/Samples/TypeScript/Demo/"
```

#### Execution

The task list is displayed by entering `>Tasks: Run Task` in the command palette (*View > Command Palette...*).

1. Select `npm: install - Samples/TypeScript/Demo` from the task list to download the dependent package
1. Select `npm: build - Samples/TypeScript/Demo` from the task list to build the sample demo
1. Select `npm: serve - Samples/TypeScript/Demo` from the task list to start a simple server for checking the operation
1. Enter `http://localhost:5000/CubismWebMotionSyncComponents/Samples/TypeScript/Demo/` in the URL field of your browser to access it (Replace `CubismWebMotionSyncComponents` with the name of the root directory for this plugin if changed)
1. Enter `>Tasks: Terminate Task` from the command palette and select `npm: serve` to terminate the simple server

For other tasks, please refer to [README.md](Samples/TypeScript/README.md) of the sample project.

NOTE: Settings for debugging are described in `.vscode/tasks.json`.  -->

### Project debugging

Open the **directory where Cubism SDK for Web and this plugin are placed** in Visual Studio Code and enter the *F5* key to start Debugger for Chrome.

You can place breakpoints in Visual Studio Code to debug in conjunction with the Chrome browser.

NOTE: Settings for debugging are described in `.vscode/launch.json`.


## SDK manual

[Cubism SDK Manual](https://docs.live2d.com/cubism-sdk-manual/cubism-sdk-motionsync-plugin-for-web/)


## Changelog

Please refer to [CHANGELOG.md](CHANGELOG.md) for the changelog of this repository.

## Development environment

### Node.js

* 21.2.0
* 20.10.0


## Operation environment

| Platform | Browser | Version |
| --- | --- | --- |
| macOS | Safari | 17.1 |
| Windows | Google Chrome | 119.0.6045.200 |
| Windows | Microsoft Edge | 119.0.2151.93 |
| Windows | Mozilla Firefox | 120.0 |

Note: You can start the server for operation check by running the `serve` script of `./Samples/TypeScript/Demo/package.json`.


## Contributing

There are many ways to contribute to the project: logging bugs, submitting pull requests on this GitHub, and reporting issues and making suggestions in Live2D Community.

### Forking And Pull Requests

We very much appreciate your pull requests, whether they bring fixes, improvements, or even new features. Note, however, that the wrapper is designed to be as lightweight and shallow as possible and should therefore only be subject to bug fixes and memory/performance improvements. To keep the main repository as clean as possible, create a personal fork and feature branches there as needed.

### Bugs

We are regularly checking issue-reports and feature requests at Live2D Community. Before filing a bug report, please do a search in Live2D Community to see if the issue-report or feature request has already been posted. If you find your issue already exists, make relevant comments and add your reaction.

### Suggestions

We're also interested in your feedback for the future of the SDK. You can submit a suggestion or feature request at Live2D Community. To make this process more effective, we're asking that you include more information to help define them more clearly.


## Forum

If you want to suggest or ask questions about how to use the Cubism SDK between users, please use the forum.

- [Live2D Creator's Forum](https://community.live2d.com/)
- [Live2D 公式クリエイターズフォーラム (Japanese)](https://creatorsforum.live2d.com/)
