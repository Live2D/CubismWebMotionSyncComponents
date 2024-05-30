[English](README.md) / [日本語](README.ja.md)

---

# Cubism MotionSync Plugin for Web

Cubism SDK for Web上で、モーションシンク機能を利用するためのCubism SDKプラグインです。

## ライセンス

ご使用前に[ライセンス](LICENSE.md)をお読みください。


## お知らせ

ご使用前に[お知らせ](NOTICE.ja.md)をお読みください。


## 構造

### 依存関係

#### Cubism SDK for Web

本プラグインは、Cubism SDK for Web用のCubism SDKプラグインです。

利用するには最新のCubism SDK for Webのパッケージが必要となります。

SDKパッケージのダウンロードページをお探しの場合は、[ダウンロードページ](https://www.live2d.com/download/cubism-sdk/download-web/)にアクセスしてください。

#### Live2D Cubism MotionSync Core

モーションシンク機能を提供するライブラリです。当リポジトリにはLive2D Cubism MotionSync Coreは同梱されていません。

Live2D Cubism MotionSync Coreを同梱したプラグインパッケージをダウンロードするには[こちら](https://www.live2d.com/sdk/download/motionsync/)のページを参照ください。

### ディレクトリ構成

```
.
├─ .vscode          # Visual Studio Code 用プロジェクト設定ディレクトリ
├─ Core             # Live2D Cubism MotionSync Core が含まれるディレクトリ
├─ Framework        # モーションシンク機能の主要なソースコードが含まれるディレクトリ
└─ Samples
   ├─ Resources     # モデルのファイルや画像などのリソースが含まれるディレクトリ
   └─ TypeScript    # TypeScript のサンプルプロジェクトが含まれるディレクトリ
```

## ブランチ

最新の機能や修正をお探しの場合、`develop`ブランチをご確認ください。

`master`ブランチは、公式のプラグインリリースごとに`develop`ブランチと同期されます。

## 開発環境構築

1. Cubism SDK for Web の `README.ja.md` の `開発環境構築` をご確認ください。

### 開発環境構築後に必要な手順

本プラグインをそのまま利用する場合、以下の手順が必要となります。

#### ディレクトリ構成

本プラグインの実行にはまず以下のディレクトリ構成で Cubism SDK for Web 及び本プラグインを配置する必要があります。
配置した後にこれらを配置したディレクトリを Visual Studio Code で開いてください。

```
.
├─ .vscode                              # Visual Studio Code 用プロジェクト設定ディレクトリ（※1）
│
├─ CubismSdkForWeb                      # Cubism SDK for Webのルートディレクトリ（※2）
│   └─ ...                              # Cubism SDK for Webのディレクトリ構造
│
└─ CubismSdkMotionSyncPluginForWeb      # 本プラグインのルートディレクトリ
    ├─ .vscode                          # Visual Studio Code 用プロジェクト設定ディレクトリ
    ├─ Core                             # Live2D Cubism MotionSync Core が含まれるディレクトリ
    ├─ Framework                        # モーションシンク機能の主要なソースコードが含まれるディレクトリ
    └─ Samples
        ├─ Resources                    # モデルのファイルや画像などのリソースが含まれるディレクトリ
        └─ TypeScript                   # TypeScript のサンプルプロジェクトが含まれるディレクトリ
```

※1 [launch.json の作成](#launchjson-の作成) の項で作成します。
※2 デフォルトでは `CubismSdkForWeb` の名称で固定する必要があります。

Cubism SDK for Webのルートディレクトリの名称を任意のものに変更したい場合、本プラグインのルートディレクトリ内以下の次の箇所で利用されている `CubismSdkForWeb` の名称を修正する必要があります。

* Framework/tsconfig.json

Samplesの実行を行う場合は、追加で以下のファイル内の該当箇所を変更する必要があります。

* Samples/TypeScript/Demo/index.html
* Samples/TypeScript/Demo/tsconfig.json
* Samples/TypeScript/Demo/vite.config.mts
* Samples/TypeScript/Demo/vite.config.microphone.mts
* Samples/TypeScript/Demo/copy_resources.js

ディレクトリ構成を任意のものに変更したい場合も、上記のファイルを編集することで適用することが出来ます。

### サンプルデモの動作確認

#### launch.json の作成

 **Cubism SDK for Web 及び本プラグインを配置したディレクトリ** に `.vscode` ディレクトリを作成し、Cubism SDK for Webの`.vscode` ディレクトリから `launch.json` をコピーします。
コピーが完了したら、`webRoot` キーを以下のように修正します。 `CubismWebMotionSyncComponents` となっている箇所は、本プラグインのルートディレクトリの名称に書き換えてください。

```
"webRoot": "${workspaceFolder}/CubismWebMotionSyncComponents/Samples/TypeScript/Demo/",
```

#### 実行

コマンドパレット（*View > Command Palette...*）で `>Tasks: Run Task` を入力することで、タスク一覧が表示されます。

1. タスク一覧から `npm: install - CubismWebMotionSyncComponents/Samples/TypeScript/Demo` を選択して依存パッケージのダウンロードを行います
1. タスク一覧から `npm: build - CubismWebMotionSyncComponents/Samples/TypeScript/Demo` を選択してオーディオファイルを利用したサンプルデモのビルドを行います
1. もしくは、タスク一覧から `npm: build:microphone - CubismWebMotionSyncComponents/Samples/TypeScript/Demo` を選択してマイク入力を利用したサンプルデモのビルドを行います
1. タスク一覧から `npm: serve - CubismWebMotionSyncComponents/Samples/TypeScript/Demo` を選択して動作確認用の簡易サーバを起動します
1. ブラウザの URL 欄に `https://localhost:5000/` と入力してアクセスします 
1. コマンドパレットから `>Tasks: Terminate Task` を入力して `npm: serve-https` を選択すると簡易サーバが終了します

NOTE: `CubismWebMotionSyncComponents` となっている箇所は変更している場合、本プラグインのルートディレクトリの名称
NOTE: 本サンプルプロジェクトでは、`@vitejs/plugin-basic-ssl` パッケージを利用して自己署名証明書を発行しています。本サンプルプロジェクトを利用した場合に作成される自己署名証明書は一部ブラウザなどでは警告が出ることがあり、開発環境以外での利用は想定していません。

その他のタスクに関してはサンプルプロジェクトの [README.md](Samples/TypeScript/README.ja.md) を参照ください。

### プロジェクトのデバック

Visual Studio Code で **Cubism SDK for Web 及び本プラグインを配置したディレクトリ** を開き、 *F5* キーを入力すると Debugger for Chrome が起動します。

Visual Studio Code 上でブレイクポイントを貼って Chrome ブラウザと連動してデバックを行うことができます。

NOTE: デバック用の設定は、`.vscode/launch.json` に記述しています。


## SDKマニュアル

[Cubism SDK Manual](https://docs.live2d.com/cubism-sdk-manual/cubism-sdk-motionsync-plugin-for-web/)


## 変更履歴

当リポジトリの変更履歴については [CHANGELOG.md](CHANGELOG.md) を参照ください。


## 開発環境

### Node.js

* 22.2.0
* 20.13.1


## 動作確認環境

| プラットフォーム | ブラウザ | バージョン |
| --- | --- | --- |
| Android | Google Chrome | 125.0.6422.113 |
| Android | Microsoft Edge | 124.0.2478.104 |
| Android | Mozilla Firefox | 126.0 |
| iOS / iPadOS | Google Chrome | 125.0.6422.80 |
| iOS / iPadOS | Microsoft Edge | 125.0.2535.60 |
| iOS / iPadOS | Mozilla Firefox | 126.1 |
| iOS / iPadOS | Safari | 17.4.1 |
| macOS | Google Chrome | 125.0.6422.113 |
| macOS | Microsoft Edge | 125.0.2535.67 |
| macOS | Mozilla Firefox | 126.0 |
| macOS | Safari | 17.5 |
| Windows | Google Chrome | 125.0.6422.113 |
| Windows | Microsoft Edge | 125.0.2535.67 |
| Windows | Mozilla Firefox | 126.0 |

Note: 動作確認時のサーバの起動は `./Samples/TypeScript/Demo/package.json` の `serve-https` スクリプトを使用して行っています。

### Cubism SDK for Web

[Cubism 5 SDK for Web R1](https://github.com/Live2D/CubismWebSamples/releases/tag/5-r.1)

## サウンドデバイス

入出力用のサウンドデバイスは、既定のデバイスが使用される仕様です。

ご利用の環境によってはハウリングする場合がございますので、サンプルアプリケーションやデバイスの音声再生機器を一度ミュートにするか、マイクとスピーカーの位置を離してご利用ください。

## プロジェクトへの貢献

プロジェクトに貢献する方法はたくさんあります。バグのログの記録、このGitHubでのプルリクエストの送信、Live2Dフォーラムでの問題の報告と提案の作成です。

### フォークとプルリクエスト

修正、改善、さらには新機能をもたらすかどうかにかかわらず、プルリクエストに感謝します。メインリポジトリを可能な限りクリーンに保つために、必要に応じて個人用フォークと機能ブランチを作成してください。

### バグ

Live2Dフォーラムでは、問題のレポートと機能リクエストを定期的にチェックしています。バグレポートを提出する前に、Live2Dフォーラムで検索して、問題のレポートまたは機能リクエストがすでに投稿されているかどうかを確認してください。問題がすでに存在する場合は、関連するコメントを追記してください。

### 提案

SDKの将来についてのフィードバックにも関心があります。Live2Dフォーラムで提案や機能のリクエストを送信できます。このプロセスをより効果的にするために、それらをより明確に定義するのに役立つより多くの情報を含めるようお願いしています。


## フォーラム

ユーザー同士でCubism SDKの活用方法の提案や質問をしたい場合は、是非公式クリエイターズフォーラムをご活用ください。

- [Live2D 公式クリエイターズフォーラム](https://creatorsforum.live2d.com/)
- [Live2D Creators Forum(English)](https://community.live2d.com/)
