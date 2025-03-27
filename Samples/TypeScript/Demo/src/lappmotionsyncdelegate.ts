/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { LAppMotionSyncDelegateParent } from './lappmotionsyncdelegateparent';
import { LAppPal } from '@cubismsdksamples/lapppal';
import { LAppInputDevice } from './lappinputdevice';

export let s_instance: LAppMotionSyncDelegate = null;

/**
 * アプリケーションクラス。
 * Cubism SDKの管理を行う。
 */
export class LAppMotionSyncDelegate extends LAppMotionSyncDelegateParent {
  /**
   * クラスのインスタンス（シングルトン）を返す。
   * インスタンスが生成されていない場合は内部でインスタンスを生成する。
   *
   * @return クラスのインスタンス
   */
  public static getInstance(): LAppMotionSyncDelegate {
    if (s_instance == null) {
      s_instance = new LAppMotionSyncDelegate();
    }

    return s_instance;
  }

  /**
   * クラスのインスタンス（シングルトン）を解放する。
   */
  public static releaseInstance(): void {
    if (s_instance != null) {
      s_instance.release();
    }

    s_instance = null;
  }

  /**
   * 実行処理。
   */
  public run(): void {
    // メインループ
    const loop = (): void => {
      // インスタンスの有無の確認
      if (s_instance == null) {
        return;
      }

      // 時間更新
      LAppPal.updateTime();

      for (let i = 0; i < this._subdelegates.getSize(); i++) {
        this._subdelegates.at(i).update();
      }

      // すべてのSubdelegatesがバッファを受け取ったらバッファをクリア
      LAppInputDevice.getInstance().reset();

      // ループのために再帰呼び出し
      requestAnimationFrame(loop);
    };
    loop();
  }
}
