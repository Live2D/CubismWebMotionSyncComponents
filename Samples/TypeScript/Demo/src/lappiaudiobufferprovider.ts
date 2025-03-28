/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import { csmVector } from '@framework/type/csmvector';

export interface ILAppAudioBufferProvider {
  /**
   * 音声バッファを取得
   */
  getBuffer(): csmVector<number>;
}
