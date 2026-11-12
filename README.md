# 気血水セルフチェック ／ 五臓セルフチェック

スマートフォン・PCのブラウザで動く、インストール不要のセルフチェックWebアプリです。
HTML / CSS / JavaScript だけで動く静的サイトなので、Netlify などで無料で公開できます。

| チェック | URL | 内容を書いているファイル |
|---|---|---|
| 気血水セルフチェック | https://acco-kiketsusui.netlify.app/ | `assets/js/data.js` |
| 五臓セルフチェック | https://acco-kiketsusui.netlify.app/gozou/ | `assets/js/gozou-data.js` |

2つのページは同じプログラム（`app.js`）とデザイン（`style.css`）を共有していますが、
質問・結果・回答はそれぞれ別で、勝手につながることはありません。

## 使い方の流れ

1. スタート画面で「チェックをはじめる」
2. 1問ずつ4択（はい／たまにある／ほとんどない／いいえ など）で答える（はい3点〜いいえ0点）
3. 1位との差が1点以内のタイプがあるときは、「今いちばん気になるサイン」を1つ選ぶ
4. 結果を表示（画像保存・シェア・LINEで無料カウンセリングへ）

## ファイル構成

```
├── index.html              … 気血水チェックのページ
├── gozou/index.html        … 五臓チェックのページ
├── _headers                … セキュリティ設定（外部通信をブロック）
├── assets/
│   ├── js/
│   │   ├── config.js       … ★共通設定：サイト名・運営者名・公開URL・シェア文・リンク
│   │   ├── data.js         … ★気血水：質問・解説・ライフスタイル・食養生の文章
│   │   ├── gozou-data.js   … ★五臓：質問・解説の文章（先頭の config で設定を上書き）
│   │   └── app.js          … 動作プログラム（通常は編集不要）
│   ├── css/style.css       … デザイン（色は先頭の :root で変更）
│   └── img/                … SNSプレビュー画像・アイコン
└── README.md
```

★印のファイルだけ編集すれば、内容を変更できます。

## よくある変更

| やりたいこと | 編集する場所 |
|---|---|
| Instagram・LINE公式アカウントのリンク | 気血水：`config.js` の `links`／五臓：`gozou-data.js` の `config.links` |
| サロン名・講座名を表示 | `config.js` の `operatorName` |
| シェア文を変更 | 気血水：`config.js` の `shareText`／五臓：`gozou-data.js` の `config.shareText` |
| 質問の文言を変更・追加・削除 | `data.js` / `gozou-data.js` の `questions` |
| 質問ごとの答えの言葉 | `answerSets`（質問に `answers: "concern"` などを付けて選ぶ） |
| タイプの解説・ライフスタイル・食材を変更 | `data.js` / `gozou-data.js` の `types` |
| 「いちばん気になるサイン」を選ぶ条件 | `closeMargin`（1位との差が何点以内か） |
| 2番目のタイプも紹介する条件 | `secondMargin`（1位との差が何点以内か） |
| 色を変更 | `style.css` 先頭の `:root` |

編集のコツ：`"` で囲まれた文字の中だけを書き換え、行末のカンマ `,` は消さないでください。
編集後は `index.html` をブラウザで開けば、そのまま動作確認できます。

## 公開について（Netlify・無料）

公開URL：**https://acco-kiketsusui.netlify.app/**

- Netlify は GitHub のこのリポジトリとつながっています。
  `main` ブランチに保存（push）すると、1〜2分で自動的にサイトへ反映されます。
- URL（サイト名）を変えたときは、次の3か所も新しいURLに書き換えてください。
  - `index.html` の `og:url` と `og:image`（LINEやSNSでURLを送ったときのプレビュー用）
  - `config.js` の `siteUrl`（シェア文と結果画像の下部に表示）

Cloudflare Pages・GitHub Pages でも、同じフォルダをそのまま公開できます
（GitHub Pages では `_headers` は効きませんが、動作には影響しません）。

## 配布のヒント

- **サロン・講座**：URLのQRコードを印刷して置いておくと、お客様が自分のスマホで読み取って使えます。
  1人終わったら「もう一度チェックする」で回答がすべて消えるので、店頭の共用端末でも使えます。
- **LINEで配布**：URLの末尾に `?openExternalBrowser=1` を付けると、LINEアプリ内ではなく
  Safari / Chromeで開くので、画像保存やシェアがスムーズです。
  例：`https://xxxx.netlify.app/?openExternalBrowser=1`
- **Instagram**：プロフィールのリンクやストーリーズのリンクスタンプにURLを設定してください。

## プライバシー設計

- 個人情報の入力欄はありません
- 回答はブラウザの中だけで計算し、サーバーへの送信・Cookie・localStorage への保存は一切しません
- 解析ツール・広告・外部フォント・外部スクリプトを使っていません
- `_headers` の Content-Security-Policy で、ブラウザ側でも外部への通信をブロックしています
- 結果画像は端末内で生成されます
- シェアボタンを押したときだけ、タイプ名とURLが利用者の選んだアプリに渡ります

※ホスティング会社（Netlify等）は、一般的なWebサイトと同様にアクセスログ（IPアドレス等）を記録します。回答内容はログに含まれません。
※Netlify Analytics などの解析機能を後から有効にする場合は、ページ下部の「プライバシーについて」の記載も見直してください。
