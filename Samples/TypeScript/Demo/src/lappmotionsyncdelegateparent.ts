/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { CubismFramework, Option } from '@framework/live2dcubismframework';
import { csmVector } from '@framework/type/csmvector';

import * as LAppDefine from '@cubismsdksamples/lappdefine';
import * as LappMotionSyncDefine from './lappmotionsyncdefine';
import { LAppPal } from '@cubismsdksamples/lapppal';
import {
  CubismMotionSync,
  MotionSyncOption
} from '@motionsyncframework/live2dcubismmotionsync';
import { LAppMotionSyncSubdelegate } from './lappmotionsyncsubdelegate';
import { CubismLogError } from '@framework/utils/cubismdebug';
import { LAppInputDevice } from './lappinputdevice';
import { ILAppAudioBufferProvider } from './lappiaudiobufferprovider';

/**
 * アプリケーションクラス。
 * Cubism SDKの管理を行う。
 */

export abstract class LAppMotionSyncDelegateParent {
  /**
   * マウスダウンしたときに呼ばれる。
   */
  private onMouseBegan(e: MouseEvent): void {
    for (
      let ite = this._subdelegates.begin();
      ite.notEqual(this._subdelegates.end());
      ite.preIncrement()
    ) {
      ite.ptr().onPointBegan(e.pageX, e.pageY);
    }
  }

  /**
   * ポインタが動いたら呼ばれる。
   */
  private onMouseMoved(e: MouseEvent): void {
    for (
      let ite = this._subdelegates.begin();
      ite.notEqual(this._subdelegates.end());
      ite.preIncrement()
    ) {
      ite.ptr().onPointMoved(e.pageX, e.pageY);
    }
  }

  /**
   * マウスアップしたときに呼ばれる。
   */
  private onMouseEnded(e: MouseEvent): void {
    for (
      let ite = this._subdelegates.begin();
      ite.notEqual(this._subdelegates.end());
      ite.preIncrement()
    ) {
      ite.ptr().onPointEnded(e.pageX, e.pageY);
    }
  }

  /**
   * タッチダウンしたときに呼ばれる。
   */
  private onTouchBegan(e: TouchEvent): void {
    for (
      let ite = this._subdelegates.begin();
      ite.notEqual(this._subdelegates.end());
      ite.preIncrement()
    ) {
      ite.ptr().onPointBegan(e.touches[0].pageX, e.touches[0].pageY);
    }
  }

  /**
   * タッチ中に動いたら呼ばれる。
   */
  private onTouchMoved(e: TouchEvent): void {
    for (
      let ite = this._subdelegates.begin();
      ite.notEqual(this._subdelegates.end());
      ite.preIncrement()
    ) {
      ite.ptr().onPointMoved(e.touches[0].pageX, e.touches[0].pageY);
    }
  }

  /**
   * タッチアップしたときに呼ばれる。
   */
  private onTouchEnded(e: TouchEvent): void {
    for (
      let ite = this._subdelegates.begin();
      ite.notEqual(this._subdelegates.end());
      ite.preIncrement()
    ) {
      ite.ptr().onPointEnded(e.touches[0].pageX, e.touches[0].pageY);
    }
  }

  /**
   * タッチがキャンセルされると呼ばれる。
   */
  private onTouchCancel(e: TouchEvent): void {
    for (
      let ite = this._subdelegates.begin();
      ite.notEqual(this._subdelegates.end());
      ite.preIncrement()
    ) {
      ite.ptr().onTouchCancel(e.touches[0].pageX, e.touches[0].pageY);
    }
  }

  /**
   * Resize canvas and re-initialize view.
   */
  public onResize(): void {
    for (let i = 0; i < this._subdelegates.getSize(); i++) {
      this._subdelegates.at(i).onResize();
    }
  }

  /**
   * 解放する。
   */
  public release(): void {
    this.releaseEventListener();
    this.releaseSubdelegates();

    // Cubism SDKの解放
    CubismFramework.dispose();
    CubismMotionSync.dispose();

    this._cubismOption = null;
    this._cubismMotionSyncOption = null;
  }

  /**
   * 実行処理。
   */
  public abstract run(): void;

  /**
   * イベントリスナーを解除する。
   */
  private releaseEventListener(): void {
    if (this.touchCancelEventListener != null) {
      document.removeEventListener(
        'pointerdown',
        this.touchCancelEventListener
      );
      this.touchCancelEventListener = null;
    }
    document.removeEventListener('pointerdown', this.pointEndedEventListener);
    this.pointEndedEventListener = null;
    document.removeEventListener('pointerdown', this.pointMovedEventListener);
    this.pointMovedEventListener = null;
    document.removeEventListener('pointerdown', this.pointBeganEventListener);
    this.pointBeganEventListener = null;
  }

  /**
   * Subdelegate を解放する
   */
  private releaseSubdelegates(): void {
    for (
      let ite = this._subdelegates.begin();
      ite.notEqual(this._subdelegates.end());
      ite.preIncrement()
    ) {
      ite.ptr().release();
    }

    this._subdelegates.clear();
    this._subdelegates = null;
  }

  /**
   * APPに必要な物を初期化する。
   */
  public initialize(): boolean {
    // Cubism SDKの初期化
    this.initializeCubism();

    this.initializeSubdelegates();
    this.initializeEventListener();

    LAppInputDevice.getInstance().initialize();

    return true;
  }

  /**
   * イベントリスナーを設定する。
   */
  private initializeEventListener(): void {
    const supportTouch: boolean = 'touchcancel' in document;
    if (supportTouch) {
      this.pointBeganEventListener = this.onTouchBegan.bind(this);
      this.pointMovedEventListener = this.onTouchMoved.bind(this);
      this.pointEndedEventListener = this.onTouchEnded.bind(this);
      this.touchCancelEventListener = this.onTouchCancel.bind(this);

      // タッチ関連コールバック関数登録
      document.addEventListener('touchdown', this.pointBeganEventListener, {
        passive: true
      });
      document.addEventListener('touchmove', this.pointMovedEventListener, {
        passive: true
      });
      document.addEventListener('touchup', this.pointEndedEventListener, {
        passive: true
      });
      document.addEventListener('touchcancel', this.touchCancelEventListener, {
        passive: true
      });
    } else {
      // マウス関連コールバック関数登録
      this.pointBeganEventListener = this.onMouseBegan.bind(this);
      this.pointMovedEventListener = this.onMouseMoved.bind(this);
      this.pointEndedEventListener = this.onMouseEnded.bind(this);

      document.addEventListener('mousedown', this.pointBeganEventListener, {
        passive: true
      });
      document.addEventListener('mousemove', this.pointMovedEventListener, {
        passive: true
      });
      document.addEventListener('mouseup', this.pointEndedEventListener, {
        passive: true
      });
    }
  }

  /**
   * Canvasを生成配置、Subdelegateを初期化する
   */
  private initializeSubdelegates(): void {
    let width: number = 100;
    let height: number = 100;
    if (LAppDefine.CanvasNum > 3) {
      const widthunit: number = Math.ceil(Math.sqrt(LAppDefine.CanvasNum));
      const heightUnit = Math.ceil(LAppDefine.CanvasNum / widthunit);
      width = 100.0 / widthunit;
      height = 100.0 / heightUnit;
    } else {
      width = 100.0 / LAppDefine.CanvasNum;
    }

    this._canvases.prepareCapacity(LAppDefine.CanvasNum);
    this._subdelegates.prepareCapacity(LAppDefine.CanvasNum);
    for (let i = 0; i < LAppDefine.CanvasNum; i++) {
      const canvas = document.createElement('canvas');
      this._canvases.pushBack(canvas);
      canvas.style.width = `${width}vw`;
      canvas.style.height = `${height}vh`;

      // キャンバスを DOM に追加
      document.body.appendChild(canvas);
    }

    for (let i = 0; i < this._canvases.getSize(); i++) {
      const subdelegate = new LAppMotionSyncSubdelegate();
      subdelegate._useMicrophone =
        i == LappMotionSyncDefine.UseMicrophoneCanvas;
      subdelegate.initialize(this._canvases.at(i));
      this._subdelegates.pushBack(subdelegate);
    }

    for (let i = 0; i < LAppDefine.CanvasNum; i++) {
      if (this._subdelegates.at(i).isContextLost()) {
        CubismLogError(
          `The context for Canvas at index ${i} was lost, possibly because the acquisition limit for WebGLRenderingContext was reached.`
        );
      }
    }
  }

  /**
   * Privateなコンストラクタ
   */
  protected constructor() {
    this._cubismOption = new Option();
    this._cubismMotionSyncOption = new MotionSyncOption();
    this._subdelegates = new csmVector<LAppMotionSyncSubdelegate>();
    this._canvases = new csmVector<HTMLCanvasElement>();
  }

  /**
   * Cubism SDKの初期化
   */
  public initializeCubism(): void {
    LAppPal.updateTime();

    // setup cubism
    this._cubismOption.logFunction = LAppPal.printMessage;
    this._cubismOption.loggingLevel = LAppDefine.CubismLoggingLevel;
    CubismFramework.startUp(this._cubismOption);

    // setup motionsync
    this._cubismMotionSyncOption.logFunction = LAppPal.printMessage;
    this._cubismMotionSyncOption.loggingLevel = LAppDefine.CubismLoggingLevel;
    CubismMotionSync.startUp(this._cubismMotionSyncOption);

    // initialize cubism
    CubismFramework.initialize();
    CubismMotionSync.initialize();
  }

  /**
   * Cubism SDK Option
   */
  private _cubismOption: Option;

  /**
   * Cubism SDK MotionSync Option
   */
  private _cubismMotionSyncOption: MotionSyncOption;

  /**
   * 操作対象のcanvas要素
   */
  private _canvases: csmVector<HTMLCanvasElement>;

  /**
   * Subdelegate
   */
  protected _subdelegates: csmVector<LAppMotionSyncSubdelegate>;

  /**
   * 音声データを提供するインスタンス
   */
  protected _audioBufferProvider: ILAppAudioBufferProvider;

  /**
   * 登録済みイベントリスナー 関数オブジェクト
   */
  private pointBeganEventListener: (
    this: Document,
    ev: MouseEvent | TouchEvent
  ) => void;

  /**
   * 登録済みイベントリスナー 関数オブジェクト
   */
  private pointMovedEventListener: (
    this: Document,
    ev: MouseEvent | TouchEvent
  ) => void;

  /**
   * 登録済みイベントリスナー 関数オブジェクト
   */
  private pointEndedEventListener: (
    this: Document,
    ev: MouseEvent | TouchEvent
  ) => void;

  /**
   * 登録済みイベントリスナー 関数オブジェクト
   */
  private touchCancelEventListener: (
    this: Document,
    ev: MouseEvent | TouchEvent
  ) => void;
}
