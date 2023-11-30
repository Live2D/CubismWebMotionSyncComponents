/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

/**
 * Sample Appで使用する定数
 */

// 相対パス
export const ResourcesPath = '../../Resources/';
export const MotionSyncModelSoundsDirName = 'sounds/';

// 早送りの画像ファイル
export const FastForwardImageName = 'icon_fastForward.png';

// モデル定義---------------------------------------------
// モデルを配置したディレクトリ名の配列
// ディレクトリ名とmodel3.jsonの名前を一致させておくこと
export const ModelDir: string[] = ['Kei_basic', 'Kei_vowels'];

export const ModelDirSize: number = ModelDir.length;

// チャンネル数
export const Channels = 2;
// サンプリング周波数
export const SamplesPerSec = 48000;
// ビット深度
export const BitDepth = 16;
