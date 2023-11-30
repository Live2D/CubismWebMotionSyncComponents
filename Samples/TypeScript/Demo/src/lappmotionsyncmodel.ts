/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import 'whatwg-fetch';

import { CubismIdHandle } from '@framework/id/cubismid';
import { CubismMatrix44 } from '@framework/math/cubismmatrix44';
import { CubismUserModel } from '@framework/model/cubismusermodel';
import { csmMap } from '@framework/type/csmmap';
import { csmRect } from '@framework/type/csmrectf';
import { csmString } from '@framework/type/csmstring';
import { csmVector } from '@framework/type/csmvector';
import {
  CSM_ASSERT,
  CubismLogError,
  CubismLogInfo
} from '@framework/utils/cubismdebug';

import * as LAppDefine from '@cubismsdksamples/lappdefine';
import * as LAppMotionSyncDefine from './lappmotionsyncdefine';
import { frameBuffer, LAppMotionSyncDelegate } from './lappmotionsyncdelegate';
import { LAppPal } from '@cubismsdksamples/lapppal';
import { TextureInfo } from '@cubismsdksamples/lapptexturemanager';
import { CubismMoc } from '@framework/model/cubismmoc';
import { CubismModelMotionSyncSettingJson } from '@motionsyncframework/cubismmodelmotionsyncsettingjson';
import { LAppPlaySound } from './lappplaysound';
import { CubismMotionSync } from '@motionsyncframework/live2dcubismmotionsync';
import { canvas, gl } from '@cubismsdksamples/lappglmanager';

enum LoadStep {
  LoadAssets,
  LoadModel,
  WaitLoadModel,
  LoadExpression,
  WaitLoadExpression,
  LoadPhysics,
  WaitLoadPhysics,
  LoadPose,
  WaitLoadPose,
  SetupEyeBlink,
  SetupBreath,
  LoadUserData,
  WaitLoadUserData,
  SetupEyeBlinkIds,
  SetupLipSyncIds,
  SetupLayout,
  LoadMotionSync,
  LoadMotion,
  WaitLoadMotion,
  CompleteInitialize,
  CompleteSetupModel,
  LoadTexture,
  WaitLoadTexture,
  CompleteSetup
}

/**
 * ユーザーが実際に使用するモデルの実装クラス<br>
 * モデル生成、機能コンポーネント生成、更新処理とレンダリングの呼び出しを行う。
 */
export class LAppMotionSyncModel extends CubismUserModel {
  /**
   * model3.jsonが置かれたディレクトリとファイルパスからモデルを生成する
   * @param dir
   * @param fileName
   */
  public loadAssets(dir: string, fileName: string): void {
    this._modelHomeDir = dir;

    fetch(`${this._modelHomeDir}${fileName}`)
      .then(response => response.arrayBuffer())
      .then(arrayBuffer => {
        const setting: CubismModelMotionSyncSettingJson =
          new CubismModelMotionSyncSettingJson(
            arrayBuffer,
            arrayBuffer.byteLength
          );

        // ステートを更新
        this._state = LoadStep.LoadModel;

        // 結果を保存
        this.setupModel(setting);
      });
  }

  /**
   * model3.jsonからモデルを生成する。
   * model3.jsonの記述に従ってモデル生成、モーション、物理演算などのコンポーネント生成を行う。
   *
   * @param setting ICubismModelSettingのインスタンス
   */
  private setupModel(setting: CubismModelMotionSyncSettingJson): void {
    this._updating = true;
    this._initialized = false;

    this._modelSetting = setting;

    // CubismModel
    if (this._modelSetting.getModelFileName() != '') {
      const modelFileName = this._modelSetting.getModelFileName();

      fetch(`${this._modelHomeDir}${modelFileName}`)
        .then(response => response.arrayBuffer())
        .then(arrayBuffer => {
          this.loadModel(arrayBuffer, this._mocConsistency);

          this._state = LoadStep.SetupLayout;

          // Callback
          setupLayout();
        });

      this._state = LoadStep.WaitLoadModel;
    } else {
      LAppPal.printMessage('Model data does not exist.');
    }

    // Layout
    const setupLayout = (): void => {
      const layout: csmMap<string, number> = new csmMap<string, number>();

      if (this._modelSetting == null || this._modelMatrix == null) {
        CubismLogError('Failed to setupLayout().');
        return;
      }

      this._modelSetting.getLayoutMap(layout);
      this._modelMatrix.setupFromLayout(layout);
      this._state = LoadStep.LoadMotionSync;

      // MotionSync
      setupMotionSync();
    };

    // MotionSync
    const setupMotionSync = (): void => {
      if (this._modelSetting.getMotionSyncFileName() != '') {
        const motionSyncFile = this._modelSetting.getMotionSyncFileName();

        fetch(`${this._modelHomeDir}${motionSyncFile}`)
          .then(response => response.arrayBuffer())
          .then(arrayBuffer => {
            this.loadMotionSync(arrayBuffer, arrayBuffer.byteLength);
            // 音声ファイルの読み込み
            this._soundFileList =
            this._modelSetting.getMotionSyncSoundFileList();
            this._soundIndex = 0;
          }).then(() => {
            this.loadFromSoundList();

            this._state = LoadStep.LoadTexture;

            this._updating = false;
            this._initialized = true;

            this.createRenderer();
            this.setupTextures();
            this.getRenderer().startUp(gl);
          });
      }
    };
  }

  /**
   * モーションシンクデータの読み込み
   * @param buffer  physics3.jsonが読み込まれているバッファ
   * @param size    バッファのサイズ
   */
  private loadMotionSync(buffer: ArrayBuffer, size: number) {
    this._motionSync = CubismMotionSync.create(
      this._model,
      buffer,
      size,
      LAppMotionSyncDefine.SamplesPerSec
    );
  }

  /**
   * テクスチャユニットにテクスチャをロードする
   */
  private setupTextures(): void {
    // iPhoneでのアルファ品質向上のためTypescriptではpremultipliedAlphaを採用
    const usePremultiply = true;

    if (this._state == LoadStep.LoadTexture) {
      // テクスチャ読み込み用
      const textureCount: number = this._modelSetting.getTextureCount();

      for (
        let modelTextureNumber = 0;
        modelTextureNumber < textureCount;
        modelTextureNumber++
      ) {
        // テクスチャ名が空文字だった場合はロード・バインド処理をスキップ
        if (this._modelSetting.getTextureFileName(modelTextureNumber) == '') {
          console.log('getTextureFileName null');
          continue;
        }

        // WebGLのテクスチャユニットにテクスチャをロードする
        let texturePath =
          this._modelSetting.getTextureFileName(modelTextureNumber);
        texturePath = this._modelHomeDir + texturePath;

        // ロード完了時に呼び出すコールバック関数
        const onLoad = (textureInfo: TextureInfo): void => {
          this.getRenderer().bindTexture(modelTextureNumber, textureInfo.id);

          this._textureCount++;

          if (this._textureCount >= textureCount) {
            // ロード完了
            this._state = LoadStep.CompleteSetup;
          }
        };

        // 読み込み
        LAppMotionSyncDelegate.getInstance()
          .getTextureManager()
          .createTextureFromPngFile(texturePath, usePremultiply, onLoad);
        this.getRenderer().setIsPremultipliedAlpha(usePremultiply);
      }

      this._state = LoadStep.WaitLoadTexture;
    }
  }

  /**
   * レンダラを再構築する
   */
  public reloadRenderer(): void {
    this.deleteRenderer();
    this.createRenderer();
    this.setupTextures();
  }

  /**
   * 音声ファイルリストから読み込みを行う。
   */
  public loadFromSoundList(): void {
    if (!this._soundFileList || !this._soundData) {
      return;
    }

    this._soundData.getSoundBufferContext().getAudioManager()._audios.resize(this._soundFileList.getSize());
    this._soundData.getSoundBufferContext().getBuffers().resize(this._soundFileList.getSize());

    for (let index = 0; index < this._soundFileList.getSize(); index++) {
      const filePath = this._modelHomeDir + this._soundFileList.at(index).s;
      this._soundData.loadFile(filePath, index);
    }
  }

  /**
   * 現在の音声のコンテキストが待機状態かどうかを判定する
   *
   * @returns 現在の音声のコンテキストが待機状態か？
   */
  public isSuspendedCurrentSoundContext(): boolean {
    return this._soundData.isSuspendedContextByIndex(this._soundIndex);
  }

  /**
   * 現在の音声を再生する
   */
  public playCurrentSound(): void {
    if (
      !this._soundData ||
      !this._soundFileList ||
      !(this._soundIndex < this._soundFileList.getSize())
    ) {
      return;
    }

    this._motionSync.setSoundBuffer(
      0,
      this._soundData
        .getSoundBufferContext()
        .getBuffers()
        .at(this._soundIndex)
    );

    this._soundData.playByIndex(this._soundIndex);
  }

  /**
   * 現在の音声を再生停止する
   */
  public stopCurrentSound(): void {
    if (
      !this._soundData ||
      !this._soundFileList ||
      !(this._soundIndex < this._soundFileList.getSize())
    ) {
      return;
    }

    this._soundData.stopByIndex(this._soundIndex);
  }

  /**
   * 更新
   */
  public update(): void {
    if (this._state != LoadStep.CompleteSetup) return;

    const deltaTimeSeconds: number = LAppPal.getDeltaTime();
    this._userTimeSeconds += deltaTimeSeconds;

    // 物理演算の設定
    if (this._physics != null) {
      this._physics.evaluate(this._model, deltaTimeSeconds);
    }

    // ポーズの設定
    if (this._pose != null) {
      this._pose.updateParameters(this._model, deltaTimeSeconds);
    }

    if (this._soundData.isPlayByIndex(this._soundIndex)) {
      // 現在のフレームのデータを取得
      this._soundData.update();

      // サウンドバッファを新しいものへ更新
      this._motionSync.setSoundBuffer(0, this._soundData.getSoundBufferContext().getBuffers().at(this._soundIndex));

      // 現在のフレームのデータから解析処理を行う
      this._motionSync.updateParameters(this._model, deltaTimeSeconds);

      // 現在のフレームでの解析したサンプル数
      const processedCount = this._motionSync.getLastTotalProcessedCount(0);

      // 解析した数だけデータの配列の先頭から削除
      this._soundData.removeDataArrayByIndex(this._soundIndex, processedCount);
    }

    this._model.update();
  }

  /**
   * イベントの発火を受け取る
   */
  public motionEventFired(eventValue: csmString): void {
    CubismLogInfo('{0} is fired on LAppModel!!', eventValue.s);
  }

  /**
   * 当たり判定テスト
   * 指定ＩＤの頂点リストから矩形を計算し、座標をが矩形範囲内か判定する。
   *
   * @param hitArenaName  当たり判定をテストする対象のID
   * @param x             判定を行うX座標
   * @param y             判定を行うY座標
   */
  public hitTest(hitArenaName: string, x: number, y: number): boolean {
    // 透明時は当たり判定無し。
    if (this._opacity < 1) {
      return false;
    }

    const count: number = this._modelSetting.getHitAreasCount();

    for (let i = 0; i < count; i++) {
      if (this._modelSetting.getHitAreaName(i) == hitArenaName) {
        const drawId: CubismIdHandle = this._modelSetting.getHitAreaId(i);
        return this.isHit(drawId, x, y);
      }
    }

    return false;
  }

  /**
   * モデルを描画する処理。モデルを描画する空間のView-Projection行列を渡す。
   */
  public doDraw(): void {
    if (this._model == null) return;

    // キャンバスサイズを渡す
    const viewport: number[] = [0, 0, canvas.width, canvas.height];

    this.getRenderer().setRenderState(frameBuffer, viewport);
    this.getRenderer().drawModel();
  }

  /**
   * モデルを描画する処理。モデルを描画する空間のView-Projection行列を渡す。
   */
  public draw(matrix: CubismMatrix44): void {
    if (this._model == null) {
      return;
    }

    // 各読み込み終了後
    if (this._state == LoadStep.CompleteSetup) {
      matrix.multiplyByMatrix(this._modelMatrix);

      this.getRenderer().setMvpMatrix(matrix);

      this.doDraw();
    }
  }

  public async hasMocConsistencyFromFile() {
    CSM_ASSERT(this._modelSetting.getModelFileName().localeCompare(``));

    // CubismModel
    if (this._modelSetting.getModelFileName() != '') {
      const modelFileName = this._modelSetting.getModelFileName();

      const response = await fetch(`${this._modelHomeDir}${modelFileName}`);
      const arrayBuffer = await response.arrayBuffer();

      this._consistency = CubismMoc.hasMocConsistency(arrayBuffer);

      if (!this._consistency) {
        CubismLogInfo('Inconsistent MOC3.');
      } else {
        CubismLogInfo('Consistent MOC3.');
      }

      return this._consistency;
    } else {
      LAppPal.printMessage('Model data does not exist.');
    }
  }

  /**
   * コンストラクタ
   */
  public constructor() {
    super();

    this._modelSetting = null;
    this._modelHomeDir = null;
    this._userTimeSeconds = 0.0;

    this._hitArea = new csmVector<csmRect>();
    this._userArea = new csmVector<csmRect>();

    if (LAppDefine.MOCConsistencyValidationEnable) {
      this._mocConsistency = true;
    }

    this._state = LoadStep.LoadAssets;
    this._expressionCount = 0;
    this._textureCount = 0;
    this._motionCount = 0;
    this._allMotionCount = 0;
    this._consistency = false;
    this._soundFileList = new csmVector<csmString>();
    this._soundIndex = 0;
    this._soundData = new LAppPlaySound();
  }

  public override release(): void {
    super.release();

    if(this._motionSync){
      this._motionSync.release();
      this._motionSync = null;
    }

    if(this._soundFileList){
      this._soundFileList?.clear();
      this._soundFileList = null;
    }

    if(this._soundData){
      this._soundData?.release();
      this._soundData = null;
    }
  }

  _modelSetting: CubismModelMotionSyncSettingJson; // モデルセッティング情報
  _modelHomeDir: string; // モデルセッティングが置かれたディレクトリ
  _userTimeSeconds: number; // デルタ時間の積算値[秒]

  _hitArea: csmVector<csmRect>;
  _userArea: csmVector<csmRect>;

  _state: LoadStep; // 現在のステータス管理用
  _expressionCount: number; // 表情データカウント
  _textureCount: number; // テクスチャカウント
  _motionCount: number; // モーションデータカウント
  _allMotionCount: number; // モーション総数
  _consistency: boolean; // MOC3一貫性チェック管理用

  _soundFileList: csmVector<csmString>; // モーションシンクで利用するファイルのリスト
  _soundIndex: number; // 再生する音声データのインデックス
  _soundData: LAppPlaySound; // 音声管理
  _motionSync: CubismMotionSync; // モーションシンク
}
