# Sudden Death

＿人人人人人人＿  
＞　突然の死　＜  
￣Y^Y^Y^Y^Y￣

↑を簡単に作るためのPythonスクリプトです。

## Requirements

- Python 3.11.0
- ```pipenv install```
- ```npm install```

## Usage

sd.pyを実行することで次に入力した文字が吹き出しになって出力されます。また、同時に出力された吹き出しはクリップボードにもコピーされます。

```sh
pipenv run python sd.py メッセージ
```

## lintをかける方法

```sh
npm run lint
```

## コミットする前に行うこと

<https://pre-commit.com/> の手順に従って `pre-commit` をインストールします。  
これにより、[.pre-commit-config.yaml](.pre-commit-config.yaml)の設定に基づいて、コミット時にクレデンシャルが含まれていないかの検査が行われるようになります。

## License

[MIT LICENSE](LICENSE)

## Author

- [koluku](https://github.com/koluku)
