# Sudden Death

＿人人人人人人＿  
＞　突然の死　＜  
￣Y^Y^Y^Y^Y￣

↑を簡単に作るためのPythonスクリプトです。

## Requirements

- Python 3.5 over
- ```pipenv install```

## Usage

sd.pyを実行することで次に入力した文字が吹き出しになって出力されます。また、同時に出力された吹き出しはクリップボードにもコピーされます。

```sh
pipenv run python sd.py メッセージ
```

## コミットする前に行うこと

誤ってクレデンシャルをコミットしないよう、以下のhookを設定します。

1. 以下のスクリプトを `.git/hooks/pre-commit` として保存します。

    <!-- markdownlint-disable MD013 -->
    ```sh
    #!/bin/bash
    source `dirname ${0}`/_local-hook-exec
    declare scriptDir=$(cd $(dirname $0);pwd)
    declare parentDir="$(dirname "${scriptDir}")"
    declare FILES=$(git diff --cached --name-only --diff-filter=ACMR | sed 's| |\\ |g')
    [ -z "$FILES" ] && exit 0
    echo "  ▶ Check credentials by secretlint"
    yarn install
    # Secretlint all selected files
    echo "$FILES" | xargs yarn secretlint --maskSecrets
    RET=$?
    if [ $RET -eq 0 ] ;then
        exit 0
    else
        exit 1
    fi
    EOF
    ```
    <!-- markdownlint-enable MD013 -->

1. `.git/hooks/pre-commit` に実行権限を付与します。

    ```sh
    chmod +x .git/hooks/pre-commit
    ```

## License

[MIT LICENSE](LICENSE)

## Author

- [koluku](https://github.com/koluku)
