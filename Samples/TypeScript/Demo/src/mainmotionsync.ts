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
