# CI 同期の契約

共通CIの管理元はhato-botの`develop`です。同期workflowはコピー元とコピー先のコミットSHAをログに残します。

コピー元の`.github/ci-sync.json`が、共通workflowの除外名と、それ以外に必要な設定ファイルを定義します。Aquaを利用するworkflowには`aqua.yaml`と`aqua-checksums.json`の両方が必要です。consumerはmanifestの形式、参照ファイル、symlinkをコピー前に検査し、不備があれば既存の生成物を変更せずに終了します。

## 管理する場所

- 共通workflow、共通script、manifestに列挙した設定はhato-botで修正します。sudden-deathで直接変更しても、次の同期で上書きまたは削除されます。
- sudden-death固有のworkflowは`*sudden-death.yml`、固有scriptはパスに`sudden_death`を含めます。これらと既存の`verify-lockfile.yml`は同期で保持します。
- `repo-name`はコピー先へ変換します。Pythonとuvのバージョン指定も同期します。アプリケーションのPython依存や、コピー先のnpm scriptsは従来どおり別管理です。
- 共通CodeQL workflowを配布する場合はAdvanced setupを利用します。GitHub側のdefault setupとの切替はリポジトリ管理者が行います。同期処理はGitHubの設定を変更しません。default setupが有効なままではAdvanced setupの結果を受理できないため、生成PRの実行結果でアップロード完了まで確認してください。

## 導入と検証

hato-botのmanifestを先にマージし、その後でsudden-deathのconsumerをマージします。コピー元にmanifestがない場合はfail-fastし、従来の固定リストへは戻しません。既存の生成PRに手動コミットを重ねる必要はありません。

`node --test`は既存のSuper-Linterジョブで、npmの依存導入直後に実行します。fixtureテストは実際の`copy_ci.sh`を使い、Aqua一式、コピー先固有ファイル、古い共通ファイルの削除、変換、再実行時の無変更、不正なmanifestでの事前停止を確認します。ローカルではNode.js 20以上、Bash、既存のmikefarah/yqが必要です。
