/*
 * ============================================================
 *  サイト設定ファイル
 *  ここを書き換えるだけで、サイト名・リンク・シェア文などを変更できます。
 *  （文字列は "  " の中だけを書き換えてください）
 * ============================================================
 */
window.APP_CONFIG = {
  // サイト名（タブ・画像・シェア文に使われます）
  siteTitle: "気血水セルフチェック",

  // 運営者名（ページ下部と保存画像に表示されます。空 "" なら非表示）
  operatorName: "L’Atelier acco",

  // 運営者名の読み（ページ下部にだけ、名前のあとに表示されます。空 "" なら非表示）
  operatorNameKana: "アトリエアッコ",

  // 公開URL（例: "https://kiketsusui.netlify.app/"）
  // 空 "" のままなら、開いているページのURLを自動で使います。
  siteUrl: "",

  // シェアするときの文章。{result} の部分が結果のタイプ名に置き換わります。
  shareText: "気血水セルフチェックをやってみました。結果は「{result}」でした。",

  // 結果のすぐ下に表示するカウンセリング案内とリンク（Instagram・LINE公式アカウントなど）
  // url が空 "" のものは表示されません。不要な行は削除してもOKです。
  links: {
    title: "もっと詳しく聞きたい方へ",
    text: "約20分のオンラインプチカウンセリング（無料）を受けてみませんか？LINE公式アカウントのメッセージから、お気軽にお問い合わせくださいね。",
    items: [
      { label: "LINEで無料カウンセリングを相談する", url: "https://lin.ee/vYYwe85", style: "line" },
      { label: "東洋医学のInstagramを見る", url: "https://www.instagram.com/cocokara.kampo/", style: "instagram" },
      { label: "サロンのInstagramを見る", url: "https://www.instagram.com/acco.pbd.yatabe/", style: "instagram" }
      // { label: "講座・サロンのご案内", url: "https://...", style: "default" }
    ]
  }
};
