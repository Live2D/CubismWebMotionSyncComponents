/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { csmVector, iterator } from '@framework/type/csmvector';
import * as LAppMotionSyncDefine from './lappmotionsyncdefine';
import { CubismMotionSync } from '@motionsyncframework/live2dcubismmotionsync';
import { LAppMotionSyncModel } from './lappmotionsyncmodel';
import { LAppWavFileHandler } from '@cubismsdksamples/lappwavfilehandler';
import { CubismLogError } from '@framework/utils/cubismdebug';

/**
 * WorkletProcessorモジュール用の型定義
 */
export interface LAppResponseObject {
  eventType: string;
  audioBuffer: Float32Array;
}

/**
 * 音声管理クラス
 * 音声読み込み、管理を行うクラス。
 */
export class LAppMotionSyncAudioManager {
  /**
   * コンストラクタ
   */
  constructor() {
    this._audios = new csmVector<AudioInfo>();
  }

  /**
   * 解放する。
   */
  public release(): void {
    for (
      let ite: iterator<AudioInfo> = this._audios.begin();
      ite.notEqual(this._audios.end());
      ite.preIncrement()
    ) {
      if (!ite.ptr()) {
        continue;
      }

      if (ite.ptr().source) {
        ite.ptr().source.disconnect();
      }
      if (ite.ptr().audioContext) {
        ite.ptr().audioContext.close();
      }
    }
    this._audios = null;
  }

  /**
   * 音声読み込み
   *
   * @param fileName 読み込む音声ファイルパス名
   * @param audioContext 音声コンテキスト
   * @return 音声情報、読み込み失敗時はnullを返す
   */
  public createAudioFromFile(
    fileName: string,
    index: number,
    model: LAppMotionSyncModel,
    motionSync: CubismMotionSync,
    audioContext: AudioContext,
    callback: (
      audioInfo: AudioInfo,
      callbackIndex: number,
      model: LAppMotionSyncModel,
      motionSync: CubismMotionSync
    ) => void
  ): void {
    if (this._audios && this._audios.at(index) != null) {
      // search loaded audio already
      for (
        let ite: iterator<AudioInfo> = this._audios.begin();
        ite.notEqual(this._audios.end());
        ite.preIncrement()
      ) {
        if (
          ite.ptr().filePath == fileName &&
          ite.ptr().audioContext == audioContext &&
          audioContext != null
        ) {
          // 2回目以降はキャッシュが使用される(待ち時間なし)
          // WebKitでは同じImageのonloadを再度呼ぶには再インスタンスが必要
          // 詳細：https://stackoverflow.com/a/5024181
          ite.ptr().audio = new Audio();
          ite
            .ptr()
            .audio.addEventListener(
              'load',
              (): void => callback(ite.ptr(), index, model, motionSync),
              {
                passive: true
              }
            );
          ite.ptr().audio.src = fileName;
          ite.ptr().audioContext = audioContext;
          return;
        }
      }
    }

    // 音声コンテキストの作成
    const newAudioContext = new AudioContext({
      sampleRate: LAppMotionSyncDefine.SamplesPerSec
    });

    newAudioContext.suspend();

    // 埋め込み音声要素を作成
    const audio = new Audio(fileName);

    // 埋め込み音声要素の初期設定
    audio.preload = 'auto';

    // 音源ノードの作成
    const source = newAudioContext.createMediaElementSource(audio);

    // AudioWorklet用のモジュールを追加
    // 各ノードを接続する
    source.connect(newAudioContext.destination);

    const audioInfo: AudioInfo = new AudioInfo();
    if (audioInfo != null && this._audios != null) {
      audioInfo.filePath = fileName;
      audioInfo.audioContext = newAudioContext;
      audioInfo.audio = audio;
      audioInfo.source = source;
      audioInfo.isPlay = false;
      audioInfo.previousSamplePosition = 0;
      audioInfo.audioElapsedTime = 0;

      // WavFileHandlerの作成
      const wavhandler = new LAppWavFileHandler();

      // Wavファイルの読み込み
      wavhandler.loadWavFile(fileName).then(result => {
        if (!result) {
          CubismLogError("wav file can't load. File name: " + fileName + '.');
          return;
        }
        audioInfo.wavhandler = wavhandler;
        audioInfo.audioSamples = audioInfo.wavhandler.getPcmDataChannel(0);
        this._audios.set(index, audioInfo);

        callback(audioInfo, index, model, motionSync);
      });
    }
    audio.src = fileName;

    // 再生終了時に再生されていないとマークする。
    audio.onended = function () {
      audioInfo.isPlay = false;

      // 再生終了時に再生時間をリセットする。
      audioInfo.previousSamplePosition = 0;
      audioInfo.audioElapsedTime = 0;
    };
  }

  /**
   * 音声の解放
   *
   * 配列に存在する音声全てを解放する。
   */
  public clearAudios(): void {
    for (let i = 0; i < this._audios.getSize(); i++) {
      this._audios.at(i).source.disconnect();
      this._audios.at(i).audioContext.close();
      this._audios.set(i, null);
    }

    this._audios.clear();
  }

  /**
   * 音声の解放
   *
   * 指定した音声コンテキストの音声を解放する。
   * @param audioContext 解放する音声コンテキスト
   */
  public releaseAudioByAudioContext(audioContext: AudioContext): void {
    for (let i = 0; i < this._audios.getSize(); i++) {
      if (this._audios.at(i).audioContext != audioContext) {
        continue;
      }
      this._audios.at(i).source.disconnect();
      this._audios.at(i).audioContext.close();
      this._audios.set(i, null);
      this._audios.remove(i);
      break;
    }
  }

  /**
   * 音声の解放
   *
   * 指定した名前の音声を解放する。
   * @param fileName 解放する音声ファイルパス
   */
  public releaseAudioByFilePath(fileName: string): void {
    for (let i = 0; i < this._audios.getSize(); i++) {
      if (this._audios.at(i).filePath != fileName) {
        continue;
      }
      this._audios.at(i).source.disconnect();
      this._audios.at(i).audioContext.close();
      this._audios.set(i, null);
      this._audios.remove(i);
      break;
    }
  }

  /**
   * 再生中かどうかを取得
   *
   * @param filePath 音声ファイルパス
   * @returns 指定した名前の音声が再生中か？
   */
  public isPlayByFilePath(filePath: string): boolean {
    for (let i = 0; i < this._audios.getSize(); i++) {
      if (this._audios.at(i).filePath != filePath) {
        continue;
      }

      return this.isPlayByIndex(i);
    }

    return false;
  }

  /**
   * 指定したファイルパスの音声を再生
   *
   * @param filePath 音声ファイルパス
   */
  public playByFilePath(filePath: string): void {
    for (let i = 0; i < this._audios.getSize(); i++) {
      if (this._audios.at(i).filePath != filePath) {
        continue;
      }

      this.playByIndex(i);
      break;
    }
  }

  /**
   * 指定したファイルパスの音声の再生を停止
   *
   * @param filePath 音声ファイルパス
   */
  public stopByFilePath(filePath: string): void {
    for (let i = 0; i < this._audios.getSize(); i++) {
      if (this._audios.at(i).filePath != filePath) {
        continue;
      }

      this.stopByIndex(i);
      break;
    }
  }

  /**
   * 指定したファイルパスの音声の再生を一時停止
   *
   * @param filePath 音声ファイルパス
   */
  public pauseByFilePath(filePath: string): void {
    for (let i = 0; i < this._audios.getSize(); i++) {
      if (this._audios.at(i).filePath != filePath) {
        continue;
      }

      this.pauseByIndex(i);
      break;
    }
  }

  /**
   * 再生中かどうかを取得
   *
   * @param index インデックス
   * @returns 指定したインデックスの音声が再生中か？
   */
  public isPlayByIndex(index: number): boolean {
    if (
      this._audios == null ||
      !(index < this._audios.getSize()) ||
      this._audios.at(index) == null
    ) {
      return false;
    }

    return this._audios.at(index).isPlay;
  }

  /**
   * 指定したインデックスの音声を再生
   *
   * @param index インデックス
   */
  public playByIndex(index: number): void {
    if (!(index < this._audios.getSize()) || this._audios.at(index) == null) {
      return;
    }

    const audioInfo = this._audios.at(index);

    audioInfo.audio.play().then(() => {
      audioInfo.isPlay = true;

      // 現在フレームの時間を秒単位で取得
      // NOTE: ブラウザやブラウザ側の設定により、performance.now() の精度が異なる可能性に注意
      const currentAudioTime = performance.now() / 1000; // convert to seconds.

      // 前回フレームの時間が現在時刻よりも前だった場合は同時刻として扱う
      if (currentAudioTime < audioInfo.audioContextPreviousTime) {
        audioInfo.audioContextPreviousTime = currentAudioTime;
      }
      audioInfo.audioContextPreviousTime = currentAudioTime;
    });
  }

  /**
   * 指定したインデックスの音声の再生を停止
   *
   * @param index インデックス
   */
  public stopByIndex(index: number): void {
    if (!(index < this._audios.getSize()) || this._audios.at(index) == null) {
      return;
    }

    const audioInfo = this._audios.at(index);
    audioInfo.audio.load();
    audioInfo.isPlay = false;

    // 再生位置をリセット
    audioInfo.previousSamplePosition = 0;
    audioInfo.audioElapsedTime = 0;
  }

  /**
   * 指定したインデックスの音声の再生を一時停止
   *
   * @param index インデックス
   */
  public pauseByIndex(index: number): void {
    if (!(index < this._audios.getSize()) || this._audios.at(index) == null) {
      return;
    }

    const audioInfo = this._audios.at(index);
    audioInfo.audio.pause();
    audioInfo.isPlay = false;
  }

  _audios: csmVector<AudioInfo>;
  _eBuffers: number[] = [];
}

/**
 * 音声情報構造体
 */
export class AudioInfo {
  audio: HTMLAudioElement; // 埋め込み音声要素
  audioContext: AudioContext = null; // 音声コンテキスト
  source: MediaElementAudioSourceNode = null; // 音源ノード
  filePath: string; // ファイル名
  isPlay: boolean; // 再生中か？
  audioContextPreviousTime: number = 0; // 音声コンテキストを最後に呼んだ時間
  wavhandler: LAppWavFileHandler = null; // WavFileHandlerのインスタンス
  audioSamples: Float32Array = null; // 音声データ
  audioElapsedTime: number = 0; // 再生した時間
  previousSamplePosition: number = 0; // 前回のサンプル数
}
