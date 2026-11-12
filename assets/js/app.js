/*
 * 気血水セルフチェック 本体
 * 通常、このファイルを編集する必要はありません。
 * 文章は data.js、サイト設定は config.js で変更できます。
 *
 * プライバシー方針：
 *  - 回答はメモリ上でのみ扱い、通信・保存（Cookie / localStorage 等）は一切しない
 *  - ページを閉じる・再読み込み・「もう一度チェック」で回答は消える
 */
(function () {
  "use strict";

  var C = window.APP_CONFIG || {};
  var D = window.APP_DATA;
  var typeKeys = Object.keys(D.types);

  // 回答ボタン（data.js の answers）。いちばん高い点数が「はい」
  var ANSWERS = D.answers || [
    { label: "はい", points: 2 },
    { label: "どちらかといえば", points: 1 },
    { label: "いいえ", points: 0 }
  ];
  var MAX_POINTS = Math.max.apply(null, ANSWERS.map(function (a) { return a.points; }));

  // タイプごとの満点（＝質問数 × 「はい」の点数）
  var maxScores = {};
  typeKeys.forEach(function (k) {
    maxScores[k] = D.questions.filter(function (q) { return q.type === k; }).length * MAX_POINTS;
  });

  var $ = function (id) { return document.getElementById(id); };
  var current = null;      // 現在の結果（メモリ上のみ）
  var imageBlob = null;
  var imageUrl = null;

  var isTouch = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
  var isInAppBrowser = /Line\/|Instagram|FBAN|FBAV|FB_IAB/i.test(navigator.userAgent);

  // ---------- 共通 ----------
  function fullName(key) {
    var t = D.types[key];
    return t.label + "（" + t.reading + "）";
  }

  function el(tag, className, text) {
    var e = document.createElement(tag);
    if (className) e.className = className;
    if (text != null) e.textContent = text;
    return e;
  }

  function fill(template, values) {
    return template.replace(/\{(\w+)\}/g, function (m, k) {
      return values[k] != null ? values[k] : m;
    });
  }

  var toastTimer;
  function toast(msg) {
    var t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2200);
  }

  // ---------- 質問（1問ずつ表示） ----------
  var answers = [];        // 質問ごとの点数（メモリ上のみ）
  var qIndex = 0;          // 表示中の質問番号（0から）
  var busy = false;        // 次の質問へ切り替え中は連打を無視
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function renderAnswerButtons() {
    var area = $("answerButtons");
    ANSWERS.forEach(function (a) {
      var btn = el("button", "answer", a.label);
      btn.type = "button";
      btn.dataset.points = a.points;
      btn.addEventListener("click", function () { answer(a.points, btn); });
      area.appendChild(btn);
    });
  }

  function renderQuestion(direction) {
    var q = D.questions[qIndex];
    var total = D.questions.length;
    $("qNum").textContent = "Q" + (qIndex + 1);
    $("qText").textContent = q.text;
    $("counter").textContent = (qIndex + 1) + " / " + total;
    $("progress").style.width = (qIndex / total * 100) + "%";
    $("prevBtn").hidden = qIndex === 0;
    Array.prototype.forEach.call(document.querySelectorAll("#answerButtons .answer"), function (b) {
      var selected = answers[qIndex] === Number(b.dataset.points);
      b.classList.toggle("is-selected", selected);
      b.setAttribute("aria-pressed", selected ? "true" : "false");
    });
    var card = $("qCard");
    card.classList.remove("slide-next", "slide-prev");
    if (direction && !reduceMotion) {
      void card.offsetWidth;   // アニメーションをやり直すため
      card.classList.add(direction === "prev" ? "slide-prev" : "slide-next");
    }
  }

  function answer(points, btn) {
    if (busy) return;
    busy = true;
    answers[qIndex] = points;
    Array.prototype.forEach.call(document.querySelectorAll("#answerButtons .answer"), function (b) {
      b.classList.toggle("is-selected", b === btn);
    });
    setTimeout(function () {
      busy = false;
      if (qIndex < D.questions.length - 1) {
        qIndex++;
        renderQuestion("next");
      } else {
        $("progress").style.width = "100%";
        showResult();
      }
    }, reduceMotion ? 80 : 260);
  }

  function prevQuestion() {
    if (busy || qIndex === 0) return;
    qIndex--;
    renderQuestion("prev");
  }

  // その人が「はい」「どちらかといえば」と答えた質問（タイプ別）
  function answeredSigns(typeKey) {
    var list = [];
    D.questions.forEach(function (q, i) {
      if (q.type === typeKey && answers[i] > 0) list.push(q.text);
    });
    return list;
  }

  // ---------- 判定 ----------
  // chosenKey：同点のとき、お客様が「今いちばん気になる」と選んだタイプ
  function compute(ans, chosenKey) {
    var scores = {};
    var total = 0;
    typeKeys.forEach(function (k) { scores[k] = 0; });
    D.questions.forEach(function (q, i) {
      var p = ans[i] || 0;
      scores[q.type] += p;
      total += p;
    });

    var ranked = typeKeys.map(function (key) {
      return { key: key, score: scores[key], ratio: maxScores[key] ? scores[key] / maxScores[key] : 0 };
    }).sort(function (a, b) { return b.ratio - a.ratio; });

    var topRatio = ranked[0].ratio;
    var tops = ranked.filter(function (r) { return r.ratio === topRatio; });
    var second = ranked.filter(function (r) { return r.ratio < topRatio && r.score > 0; })[0] || null;

    var chosen = chosenKey ? tops.filter(function (t) { return t.key === chosenKey; })[0] : null;
    if (chosen) {
      // 選ばれたタイプを1位に、同点だったほかのタイプを次点にする
      ranked = [chosen].concat(ranked.filter(function (r) { return r !== chosen; }));
      second = ranked.filter(function (r) { return r !== chosen && r.score > 0; })[0] || null;
      tops = [chosen];
    }

    return {
      ranked: ranked,
      topRatio: topRatio,
      tops: tops,
      second: second,
      // すべて「いいえ」のとき（mixedResult ＝ バランス良好の結果を表示）
      mixed: total === 0,
      // いちばん多いタイプでも「はい」1つ分以下のとき
      low: total > 0 && ranked[0].score <= MAX_POINTS
    };
  }

  function isTopItem(r, item) {
    return r.tops.some(function (t) { return t.key === item.key; });
  }

  // シェア・画像用の短いタイトル
  function resultShortTitle(r) {
    if (r.mixed) return D.mixedResult.title;
    return r.tops.map(function (t) { return D.types[t.key].label; }).join("・");
  }

  // 養生を表示するタイプ一覧（mixed のときは共通の養生を使う）
  function adviceSources(r) {
    if (r.mixed) return [{ name: null, data: D.mixedResult }];
    return r.tops.map(function (t) {
      return { name: r.tops.length > 1 ? fullName(t.key) : null, data: D.types[t.key] };
    });
  }

  // ---------- 結果の描画 ----------
  function renderResult(r) {
    // タイプ名の途中で改行されないよう、名前ごとに span で包む
    var titleEl = $("mainTitle");
    titleEl.textContent = "";
    if (r.mixed) {
      titleEl.textContent = D.mixedResult.title;
    } else {
      r.tops.forEach(function (t, i) {
        if (i > 0) titleEl.appendChild(document.createTextNode(" × "));
        // 名前と読みを分け、幅が足りないときは読みの前で改行する
        titleEl.appendChild(el("span", "nowrap", D.types[t.key].label));
        titleEl.appendChild(el("span", "nowrap reading", "（" + D.types[t.key].reading + "）"));
      });
    }
    $("mainDescription").textContent = r.mixed
      ? D.mixedResult.nickname
      : r.tops.map(function (t) { return D.types[t.key].nickname; }).join("／");

    // 傾向
    var ex = r.mixed
      ? D.mixedResult.description
      : r.tops.map(function (t) { return D.types[t.key].description; }).join("");
    if (!r.mixed && r.second) {
      ex += fill(D.texts.second, {
        name: fullName(r.second.key),
        description: D.types[r.second.key].description
      });
    }
    if (r.low) ex += D.texts.low;
    $("explanation").textContent = ex;

    // スコア
    var scoreArea = $("scores");
    scoreArea.textContent = "";
    r.ranked.forEach(function (item) {
      var div = el("div", "type-item" + (isTopItem(r, item) ? " is-top" : ""));
      var row = el("div", "type-row");
      row.appendChild(el("span", "type-name", fullName(item.key)));
      row.appendChild(el("span", null, item.score + "/" + maxScores[item.key]));
      var bar = el("div", "score-bar");
      var fillEl = el("div", "score-fill");
      fillEl.style.width = (item.ratio * 100) + "%";
      bar.appendChild(fillEl);
      div.appendChild(row);
      div.appendChild(bar);
      scoreArea.appendChild(div);
    });

    // おすすめのライフスタイル＋日常のヒント（重複は除く）
    var adviceArea = $("advice");
    adviceArea.textContent = "";
    var seen = {};
    adviceSources(r).forEach(function (src) {
      var items = (src.data.advice || []).filter(function (a) { return !seen[a]; });
      items.forEach(function (a) { seen[a] = true; });
      if (!src.data.lifestyle && !items.length) return;
      if (src.name) adviceArea.appendChild(el("div", "group-title", src.name));
      if (src.data.lifestyle) adviceArea.appendChild(el("p", "lifestyle", src.data.lifestyle));
      if (items.length) {
        var ul = el("ul");
        items.forEach(function (a) { ul.appendChild(el("li", null, a)); });
        adviceArea.appendChild(ul);
      }
    });

    // 食養生
    var foodArea = $("food");
    foodArea.textContent = "";
    adviceSources(r).forEach(function (src) {
      var f = src.data.food;
      if (!f) return;
      if (src.name) foodArea.appendChild(el("div", "group-title", src.name));
      var ul = el("ul", "chips");
      f.good.forEach(function (g) { ul.appendChild(el("li", null, g)); });
      foodArea.appendChild(ul);
      if (f.tip) foodArea.appendChild(el("p", "food-tip", f.tip));
      if (f.avoid) foodArea.appendChild(el("p", "food-avoid", "控えめに：" + f.avoid));
    });
    $("foodNotice").textContent = D.texts.foodNotice || "";

    // シェアリンク
    var text = shareText();
    var url = shareUrl();
    $("lineShareBtn").href = "https://line.me/R/share?text=" +
      encodeURIComponent(url ? text + "\n" + url : text);
    $("xShareBtn").href = "https://x.com/intent/post?text=" + encodeURIComponent(text) +
      (url ? "&url=" + encodeURIComponent(url) : "");
  }

  // 画面の切り替え（start / quiz / tiebreak / result のどれか1つを表示）
  function showView(name) {
    ["start", "quiz", "tiebreak", "result"].forEach(function (v) {
      $(v).hidden = v !== name;
    });
    document.body.setAttribute("data-view", name);   // スタート画面以外はヘッダーを小さく
    window.scrollTo(0, 0);
  }

  function showResult() {
    var r = compute(answers);

    // 同点のときは、今いちばん気になるタイプをお客様に選んでもらう
    if (!r.mixed && r.tops.length > 1) {
      renderTieBreak(r);
      showView("tiebreak");
      $("tieTitle").focus({ preventScroll: true });
      try { history.pushState({ view: "tie" }, ""); } catch (e) { /* file:// 等 */ }
      return;
    }
    showResultView(r, "push");
  }

  function renderTieBreak(r) {
    $("tieTitle").textContent = D.texts.tieTitle || "";
    $("tieLead").textContent = D.texts.tieLead || "";
    var area = $("tieOptions");
    area.textContent = "";
    r.tops.forEach(function (t) {
      var type = D.types[t.key];
      var btn = el("button", "tie-option");
      btn.type = "button";
      var head = el("span", "tie-head");
      head.appendChild(el("span", "tie-name", type.nickname));
      head.appendChild(el("span", "tie-label", fullName(t.key)));
      btn.appendChild(head);
      // そのタイプで「はい」「どちらかといえば」と答えたサイン
      var ul = el("ul", "tie-signs");
      answeredSigns(t.key).forEach(function (s) { ul.appendChild(el("li", null, s)); });
      btn.appendChild(ul);
      btn.addEventListener("click", function () {
        showResultView(compute(answers, t.key), "replace");
      });
      area.appendChild(btn);
    });
  }

  function showResultView(r, historyMode) {
    current = r;
    renderResult(current);

    showView("result");
    $("mainTitle").focus({ preventScroll: true });

    // ブラウザの「戻る」で質問画面に戻れるように
    try {
      if (historyMode === "replace") history.replaceState({ view: "result" }, "");
      else history.pushState({ view: "result" }, "");
    } catch (e) { /* file:// 等 */ }
  }

  // 質問画面に戻る（最後に答えた質問を表示。「前の質問に戻る」で見直せる）
  function showQuiz() {
    closeModal();
    if (restartPending) {
      restartPending = false;
      showView("start");
      return;
    }
    renderQuestion();
    showView("quiz");
  }

  function startQuiz() {
    answers = [];
    qIndex = 0;
    renderQuestion();
    showView("quiz");
  }

  var restartPending = false;

  function backToQuiz() {
    if (history.state && history.state.view) history.back();   // popstate で showQuiz される
    else showQuiz();
  }

  function restart() {
    // 回答と結果をすべて破棄して、スタート画面へ
    answers = [];
    qIndex = 0;
    current = null;
    releaseImage();
    restartPending = true;
    backToQuiz();
  }

  window.addEventListener("popstate", function () {
    if (!$("result").hidden || !$("tiebreak").hidden) showQuiz();
  });

  // ---------- シェア ----------
  function shareUrl() {
    if (C.siteUrl) return C.siteUrl;
    if (/^https?:$/.test(location.protocol)) return location.origin + location.pathname;
    return "";
  }

  function shareText() {
    var result = "";
    if (current) {
      result = (!current.mixed && current.tops.length === 1)
        ? D.types[current.tops[0].key].nickname + "（" + D.types[current.tops[0].key].label + "）"
        : resultShortTitle(current);
    }
    return fill(C.shareText || "", { result: result });
  }

  function nativeShare() {
    var data = { title: C.siteTitle, text: shareText() };
    var url = shareUrl();
    if (url) data.url = url;
    navigator.share(data).catch(function () { /* キャンセル時は何もしない */ });
  }

  function copyUrl() {
    var value = shareUrl() || shareText();
    var done = function () { toast("コピーしました"); };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(value).then(done, function () { legacyCopy(value) && done(); });
    } else if (legacyCopy(value)) {
      done();
    }
  }

  function legacyCopy(value) {
    var ta = document.createElement("textarea");
    ta.value = value;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
    document.body.removeChild(ta);
    if (!ok) toast("コピーできませんでした");
    return ok;
  }

  // ---------- 結果画像（端末内の canvas で生成。外部送信なし） ----------
  var FONT = '"Hiragino Sans","Hiragino Kaku Gothic ProN","Noto Sans JP","Yu Gothic",Meiryo,sans-serif';
  var P = {
    bg: "#f8f3ef", card: "#ffffff", text: "#514943", sub: "#82766e",
    light: "#a58c80", accent: "#ad8276", track: "#eee8e3", fill: "#bd988c",
    line: "#eaded7", chip: "#fffaf7"
  };

  function font(size, weight) { return (weight || 400) + " " + size + "px " + FONT; }
  function spacing(ctx, px) { if ("letterSpacing" in ctx) ctx.letterSpacing = px + "px"; }

  function roundRect(ctx, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function fitFont(ctx, text, maxW, size, min, weight) {
    while (size > min) {
      ctx.font = font(size, weight);
      if (ctx.measureText(text).width <= maxW) break;
      size -= 2;
    }
    ctx.font = font(size, weight);
    return size;
  }

  function drawResultImage(r) {
    var W = 1080, H = 1350;
    var cv = document.createElement("canvas");
    cv.width = W; cv.height = H;
    var ctx = cv.getContext("2d");
    var L = 130, R = W - 130, CW = R - L;

    ctx.fillStyle = P.bg;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = P.card;
    roundRect(ctx, 60, 60, W - 120, H - 120, 40);
    ctx.fill();

    // ヘッダー
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    var y = 150;
    spacing(ctx, 6);
    ctx.font = font(24);
    ctx.fillStyle = P.light;
    ctx.fillText("EASTERN MEDICINE / SELF CHECK", W / 2, y);

    y += 60;
    spacing(ctx, 4);
    fitFont(ctx, C.siteTitle, CW, 42, 28, 500);
    ctx.fillStyle = P.text;
    ctx.fillText(C.siteTitle, W / 2, y);

    y += 38;
    ctx.fillStyle = P.line;
    ctx.fillRect(L, y, CW, 2);

    // 結果タイトル
    y += 70;
    spacing(ctx, 4);
    ctx.font = font(24);
    ctx.fillStyle = P.accent;
    ctx.fillText("YOUR CURRENT BALANCE", W / 2, y);

    y += 92;
    spacing(ctx, 2);
    var title = (r.mixed || r.tops.length > 1) ? resultShortTitle(r).replace(/・/g, " × ") : fullName(r.tops[0].key);
    fitFont(ctx, title, CW, 76, 36, 500);
    ctx.fillStyle = P.text;
    ctx.fillText(title, W / 2, y);

    y += 56;
    spacing(ctx, 0);
    var sub = r.mixed ? D.mixedResult.nickname
      : r.tops.length > 1 ? r.tops.map(function (t) { return D.types[t.key].nickname; }).join(" × ")
      : D.types[r.tops[0].key].nickname;
    fitFont(ctx, sub, CW, 30, 22, 400);
    ctx.fillStyle = P.sub;
    ctx.fillText(sub, W / 2, y);

    // バランス
    y += 40;
    var rowH = r.ranked.length > 5 ? 62 : 70;   // タイプ数が多いときは行間を詰める
    r.ranked.forEach(function (item) {
      y += rowH;
      var isTop = isTopItem(r, item);
      ctx.textAlign = "left";
      ctx.font = font(30, 600);
      ctx.fillStyle = isTop ? P.accent : P.text;
      ctx.fillText(fullName(item.key), L, y);
      ctx.textAlign = "right";
      ctx.font = font(28, 400);
      ctx.fillStyle = P.text;
      ctx.fillText(item.score + "/" + maxScores[item.key], R, y);

      ctx.fillStyle = P.track;
      roundRect(ctx, L, y + 16, CW, 12, 6);
      ctx.fill();
      if (item.ratio > 0) {
        ctx.fillStyle = P.fill;
        roundRect(ctx, L, y + 16, CW * item.ratio, 12, 6);
        ctx.fill();
      }
    });

    // 食材
    y += 72;
    ctx.fillStyle = P.line;
    ctx.fillRect(L, y, CW, 2);
    y += 58;
    ctx.textAlign = "left";
    ctx.font = font(28, 600);
    ctx.fillStyle = P.accent;
    ctx.fillText("おすすめの食材", L, y);

    var foods = [];
    adviceSources(r).forEach(function (s) {
      (s.data.food ? s.data.food.good : []).forEach(function (g) {
        if (foods.indexOf(g) < 0) foods.push(g);
      });
    });
    y += 24;
    var x = L, chipH = 56, gap = 14, rows = 1, maxRows = 2;
    ctx.font = font(26);
    for (var i = 0; i < foods.length; i++) {
      var w = ctx.measureText(foods[i]).width + 44;
      if (x + w > R) {
        if (rows >= maxRows) continue;   // 2行に収まらない食材は省略
        rows++;
        x = L;
        y += chipH + gap;
      }
      ctx.fillStyle = P.chip;
      roundRect(ctx, x, y, w, chipH, 28);
      ctx.fill();
      ctx.strokeStyle = P.line;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = P.text;
      ctx.textBaseline = "middle";
      ctx.fillText(foods[i], x + 22, y + chipH / 2 + 1);
      ctx.textBaseline = "alphabetic";
      x += w + gap;
    }

    // フッター
    ctx.textAlign = "center";
    ctx.font = font(21);
    ctx.fillStyle = P.sub;
    ctx.fillText("※東洋医学の考え方にもとづくセルフチェックです。医学的な診断ではありません。", W / 2, H - 120);
    var foot = [];
    if (C.operatorName) foot.push(C.operatorName);
    var u = shareUrl();
    if (u) foot.push(u.replace(/^https?:\/\//, "").replace(/\/$/, ""));
    if (foot.length) {
      ctx.font = font(24, 500);
      ctx.fillStyle = P.accent;
      ctx.fillText(foot.join("  |  "), W / 2, H - 82);
    }
    return cv;
  }

  function releaseImage() {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    imageUrl = null;
    imageBlob = null;
    $("resultImage").removeAttribute("src");
  }

  function openImage() {
    if (!current) return;
    var btn = $("saveImageBtn");
    btn.disabled = true;
    var ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    ready.then(function () {
      var cv = drawResultImage(current);
      cv.toBlob(function (blob) {
        btn.disabled = false;
        if (!blob) { toast("画像を作成できませんでした"); return; }
        releaseImage();
        imageBlob = blob;
        imageUrl = URL.createObjectURL(blob);
        // 長押し保存しやすいよう data URL を表示に使う
        $("resultImage").src = cv.toDataURL("image/png");

        var hint = isTouch
          ? "保存ボタンがうまく動かない場合は、画像を長押しして保存してください。"
          : "「画像を保存」でPNG画像をダウンロードできます。";
        if (isInAppBrowser) {
          hint = "LINE・Instagramのアプリ内では、画像を長押しして保存してください。";
        }
        $("saveHint").textContent = hint;
        $("imageModal").hidden = false;
        $("downloadBtn").focus();
      }, "image/png");
    });
  }

  function saveImage() {
    if (!imageBlob) return;
    var name = "kiketsusui-check.png";

    // スマホは共有シートから「画像を保存」できる
    if (isTouch && window.File && navigator.canShare) {
      var file = new File([imageBlob], name, { type: "image/png" });
      if (navigator.canShare({ files: [file] })) {
        navigator.share({ files: [file] }).catch(function (e) {
          if (e && e.name !== "AbortError") download(name);
        });
        return;
      }
    }
    download(name);
  }

  function download(name) {
    var a = document.createElement("a");
    a.href = imageUrl;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  function closeModal() {
    $("imageModal").hidden = true;
  }

  // ---------- 外部リンク ----------
  function renderLinks() {
    var cfg = C.links || {};
    var items = (cfg.items || []).filter(function (l) { return l && /^https?:\/\//.test(l.url || ""); });
    if (!items.length) return;
    $("linksTitle").textContent = cfg.title || "";
    $("linksText").textContent = cfg.text || "";
    var area = $("links");
    items.forEach(function (l) {
      var a = el("a", l.style || "default", l.label);
      a.href = l.url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      area.appendChild(a);
    });
    $("linksCard").hidden = false;
  }

  // ---------- 初期化 ----------
  function init() {
    document.title = C.siteTitle ? C.siteTitle + "｜登録不要・無料" : document.title;
    if (D.intro) {
      $("introText").textContent = D.intro;
      $("introText").hidden = false;
    }
    $("questionCount").textContent = D.questions.length;
    renderAnswerButtons();
    renderLinks();

    if (C.operatorName) {
      $("operator").textContent = "© " + C.operatorName +
        (C.operatorNameKana ? "（" + C.operatorNameKana + "）" : "");
      $("operator").hidden = false;
    }
    if (navigator.share) $("nativeShareBtn").hidden = false;

    $("startBtn").addEventListener("click", startQuiz);
    $("prevBtn").addEventListener("click", prevQuestion);
    $("restartBtn").addEventListener("click", restart);
    $("tieBackBtn").addEventListener("click", backToQuiz);
    $("saveImageBtn").addEventListener("click", openImage);
    $("downloadBtn").addEventListener("click", saveImage);
    $("closeModalBtn").addEventListener("click", closeModal);
    $("imageModal").addEventListener("click", function (e) {
      if (e.target === e.currentTarget) closeModal();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeModal();
    });
    $("nativeShareBtn").addEventListener("click", nativeShare);
    $("copyBtn").addEventListener("click", copyUrl);

    // 再読み込み時などに履歴に結果状態が残っていても、必ずスタート画面から始める
    try { if (history.state) history.replaceState(null, ""); } catch (e) { /* noop */ }
  }

  init();
})();
