/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { CubismIdHandle } from '@framework/id/cubismid';
import { CubismMatrix44 } from '@framework/math/cubismmatrix44';
import { CubismUserModel } from '@framework/model/cubismusermodel';
import { csmRect } from '@framework/type/csmrectf';
import {
  CSM_ASSERT,
  CubismLogError,
  CubismLogInfo
} from '@framework/utils/cubismdebug';

import * as LAppDefine from '@cubismsdksamples/lappdefine';
import * as LAppMotionSyncDefine from './lappmotionsyncdefine';
import { LAppPal } from '@cubismsdksamples/lapppal';
import { TextureInfo } from '@cubismsdksamples/lapptexturemanager';
import { CubismMoc } from '@framework/model/cubismmoc';
import { CubismModelMotionSyncSettingJson } from '@motionsyncframework/cubismmodelmotionsyncsettingjson';
import { LAppAudioManager } from './lappaudiomanager';
import { CubismMotionSync } from '@motionsyncframework/live2dcubismmotionsync';
import { LAppMotionSyncSubdelegate } from './lappmotionsyncsubdelegate';
import { ILAppAudioBufferProvider } from './lappiaudiobufferprovider';
import {
  ACubismMotion,
  BeganMotionCallback,
  FinishedMotionCallback
} from '@framework/motion/acubismmotion';
import { CubismMotion } from '@framework/motion/cubismmotion';
import {
  CubismMotionQueueEntryHandle,
  InvalidMotionQueueEntryHandleValue
} from '@framework/motion/cubismmotionqueuemanager';
import { CubismUpdateScheduler } from '@framework/motion/cubismupdatescheduler';
import { CubismPhysicsUpdater } from '@framework/motion/cubismphysicsupdater';
import { CubismPoseUpdater } from '@framework/motion/cubismposeupdater';
import { CubismMotionSyncUpdater } from '@motionsyncframework/cubismmotionsyncupdater';

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
  SetupLook,
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
      })
      .catch(error => {
        // model3.json読み込みでエラーが発生した時点で描画は不可能なので、setupせずエラーをcatchして何もしない
        CubismLogError(`Failed to load file ${this._modelHomeDir}${fileName}`);
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
        .then(response => {
          if (response.ok) {
            return response.arrayBuffer();
          } else if (response.status >= 400) {
            CubismLogError(
              `Failed to load file ${this._modelHomeDir}${modelFileName}`
            );
            return new ArrayBuffer(0);
          }
        })
        .then(arrayBuffer => {
          this.loadModel(arrayBuffer, this._mocConsistency);

          this._state = LoadStep.LoadPhysics;

          // Callback
          loadCubismPhysics();
        });

      this._state = LoadStep.WaitLoadModel;
    } else {
      LAppPal.printMessage('Model data does not exist.');
    }

    // Physics
    const loadCubismPhysics = (): void => {
      if (this._modelSetting.getPhysicsFileName() != '') {
        const physicsFileName = this._modelSetting.getPhysicsFileName();

        fetch(`${this._modelHomeDir}${physicsFileName}`)
          .then(response => {
            if (response.ok) {
              return response.arrayBuffer();
            } else if (response.status >= 400) {
              CubismLogError(
                `Failed to load file ${this._modelHomeDir}${physicsFileName}`
              );
              return new ArrayBuffer(0);
            }
          })
          .then(arrayBuffer => {
            this.loadPhysics(arrayBuffer, arrayBuffer.byteLength);

            // Physics Updaterの追加
            if (this._physics) {
              const physicsUpdater = new CubismPhysicsUpdater(this._physics);
              this._updateScheduler.addUpdatableList(physicsUpdater);
            }

            this._state = LoadStep.LoadPose;

            // Pose
            loadCubismPose();
          });
        this._state = LoadStep.WaitLoadPhysics;
      } else {
        this._state = LoadStep.LoadPose;

        // Pose
        loadCubismPose();
      }
    };

    // Pose
    const loadCubismPose = (): void => {
      if (this._modelSetting.getPoseFileName() != '') {
        const poseFileName = this._modelSetting.getPoseFileName();

        fetch(`${this._modelHomeDir}${poseFileName}`)
          .then(response => {
            if (response.ok) {
              return response.arrayBuffer();
            } else if (response.status >= 400) {
              CubismLogError(
                `Failed to load file ${this._modelHomeDir}${poseFileName}`
              );
              return new ArrayBuffer(0);
            }
          })
          .then(arrayBuffer => {
            this.loadPose(arrayBuffer, arrayBuffer.byteLength);

            // Pose Updaterの追加
            if (this._pose) {
              const poseUpdater = new CubismPoseUpdater(this._pose);
              this._updateScheduler.addUpdatableList(poseUpdater);
            }

            // callback
            finalizeUpdaters();
          });
        this._state = LoadStep.WaitLoadPose;
      } else {
        // callback
        finalizeUpdaters();
      }
    };

    // UpdateScheduler最終化処理
    const finalizeUpdaters = (): void => {
      // 全てのUpdaterが追加されたのでUpdateSchedulerを最終ソート
      this._updateScheduler.sortUpdatableList();

      this._state = LoadStep.SetupLayout;

      // callback
      setupLayout();
    };

    // Layout
    const setupLayout = (): void => {
      const layout: Map<string, number> = new Map<string, number>();

      if (this._modelSetting == null || this._modelMatrix == null) {
        CubismLogError('Failed to setupLayout().');
        return;
      }

      this._modelSetting.getLayoutMap(layout);
      this._modelMatrix.setupFromLayout(layout);
      this._state = LoadStep.LoadMotion;

      // Motion.
      loadCubismMotion();
    };

    // Motion
    const loadCubismMotion = (): void => {
      this._state = LoadStep.WaitLoadMotion;
      this._model.saveParameters();
      this._allMotionCount = 0;
      this._motionCount = 0;
      const group: string[] = [];

      const motionGroupCount: number = this._modelSetting.getMotionGroupCount();

      // モーションの総数を求める
      for (let i = 0; i < motionGroupCount; i++) {
        group[i] = this._modelSetting.getMotionGroupName(i);
        this._allMotionCount += this._modelSetting.getMotionCount(group[i]);
      }

      // モーションの読み込み
      for (let i = 0; i < motionGroupCount; i++) {
        this.preLoadMotionGroup(group[i]);
      }

      this._state = LoadStep.LoadMotionSync;

      // 全てのモーションを停止する
      this._motionManager.stopAllMotions();

      // MotionSync
      setupMotionSync();

      this._state = LoadStep.LoadTexture;

      this._updating = false;
      this._initialized = true;

      this.createRenderer(
        this._subdelegate.getCanvas().width,
        this._subdelegate.getCanvas().height
      );
      this.setupTextures();
      this.getRenderer().startUp(this._subdelegate.getGlManager().getGl());
    };

    // MotionSync
    const setupMotionSync = (): void => {
      if (this._modelSetting.getMotionSyncFileName() != '') {
        const motionSyncFile = this._modelSetting.getMotionSyncFileName();

        // NOTE: MotionSyncFileが見つからない場合 'NullValue' が返るため、明示的に判定を行う。
        if (!motionSyncFile || motionSyncFile == 'NullValue') {
          CubismLogError('Failed to setupMotionSync().');
          return;
        }

        fetch(`${this._modelHomeDir}${motionSyncFile}`)
          .then(response => {
            if (response.ok) {
              return response.arrayBuffer();
            } else if (response.status >= 400) {
              CubismLogError(
                `Failed to load file ${this._modelHomeDir}${motionSyncFile}`
              );
              // ファイルが存在しなくてもresponseはnullを返却しないため、空のArrayBufferで対応する
              return new ArrayBuffer(0);
            }
          })
          .then(arrayBuffer => {
            this.loadMotionSync(arrayBuffer, arrayBuffer.byteLength);

            // 音声ファイルと設定の読み込み
            this._motionSyncSettingMap =
              this._modelSetting.getMotionSyncLinkSettingMap();
            this._soundFileMap = this._modelSetting.getMotionSyncLinkAudioMap();
            this._soundIndex = 0;
          })
          .then(() => {
            this.loadFromSoundList();
          })
          .then(() => {
            if (this._motionSync) {
              const motionSyncUpdater = new CubismMotionSyncUpdater(
                this._motionSync
              );
              this._updateScheduler.addUpdatableList(motionSyncUpdater);
              this._updateScheduler.sortUpdatableList();
            }
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
    if (buffer == null || size == 0) {
      CubismLogError('Failed to loadMotionSync().');
      return;
    }

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
        this._subdelegate
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
    this.createRenderer(
      this._subdelegate.getCanvas().width,
      this._subdelegate.getCanvas().height
    );
    this.setupTextures();
  }

  /**
   * 音声ファイルリストから読み込みを行う。
   */
  public loadFromSoundList(): void {
    if (!this._soundFileMap || !this._soundData) {
      return;
    }

    this._soundData.getSoundBufferContext().getAudioManager()._audios.length =
      this._soundFileMap.size;
    this._soundData.getSoundBufferContext().getBuffers().length =
      this._soundFileMap.size;

    for (let index = 0; index < this._soundFileMap.size; index++) {
      const filePath =
        this._modelHomeDir + Array.from(this._soundFileMap.values())[index];
      this._soundData.loadFile(filePath, index, this, this._motionSync);
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
      !this._soundFileMap ||
      !(this._soundIndex < this._soundFileMap.size) ||
      !this._motionSync
    ) {
      return;
    }

    this._motionSync.setSoundBuffer(
      0,
      this._soundData.getSoundBufferContext().getBuffers()[this._soundIndex],
      0
    );

    this._soundData.playByIndex(this._soundIndex);
  }

  /**
   * 現在の音声を再生停止する
   */
  public stopCurrentSound(): void {
    if (
      !this._soundData ||
      !this._soundFileMap ||
      !(this._soundIndex < this._soundFileMap.size)
    ) {
      return;
    }

    this._soundData.stopByIndex(this._soundIndex);
  }

  /**
   * 配列のpush処理、コンテナに新たな要素を追加する
   * @param value Push処理で追加する配列の元データ
   */
  public pushFromArray(buffer: Array<number>, value: ArrayLike<number>): void {
    buffer.push(...Array.from(value));
  }

  /**
   * モーションシンクの更新
   */
  public updateMotionSync() {
    if (!this._motionSync) {
      return;
    }

    const soundBuffer = this._soundData.getSoundBufferContext().getBuffers()[
      this._soundIndex
    ];
    const audioInfo = this._soundData.getSoundBufferContext().getAudioManager()
      ._audios[this._soundIndex];

    // 現在フレームの時間を秒単位で取得
    // NOTE: ブラウザやブラウザ側の設定により、performance.now() の精度が異なる可能性に注意
    const currentAudioTime = performance.now() / 1000.0; // convert to seconds.

    // 再生時間の更新
    // 前回フレームの時間が現在時刻よりも前だった場合は同時刻として扱う。
    if (currentAudioTime < audioInfo.audioContextPreviousTime) {
      audioInfo.audioContextPreviousTime = currentAudioTime;
    }

    // 前回フレームの時間から経過時間を計算
    const audioDeltaTime =
      currentAudioTime - audioInfo.audioContextPreviousTime;

    // 経過時間を更新
    audioInfo.audioElapsedTime += audioDeltaTime;

    // 再生時間をサンプル数に変換する。
    // サンプル数 = 再生時間 * サンプリングレート
    // NOTE: サンプリングレートは、音声ファイルに設定された値を使用する。音声コンテキストのサンプリングレートを使用すると、正しくモーションシンクが再生されない場合がある。
    const currentSamplePosition = Math.floor(
      audioInfo.audioElapsedTime * audioInfo.wavhandler.getWavSamplingRate()
    );

    // 処理済みの再生位置が音声のサンプル数を超えていたら、処理を行わない。
    if (audioInfo.previousSamplePosition <= audioInfo.audioSamples.length) {
      // 前回の再生位置を起点に、音声サンプルを再生済みの数だけ取得する。
      const currentAudioSamples = audioInfo.audioSamples.slice(
        audioInfo.previousSamplePosition,
        currentSamplePosition
      );

      // サウンドバッファに再生済みのサンプルを追加する。
      for (let index = 0; index < currentAudioSamples.length; index++) {
        soundBuffer.push(currentAudioSamples[index]);
      }

      // サウンドバッファの設定
      this._motionSync.setSoundBuffer(0, soundBuffer, 0);

      // 再生済みのサンプル数と再生時間を現在のものへ更新する。
      audioInfo.audioContextPreviousTime = currentAudioTime;
      audioInfo.previousSamplePosition = currentSamplePosition;
    }
  }

  private updateMotionSyncForProvider(): void {
    if (!this._audioBufferProvider || !this._motionSync) {
      return;
    }

    // サウンドバッファの設定
    this._motionSync.setSoundBuffer(
      0,
      this._audioBufferProvider.getBuffer(),
      0
    );
  }

  /**
   * 更新
   */
  public update(): void {
    if (this._state != LoadStep.CompleteSetup) return;

    const deltaTimeSeconds: number = LAppPal.getDeltaTime();
    this._userTimeSeconds += deltaTimeSeconds;

    // モーションの更新
    //--------------------------------------------------------------------------
    this._model.loadParameters(); // 前回セーブされた状態をロード
    this._motionManager.updateMotion(this._model, deltaTimeSeconds); // モーションを更新
    this._model.saveParameters(); // 状態を保存
    //--------------------------------------------------------------------------

    if (this._soundData.isPlayByIndex(this._soundIndex)) {
      this.updateMotionSync();
    } else {
      this.updateMotionSyncForProvider();
    }
    this._updateScheduler.onLateUpdate(this._model, deltaTimeSeconds);

    if (this._soundData.isPlayByIndex(this._soundIndex)) {
      // 解析しただけデータを削除する。
      const lastTotalProcessedCount =
        this._motionSync.getLastTotalProcessedCount(0);
      this._soundData.removeDataArrayByIndex(
        this._soundIndex,
        lastTotalProcessedCount
      );
    }

    this._model.update();
  }

  /**
   * 引数で指定したモーションの再生を開始する
   * @param group モーショングループ名
   * @param no グループ内の番号
   * @param priority 優先度
   * @param onFinishedMotionHandler モーション再生終了時に呼び出されるコールバック関数
   * @return 開始したモーションの識別番号を返す。個別のモーションが終了したか否かを判定するisFinished()の引数で使用する。開始できない時は[-1]
   */
  public startMotion(
    group: string,
    no: number,
    priority: number,
    onFinishedMotionHandler?: FinishedMotionCallback,
    onBeganMotionHandler?: BeganMotionCallback
  ): CubismMotionQueueEntryHandle {
    if (priority == LAppDefine.PriorityForce) {
      this._motionManager.setReservePriority(priority);
    } else if (!this._motionManager.reserveMotion(priority)) {
      if (this._debugMode) {
        LAppPal.printMessage("[APP]can't start motion.");
      }
      return InvalidMotionQueueEntryHandleValue;
    }

    const motionFileName = this._modelSetting.getMotionFileName(group, no);

    // ex) idle_0
    const name = `${group}_${no}`;
    let motion: CubismMotion = this._motions.get(name) as CubismMotion;
    let autoDelete = false;

    if (motion == null) {
      fetch(`${this._modelHomeDir}${motionFileName}`)
        .then(response => {
          if (response.ok) {
            return response.arrayBuffer();
          } else if (response.status >= 400) {
            CubismLogError(
              `Failed to load file ${this._modelHomeDir}${motionFileName}`
            );
            return new ArrayBuffer(0);
          }
        })
        .then(arrayBuffer => {
          motion = this.loadMotion(
            arrayBuffer,
            arrayBuffer.byteLength,
            null,
            onFinishedMotionHandler,
            onBeganMotionHandler
          );

          if (motion == null) {
            return;
          }

          let fadeTime: number = this._modelSetting.getMotionFadeInTimeValue(
            group,
            no
          );

          if (fadeTime >= 0.0) {
            motion.setFadeInTime(fadeTime);
          }

          fadeTime = this._modelSetting.getMotionFadeOutTimeValue(group, no);
          if (fadeTime >= 0.0) {
            motion.setFadeOutTime(fadeTime);
          }

          motion.setEffectIds(this._eyeBlinkIds, this._lipSyncIds);
          autoDelete = true; // 終了時にメモリから削除
        });
    } else {
      motion.setBeganMotionHandler(onBeganMotionHandler);
      motion.setFinishedMotionHandler(onFinishedMotionHandler);
    }

    if (
      !this._motionSyncSettingMap.has(motionFileName) ||
      !this._soundFileMap.has(motionFileName)
    ) {
      LAppPal.printMessage(`[APP]No exist: ${motionFileName}`);
      return InvalidMotionQueueEntryHandleValue;
    }

    // 現在のモーションのインデックスを確定
    this._motionIndex = no;

    // MotionSync
    const useMotionSyncSettingName: string =
      this._motionSyncSettingMap.get(motionFileName);
    const useSoundFileName: string = this._soundFileMap.get(motionFileName);

    let motionSyncSettingIndex: number = -1;
    for (
      let i: number = 0;
      i < this._motionSync.getData().getSettingCount();
      i++
    ) {
      const settingIdName: string = this._motionSync.getData().getMeta()
        .dictionary[i].name;

      if (settingIdName == useMotionSyncSettingName) {
        motionSyncSettingIndex = i;
        break;
      }
    }

    if (motionSyncSettingIndex != -1) {
      this._currentSoundFileName = useSoundFileName;
      this._currentMotionSyncSettingIndex = motionSyncSettingIndex;

      // 音声ファイルのロードと再生の開始
      this.startMotionSync();
    } else {
      if (this._debugMode) {
        LAppPal.printMessage(`[APP]Failed set motionSync: [${group}_${no}]`);
      }

      this._currentMotionSyncSettingIndex = -1;
      this._currentSoundFileName = '';
    }

    if (this._debugMode) {
      LAppPal.printMessage(`[APP]start motion: [${group}_${no}]`);
    }
    return this._motionManager.startMotionPriority(
      motion,
      autoDelete,
      priority
    );
  }

  /**
   * モーションの再生を停止する
   */
  public stopAllMotions(): void {
    this._motionManager.stopAllMotions();
    // 音声再生の終了と音声バッファのクリア
    this.stopCurrentSound();
  }

  // モーション再生終了のコールバック関数
  public onFinishedMotion = (self: ACubismMotion): void => {
    // 音声再生の終了と音声バッファのクリア
    this.stopCurrentSound();

    if (this._debugMode) {
      LAppPal.printMessage(
        `[APP] Finish motion sync: ${this._modelHomeDir}${this._currentSoundFileName}`
      );
    }
  };

  /**
   * モーションシンクの再生を開始する。
   */
  public startMotionSync(): void {
    if (this._currentMotionSyncSettingIndex < 0) {
      if (this._debugMode) {
        LAppPal.printMessage(
          `[APP]Failed begin motion sync.\n_currentMotionSyncSettingIndex: ${this._currentMotionSyncSettingIndex}`
        );
      }
      return;
    }

    // 音声再生の開始
    if (this._debugMode) {
      LAppPal.printMessage(
        `[APP] Begin motion sync: ${this._modelHomeDir}${this._currentSoundFileName}`
      );
    }

    this._soundIndex = this._motionIndex;
    this.playCurrentSound();
  }

  /**
   * イベントの発火を受け取る
   */
  public motionEventFired(eventValue: string): void {
    CubismLogInfo('{0} is fired on LAppMotionSyncModel!!', eventValue);
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
   * モーションデータをグループ名から一括でロードする。
   * モーションデータの名前は内部でModelSettingから取得する。
   *
   * @param group モーションデータのグループ名
   */
  public preLoadMotionGroup(group: string): void {
    for (let i = 0; i < this._modelSetting.getMotionCount(group); i++) {
      const motionFileName = this._modelSetting.getMotionFileName(group, i);

      // ex) idle_0
      const name = `${group}_${i}`;
      if (this._debugMode) {
        LAppPal.printMessage(
          `[APP]load motion: ${motionFileName} => [${name}]`
        );
      }

      fetch(`${this._modelHomeDir}${motionFileName}`)
        .then(response => {
          if (response.ok) {
            return response.arrayBuffer();
          } else if (response.status >= 400) {
            CubismLogError(
              `Failed to load file ${this._modelHomeDir}${motionFileName}`
            );
            return new ArrayBuffer(0);
          }
        })
        .then(arrayBuffer => {
          const tmpMotion: CubismMotion = this.loadMotion(
            arrayBuffer,
            arrayBuffer.byteLength,
            name
          );

          if (tmpMotion != null) {
            let fadeTime = this._modelSetting.getMotionFadeInTimeValue(
              group,
              i
            );
            if (fadeTime >= 0.0) {
              tmpMotion.setFadeInTime(fadeTime);
            }

            fadeTime = this._modelSetting.getMotionFadeOutTimeValue(group, i);
            if (fadeTime >= 0.0) {
              tmpMotion.setFadeOutTime(fadeTime);
            }
            tmpMotion.setEffectIds(this._eyeBlinkIds, this._lipSyncIds);

            if (this._motions.get(name) != null) {
              ACubismMotion.delete(this._motions.get(name));
            }

            this._motions.set(name, tmpMotion);

            this._motionCount++;
            if (this._motionCount >= this._allMotionCount) {
              this._state = LoadStep.LoadTexture;

              // 全てのモーションを停止する
              this._motionManager.stopAllMotions();

              this._updating = false;
              this._initialized = true;

              this.createRenderer(
                this._subdelegate.getCanvas().width,
                this._subdelegate.getCanvas().height
              );
              this.setupTextures();
              this.getRenderer().startUp(
                this._subdelegate.getGlManager().getGl()
              );
            }
          } else {
            // loadMotionできなかった場合はモーションの総数がずれるので1つ減らす
            this._allMotionCount--;
          }
        });
    }
  }

  /**
   * すべてのモーションデータを解放する。
   */
  public releaseMotions(): void {
    this._motions.clear();
  }

  /**
   * モデルを描画する処理。モデルを描画する空間のView-Projection行列を渡す。
   */
  public doDraw(): void {
    if (this._model == null) return;

    // キャンバスサイズを渡す
    const canvas = this._subdelegate.getCanvas();
    const viewport: number[] = [0, 0, canvas.width, canvas.height];

    this.getRenderer().setRenderState(
      this._subdelegate.getFrameBuffer(),
      viewport
    );
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

    this._eyeBlinkIds = new Array<CubismIdHandle>();
    this._lipSyncIds = new Array<CubismIdHandle>();
    this._motions = new Map<string, ACubismMotion>();

    this._hitArea = new Array<csmRect>();
    this._userArea = new Array<csmRect>();

    if (LAppDefine.MOCConsistencyValidationEnable) {
      this._mocConsistency = true;
    }

    this._state = LoadStep.LoadAssets;
    this._expressionCount = 0;
    this._textureCount = 0;
    this._motionCount = 0;
    this._allMotionCount = 0;
    this._consistency = false;
    this._soundFileList = new Array<string>();
    this._motionSyncSettingMap = new Map<string, string>();
    this._soundFileMap = new Map<string, string>();
    this._soundIndex = 0;
    this._motionIndex = 0;
    this._soundData = new LAppAudioManager();
    this._lastSampleCount = 0;
    this._audioBufferProvider = null;
    this._updateScheduler = new CubismUpdateScheduler();
  }

  public override release(): void {
    super.release();

    if (this._motions) {
      this.releaseMotions();
      this._motions = null;
    }

    if (this._motionSync) {
      this._motionSync.release();
      this._motionSync = null;
    }

    if (this._soundFileList) {
      this._soundFileList.length = 0;
      this._soundFileList = null;
    }

    if (this._motionSyncSettingMap) {
      this._motionSyncSettingMap?.clear();
      this._motionSyncSettingMap = null;
    }

    if (this._soundFileMap) {
      this._soundFileMap?.clear();
      this._soundFileMap = null;
    }

    if (this._soundData) {
      this._soundData?.release();
      this._soundData = null;
    }

    if (this._updateScheduler) {
      this._updateScheduler.release();
    }
  }

  public setSubdelegate(subdelegate: LAppMotionSyncSubdelegate): void {
    this._subdelegate = subdelegate;
  }

  public getProvider(): ILAppAudioBufferProvider {
    return this._audioBufferProvider;
  }

  public setProvider(audioBuffer: ILAppAudioBufferProvider): void {
    this._audioBufferProvider = audioBuffer;
  }

  _modelSetting: CubismModelMotionSyncSettingJson; // モデルセッティング情報
  _modelHomeDir: string; // モデルセッティングが置かれたディレクトリ
  _userTimeSeconds: number; // デルタ時間の積算値[秒]

  _eyeBlinkIds: Array<CubismIdHandle>; // モデルに設定された瞬き機能用パラメータID
  _lipSyncIds: Array<CubismIdHandle>; // モデルに設定されたリップシンク機能用パラメータID
  _motions: Map<string, ACubismMotion>; // 読み込まれているモーションのリスト

  _hitArea: Array<csmRect>;
  _userArea: Array<csmRect>;

  _state: LoadStep; // 現在のステータス管理用
  _expressionCount: number; // 表情データカウント
  _textureCount: number; // テクスチャカウント
  _motionCount: number; // モーションデータカウント
  _allMotionCount: number; // モーション総数
  _consistency: boolean; // MOC3一貫性チェック管理用

  _soundFileList: Array<string>; // モーションシンクで利用するファイルのリスト
  _motionSyncSettingMap: Map<string, string>; // モーションシンク設定のマップ
  _currentMotionSyncSettingIndex: number; // 現在再生中のモーションシンク設定のインデックス
  _soundFileMap: Map<string, string>; // 音声ファイルのマップ
  _soundIndex: number; // 再生する音声データのインデックス
  _motionIndex: number; // 再生するモーションのインデックス
  _soundData: LAppAudioManager; // 音声管理
  _motionSync: CubismMotionSync; // モーションシンク
  _lastSampleCount: number; // 最後にサンプリングしたフレーム数
  _currentSoundFileName: string; // 現在再生中の音声ファイル名

  _updateScheduler: CubismUpdateScheduler; // アップデートスケジューラ
  _subdelegate: LAppMotionSyncSubdelegate; // サブデリゲート

  private _audioBufferProvider: ILAppAudioBufferProvider; // 音声バッファ
}
