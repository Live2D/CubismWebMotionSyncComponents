/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { csmVector } from '@framework/type/csmvector';

import { LAppResponseObject } from './lappmotionsyncaudiomanager';
import { CubismLogError } from '@framework/utils/cubismdebug';
import { ILAppAudioBufferProvider } from './lappiaudiobufferprovider';

export let s_instance: LAppInputDevice = null;

/**
 * AudioWorklet からデータを保持しておくためのバッファクラス
 *
 * LAppInputDevice 内部でのみ使用
 */
class AudioBuffer {
  private _buffer: Float32Array;
  private _size: number;
  private _head: number;

  public constructor(size: number) {
    this._buffer = new Float32Array(size);
    this._size = 0;
    this._head = 0;
  }

  public get size(): number {
    return this._size;
  }

  public addLast(value: number): void {
    this._buffer[this._head] = value;
    this._size = Math.min(this._size + 1, this._buffer.length);
    this._head++;
    if (this._head >= this._buffer.length) {
      this._head = 0;
    }
  }

  public toVector(): csmVector<number> {
    const result = new csmVector<number>(this._size);
    let p: number = this._head - this._size;
    if (p < 0) {
      p += this._buffer.length;
    }
    for (let i = 0; i < this._size; i++) {
      result.pushBack(this._buffer[p]);
      p++;
      if (p >= this._buffer.length) {
        p = 0;
      }
    }
    return result;
  }

  public clear(): void {
    this._size = 0;
    this._head = 0;
  }
}

export class LAppInputDevice implements ILAppAudioBufferProvider {
  /**
   * クラスのインスタンス（シングルトン）を返す。
   * インスタンスが生成されていない場合は内部でインスタンスを生成する。
   *
   * @return クラスのインスタンス
   */
  public static getInstance(): LAppInputDevice {
    if (s_instance == null) {
      s_instance = new LAppInputDevice();
    }

    return s_instance;
  }

  private _source: MediaStreamAudioSourceNode;
  private _context: AudioContext;
  private _buffer: AudioBuffer;
  private _lockId: string;
  private _isInitialized: boolean = false;

  public isInitialized(): boolean {
    return this._isInitialized;
  }

  public async initialize(): Promise<boolean> {
    // NOTE: Lock API はワーカーや他のタブと共有します。ロックに使う名称は極力他と被らないようにしてください。
    await navigator.locks.request(this._lockId, async lock => {
      if (this.isInitialized()) {
        return true;
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audios = devices.filter(
        (value, index, array) => value.kind === 'audioinput'
      );
      if (audios.length == 0) {
        CubismLogError('No audio input devices found.');
        return false;
      }
      const constraints: MediaStreamConstraints = {
        audio: { deviceId: audios[0].deviceId }
      };
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (error) {
        if (typeof error === 'object') {
          if ('message' in error) {
            console.error(error.message);
          }
        }
        return false;
      }
      const tracks = stream.getAudioTracks();
      if (tracks.length == 0) {
        return false;
      }
      const settings: MediaTrackSettings = tracks[0].getSettings();
      const isSampleRateSupported: boolean = 'sampleRate' in settings;
      // NOTE: 一部のブラウザはsampleRateを提供しないので暫定48000
      const sampleRate = isSampleRateSupported ? settings.sampleRate : 48000;
      // 多少余裕を持たせ(30fps)2フレーム分程度でバッファを作成
      // NOTE: `requestAnimationFrame()` がコールバックを呼ぶ仕様上の間隔はディスプレイリフレッシュレート依存のため
      // 本来はこのリフレッシュレートに沿ったfps値を設定すべきであるが、これを取得するAPIが存在しないため。
      // リフレッシュレートが30Hzを下回ることは基本的にはない想定で30としています。
      const frameRate: number = 30; // 最低限期待されるリフレッシュレート
      const amount: number = 2; // 2フレーム分
      this._buffer = new AudioBuffer(
        Math.trunc((sampleRate / frameRate) * amount)
      );
      // NOTE: AudioContext サポートしている sampleRate を知るすべが現状ないので未指定で作成
      this._context = new AudioContext();
      this._source = this._context.createMediaStreamSource(
        new MediaStream([tracks[0]])
      );
      await this._context.audioWorklet.addModule(
        './src/lappaudioworkletprocessor.js'
      );
      const audioWorkletNode = new AudioWorkletNode(
        this._context,
        'lappaudioworkletprocessor'
      );
      this._source.connect(audioWorkletNode);
      audioWorkletNode.connect(this._context.destination);
      audioWorkletNode.port.onmessage = this.onMessage.bind(this);

      this._isInitialized = true;
    });

    return true;
  }

  public getBuffer(): csmVector<number> {
    return this._buffer.toVector();
  }

  public reset(): void {
    this._buffer.clear();
  }

  private onMessage(e: MessageEvent<any>) {
    // 元がany型なので定義に入れる。
    const data: LAppResponseObject = e.data;

    // WorkletProcessorモジュールからデータを取得
    if (data.eventType === 'data' && data.audioBuffer) {
      for (let i = 0; i < data.audioBuffer.length; i++) {
        this._buffer.addLast(data.audioBuffer[i]);
      }
    }
  }

  public update(): void {
    throw new Error('Method not implemented.');
  }
  public release(): void {
    throw new Error('Method not implemented.');
  }

  public constructor() {
    // NOTE: 非同期な初期化処理が多重処理されないために Lock API を使用する際の Key
    // Lock API が文字列しか受け入れないため UUID を生成している。
    this._lockId = crypto.randomUUID();
    this._buffer = new AudioBuffer(0);
  }
}
