# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).


## [5-r.1-beta.2] - 2024-01-30

### Added

* Add a process to alert when a context is not secure.

### Changed

* Change configuration to start with https.
  * A self-signed certificate is created when the sample project server is started.
* Change target to `es6`.
* Change to use motion sync with pre-acquired audio data.
  * This change limits the available audio to `.wav` files.

### Removed

* Remove use of `polyfill` and `watwg-fetch`.

### Fixed

* Fix an issue where the number of motion sync updates depended on the screen refresh rate.
* Fix crash when loading a model for which `.motionsync3.json` does not exist.
* Fix a crash when trying to play audio when `.model3.json` contains motions that are not tied to audio.
* Fix the MotionSync analysis process.
* Fix the memory corruption.

## [5-r.1-beta.1] - 2023-11-30

### Added

* New released!


[5-r.1-beta.2]: https://github.com/Live2D/CubismWebMotionSyncComponents/compare/5-r.1-beta.1...5-r.1-beta.2
