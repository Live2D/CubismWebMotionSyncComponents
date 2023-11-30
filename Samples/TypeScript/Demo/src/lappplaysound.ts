/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { csmVector } from '@framework/type/csmvector';
import {
  AudioInfo,
  LAppMotionSyncAudioManager
} from './lappmotionsyncaudiomanager';
import * as LAppMotionSyncDefine from './lappmotionsyncdefine';

export class LAppPlaySound {
  /**
   * パスからの音声ファイルの読み込み
   *
   * @param path ファイルパス
   */
  public loadFile(path: string, index: number): void {
    this._soundBufferContext
      .getAudioManager()
      .createAudioFromFile(
        path,
        index,
        null,
        (audioInfo: AudioInfo, index: number): void => {
          this._soundBufferContext
            .getBuffers()
            .set(
              index,
              new csmVector<number>()
            );

          // 前回のサンプルから進んだ数の配列に設定
          this._soundBufferContext.getUpdateSizes().pushBack(0);

          // Messege発した時にデータ取って来れるように設定
          this._soundBufferContext
            .getAudioManager()
            .setOnMessageByIndex(
              index,
              this._soundBufferContext.getBuffers().at(index),
              this._soundBufferContext.getUpdateSizes()
            );
        }
      );
  }

  /**
   * 更新
   */
  public update(): void {
    const audioManager = this._soundBufferContext.getAudioManager();
    const updateSizes = this._soundBufferContext.getUpdateSizes();

    for (let index = 0; index < audioManager._audios.getSize(); index++) {
      if (!audioManager.isPlayByIndex(index)) {
        continue;
      }

      // 更新されたので要素数をリセット
      updateSizes.set(index, 0);
    }
  }

  /**
   * コンテナの先頭から要素を削除して他の要素をシフトする
   *
   * @param buffer 変更するバッファ
   * @param size 削除する大きさ
   * @returns 変更後のバッファ
   */
  public spliceBegin(buffer: csmVector<number>, size: number): csmVector<number> {
    if (!buffer?.begin() || buffer?._size <= size) {
      return buffer; // 削除範囲外
    }

    // 削除
    buffer._ptr.splice(0, size);
    buffer._size -= size;

    return buffer;
  }

  /**
   * 先頭からsize分データを削除する
   *
   * @param index データを削除するバッファのインデックス
   * @param size 削除するデータの要素数
   */
  public removeDataArrayByIndex(index: number, size: number) {
    let buffer = this._soundBufferContext.getBuffers().at(index);

    if (size < buffer.getSize()) {
      // 途中からのバッファにする
      buffer = this.spliceBegin(buffer, size);
    } else {
      // バッファの全要素をクリア
      buffer.clear();
    }
  }

  /**
   * 指定したインデックスの音声コンテキストが待機状態になっているかを判定する
   *
   * @param index 指定するインデックス
   * @returns 音声コンテキストが待機状態になっているか？
   */
  public isSuspendedContextByIndex(index: number): boolean {
    const audioContext = this.getSoundBufferContext()
      .getAudioManager()
      ._audios.at(index).audioContext;

    return audioContext.state == 'suspended';
  }

  /**
   * インデックスを使って音声を再生する。
   *
   * @param index インデックス
   */
  public playByIndex(index: number): void {
    if (this.isPlayByIndex(index)) {
      return;
    }

    const audioContext = this.getSoundBufferContext()
      .getAudioManager()
      ._audios.at(index).audioContext;

    // まだ待機状態だったらrunningにする
    if (this.isSuspendedContextByIndex(index)) {
      audioContext.resume().then(() => {
        this._soundBufferContext.getAudioManager().playByIndex(index);
      });
    } else {
      this._soundBufferContext.getAudioManager().playByIndex(index);
    }
  }

  /**
   * インデックスを使って音声の再生を停止する。
   *
   * @param index インデックス
   */
  public stopByIndex(index: number): void {
    if (!this.isPlayByIndex(index)) {
      return;
    }

    this._soundBufferContext.getAudioManager().stopByIndex(index);

    // バッファの中身をクリアする。
    const buffer = this._soundBufferContext.getBuffers().at(index);
    buffer.clear();
  }

  /**
   * インデックスを使って音声が再生中か判定する。
   *
   * @param index インデックス
   * @returns 再生中か？
   */
  public isPlayByIndex(index: number): boolean {
    return this._soundBufferContext.getAudioManager().isPlayByIndex(index);
  }

  public getSoundBufferContext(): SoundBufferContext {
    return this._soundBufferContext;
  }

  public constructor() {
    this._soundBufferContext = new SoundBufferContext();
  }

  public release() {
    if(this._soundBufferContext) {
      this._soundBufferContext.release();
      this._soundBufferContext = void 0;
    }
  }

  private _soundBufferContext: SoundBufferContext;
}

export class SoundBufferContext {
  public getBuffers(): csmVector<csmVector<number>> {
    return this._buffers;
  }

  public getAudioManager(): LAppMotionSyncAudioManager {
    return this._audioManager;
  }

  public getUpdateSizes(): csmVector<number> {
    return this._updateSizes;
  }

  public setUpdateSize(index: number, value: number) {
    this._updateSizes.set(index, value);
  }

  public constructor(
    buffers?: csmVector<csmVector<number>>,
    audioManager?: LAppMotionSyncAudioManager,
    updateSizes?: csmVector<number>
  ) {
    this._buffers = buffers
      ? buffers
      : new csmVector<csmVector<number>>();
    this._audioManager = audioManager
      ? audioManager
      : new LAppMotionSyncAudioManager();
    this._updateSizes = updateSizes ? updateSizes : new csmVector<number>();
  }

  public release() {
    if(this._buffers != null){
      this._buffers.clear();
      this._buffers = void 0;
    }

    if(this._audioManager != null){
      this._audioManager.release();
      this._audioManager = void 0;
    }

    if(this._updateSizes != null){
      this._updateSizes.clear();
      this._updateSizes = void 0;
    }
  }

  private _buffers: csmVector<csmVector<number>>;
  private _audioManager: LAppMotionSyncAudioManager;
  private _updateSizes: csmVector<number>;
}
