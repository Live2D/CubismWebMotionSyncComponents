/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { csmVector } from '@framework/type/csmvector';

import { LAppResponseObject } from './lappmotionsyncaudiomanager';
import { CubismLogError } from '@framework/utils/cubismdebug';

export let s_instance: LAppInputDevice = null;
export let connected: boolean = false;

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

export class LAppInputDevice {
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

  public async initialize(): Promise<boolean> {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audios = devices.filter(
      (value, _index, _array) => value.kind === 'audioinput'
    );
    if (audios.length == 0) {
      CubismLogError('No audio input devices found.');
      return false;
    }
    const constraints: MediaStreamConstraints = {
      audio: { deviceId: audios[0].deviceId }
    };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    const tracks = stream.getAudioTracks();
    if (tracks.length == 0) {
      return false;
    }
    const sampleRate = tracks[0].getSettings().sampleRate;
    // 多少余裕を持たせ(30fps)2フレーム分程度でバッファを作成
    // NOTE: `requestAnimationFrame()` がコールバックを呼ぶ仕様上の間隔はディスプレイリフレッシュレート依存のため
    // 本来はこのリフレッシュレートに沿ったfps値を設定すべきであるが、これを取得するAPIが存在しないため。
    // リフレッシュレートが30Hzを下回ることは基本的にはない想定で30としています。
    const frameRate: number = 30; // 最低限期待されるリフレッシュレート
    const amount: number = 2; // 2フレーム分
    this._buffer = new AudioBuffer(
      Math.trunc((sampleRate / frameRate) * amount)
    );
    this._context = new AudioContext({ sampleRate: sampleRate });
    this._source = this._context.createMediaStreamSource(
      new MediaStream([tracks[0]])
    );
    return true;
  }

  public async connect(): Promise<void> {
    if (connected) {
      return;
    }

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

    connected = true;
  }

  public pop(): csmVector<number> {
    const buffer = this._buffer.toVector();
    this._buffer.clear();
    return buffer;
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

  public constructor() {}
}
