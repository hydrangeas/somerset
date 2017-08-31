Somerset
====

保通協が掲示している[型式試験の実施状況(PDF)](http://www.hotsukyo.or.jp/pdf/weekly.pdf)を取得し、HTML又はJSONで返します。リクエストクエリを送ることで、一部のデータだけ返すことも可能です。

## Description
Node.jsとExpress.jsを勉強するために作成しました。
* [Node.jsとExpress.jsを使ってみた](http://qiita.com/hydrangeas/items/8651cfbc71ecbe21a4e7)

## Demo
* [型式試験の実施状況（デモ)](http://somerset.eu-4.evennode.com/)
* 2017/09/23まで見ることができます。

## Requirement
* Nodejs
* MongoDB

## Install

```bash
$ npm install
```

## TODO

* 試験を導入したい
* アクセスがない場合、データベースが更新されないので、CRONみたいな仕組みを入れたい
* 1レコード単位（もしくは複数）で更新（編集）したい（環境変数にパスワードを入れて、更新する仕組みをつくる？）
* 初期設定時のデータだけ特殊処理をしたい（start=nullとしたい）
* workingから削除されたデータをfinishedに移動させるか、削除フラグで代用したい（データの統計を取るため）

## Licence
MIT

## Author
[hydrangeas](https://github.com/hydrangeas)
