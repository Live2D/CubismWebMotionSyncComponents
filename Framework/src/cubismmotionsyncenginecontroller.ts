/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { CubismLogInfo } from '@framework/utils/cubismdebug';
import { CubismMotionSyncEngineCri } from './cubismmotionsyncenginecri';
import { CubismMotionSyncEngineLib } from './cubismmotionsyncenginelib';
import { CubismMotionSyncEngineVersion } from './cubismmotionsyncengineversion';
import { EngineType } from './cubismmotionsyncutil';
import { ICubismMotionSyncEngine } from './icubismmotionsyncengine';

export class CubismMotionSyncEngineController {
  public static initializeEngine(
    engineConfig: number
  ): ICubismMotionSyncEngine {
    let engineLib: CubismMotionSyncEngineLib = new CubismMotionSyncEngineLib();
    const engineName: string = engineLib.getEngineName();
    const engineType: EngineType = this.ToEngineType(engineName);
    const nativeVersion: number = engineLib.getEngineVersion();
    const version: CubismMotionSyncEngineVersion =
      new CubismMotionSyncEngineVersion(nativeVersion);

    if (!this._engineMap) {
      this._engineMap = new Map<EngineType, ICubismMotionSyncEngine>();
    }

    if (this._engineMap.has(engineType)) {
      engineLib = void 0;
      engineLib = null;
      return null;
    }

    CubismLogInfo(engineName + ' ' + version.toString());

    const isInitialized: boolean = engineLib.initializeEngine(engineConfig);

    if (!isInitialized) {
      engineLib = void 0;
      engineLib = null;
      return null;
    }

    let engine: ICubismMotionSyncEngine = null;
    switch (engineType) {
      case EngineType.EngineType_Cri:
        engine = new CubismMotionSyncEngineCri(
          engineLib,
          engineType,
          engineName,
          version
        );
        break;
      default:
        engineLib.disposeEngine();
        engineLib = void 0;
        engineLib = null;
        return null;
    }

    this._engineMap.set(engineType, engine);

    return engine;
  }

  public static getEngine(type: EngineType) {
    if (this._engineMap && this._engineMap.has(type)) {
      return this._engineMap.get(type);
    }
    return null;
  }

  public static getEngines(): Array<ICubismMotionSyncEngine> {
    return [...this._engineMap.values()];
  }

  public static releaseEngineNotForce(engine: ICubismMotionSyncEngine): void {
    this.releaseEngine(engine, false);
  }

  public static releaseEngine(
    engine: ICubismMotionSyncEngine,
    isForce: boolean
  ): void {
    engine.close(isForce);
  }

  public static deleteAllEngine(): void {
    const engines: Array<ICubismMotionSyncEngine> = this.getEngines();
    for (let index = 0; index < engines.length; index++) {
      engines[index].close(true);
    }

    this._engineMap.clear();
  }

  public static ToEngineType(engineName: string): EngineType {
    let engineType: EngineType = EngineType.EngineType_Unknown;

    if (engineName == 'Live2DCubismMotionSyncEngine_CRI') {
      engineType = EngineType.EngineType_Cri;
    }

    return engineType;
  }

  public static deleteAssociation(engine: ICubismMotionSyncEngine) {
    if (this._engineMap.has(engine.getType())) {
      this._engineMap.delete(engine.getType());
      engine = void 0;
    }
  }

  private static _engineMap: Map<EngineType, ICubismMotionSyncEngine>;
}

// Namespace definition for compatibility.
import * as $ from './cubismmotionsyncenginecontroller';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismMotionSyncFramework {
  export const CubismMotionSyncEngineController =
    $.CubismMotionSyncEngineController;
  export type CubismMotionSyncEngineController =
    $.CubismMotionSyncEngineController;
}
