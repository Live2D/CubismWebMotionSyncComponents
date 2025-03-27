# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).


## 2024-11-28

### Removed

* [Unity,Native] Remove Android ARM v7 library.


## 2023-11-30

### Added

* [Web] Add library for Emscripten 3.1.8 version build.

### Changed

* Upgrade Core version to 05.00.0004.

### Fixed

* [Native] Fix an issue with incorrect file paths listed in `RedistributableFiles.txt` and `README.md`.
* Fix a issue with incorrect function names in `csmMotionSync_DeleteContext` logs.


## 2023-11-14

### Added

* [Unity] Add library for Emscripten 3.1.8 version build.

### Changed

* Upgrade Core version to 05.00.0003.


## 2023-10-17

### Changed

* Upgrade Core version to 05.00.0002.

### Fixed

* Fix a calculation bug within the `csmMotionSync_Analyze()`.


## 2023-09-28

### Added

* Add library for Android.
* Add library for ios.
* Add logging functions.
  * `csmMotionSync_SetLogFunction()`
  * `csmMotionSync_GetLogFunction()`


### Changed

* Upgrade Core version to 05.00.0001.
* Change `csmMotionSync_Analyze()` argument name.
  * `analyzeConfiguration` -> `analysisConfiguration`


## 2023-08-17

### Added

* New released!
