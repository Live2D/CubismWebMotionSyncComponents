/**
 * Copyright(c) Live2D Inc. All rights reserved.
 *
 * Use of this source code is governed by the Live2D Open Software license
 * that can be found at https://www.live2d.com/eula/live2d-open-software-license-agreement_en.html.
 */

import {
  CubismModelSettingJson,
  FrequestNode
} from '@framework/cubismmodelsettingjson';

export class CubismModelMotionSyncSettingJson extends CubismModelSettingJson {
  public constructor(buffer: ArrayBuffer, size: number) {
    super(buffer, size);
    this._motionSyncFilePath = this.getJson()
      .getRoot()
      .getValueByString(this.fileReferences)
      .getValueByString(this.motionSync)
      .getRawString();
  }

  public getMotionSyncFileName(): string {
    return this._motionSyncFilePath;
  }

  public getMotionSyncSoundFileList(): Array<string> {
    const list: Array<string> = new Array<string>();

    for (let index = 0; index < this.getMotionGroupCount(); index++) {
      const groupName: string = this.getMotionGroupName(index);

      for (
        let listIndex = 0;
        listIndex < this.getMotionCount(groupName);
        listIndex++
      ) {
        const fileName: string = this.getMotionSoundFileName(
          groupName,
          listIndex
        );

        // ファイル名が空であれば無視する。
        if (!fileName || fileName.length < 1) {
          continue;
        }

        list.push(fileName);
      }
    }

    return list;
  }

  public getMotionSyncSettingNameFromMotion(
    groupName: string,
    index: number
  ): string {
    // _jsonValue に確保済みのデータから取得する。
    return this._jsonValue[FrequestNode.FrequestNode_Motions]
      .getValueByString(groupName)
      .getValueByIndex(index)
      .getValueByString(this.motionSync)
      .getRawString();
  }

  /**
   * モーションファイル名とサウンドファイル名のマップを取得する
   *
   * @returns モーションファイル名とサウンドファイル名のマップ
   */
  public getMotionSyncLinkSettingMap(): Map<string, string> {
    const map: Map<string, string> = new Map<string, string>();

    for (let index = 0; index < this.getMotionGroupCount(); index++) {
      const groupName: string = this.getMotionGroupName(index);
      for (
        let motionIndex = 0;
        motionIndex < this.getMotionCount(groupName);
        motionIndex++
      ) {
        const motionFileName: string = this.getMotionFileName(
          groupName,
          motionIndex
        );
        const settingName: string = this.getMotionSyncSettingNameFromMotion(
          groupName,
          motionIndex
        );

        // ファイル名が空であれば無視する。
        if (!motionFileName || motionFileName.length < 1) {
          continue;
        }

        // ファイル名が空であれば無視する。
        if (!settingName || settingName.length < 1) {
          continue;
        }

        // 値を設定
        map.set(motionFileName, settingName);
      }
    }
    return map;
  }

  /**
   * モーションファイル名とサウンドファイル名のマップを取得する
   *
   * @returns モーションファイル名とサウンドファイル名のマップ
   */
  public getMotionSyncLinkAudioMap(): Map<string, string> {
    const map: Map<string, string> = new Map<string, string>();

    for (let index = 0; index < this.getMotionGroupCount(); index++) {
      const groupName: string = this.getMotionGroupName(index);
      for (
        let motionIndex = 0;
        motionIndex < this.getMotionCount(groupName);
        motionIndex++
      ) {
        const motionFileName: string = this.getMotionFileName(
          groupName,
          motionIndex
        );
        const soundFileName: string = this.getMotionSoundFileName(
          groupName,
          motionIndex
        );

        // ファイル名が空であれば無視する。
        if (!motionFileName || motionFileName.length < 1) {
          continue;
        }

        // ファイル名が空であれば無視する。
        if (!soundFileName || soundFileName.length < 1) {
          continue;
        }

        // 値を設定
        map.set(motionFileName, soundFileName);
      }
    }
    return map;
  }

  /**
   * Model3Jsonのキー文字列
   */
  protected readonly motionSync = 'MotionSync';

  private _motionSyncFilePath: string;
}

// Namespace definition for compatibility.
import * as $ from './cubismmodelmotionsyncsettingjson';
// eslint-disable-next-line @typescript-eslint/no-namespace
export namespace Live2DCubismMotionSyncFramework {
  export const CubismModelMotionSyncSettingJson =
    $.CubismModelMotionSyncSettingJson;
  export type CubismModelMotionSyncSettingJson =
    $.CubismModelMotionSyncSettingJson;
}
