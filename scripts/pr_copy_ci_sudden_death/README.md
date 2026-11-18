# CI 同期の契約

共通 CI の管理元は hato-bot の `develop` です。同期 workflow はコピー元とコピー先のコミット SHA をログに残します。

コピー元の `.github/ci-sync.json` が、共通 workflow の除外名と、それ以外に必要な設定ファイルを定義します。Aqua を利用する workflow には `aqua.yaml` と `aqua-checksums.json` の両方が必要です。consumer は manifest の形式、参照ファイル、symlink をコピー前に検査し、不備があれば既存の生成物を変更せずに終了します。

## 管理する場所

- 共通 workflow、共通 script、manifest に列挙した設定は hato-bot で修正します。sudden-death で直接変更しても、次の同期で上書きまたは削除されます。
- sudden-death 固有の workflow は `*sudden-death.yml`、固有 script はパスに `sudden_death` を含めます。これらと既存の `verify-lockfile.yml` は同期で保持します。
- `repo-name` はコピー先へ変換します。Python と uv のバージョン指定も同期します。アプリケーションの Python 依存や、コピー先の npm scripts は従来どおり別管理です。
- 共通 CodeQL workflow を配布する場合は Advanced setup を利用します。GitHub 側の default setup との切替はリポジトリ管理者が行います。同期処理は GitHub の設定を変更しません。default setup が有効なままでは Advanced setup の結果を受理できないため、生成 PR の実行結果でアップロード完了まで確認してください。

## 導入と検証

hato-bot の manifest を先にマージし、その後で sudden-death の consumer をマージします。コピー元に manifest がない場合は fail-fast し、従来の固定リストへは戻しません。既存の生成 PR に手動コミットを重ねる必要はありません。

`node --test` は既存の Super-Linter ジョブで、npm の依存導入直後に実行します。fixture テストは実際の `copy_ci.sh` を使い、Aqua 一式、コピー先固有ファイル、古い共通ファイルの削除、変換、再実行時の無変更、不正な manifest での事前停止を確認します。ローカルでは Node.js 20 以上、Bash、既存の mikefarah/yq が必要です。
