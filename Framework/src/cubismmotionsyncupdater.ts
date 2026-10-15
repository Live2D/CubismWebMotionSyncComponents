/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { ICubismUpdater, CubismUpdateOrder} from '@framework/motion/icubismupdater';
import { CubismModel } from '@framework/model/cubismmodel';
import { CubismMotionSync } from './live2dcubismmotionsync';

const CubismUpdateOrder_MotionSync = (CubismUpdateOrder.CubismUpdateOrder_LipSync + CubismUpdateOrder.CubismUpdateOrder_Pose) / 2;

export class CubismMotionSyncUpdater extends ICubismUpdater {
  private _motionSync: CubismMotionSync;

  /**
   * Constructor
   *
   * @param motionSync CubismMotionSync reference
   */
  constructor(motionSync: CubismMotionSync);

  /**
   * Constructor
   *
   * @param motionSync CubismMotionSync reference
   * @param executionOrder Order of operations
   */
  constructor(motionSync: CubismMotionSync, executionOrder: number);

  constructor(motionSync: CubismMotionSync, executionOrder?: number) {
    super(executionOrder ?? CubismUpdateOrder_MotionSync);
    this._motionSync = motionSync;
  }

  /**
   * Update process.
   *
   * @param model Model to update
   * @param deltaTimeSeconds Delta time in seconds.
   */
  onLateUpdate(model: CubismModel, deltaTimeSeconds: number): void {
    if (!model) {
      return;
    }

    this._motionSync.updateParameters(model, deltaTimeSeconds);
  }
}

// Namespace definition for compatibility.
import * as $ from './cubismmotionsyncupdater';
export namespace Live2DCubismMotionSyncFramework {
  export const CubismMotionSyncUpdater = $.CubismMotionSyncUpdater;
  export type CubismMotionSyncUpdater = $.CubismMotionSyncUpdater;
}
