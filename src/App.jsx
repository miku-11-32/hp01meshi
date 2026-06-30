import { useState, useRef, useEffect } from "react";

const FATIGUE_LEVELS = [
  { id: "dead", emoji: "💀", label: "死にそう", sub: "皿すら洗いたくない", color: "#d4857a", bg: "#fff0ee", border: "#f5c4be" },
  { id: "tired", emoji: "😩", label: "かなりしんどい", sub: "レンチンだけでお願い", color: "#d4a06a", bg: "#fff6ec", border: "#f5d9b8" },
  { id: "meh", emoji: "😐", label: "まあまあ", sub: "炒めるくらいならできる", color: "#c4ae50", bg: "#fffce8", border: "#f0e49a" },
  { id: "ok", emoji: "😊", label: "わりと元気", sub: "ちゃんとしたズボラ飯いける", color: "#7aaf7a", bg: "#f0faf0", border: "#b8e4b8" },
];

const PHOTO_SLOTS = [
  { id: "fridge", label: "冷蔵室", emoji: "🧊" },
  { id: "veggie", label: "野菜室", emoji: "🥦" },
  { id: "freezer", label: "冷凍庫", emoji: "❄️" },
];

const NG_FOODS = [
  "ピーマン","にんじん","きのこ","なす","トマト","ほうれん草","ブロッコリー","玉ねぎ",
  "魚全般","エビ","イカ","貝類","牛肉","豚肉","鶏肉","卵","牛乳","チーズ","豆腐","納豆",
  "こんにゃく","ゴーヤ","セロリ","パクチー","レバー","しらす","梅干し"
];

const NG_GENRES = [
  { id: "japanese", label: "和食", emoji: "🍚" },
  { id: "western", label: "洋食", emoji: "🍝" },
  { id: "chinese", label: "中華", emoji: "🥡" },
  { id: "noodle", label: "麺類", emoji: "🍜" },
  { id: "bowl", label: "丼もの", emoji: "🍲" },
  { id: "soup", label: "スープ・汁物", emoji: "🍵" },
];


const fatigueSystemPrompt = `あなたは疲れたママのための夕食アドバイザーです。疲れ度に応じて、子供も食べられる栄養のある夕食メニューを3個提案してください。
疲れ度：💀死にそう=包丁不要（3個の提案のうち必ず1個はカップ麺か袋麺にすること。残り2個はレンチン丼・冷凍食品アレンジ・お惣菜活用・電子レンジだけで作れる料理など、カップ麺・袋麺以外の手抜き飯にすること）、😩かなりしんどい=レンチン5分以内、😐まあまあ=フライパン1つ10分、😊元気=20分以内
毎回なるべく違うジャンル（和食・洋食・中華・丼・麺・スープなど）をバランスよく混ぜて提案してください。同じメニューの繰り返しは避けること。親子丼・卵とじ丼など同系統の丼が連続しないようにすること。
冷凍野菜を使う場合は「冷凍ブロッコリー」に偏らず、冷凍カット野菜・冷凍ほうれん草・冷凍枝豆・冷凍コーン・冷凍いんげんなどバリエーションをつけること。
JSON形式のみ返答（他の文字一切不要）：{"menus":[{"name":"絵文字1〜3個+半角スペース+料理名（例：🍅🧀 トマトチーズ焼き）","time":"調理時間","ingredients":["食材1（量）","食材2（量）"],"seasonings":["調味料1（例：醤油 大さじ2）","調味料2"],"steps":["手順1","手順2","手順3"],"point":"ポイント","okMessage":"疲れたママへのクスッと笑えるひとこと。例：「これで十分！むしろ料理した自分えらい」「手抜きじゃなくて時短って言うの」「今日もよく生きた」みたいなノリで、ユーモアたっぷりに。"}]}
重要：JSON以外の文字（説明・前置き・コードブロック記号）は絶対に含めないこと。`;

const fridgeSystemPrompt = `あなたは疲れたママのための夕食アドバイザーです。
提供された冷蔵庫の写真（複数枚可）と音声で追加された食材情報から、使える食材を全て把握して、子供も食べられるズボラ飯を3個提案してください。
条件：なるべく少ない工程、できれば20分以内。毎回なるべく違うジャンル（和食・洋食・中華・丼・麺・スープなど）をバランスよく混ぜて提案してください。同じメニューの繰り返しは避けること。親子丼・卵とじ丼など同系統の丼が連続しないようにすること。
冷凍野菜を使う場合は「冷凍ブロッコリー」に偏らず、冷凍カット野菜・冷凍ほうれん草・冷凍枝豆・冷凍コーン・冷凍いんげんなどバリエーションをつけること。
JSON形式のみ（他の文字一切不要）：{"ingredients":["食材1","食材2"],"menus":[{"name":"絵文字1〜3個+半角スペース+料理名（例：🥚🧅 玉ねぎ卵炒め）","time":"時間","usedIngredients":["食材1（量）","食材2（量）"],"seasonings":["調味料1（例：醤油 大さじ2）","調味料2"],"steps":["手順1","手順2","手順3"],"point":"ポイント","okMessage":"疲れたママへのクスッと笑えるひとこと。例：「冷蔵庫ガチャ大当たり！」「これで十分！むしろ料理した自分えらい」「手抜きじゃなくて時短って言うの」みたいなノリで、ユーモアたっぷりに。"}]}
重要：JSON以外の文字（説明・前置き・コードブロック記号）は絶対に含めないこと。`;

const shuffleSystemPrompt = `あなたは疲れたママのための夕食アドバイザーです。
疲れ度に応じて、子供も食べられる夕食メニューを【たった1つだけ】ランダムに提案してください。
重要：辛い食材（キムチ・唐辛子・コチュジャン・わさび・一味・七味など）は絶対に使わないこと。ただし甘口カレー・甘口麻婆豆腐など辛くないバージョンはOK。その場合はメニュー名に「甘口」と明記すること。子供が安心して食べられるものだけ。
疲れ度：💀死にそう=包丁不要（3個の提案のうち必ず1個はカップ麺か袋麺にすること。残り2個はレンチン丼・冷凍食品アレンジ・お惣菜活用・電子レンジだけで作れる料理など、カップ麺・袋麺以外の手抜き飯にすること）、😩かなりしんどい=レンチン5分以内、😐まあまあ=フライパン1つ10分、😊元気=20分以内
毎回違うメニューをランダムに1つ選んで提案してください。
JSON形式のみ（他の文字一切不要）：{"menu":{"name":"絵文字1〜3個+半角スペース+料理名（例：🍗🥔 鶏じゃが）","time":"調理時間","ingredients":["食材1（量）","食材2（量）"],"seasonings":["調味料1（例：醤油 大さじ2）"],"steps":["手順1","手順2","手順3"],"point":"ポイント","okMessage":"疲れたママへのクスッと笑えるひとこと"}}
重要：JSON以外の文字（説明・前置き・コードブロック記号）は絶対に含めないこと。`;

const LOADING_TIPS = [
  "洗濯まわしてみて🫧",
  "今のうちにトイレ行っといて🚽",
  "5秒だけ目閉じて✨",
  "子供に「今日なに食べたい？」って聞いといて（どうせ却下するけど）🤣",
  "ちょっとだけ水飲んでね💧",
  "何もしなくていいよ。待つだけでえらい🌸",
  "チョコでも食べちゃおう🍫",
  "１杯🍺いっとく？",
];

function LoadingTip() {
  const [tip] = useState(() => LOADING_TIPS[Math.floor(Math.random() * LOADING_TIPS.length)]);
  return (
    <div style={{
      marginTop: 16,
      background: "rgba(255,255,255,0.85)",
      border: "1.5px dashed #fcd97a",
      borderRadius: 16,
      padding: "12px 18px",
      textAlign: "center",
      fontSize: 13,
      fontWeight: 700,
      color: "#a07820",
      maxWidth: 280,
      lineHeight: 1.6,
      animation: "fadeUp 0.5s ease both",
    }}>
      その間に…<br/>{tip}
    </div>
  );
}

export default function App() {
  // 家族人数設定
  const [adults, setAdults] = useState(() => {
    try { return parseInt(localStorage.getItem("adults") || "2"); } catch { return 2; }
  });
  const [kids, setKids] = useState(() => {
    try { return parseInt(localStorage.getItem("kids") || "1"); } catch { return 1; }
  });
  const [showFamilySetup, setShowFamilySetup] = useState(() => {
    try { return localStorage.getItem("familySetupDone") !== "true"; } catch { return true; }
  });
  const [showFamilyEdit, setShowFamilyEdit] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [mode, setMode] = useState("home");
  const [selected, setSelected] = useState(null);
  const [result, setResult] = useState(null);
  const [foundIngredients, setFoundIngredients] = useState([]);
  const [shuffleResult, setShuffleResult] = useState(null);
  const [shuffleLoading, setShuffleLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ngFoods, setNgFoods] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ngFoods") || "[]"); } catch { return []; }
  });
  const [ngGenres, setNgGenres] = useState(() => {
    try { return JSON.parse(localStorage.getItem("ngGenres") || "[]"); } catch { return []; }
  });
  const [showNgSettings, setShowNgSettings] = useState(false);
  const [reactions, setReactions] = useState({});
  const [savedMenus, setSavedMenus] = useState(() => {
    try { return JSON.parse(localStorage.getItem("savedMenus") || "[]"); } catch { return []; }
  });
  const [showSaved, setShowSaved] = useState(false);
  const [selectedSavedMenu, setSelectedSavedMenu] = useState(null);
  const [ngCustomInput, setNgCustomInput] = useState("");
  const [error, setError] = useState(null);
  const [photos, setPhotos] = useState({ fridge: null, veggie: null, freezer: null });
  const [voiceInput, setVoiceInput] = useState("");
  const fileInputRefs = { fridge: useRef(null), veggie: useRef(null), freezer: useRef(null) };

  const MODEL_ID = "claude-haiku-4-5-20251001";

  const getNgGenreNote = () => {
    if (ngGenres.length === 0) return "";
    const labels = ngGenres.map(id => NG_GENRES.find(g => g.id === id)?.label).filter(Boolean);
    return `\n避けてほしいジャンル：${labels.join("・")}（このジャンルは提案しないこと）`;
  };

  // JSON安全パース（壊れたJSONも拾う）
  const safeParseJSON = (text) => {
    const cleaned = text.replace(/```json|```/g, "").trim();
    try {
      return JSON.parse(cleaned);
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          return JSON.parse(match[0]);
        } catch {
          throw new Error("JSONパース失敗: " + cleaned.slice(0, 150));
        }
      }
      throw new Error("JSON抽出失敗: " + cleaned.slice(0, 150));
    }
  };

  // APIコール共通（最大2回リトライ）
  const callAPI = async (body, maxRetry = 2) => {
    let lastErr;
    for (let i = 0; i <= maxRetry; i++) {
      try {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true",
          },
          body: JSON.stringify({ ...body, model: MODEL_ID, max_tokens: body.max_tokens || 3000 }),
        });
        const data = await res.json();
        if (!res.ok || data.error) {
          const msg = data?.error?.message || data?.message || `HTTP ${res.status}`;
          throw new Error(msg);
        }
        const text = data.content?.find(b => b.type === "text")?.text || "";
        if (!text) throw new Error("空のレスポンス: " + JSON.stringify(data).slice(0,200));
        return safeParseJSON(text);
      } catch (err) {
        lastErr = err;
        if (i < maxRetry) await new Promise(r => setTimeout(r, 800 * (i + 1)));
      }
    }
    throw lastErr;
  };

  // ---- iOS Safari 音声入力対応 ----

  const toggleVoice = async () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      return;
    }

    if (!isSpeechSupported) {
      setError("このブラウザは音声入力に対応していないよ。下のテキスト欄に直接入力してね📝");
      return;
    }

    // iOSは先にマイク許可を取る
    if (isIOS && micPermission !== "granted") {
      const ok = await requestMicPermission();
      if (!ok) return;
    }

    if (!isHttps) {
      setError("⚠️ マイクを使うにはHTTPS接続が必要だよ！");
      return;
    }

    try {
      const recognition = new SR();
      recognition.lang = "ja-JP";
      recognition.continuous = false;
      recognition.interimResults = true;

      // iOSはinterimResultsがうまく動かないことがあるのでfalseも試せるよう
      if (isIOS) {
        recognition.interimResults = false;
      }

      recognition.onstart = () => {
        setIsRecording(true);
        setError(null);
      };

      let final = "";
      recognition.onresult = (e) => {
        if (isIOS) {
          // iOSは最後の結果だけ取る
          final = e.results[e.results.length - 1][0].transcript;
        } else {
          final = Array.from(e.results).map(r => r[0].transcript).join("");
        }
        setVoiceText(final);
      };

      recognition.onend = () => {
        setIsRecording(false);
        if (final) {
          setVoiceInput(prev => (prev ? prev + "、" : "") + final);
        }
        setVoiceText("");
        recognitionRef.current = null;
      };

      recognition.onerror = (e) => {
        setIsRecording(false);
        setVoiceText("");
        recognitionRef.current = null;

        // iOSのエラーを日本語で表示
        const errMap = {
          "not-allowed": "🎤 マイクが許可されてないよ。設定 → Safari → マイク → 許可にしてね！",
          "no-speech": "声が聞こえなかったよ。もう一度試してね🎤",
          "network": "ネットワークエラーだよ。Wi-Fiを確認してね📡",
          "aborted": null, // ユーザーが止めた場合は表示しない
          "audio-capture": "🎤 マイクにアクセスできないよ。他のアプリがマイクを使ってないか確認してね",
        };
        const msg = errMap[e.error];
        if (msg) setError(msg);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setIsRecording(false);
      setError("音声入力の起動に失敗したよ😢 テキストで入力してね。");
    }
  };

  const fetchByFatigue = async (level) => {
    setLoading(true); setResult(null); setError(null);
    try {
      const ngNote = ngFoods.length > 0 ? `\n絶対に使わないNG食材：${ngFoods.join("・")}` : "";
      const familyNote = `\n家族人数：大人${adults}人・子供${kids}人分の量で提案してください。`;
      const genreNote = getNgGenreNote();
      const parsed = await callAPI({
        max_tokens: 3000,
        system: fatigueSystemPrompt,
        messages: [{ role: "user", content: `疲れ度：${level.emoji}${level.label}（${level.sub}）夕食メニューを3個提案してください。${ngNote}${familyNote}${genreNote}` }],
      });
      setResult(parsed.menus);
    } catch { setError("提案の取得に失敗しました。もう一度試してね😢"); }
    finally { setLoading(false); }
  };

  const fetchShuffle = async (level) => {
    setShuffleLoading(true); setShuffleResult(null);
    try {
      const ngNote = ngFoods.length > 0 ? `\n絶対に使わないNG食材：${ngFoods.join("・")}` : "";
      const familyNote = `\n家族人数：大人${adults}人・子供${kids}人分の量で提案してください。`;
      const genreNote = getNgGenreNote();
      const parsed = await callAPI({
        max_tokens: 1000,
        system: shuffleSystemPrompt,
        messages: [{ role: "user", content: `疲れ度：${level.emoji}${level.label}（${level.sub}）今日のメシを1つだけ決めて！${ngNote}${familyNote}${genreNote}` }],
      });
      setShuffleResult(parsed.menu);
    } catch { setShuffleResult(null); }
    finally { setShuffleLoading(false); }
  };

  const fetchByFridge = async () => {
    const photoList = Object.entries(photos).filter(([, v]) => v !== null);
    if (photoList.length === 0 && !voiceInput.trim()) {
      setError("写真かテキストで食材を教えてね📸✏️");
      return;
    }
    setLoading(true); setResult(null); setFoundIngredients([]); setError(null);
    try {
      const contentBlocks = [];
      for (const [slotId, dataUrl] of photoList) {
        const slot = PHOTO_SLOTS.find(s => s.id === slotId);
        contentBlocks.push({ type: "text", text: `【${slot.emoji}${slot.label}の写真】` });
        const base64 = dataUrl.split(",")[1];
        const mediaType = dataUrl.split(";")[0].split(":")[1];
        contentBlocks.push({ type: "image", source: { type: "base64", media_type: mediaType, data: base64 } });
      }
      if (voiceInput.trim()) {
        contentBlocks.push({ type: "text", text: `【追加食材】${voiceInput}` });
      }
      contentBlocks.push({ type: "text", text: `この食材でズボラ飯を3個提案してください。大人${adults}人・子供${kids}人分の量で提案してください。${getNgGenreNote()}` });
      const parsed = await callAPI({
        max_tokens: 3000,
        system: fridgeSystemPrompt,
        messages: [{ role: "user", content: contentBlocks }],
      });
      setFoundIngredients(parsed.ingredients || []);
      setResult(parsed.menus);
    } catch { setError("食材の読み取りに失敗しました。もう一度試してね😢"); }
    finally { setLoading(false); }
  };

  const handlePhotoSelect = (slotId, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotos(prev => ({ ...prev, [slotId]: reader.result }));
    reader.readAsDataURL(file);
  };

  const removePhoto = (slotId) => setPhotos(prev => ({ ...prev, [slotId]: null }));

  const reset = () => {
    setMode("home"); setSelected(null); setResult(null); setFoundIngredients([]); setShuffleResult(null); setShuffleLoading(false);
    setError(null); setPhotos({ fridge: null, veggie: null, freezer: null });
    setVoiceInput("");
  };

  useEffect(() => { localStorage.setItem("ngFoods", JSON.stringify(ngFoods)); }, [ngFoods]);
  useEffect(() => { localStorage.setItem("ngGenres", JSON.stringify(ngGenres)); }, [ngGenres]);

  const toggleNgGenre = (genreId) => {
    setNgGenres(prev => prev.includes(genreId) ? prev.filter(g => g !== genreId) : [...prev, genreId]);
  };
  useEffect(() => { localStorage.setItem("adults", adults); }, [adults]);
  useEffect(() => { localStorage.setItem("kids", kids); }, [kids]);

  const toggleNgFood = (food) => {
    setNgFoods(prev => prev.includes(food) ? prev.filter(f => f !== food) : [...prev, food]);
  };

  const addCustomNg = () => {
    const trimmed = ngCustomInput.trim();
    if (trimmed && !ngFoods.includes(trimmed)) setNgFoods(prev => [...prev, trimmed]);
    setNgCustomInput("");
  };

  const removeNgFood = (food) => setNgFoods(prev => prev.filter(f => f !== food));

  useEffect(() => { localStorage.setItem("savedMenus", JSON.stringify(savedMenus)); }, [savedMenus]);

  const saveReaction = (menu, reaction) => {
    setReactions(prev => ({ ...prev, [menu.name]: reaction }));
    if (reaction === "おかわり！！" || reaction === "全部食べた！") {
      setSavedMenus(prev => {
        const exists = prev.find(m => m.name === menu.name);
        if (exists) return prev.map(m => m.name === menu.name ? { ...m, reaction, count: (m.count||1)+1 } : m);
        return [{ ...menu, reaction, count: 1 }, ...prev];
      });
    }
  };

  const handleRetry = () => {
    if (mode === "fatigue" && selected) fetchByFatigue(selected);
    else if (mode === "fridge") fetchByFridge();
  };

  const hasAnyPhoto = Object.values(photos).some(v => v !== null);
  const canSubmit = hasAnyPhoto || voiceInput.trim(); // voiceInputはテキスト入力のみ


  return (
    <div style={s.root}>
      <div style={s.blob1} /><div style={s.blob2} /><div style={s.blob3} />
      <div style={s.container}>

        {/* Header */}
        {/* β版告知バナー */}
        <div style={s.betaBanner}>
          🌸 現在β版無料公開中！正式リリース後は月額制を予定しています。
        </div>

        <div style={s.header}>
          <div style={s.speechBubble}>💬 AIに夕飯、丸投げしてみる？</div>
          {mode === "home" && <><h1 style={s.title}>HP0.1飯</h1><p style={s.appSubtitle}>限界ママ😮‍💨 vs 体力お化けキッズ😆</p><p style={s.subtitle}>疲れ具合で選ぶ？冷蔵庫ガチャ引く？</p></>}
          {mode === "fatigue" && !result && !loading && <><h1 style={s.title}>今日、どのくらい<br />疲れてる？</h1><p style={s.subtitle}>正直に選んでね。全部OKだから🌸</p></>}
          {mode === "fridge" && !result && !loading && <><h1 style={s.title}>冷蔵庫ガチャ<br />引いていいすか？🙏📸</h1><p style={s.subtitle}>写真＋テキストで食材を伝えてね🌸</p></>}
        </div>

        {/* 初回セットアップモーダル */}
        {showFamilySetup && (
          <div style={s.modalOverlay}>
            <div style={s.modalBox}>
              <div style={{fontSize:32, textAlign:"center", marginBottom:8}}>👨‍👩‍👧‍👦</div>
              <div style={s.modalTitle}>家族の人数を教えてね！</div>
              <div style={s.modalSub}>分量の目安にするよ🍽</div>
              <div style={s.familyRow}>
                <div style={s.familyItem}>
                  <div style={s.familyLabel}>大人</div>
                  <div style={s.familyCounter}>
                    <button style={s.counterBtn} onClick={() => setAdults(v => Math.max(1,v-1))}>－</button>
                    <span style={s.counterVal}>{adults}</span>
                    <button style={s.counterBtn} onClick={() => setAdults(v => Math.min(4,v+1))}>＋</button>
                  </div>
                </div>
                <div style={s.familyItem}>
                  <div style={s.familyLabel}>子供</div>
                  <div style={s.familyCounter}>
                    <button style={s.counterBtn} onClick={() => setKids(v => Math.max(0,v-1))}>－</button>
                    <span style={s.counterVal}>{kids}</span>
                    <button style={s.counterBtn} onClick={() => setKids(v => Math.min(4,v+1))}>＋</button>
                  </div>
                </div>
              </div>
              <button style={s.modalBtn} onClick={() => {
                localStorage.setItem("familySetupDone","true");
                setShowFamilySetup(false);
              }}>決定！</button>
            </div>
          </div>
        )}

        {/* Home */}
        {mode === "home" && !selectedSavedMenu && (
          <>
          {/* 家族人数表示 */}
          <div style={s.familyBadgeRow}>
            <span style={s.familyBadge}>👨‍👩‍👧‍👦 大人{adults}人・子供{kids}人分</span>
            <button style={s.familyEditBtn} onClick={() => setShowFamilyEdit(v => !v)}>変更</button>
          </div>

          {/* 人数変更パネル */}
          {showFamilyEdit && (
            <div style={{...s.ngPanel, marginBottom:12}}>
              <div style={s.ngPanelTitle}>👨‍👩‍👧‍👦 家族の人数を変更</div>
              <div style={s.familyRow}>
                <div style={s.familyItem}>
                  <div style={s.familyLabel}>大人</div>
                  <div style={s.familyCounter}>
                    <button style={s.counterBtn} onClick={() => setAdults(v => Math.max(1,v-1))}>－</button>
                    <span style={s.counterVal}>{adults}</span>
                    <button style={s.counterBtn} onClick={() => setAdults(v => Math.min(4,v+1))}>＋</button>
                  </div>
                </div>
                <div style={s.familyItem}>
                  <div style={s.familyLabel}>子供</div>
                  <div style={s.familyCounter}>
                    <button style={s.counterBtn} onClick={() => setKids(v => Math.max(0,v-1))}>－</button>
                    <span style={s.counterVal}>{kids}</span>
                    <button style={s.counterBtn} onClick={() => setKids(v => Math.min(4,v+1))}>＋</button>
                  </div>
                </div>
              </div>
              <button style={{...s.modalBtn, marginTop:8}} onClick={() => setShowFamilyEdit(false)}>保存する</button>
            </div>
          )}

          <div style={{display:"flex", gap:10, marginBottom:12}}>
            <button style={{...s.ngSettingsToggle, flex:1, marginBottom:0}} onClick={() => setShowNgSettings(v => !v)}>
              🥕 好き嫌い設定 {ngFoods.length > 0 ? `（${ngFoods.length}個）` : ""}
            </button>
            <button style={{...s.ngSettingsToggle, flex:1, marginBottom:0, background:"#fff0f5", borderColor:"#f5c4d8", color:"#d4788a"}} onClick={() => setShowSaved(v => !v)}>
              ⭐ リピ確定メシ {savedMenus.length > 0 ? `（${savedMenus.length}個）` : ""}
            </button>
          </div>

          {/* 今日のNG気分（ジャンル除外） */}
          <div style={s.genrePanel}>
            <div style={s.genrePanelTitle}>🙅 今日のNG気分</div>
            <div style={s.genreGrid}>
              {NG_GENRES.map(g => (
                <button key={g.id}
                  style={{...s.genreChip, ...(ngGenres.includes(g.id) ? s.genreChipActive : {})}}
                  onClick={() => toggleNgGenre(g.id)}>
                  {ngGenres.includes(g.id) ? "✕ " : ""}{g.emoji} {g.label}
                </button>
              ))}
            </div>
          </div>

          {showNgSettings && (
            <div style={s.ngPanel}>
              <div style={s.ngPanelTitle}>食べられない食材をタップして登録</div>
              <div style={s.ngGrid}>
                {NG_FOODS.map(food => (
                  <button key={food} style={{...s.ngChip, ...(ngFoods.includes(food) ? s.ngChipActive : {})}}
                    onClick={() => toggleNgFood(food)}>
                    {ngFoods.includes(food) ? "✕ " : ""}{food}
                  </button>
                ))}
              </div>
              {ngFoods.filter(f => !NG_FOODS.includes(f)).length > 0 && (
                <div style={s.ngCustomList}>
                  {ngFoods.filter(f => !NG_FOODS.includes(f)).map(food => (
                    <span key={food} style={s.ngCustomTag}>{food} <button style={s.ngRemoveBtn} onClick={() => removeNgFood(food)}>✕</button></span>
                  ))}
                </div>
              )}
              <div style={s.ngInputRow}>
                <input style={s.ngInput} placeholder="その他の食材を入力…" value={ngCustomInput}
                  onChange={e => setNgCustomInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && addCustomNg()} />
                <button style={s.ngAddBtn} onClick={addCustomNg}>追加</button>
              </div>
              {ngFoods.length > 0 && <div style={s.ngSaved}>✅ 保存済み：{ngFoods.join("・")}</div>}
            </div>
          )}

          {showSaved && (
            <div style={{...s.ngPanel, borderColor:"#f5c4d8", marginTop:10}}>
              <div style={s.ngPanelTitle}>⭐ リピ確定メシ一覧</div>
              {savedMenus.length === 0 ? (
                <div style={{color:"#b89070", fontSize:13, textAlign:"center", padding:"16px 0"}}>まだ保存されてないよ！<br/>メニューに子供の反応を記録してね🌸</div>
              ) : (
                <div style={{display:"flex", flexDirection:"column", gap:10}}>
                  {[...savedMenus].sort((a,b) => (b.count||1)-(a.count||1)).map((menu, i) => (
                    <div key={i} style={{background:"#fff7f0", border:"1px solid #fde8c0", borderRadius:14, padding:"12px 14px", cursor:"pointer"}}
                      onClick={() => { setSelectedSavedMenu(menu); setShowSaved(false); }}>
                      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                        <div>
                          <span style={{fontSize:14, fontWeight:700, color:"#7a4a2a"}}>{menu.name}</span>
                          <span style={{fontSize:11, color:"#b89070", marginLeft:8}}>⏱{menu.time}</span>
                        </div>
                        <div style={{display:"flex", alignItems:"center", gap:6}}>
                          <span style={{fontSize:18}}>{menu.reaction==="おかわり！！"?"😍":"😋"}</span>
                          {menu.count > 1 && <span style={{fontSize:11, color:"#f5a623", fontWeight:700}}>{menu.count}回</span>}
                          <button style={{background:"none", border:"none", color:"#c0a080", fontSize:12, cursor:"pointer"}}
                            onClick={e => { e.stopPropagation(); setSavedMenus(prev => prev.filter(m => m.name !== menu.name)); }}>✕</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div style={s.homeDivider}><span style={s.homeDividerText}>今日の夕食を選ぶ</span></div>
          <div style={{fontSize:11, color:"#b08a96", textAlign:"center", marginTop:-8, marginBottom:12}}>
            ※レシピにある子供の反応😍😋を選ぶと「リピ確定メシ」に保存されるよ
          </div>
          <div style={s.modeGrid}>
            <button style={s.modeCard} onClick={() => setMode("fatigue")} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.03)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
              <span style={s.modeEmoji}>😩</span>
              <span style={s.modeLabel}>疲れ度から選ぶ</span>
              <span style={s.modeSub}>しんどさに合わせて提案</span>
            </button>
            <button style={{...s.modeCard, background:"#fff0f5", borderColor:"#f5c4d8"}} onClick={() => setMode("fridge")} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.03)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
              <span style={s.modeEmoji}>📸</span>
              <span style={s.modeLabel}>冷蔵庫ガチャ</span>
              <span style={s.modeSub}>写真＋テキストで食材から提案</span>
            </button>
          </div>
          <div style={{marginTop:14}}>
            <button style={s.shuffleBtn}
              onClick={() => {
                const randomLevel = FATIGUE_LEVELS[Math.floor(Math.random() * FATIGUE_LEVELS.length)];
                setSelected(randomLevel); setShuffleResult(null); setMode("shuffle");
                fetchShuffle(randomLevel);
              }}
              onMouseEnter={e=>e.currentTarget.style.transform="scale(1.02)"}
              onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
              <span style={{fontSize:28}}>🎰</span>
              <span style={s.shuffleBtnLabel}>今日のメシ、運に任せる！</span>
              <span style={s.shuffleBtnSub}>辛くない・子供OKの一択メニュー</span>
            </button>
          </div>
          </>
        )}

        {/* Saved menu detail */}
        {selectedSavedMenu && (
          <div style={s.resultArea}>
            <div style={s.resultHeader}>
              <span style={{...s.selectedBadge, background:"#fff0f5", borderColor:"#f5c4d8", color:"#d4788a"}}>
                {selectedSavedMenu.reaction==="おかわり！！"?"😍":"😋"} リピ確定メシ
              </span>
            </div>
            <div style={s.menuCard}>
              <div style={{...s.menuNum, color:"#f5a623"}}>⭐ {selectedSavedMenu.count||1}回作ったやつ</div>
              <div style={s.menuName}>{selectedSavedMenu.name}</div>
              <div style={s.menuTime}>⏱ {selectedSavedMenu.time}</div>
              <div style={s.sectionLabel}>🥕 食材</div>
              <div style={s.ingredients}>
                {(selectedSavedMenu.ingredients||selectedSavedMenu.usedIngredients||[]).map((ing,j) => <span key={j} style={s.ingTag}>{ing}</span>)}
              </div>
              {selectedSavedMenu.seasonings?.length > 0 && <>
                <div style={s.sectionLabel}>🧂 調味料</div>
                <div style={s.ingredients}>
                  {selectedSavedMenu.seasonings.map((sea,j) => <span key={j} style={s.seasoningTag}>{sea}</span>)}
                </div>
              </>}
              {selectedSavedMenu.steps?.length > 0 && <>
                <div style={s.sectionLabel}>👩‍🍳 作り方</div>
                <ol style={s.stepsList}>
                  {selectedSavedMenu.steps.map((step,j) => (
                    <li key={j} style={s.stepItem}>
                      <span style={s.stepNum}>{j+1}</span>
                      <span style={s.stepText}>{step}</span>
                    </li>
                  ))}
                </ol>
              </>}
              <p style={s.menuPoint}>💡 {selectedSavedMenu.point}</p>
              <div style={s.okMessage}>✨ {selectedSavedMenu.okMessage}</div>
            </div>
            <div style={s.btnRow}>
              <button style={s.retryBtn} onClick={() => { setSelectedSavedMenu(null); setShowSaved(true); }}
                onMouseEnter={e=>e.currentTarget.style.background="#fff0f5"} onMouseLeave={e=>e.currentTarget.style.background="#fff5f8"}>
                ⭐ 保存一覧に戻る
              </button>
              <button style={s.resetBtn} onClick={() => setSelectedSavedMenu(null)}
                onMouseEnter={e=>e.currentTarget.style.background="#f5c97a"} onMouseLeave={e=>e.currentTarget.style.background="#fde68a"}>
                🏠 トップに戻る
              </button>
            </div>
          </div>
        )}

        {/* Fatigue grid */}
        {mode === "fatigue" && !selected && !loading && (
          <div style={s.grid}>
            {FATIGUE_LEVELS.map(level => (
              <button key={level.id} style={{...s.card, background:level.bg, borderColor:level.border}}
                onClick={() => { setSelected(level); fetchByFatigue(level); }}
                onMouseEnter={e=>e.currentTarget.style.transform="scale(1.04)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>
                <span style={s.cardEmoji}>{level.emoji}</span>
                <span style={{...s.cardLabel, color:level.color}}>{level.label}</span>
                <span style={s.cardSub}>{level.sub}</span>
              </button>
            ))}
          </div>
        )}

        {/* Fridge input */}
        {mode === "fridge" && !result && !loading && (
          <div style={s.fridgeArea}>
            <div style={s.slotsLabel}>📸 写真を撮る（最大3枚）</div>
            <div style={s.slotsGrid}>
              {PHOTO_SLOTS.map(slot => (
                <div key={slot.id} style={s.slot}>
                  <input ref={fileInputRefs[slot.id]} type="file" accept="image/*" capture="environment"
                    style={{display:"none"}} onChange={e => handlePhotoSelect(slot.id, e)} />
                  {photos[slot.id] ? (
                    <div style={s.photoThumb} onClick={() => removePhoto(slot.id)}>
                      <img src={photos[slot.id]} style={s.thumbImg} alt={slot.label} />
                      <div style={s.thumbOverlay}>✕</div>
                    </div>
                  ) : (
                    <button style={s.slotBtn} onClick={() => fileInputRefs[slot.id].current?.click()}>
                      <span style={{fontSize:28}}>{slot.emoji}</span>
                      <span style={s.slotLabel}>{slot.label}</span>
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div style={s.voiceSection}>
              <div style={s.slotsLabel}>✏️ 食材をテキストで追加</div>
              <input style={s.textInput} placeholder="例：豆腐1丁、にんじん半分、冷凍うどん"
                value={voiceInput} onChange={e => setVoiceInput(e.target.value)} />
              {voiceInput && (
                <div style={s.voiceResult}>
                  <span>✅ {voiceInput}</span>
                  <button style={s.clearVoice} onClick={() => setVoiceInput("")}>✕</button>
                </div>
              )}
            </div>

            <button style={{...s.submitBtn, ...(canSubmit ? {} : s.submitBtnDisabled)}}
              onClick={fetchByFridge} disabled={!canSubmit}>
              {canSubmit ? "🍳 メニューを提案してもらう！" : "📸 写真かテキストを追加してね"}
            </button>
          </div>
        )}

        {/* Shuffle result */}
        {mode === "shuffle" && shuffleResult && !shuffleLoading && (
          <div style={{...s.resultArea, marginTop:8}}>
            <div style={s.resultHeader}>
              <span style={{...s.selectedBadge, background:"#fff0f5", borderColor:"#f5c4d8", color:"#d4788a"}}>🎰 今日はこれ一択！！</span>
            </div>
            <div style={s.menuCard}>
              <div style={{...s.menuNum, color:"#d4788a"}}>決定</div>
              <div style={s.menuName}>{shuffleResult.name}</div>
              <div style={s.menuTime}>⏱ {shuffleResult.time}</div>
              <div style={s.sectionLabel}>🥕 食材</div>
              <div style={s.ingredients}>
                {(shuffleResult.ingredients||[]).map((ing,j) => <span key={j} style={s.ingTag}>{ing}</span>)}
              </div>
              {shuffleResult.seasonings?.length > 0 && <>
                <div style={s.sectionLabel}>🧂 調味料</div>
                <div style={s.ingredients}>
                  {shuffleResult.seasonings.map((sea,j) => <span key={j} style={s.seasoningTag}>{sea}</span>)}
                </div>
              </>}
              {shuffleResult.steps?.length > 0 && <>
                <div style={s.sectionLabel}>👩‍🍳 作り方</div>
                <ol style={s.stepsList}>
                  {shuffleResult.steps.map((step,j) => (
                    <li key={j} style={s.stepItem}>
                      <span style={s.stepNum}>{j+1}</span>
                      <span style={s.stepText}>{step}</span>
                    </li>
                  ))}
                </ol>
              </>}
              <p style={s.menuPoint}>💡 {shuffleResult.point}</p>
              <div style={s.okMessage}>✨ {shuffleResult.okMessage}</div>
            </div>
            <div style={{...s.btnRow, marginTop:16}}>
              <button style={s.retryBtn} onClick={() => { const r = FATIGUE_LEVELS[Math.floor(Math.random()*FATIGUE_LEVELS.length)]; setSelected(r); setShuffleResult(null); fetchShuffle(r); }}
                onMouseEnter={e=>e.currentTarget.style.background="#fff0f5"} onMouseLeave={e=>e.currentTarget.style.background="#fff5f8"}>
                🎰 もう一回シャッフル
              </button>
              <button style={s.resetBtn} onClick={reset}
                onMouseEnter={e=>e.currentTarget.style.background="#f5c97a"} onMouseLeave={e=>e.currentTarget.style.background="#fde68a"}>
                🏠 最初から選ぶ
              </button>
            </div>
          </div>
        )}

        {mode === "shuffle" && shuffleLoading && (
          <div style={s.loadingBox}>
            <div style={s.cookingAnim}>
              {["🎰","🍽","✨"].map((e,i) => <span key={i} style={{...s.cookingEmoji, animationDelay:`${i*0.2}s`}}>{e}</span>)}
            </div>
            <div style={s.spinner} />
            <p style={s.loadingText}>今日のメシ、決めてる…🎰</p>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div style={s.loadingBox}>
            <div style={s.cookingAnim}>
              {["🥚","🔪","🍳","🥄","✨"].map((e,i) => <span key={i} style={{...s.cookingEmoji, animationDelay:`${i*0.2}s`}}>{e}</span>)}
            </div>
            <div style={s.spinner} />
            <p style={s.loadingText}>{mode === "fridge" ? "冷蔵庫ガチャ、引いてます…🎰" : "今日の夕食、考え中…🍳"}</p>
            <LoadingTip />
            <p style={s.loadingSubText}>HP0.1でも作れるやつ探してるよ😮‍💨</p>
          </div>
        )}

        {/* Found ingredients */}
        {foundIngredients.length > 0 && result && (
          <div style={s.ingredientsFound}>
            <div style={s.ingredientsLabel}>📦 見つけた食材</div>
            <div style={s.ingredientsTags}>
              {foundIngredients.map((ing, i) => <span key={i} style={s.ingFoundTag}>{ing}</span>)}
            </div>
          </div>
        )}

        {/* Result */}
        {result && !loading && (
          <div style={s.resultArea}>
            <div style={s.resultHeader}>
              <span style={s.selectedBadge}>
                {mode === "fridge" ? "📸 冷蔵庫メニュー" : `${selected.emoji} ${selected.label}の日のごはん`}
              </span>
            </div>
            <div style={s.menuList}>
              {result.map((menu, i) => (
                <div key={i} style={s.menuCard}>
                  <div style={s.menuNum}>0{i+1}</div>
                  <div style={s.menuName}>{menu.name}</div>
                  <div style={s.menuTime}>⏱ {menu.time}</div>
                  <div style={s.sectionLabel}>🥕 食材</div>
                  <div style={s.ingredients}>
                    {(menu.ingredients||menu.usedIngredients||[]).map((ing,j) => <span key={j} style={s.ingTag}>{ing}</span>)}
                  </div>
                  {menu.seasonings?.length > 0 && <>
                    <div style={s.sectionLabel}>🧂 調味料</div>
                    <div style={s.ingredients}>
                      {menu.seasonings.map((sea,j) => <span key={j} style={s.seasoningTag}>{sea}</span>)}
                    </div>
                  </>}
                  {menu.steps?.length > 0 && <>
                    <div style={s.sectionLabel}>👩‍🍳 作り方</div>
                    <ol style={s.stepsList}>
                      {menu.steps.map((step,j) => (
                        <li key={j} style={s.stepItem}>
                          <span style={s.stepNum}>{j+1}</span>
                          <span style={s.stepText}>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </>}
                  <p style={s.menuPoint}>💡 {menu.point}</p>
                  <div style={s.okMessage}>✨ {menu.okMessage}</div>
                  <div style={s.reactionSection}>
                    <div style={s.reactionLabel}>子供の反応は？</div>
                    <div style={s.reactionRow}>
                      {[["😍","おかわり！！"],["😋","全部食べた！"],["🙂","まあ食べた"],["😐","ちょっと残した"]].map(([emoji, label]) => (
                        <button key={label} style={{...s.reactionBtn, ...(reactions[menu.name]===label ? s.reactionBtnActive : {})}}
                          onClick={() => saveReaction(menu, label)}>
                          <span style={{fontSize:20}}>{emoji}</span>
                          <span style={{fontSize:9, lineHeight:1.3}}>{label}</span>
                        </button>
                      ))}
                    </div>
                    {reactions[menu.name] && (reactions[menu.name]==="おかわり！！"||reactions[menu.name]==="全部食べた！") && (
                      <div style={s.savedBadge}>⭐ リピ確定メシに保存したよ！</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div style={s.btnRow}>
              <button style={s.retryBtn} onClick={handleRetry}
                onMouseEnter={e=>e.currentTarget.style.background="#fff0f5"} onMouseLeave={e=>e.currentTarget.style.background="#fff5f8"}>
                🔄 別のメニューを見る
              </button>
              <button style={s.retryBtn} onClick={() => { setResult(null); setSelected(null); setMode("fatigue"); }}
                onMouseEnter={e=>e.currentTarget.style.background="#fff0f5"} onMouseLeave={e=>e.currentTarget.style.background="#fff5f8"}>
                💪 体力を選び直す
              </button>
              <button style={s.resetBtn} onClick={reset}
                onMouseEnter={e=>e.currentTarget.style.background="#f5c97a"} onMouseLeave={e=>e.currentTarget.style.background="#fde68a"}>
                🏠 最初から選ぶ
              </button>
            </div>
          </div>
        )}

        {error && (
          <div style={s.errorBox}>
            <p>{error}</p>
            <button style={s.resetBtn} onClick={() => setError(null)}>閉じる</button>
            <button style={s.retryBtn} onClick={reset}>トップに戻る</button>
          </div>
        )}
        {mode !== "home" && !loading && !result && !shuffleLoading && !shuffleResult && (
          <button style={s.backBtn} onClick={reset}>← 戻る</button>
        )}

        {mode === "home" && !selectedSavedMenu && (
          <div style={s.footer}>
            <div style={s.footerHeart}>🌸 HP0.1飯 〜飯どうすんの？に答えます〜</div>
            <p style={s.footerText}>
              このアプリは疲れたママの「今日どうしよう」をちょっとだけ楽にするためのものです。
              栄養士・医師による監修はありません。メニューの栄養面・アレルギー等については
              ご自身でご確認のうえ、自己責任でお使いください。
            </p>
            <p style={s.footerSub}>
              ※ AIが提案するメニューは参考情報です。食材のアレルギーや体調に合わせてご利用ください。
            </p>
            <button style={s.aboutBtn} onClick={() => setShowAbout(true)}>
              💌 このアプリについて
            </button>
          </div>
        )}

        {/* このアプリについてモーダル */}
        {showAbout && (
          <div style={s.modalOverlay} onClick={() => setShowAbout(false)}>
            <div style={{...s.modalBox, maxHeight:"80vh", overflowY:"auto"}} onClick={e => e.stopPropagation()}>
              <div style={{fontSize:28, textAlign:"center", marginBottom:8}}>💌</div>
              <div style={s.modalTitle}>このアプリについて</div>
              <div style={s.aboutText}>
                <p>夫婦でフルタイムの共働きの中、へとへとに疲れている状態で帰宅すると、ちびっこ怪獣のお腹空いた攻撃にあい、疲労で頭も働かなくて、夕食のメニューを考えるのがとても苦痛でした。</p>
                <p>自他ともに認めるズボラな私。なーにもしたくないけど、毎日素うどんを夕食に出すわけにもいかず・・・</p>
                <p>そんな時に、自分に代わってレシピを考えてくれるものがあればなぁ〜と思いつき、このアプリを作り始めました。</p>
                <p>子供が保育園・学校で栄養バランスの取れた給食を食べてくれているなら、おうちご飯が、たまには雑でいいじゃないか！ママの気力・夕食提供までのスピードを考慮して、ズボラでもご飯が食べれて、子供達が元気ならそれでOK！！</p>
                <p>私と同じように、体力を限界まで削っても頑張って、ご飯を作っている全ママへ、ママ自身の保守のため、たまにはいっか！ってなれるくらい余裕を持ってほしい一心です。</p>
                <p style={{fontWeight:700, color:"#7a4a2a"}}>ママの笑顔なくして、家庭円満は成り立たない。</p>
                <p>私はそう思っています。</p>
                <p>少しでも、皆さんのお力になれると嬉しいです。</p>
                <p style={{color:"#b89070", fontSize:13}}>ただ、AI考案のレシピです。レシピ数にも限界が来ますw それを考慮の上、使っていただけますと幸いです。</p>
                <p style={{fontWeight:700, color:"#d4788a"}}>毎日頑張っているママのお守りのようなものになれば嬉しいです。🌸</p>
              </div>
              <button style={s.modalBtn} onClick={() => setShowAbout(false)}>閉じる</button>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@400;500;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes cardIn { from { opacity:0; transform:scale(0.95); } to { opacity:1; transform:scale(1); } }
        @keyframes bounce { from { transform:translateY(0); } to { transform:translateY(-8px); } }
        @keyframes blobFloat { 0%,100% { transform:translateY(0) scale(1); } 50% { transform:translateY(-18px) scale(1.04); } }
        @keyframes pulse { 0%,100% { box-shadow:0 0 0 0 rgba(245,100,100,0.4); } 50% { box-shadow:0 0 0 10px rgba(245,100,100,0); } }
      `}</style>
    </div>
  );
}

const s = {
  root: { minHeight:"100vh", background:"linear-gradient(160deg,#fffbf0 0%,#fff5e8 50%,#fff0f5 100%)", fontFamily:"'Zen Maru Gothic',sans-serif", position:"relative", overflow:"hidden" },
  blob1: { position:"fixed", top:"-80px", right:"-80px", width:300, height:300, borderRadius:"60% 40% 70% 30%/50% 60% 40% 50%", background:"radial-gradient(circle,#fde68a88 0%,#fcd59a55 100%)", animation:"blobFloat 7s ease-in-out infinite", zIndex:0 },
  blob2: { position:"fixed", bottom:"-60px", left:"-60px", width:240, height:240, borderRadius:"40% 60% 30% 70%/60% 40% 60% 40%", background:"radial-gradient(circle,#fecaca66 0%,#fde8d044 100%)", animation:"blobFloat 9s ease-in-out infinite reverse", zIndex:0 },
  blob3: { position:"fixed", top:"45%", left:"-40px", width:160, height:160, borderRadius:"50% 50% 40% 60%/40% 50% 60% 50%", background:"radial-gradient(circle,#bbf7d044 0%,#d9f99d33 100%)", animation:"blobFloat 11s ease-in-out infinite", zIndex:0 },
  container: { position:"relative", zIndex:1, maxWidth:520, margin:"0 auto", padding:"16px 14px 30px" },
  header: { textAlign:"center", marginBottom:10, animation:"fadeUp 0.6s ease both" },
  speechBubble: { display:"inline-block", background:"#fff", border:"2px solid #fcd97a", color:"#c49a20", fontSize:15, fontWeight:700, padding:"6px 14px", borderRadius:"20px 20px 20px 4px", marginBottom:8, boxShadow:"2px 2px 0px #fde8a0" },
  title: { color:"#7a4a2a", fontSize:30, fontWeight:700, lineHeight:1.3, marginBottom:4, letterSpacing:1, textShadow:"2px 2px 0px #fde8a0" },
  subtitle: { color:"#b89070", fontSize:17 },
  appSubtitle: { color:"#d4a06a", fontSize:16, fontWeight:700, marginBottom:4, letterSpacing:1 },
  // モデル切り替え
  // iOS hint
  iosHint: { background:"#fffce8", border:"1px solid #f0e49a", color:"#a07820", fontSize:15, padding:"10px 14px", borderRadius:12, lineHeight:1.6, marginBottom:8 },
  homeDivider: { display:"flex", alignItems:"center", gap:12, margin:"10px 0 8px" },
  homeDividerText: { fontSize:19, fontWeight:700, color:"#a07850", whiteSpace:"nowrap", background:"linear-gradient(160deg,#fffbf0,#fff5e8)", padding:"0 8px" },
  modeGrid: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, animation:"cardIn 0.5s ease both" },
  modeCard: { display:"flex", flexDirection:"column", alignItems:"center", gap:4, padding:"14px 10px", borderRadius:20, border:"2px solid #f5d9b8", background:"#fff6ec", cursor:"pointer", transition:"transform 0.2s ease", outline:"none", boxShadow:"0 2px 12px rgba(240,180,100,0.10)" },
  modeEmoji: { fontSize:30 },
  modeLabel: { fontSize:17, fontWeight:700, color:"#7a4a2a" },
  modeSub: { fontSize:14, color:"#b8956a", textAlign:"center", lineHeight:1.5 },
  grid: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, animation:"cardIn 0.5s ease both" },
  card: { display:"flex", flexDirection:"column", alignItems:"center", gap:4, padding:"12px 10px", borderRadius:20, border:"2px solid", cursor:"pointer", transition:"transform 0.2s ease", outline:"none", boxShadow:"0 2px 12px rgba(240,180,100,0.10)" },
  cardEmoji: { fontSize:28 },
  cardLabel: { fontSize:17, fontWeight:700 },
  cardSub: { fontSize:14, color:"#b8956a", textAlign:"center", lineHeight:1.5 },
  fridgeArea: { display:"flex", flexDirection:"column", gap:20, animation:"cardIn 0.5s ease both" },
  slotsLabel: { fontSize:16, fontWeight:700, color:"#7a4a2a", marginBottom:4 },
  slotsGrid: { display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:10 },
  slot: { aspectRatio:"1", position:"relative" },
  slotBtn: { width:"100%", height:"100%", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:6, borderRadius:16, border:"2px dashed #f5c4be", background:"#fff5f8", cursor:"pointer", outline:"none", transition:"transform 0.2s", padding:8 },
  slotLabel: { fontSize:14, fontWeight:700, color:"#d4788a" },
  photoThumb: { width:"100%", height:"100%", position:"relative", cursor:"pointer", borderRadius:16, overflow:"hidden" },
  thumbImg: { width:"100%", height:"100%", objectFit:"cover" },
  thumbOverlay: { position:"absolute", inset:0, background:"rgba(0,0,0,0.35)", display:"flex", alignItems:"center", justifyContent:"center", color:"white", fontSize:20, fontWeight:700, opacity:0, transition:"opacity 0.2s" },
  voiceSection: { display:"flex", flexDirection:"column", gap:10 },
  voiceRow: { display:"flex", gap:10 },
  voiceBtn: { flex:1, padding:"14px", borderRadius:16, border:"2px solid #f5c4be", background:"#fff0f5", color:"#d4788a", fontSize:16, fontWeight:700, cursor:"pointer", fontFamily:"'Zen Maru Gothic',sans-serif", userSelect:"none", WebkitUserSelect:"none" },
  voiceBtnActive: { background:"#ffd4d4", borderColor:"#f57070", animation:"pulse 1s infinite" },
  voiceBtnDisabled: { background:"#f5f5f5", color:"#aaa", borderColor:"#ddd", cursor:"not-allowed" },
  voiceResult: { display:"flex", alignItems:"center", gap:8, background:"#fff7e0", border:"1px solid #fcd97a", borderRadius:12, padding:"10px 14px", fontSize:15, color:"#a07820", flexWrap:"wrap" },
  clearVoice: { marginLeft:"auto", background:"none", border:"none", color:"#c49a20", cursor:"pointer", fontSize:17, fontWeight:700 },
  textInput: { width:"100%", padding:"12px 16px", borderRadius:14, border:"1.5px solid #fde8c0", background:"rgba(255,255,255,0.8)", fontSize:16, color:"#7a4a2a", fontFamily:"'Zen Maru Gothic',sans-serif", outline:"none" },
  submitBtn: { width:"100%", padding:"16px", background:"#fde68a", border:"none", color:"#8a5a10", fontSize:18, fontWeight:700, borderRadius:16, cursor:"pointer", fontFamily:"'Zen Maru Gothic',sans-serif", boxShadow:"0 2px 10px rgba(240,180,60,0.20)", transition:"background 0.2s" },
  submitBtnDisabled: { background:"#f0e8d8", color:"#b8a888", cursor:"not-allowed", boxShadow:"none" },
  loadingBox: { display:"flex", flexDirection:"column", alignItems:"center", gap:20, padding:"60px 0" },
  cookingAnim: { display:"flex", gap:8, marginBottom:8 },
  cookingEmoji: { fontSize:28, animation:"bounce 0.8s ease-in-out infinite alternate", display:"inline-block" },
  loadingSubText: { color:"#c0a080", fontSize:15, marginTop:4 },
  spinner: { width:40, height:40, border:"3px solid #fde8b0", borderTop:"3px solid #f5a623", borderRadius:"50%", animation:"spin 0.8s linear infinite" },
  loadingText: { color:"#b89070", fontSize:17 },
  ingredientsFound: { background:"rgba(255,255,255,0.8)", border:"1.5px solid #fde8c0", borderRadius:16, padding:"14px 16px", marginBottom:16 },
  ingredientsLabel: { fontSize:15, fontWeight:700, color:"#c49a20", marginBottom:8 },
  ingredientsTags: { display:"flex", flexWrap:"wrap", gap:6 },
  ingFoundTag: { background:"#fff7e0", border:"1px solid #fcd97a", color:"#a07820", fontSize:14, padding:"3px 10px", borderRadius:20, fontWeight:600 },
  resultArea: { animation:"fadeUp 0.5s ease both" },
  resultHeader: { marginBottom:20, textAlign:"center" },
  selectedBadge: { display:"inline-block", background:"#fff7e0", border:"1.5px solid #fcd97a", color:"#c49a20", fontSize:16, fontWeight:700, padding:"6px 18px", borderRadius:20 },
  menuList: { display:"flex", flexDirection:"column", gap:16, marginBottom:28 },
  menuCard: { background:"rgba(255,255,255,0.80)", border:"1.5px solid #fde8c0", borderRadius:20, padding:"22px 20px", boxShadow:"0 4px 18px rgba(240,180,80,0.10)" },
  menuNum: { fontSize:14, color:"#f5a623", letterSpacing:2, marginBottom:4, fontWeight:700 },
  menuName: { color:"#7a4a2a", fontSize:21, fontWeight:700, marginBottom:4 },
  menuTime: { color:"#b89070", fontSize:15, marginBottom:10 },
  ingredients: { display:"flex", flexWrap:"wrap", gap:6, marginBottom:12 },
  ingTag: { background:"#fff7e0", border:"1px solid #fcd97a", color:"#c49a20", fontSize:14, padding:"3px 10px", borderRadius:20, fontWeight:600 },
  menuPoint: { color:"#a07850", fontSize:15, lineHeight:1.7, marginBottom:12 },
  sectionLabel: { fontSize:14, fontWeight:700, color:"#b89070", letterSpacing:1, marginBottom:6, marginTop:4 },
  seasoningTag: { background:"#fff0f5", border:"1px solid #f5c4d8", color:"#d4788a", fontSize:14, padding:"3px 10px", borderRadius:20, fontWeight:600 },
  stepsList: { listStyle:"none", display:"flex", flexDirection:"column", gap:8, marginBottom:12 },
  stepItem: { display:"flex", alignItems:"flex-start", gap:10 },
  stepNum: { minWidth:22, height:22, background:"#fde68a", color:"#8a5a10", fontSize:14, fontWeight:700, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 },
  stepText: { fontSize:15, color:"#7a4a2a", lineHeight:1.7 },
  okMessage: { background:"#f0fdf4", border:"1.5px solid #bbf7d0", color:"#3a8a58", fontSize:15, padding:"10px 14px", borderRadius:14, lineHeight:1.6, fontWeight:600 },
  btnRow: { display:"flex", flexDirection:"column", gap:10 },
  retryBtn: { display:"block", width:"100%", padding:"14px", background:"#fff5f8", border:"1.5px solid #f5c4d8", color:"#d4788a", fontSize:17, fontWeight:700, borderRadius:16, cursor:"pointer", fontFamily:"'Zen Maru Gothic',sans-serif", letterSpacing:1, transition:"background 0.2s" },
  resetBtn: { display:"block", width:"100%", padding:"14px", background:"#fde68a", border:"none", color:"#8a5a10", fontSize:17, fontWeight:700, borderRadius:16, cursor:"pointer", fontFamily:"'Zen Maru Gothic',sans-serif", letterSpacing:1, transition:"background 0.2s", boxShadow:"0 2px 10px rgba(240,180,60,0.20)" },
  backBtn: { display:"block", marginTop:16, width:"100%", padding:"12px", background:"#fff7f0", border:"1.5px solid #fde8c0", color:"#c49a20", fontSize:17, fontWeight:700, borderRadius:14, cursor:"pointer", fontFamily:"'Zen Maru Gothic',sans-serif", textAlign:"center" },
  shuffleBtn: { width:"100%", display:"flex", flexDirection:"column", alignItems:"center", gap:3, padding:"12px 16px", borderRadius:20, border:"2px dashed #86efac", background:"#f0fdf4", cursor:"pointer", transition:"transform 0.2s", outline:"none" },
  shuffleBtnLabel: { fontSize:18, fontWeight:700, color:"#3a8a58" },
  shuffleBtnSub: { fontSize:14, color:"#6aaa80" },
  ngSettingsToggle: { width:"100%", padding:"12px 16px", background:"#fffce8", border:"1.5px solid #f0e49a", color:"#a07820", fontSize:16, fontWeight:700, borderRadius:14, cursor:"pointer", fontFamily:"'Zen Maru Gothic',sans-serif", marginBottom:12, textAlign:"left" },
  ngPanel: { background:"rgba(255,255,255,0.85)", border:"1.5px solid #fde8c0", borderRadius:18, padding:"18px 16px", marginBottom:16 },
  ngPanelTitle: { fontSize:15, fontWeight:700, color:"#7a4a2a", marginBottom:12 },
  ngGrid: { display:"flex", flexWrap:"wrap", gap:8, marginBottom:12 },
  ngChip: { padding:"6px 12px", borderRadius:20, border:"1.5px solid #fde8c0", background:"#fff7f0", color:"#b89070", fontSize:15, cursor:"pointer", fontFamily:"'Zen Maru Gothic',sans-serif", transition:"all 0.15s" },
  ngChipActive: { background:"#ffd4d4", borderColor:"#f5a0a0", color:"#d45050", fontWeight:700 },
  ngCustomList: { display:"flex", flexWrap:"wrap", gap:6, marginBottom:10 },
  ngCustomTag: { display:"flex", alignItems:"center", gap:4, background:"#ffd4d4", border:"1px solid #f5a0a0", color:"#d45050", fontSize:14, padding:"3px 10px", borderRadius:20, fontWeight:600 },
  ngRemoveBtn: { background:"none", border:"none", color:"#d45050", cursor:"pointer", fontSize:15, padding:0, fontWeight:700 },
  ngInputRow: { display:"flex", gap:8, marginBottom:10 },
  ngInput: { flex:1, padding:"10px 14px", borderRadius:12, border:"1.5px solid #fde8c0", background:"rgba(255,255,255,0.8)", fontSize:16, color:"#7a4a2a", fontFamily:"'Zen Maru Gothic',sans-serif", outline:"none" },
  ngAddBtn: { padding:"10px 16px", background:"#fde68a", border:"none", color:"#8a5a10", fontSize:16, fontWeight:700, borderRadius:12, cursor:"pointer", fontFamily:"'Zen Maru Gothic',sans-serif" },
  reactionSection: { marginTop:14 },
  reactionLabel: { fontSize:14, fontWeight:700, color:"#b89070", marginBottom:8 },
  reactionRow: { display:"flex", gap:8, justifyContent:"space-between" },
  reactionBtn: { flex:1, display:"flex", flexDirection:"column", alignItems:"center", gap:3, padding:"8px 4px", borderRadius:12, border:"1.5px solid #fde8c0", background:"#fff7f0", cursor:"pointer", transition:"all 0.15s", fontFamily:"'Zen Maru Gothic',sans-serif" },
  reactionBtnActive: { background:"#fde68a", borderColor:"#f5a623", transform:"scale(1.08)" },
  savedBadge: { marginTop:8, background:"#fff7e0", border:"1px solid #fcd97a", color:"#c49a20", fontSize:14, fontWeight:700, padding:"6px 12px", borderRadius:10, textAlign:"center" },
  ngSaved: { fontSize:14, color:"#3a8a58", background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:10, padding:"8px 12px" },
  footer: { marginTop:28, padding:"16px 4px 8px", borderTop:"1px solid #f5dfc0" },
  footerHeart: { fontSize:16, fontWeight:700, color:"#c49a20", marginBottom:10, textAlign:"center" },
  footerText: { fontSize:15, fontWeight:700, color:"#b89070", lineHeight:1.8, marginBottom:8, textAlign:"center" },
  footerSub: { fontSize:15, fontWeight:700, color:"#e05050", lineHeight:1.8, textAlign:"center" },
  footerBeta: { fontSize:13, color:"#d4788a", textAlign:"center", marginTop:8, fontWeight:700 },
  betaBanner: { background:"#fff0f5", border:"1.5px solid #f5c4d8", borderRadius:14, padding:"10px 16px", textAlign:"center", fontSize:13, fontWeight:700, color:"#d4788a", marginBottom:12, animation:"fadeUp 0.4s ease both" },
  aboutBtn: { display:"block", margin:"12px auto 0", padding:"10px 24px", background:"#fff0f5", border:"1.5px solid #f5c4d8", color:"#d4788a", fontSize:14, fontWeight:700, borderRadius:20, cursor:"pointer", fontFamily:"'Zen Maru Gothic',sans-serif" },
  aboutText: { fontSize:14, color:"#7a4a2a", lineHeight:2, display:"flex", flexDirection:"column", gap:12, marginBottom:16 },
  errorBox: { textAlign:"center", color:"#b89070", padding:"30px 0", display:"flex", flexDirection:"column", gap:12, alignItems:"center" },
  // 家族設定
  modalOverlay: { position:"fixed", inset:0, background:"rgba(0,0,0,0.4)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:100, padding:"20px" },
  modalBox: { background:"#fffbf0", borderRadius:24, padding:"28px 24px", width:"100%", maxWidth:340, boxShadow:"0 8px 32px rgba(0,0,0,0.15)" },
  modalTitle: { fontSize:20, fontWeight:700, color:"#7a4a2a", textAlign:"center", marginBottom:6 },
  modalSub: { fontSize:14, color:"#b89070", textAlign:"center", marginBottom:20 },
  modalBtn: { width:"100%", padding:"14px", background:"#fde68a", border:"none", color:"#8a5a10", fontSize:16, fontWeight:700, borderRadius:14, cursor:"pointer", fontFamily:"'Zen Maru Gothic',sans-serif", marginTop:16 },
  familyRow: { display:"flex", gap:20, justifyContent:"center", marginBottom:8 },
  familyItem: { display:"flex", flexDirection:"column", alignItems:"center", gap:8 },
  familyLabel: { fontSize:15, fontWeight:700, color:"#7a4a2a" },
  familyCounter: { display:"flex", alignItems:"center", gap:12 },
  counterBtn: { width:36, height:36, borderRadius:"50%", border:"2px solid #fcd97a", background:"#fff7e0", color:"#c49a20", fontSize:20, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Zen Maru Gothic',sans-serif" },
  counterVal: { fontSize:24, fontWeight:700, color:"#7a4a2a", minWidth:32, textAlign:"center" },
  familyBadgeRow: { display:"flex", alignItems:"center", justifyContent:"space-between", background:"rgba(255,255,255,0.7)", border:"1px solid #fde8c0", borderRadius:12, padding:"8px 14px", marginBottom:12 },
  familyBadge: { fontSize:14, fontWeight:700, color:"#a07850" },
  familyEditBtn: { fontSize:13, fontWeight:700, color:"#d4788a", background:"#fff0f5", border:"1px solid #f5c4d8", borderRadius:8, padding:"4px 12px", cursor:"pointer", fontFamily:"'Zen Maru Gothic',sans-serif" },
  genrePanel: { background:"rgba(255,255,255,0.7)", border:"1px solid #fde8c0", borderRadius:14, padding:"10px 14px", marginBottom:12 },
  genrePanelTitle: { fontSize:14, fontWeight:700, color:"#7a4a2a", marginBottom:8 },
  genreGrid: { display:"flex", flexWrap:"wrap", gap:8 },
  genreChip: { padding:"7px 14px", borderRadius:20, border:"1.5px solid #fde8c0", background:"#fff7f0", color:"#b89070", fontSize:14, cursor:"pointer", fontFamily:"'Zen Maru Gothic',sans-serif", transition:"all 0.15s" },
  genreChipActive: { background:"#ffd4d4", borderColor:"#f5a0a0", color:"#d45050", fontWeight:700 },
};
