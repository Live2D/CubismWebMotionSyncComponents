/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { CubismMatrix44 } from '@framework/math/cubismmatrix44';
import { csmVector } from '@framework/type/csmvector';

import * as LAppDefine from '@cubismsdksamples/lappdefine';
import * as LappMotionSyncDefine from './lappmotionsyncdefine';
import { LAppMotionSyncModel } from './lappmotionsyncmodel';
import { LAppPal } from '@cubismsdksamples/lapppal';
import { LAppMotionSyncSubdelegate } from './lappmotionsyncsubdelegate';
import { LAppInputDevice } from './lappinputdevice';

/**
 * サンプルアプリケーションにおいてCubismModelを管理するクラス
 * モデル生成と破棄、タップイベントの処理、モデル切り替えを行う。
 */
export class LAppMotionSyncLive2DManager {
  /**
   * 現在のシーンで保持しているすべてのモデルを解放する
   */
  public releaseAllModel(): void {
    for (let i = 0; i < this._models.getSize(); i++) {
      // モデルの解放
      // 内部で音声バッファの解放も行う
      this._models.at(i).release();
      this._models.set(i, null);
    }
    this._models.clear();
  }

  /**
   * 画面をタップした時の処理
   *
   * @param x 画面のX座標
   * @param y 画面のY座標
   */
  public onTap(x: number, y: number): void {
    if (LAppDefine.DebugLogEnable) {
      LAppPal.printMessage(
        `[APP]tap point: {x: ${x.toFixed(2)} y: ${y.toFixed(2)}}`
      );
    }
  }

  /**
   * 画面を更新するときの処理
   * モデルの更新処理及び描画処理を行う
   */
  public onUpdate(): void {
    const { width, height } = this._subdelegate.getCanvas();

    const projection: CubismMatrix44 = new CubismMatrix44();
    const model: LAppMotionSyncModel = this._models.at(0);
    let modelScale: number = 1.0;

    if (navigator.userAgent.includes('Mobile')) {
      modelScale = 0.5;
    }

    if (model.getModel()) {
      if (model.getModel().getCanvasWidth() > 1.0 && width < height) {
        // 横に長いモデルを縦長ウィンドウに表示する際モデルの横サイズでscaleを算出する
        model.getModelMatrix().setWidth(2.0);
        projection.scale(modelScale, (width / height) * modelScale);
      } else {
        projection.scale((height / width) * modelScale, modelScale);
      }

      // 必要があればここで乗算
      if (this._viewMatrix != null) {
        projection.multiplyByMatrix(this._viewMatrix);
      }
    }

    model.update();
    model.draw(projection); // 参照渡しなのでprojectionは変質する。
  }

  /**
   * 次の音声に切り替える
   */
  public changeNextIndexSound() {
    const model = this._models.at(0);

    if (!model.isSuspendedCurrentSoundContext()) {
      model.stopCurrentSound();

      // インデックスを更新
      model._soundIndex =
        (model._soundIndex + 1) % model._soundFileList.getSize();
    }
    model.playCurrentSound();
  }

  /**
   * 次のシーンに切りかえる
   * サンプルアプリケーションではモデルセットの切り替えを行う。
   */
  public nextScene(): void {
    const no: number =
      (this._sceneIndex + 1) % LappMotionSyncDefine.ModelDirSize;
    this.changeScene(no);
  }

  /**
   * シーンを切り替える
   * サンプルアプリケーションではモデルセットの切り替えを行う。
   * @param index モデルのインデックス
   */
  private changeScene(index: number): void {
    this._sceneIndex = index;
    if (LAppDefine.DebugLogEnable) {
      LAppPal.printMessage(`[APP]model index: ${this._sceneIndex}`);
    }

    // ModelDir[]に保持したディレクトリ名から
    // model3.jsonのパスを決定する。
    // ディレクトリ名とmodel3.jsonの名前を一致させておくこと。
    const model: string = LappMotionSyncDefine.ModelDir[index];
    const modelPath: string = LappMotionSyncDefine.ResourcesPath + model + '/';
    let modelJsonName: string = LappMotionSyncDefine.ModelDir[index];
    modelJsonName += '.model3.json';

    this.releaseAllModel();
    const instance = new LAppMotionSyncModel();
    instance.setSubdelegate(this._subdelegate);
    instance.loadAssets(modelPath, modelJsonName);
    if (this._subdelegate._useMicrophone) {
      instance.setProvider(LAppInputDevice.getInstance());
    }
    this._models.pushBack(instance);
  }

  public setViewMatrix(m: CubismMatrix44) {
    for (let i = 0; i < 16; i++) {
      this._viewMatrix.getArray()[i] = m.getArray()[i];
    }
  }

  /**
   * モデルの追加
   */
  public addModel(sceneIndex: number = 0): void {
    this._sceneIndex = sceneIndex;
    this.changeScene(this._sceneIndex);
  }

  /**
   * コンストラクタ
   */
  public constructor() {
    this._viewMatrix = new CubismMatrix44();
    this._models = new csmVector<LAppMotionSyncModel>();
    this._sceneIndex = 0;
  }

  /**
   * 解放する。
   */
  public release(): void {}

  /**
   * 初期化する。
   * @param subdelegate
   */
  public initialize(subdelegate: LAppMotionSyncSubdelegate): void {
    this._subdelegate = subdelegate;
    this.changeScene(this._sceneIndex);
  }

  /**
   * 自身が所属するSubdelegate
   */
  _subdelegate: LAppMotionSyncSubdelegate;

  _viewMatrix: CubismMatrix44; // モデル描画に用いるview行列
  _models: csmVector<LAppMotionSyncModel>; // モデルインスタンスのコンテナ
  _sceneIndex: number; // 表示するシーンのインデックス値
}
