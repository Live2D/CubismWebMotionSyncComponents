/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { LAppMotionSyncDelegate } from './lappmotionsyncdelegate';
import * as LAppDefine from '@cubismsdksamples/lappdefine';
import { LAppGlManager } from '@cubismsdksamples/lappglmanager';

/**
 * ブラウザロード後の処理
 */
window.addEventListener(
  'load',
  (): void => {
    // 安全なコンテキストかを確認する。
    // 参考: https://developer.mozilla.org/ja/docs/Web/Security/Secure_Contexts
    if (!window.isSecureContext) {
      // 安全なコンテキストではない場合は一部の機能が動作しない可能性をアラートし、リターン。
      alert('Not a secure context. Some features may not work.');

      // この接続ではAudioWorkletが動作しない旨を表示。
      document.body.innerHTML =
        '`AudioWorklet` may not work with this connection.';
      return;
    }

    // Initialize WebGL and create the application instance
    if (
      !LAppGlManager.getInstance() ||
      !LAppMotionSyncDelegate.getInstance().initialize()
    ) {
      return;
    }

    LAppMotionSyncDelegate.getInstance().run();
  },
  { passive: true }
);

/**
 * 終了時の処理
 */
window.addEventListener(
  'beforeunload',
  (): void => LAppMotionSyncDelegate.releaseInstance(),
  { passive: true }
);

/**
 * Process when changing screen size.
 */
window.addEventListener(
  'resize',
  () => {
    if (LAppDefine.CanvasSize === 'auto') {
      LAppMotionSyncDelegate.getInstance().onResize();
    }
  },
  { passive: true }
);
