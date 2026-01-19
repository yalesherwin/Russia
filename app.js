const bankSelect = document.getElementById("bankSelect");
const wordListEl = document.getElementById("wordList");
const currentWordEl = document.getElementById("currentWord");
const currentTranslationEl = document.getElementById("currentTranslation");
const playToggle = document.getElementById("playToggle");
const nextWord = document.getElementById("nextWord");
const masteredBtn = document.getElementById("masteredBtn");
const statusText = document.getElementById("statusText");
const bankUrl = document.getElementById("bankUrl");
const refreshBank = document.getElementById("refreshBank");
const ttsProvider = document.getElementById("ttsProvider");
const apiKeyInput = document.getElementById("apiKey");
const ttsModelInput = document.getElementById("ttsModel");
const ruVoiceInput = document.getElementById("ruVoice");
const zhVoiceInput = document.getElementById("zhVoice");
const translateProviderInput = document.getElementById("translateProvider");
const translateApiKeyInput = document.getElementById("translateApiKey");

const builtInBanks = {
  "通勤基础 1": {
    words: [
      { ru: "привет", zh: "你好" },
      { ru: "спасибо", zh: "谢谢" },
      { ru: "пожалуйста", zh: "请 / 不客气" },
    { ru: "да", zh: "是的" },
    { ru: "нет", zh: "不是" },
    { ru: "как дела", zh: "你好吗" },
    { ru: "доброе утро", zh: "早上好" },
    { ru: "добрый вечер", zh: "晚上好" },
    { ru: "извините", zh: "对不起" },
    { ru: "где", zh: "哪里" },
    { ru: "сейчас", zh: "现在" },
    { ru: "мне нужно", zh: "我需要" },
    { ru: "я люблю", zh: "我喜欢" },
    { ru: "машина", zh: "汽车" },
    { ru: "дорога", zh: "道路" },
    { ru: "остановка", zh: "站点" },
    { ru: "бензин", zh: "汽油" },
    { ru: "вода", zh: "水" },
    { ru: "время", zh: "时间" },
    { ru: "сегодня", zh: "今天" }
    ]
  },
  "主题词库：餐饮": {
    words: [
    { ru: "ресторан", zh: "餐厅" },
    { ru: "меню", zh: "菜单" },
    { ru: "кофе", zh: "咖啡" },
    { ru: "чай", zh: "茶" },
    { ru: "счёт", zh: "账单" },
    { ru: "вкусно", zh: "好吃" },
    { ru: "суп", zh: "汤" },
    { ru: "хлеб", zh: "面包" },
    { ru: "курица", zh: "鸡肉" },
    { ru: "рыба", zh: "鱼" },
    { ru: "соль", zh: "盐" },
    { ru: "сахар", zh: "糖" },
    { ru: "острый", zh: "辣" },
    { ru: "десерт", zh: "甜点" }
    ]
  },
  "主题词库：旅行": {
    words: [
    { ru: "аэропорт", zh: "机场" },
    { ru: "поезд", zh: "火车" },
    { ru: "билет", zh: "票" },
    { ru: "паспорт", zh: "护照" },
    { ru: "такси", zh: "出租车" },
    { ru: "отель", zh: "酒店" },
    { ru: "комната", zh: "房间" },
    { ru: "ключ", zh: "钥匙" },
    { ru: "карта", zh: "地图" },
    { ru: "помогите", zh: "请帮我" }
    ]
  },
  "GitHub：常用 1 万词": {
    sourceUrl:
      "https://raw.githubusercontent.com/hingston/russian/master/10000-russian-words-cyrillic-only.txt",
    format: "text"
  },
  "GitHub：常用 5 万词": {
    sourceUrl:
      "https://raw.githubusercontent.com/hingston/russian/master/50000-russian-words-cyrillic-only.txt",
    format: "text"
  },
  "GitHub：常用 10 万词": {
    sourceUrl:
      "https://raw.githubusercontent.com/hingston/russian/master/100000-russian-words.txt",
    format: "text"
  }
};

let currentBankName = "";
let words = [];
let currentIndex = 0;
let isPlaying = false;
let isLoading = false;

// 分页配置
const PAGE_SIZE = 50;
let currentPage = 0;

const audioPlayer = new Audio();
audioPlayer.preload = "auto";

const persisted = {
  apiKey: localStorage.getItem("ttsApiKey") || "",
  provider: localStorage.getItem("ttsProvider") || "openai",
  model: localStorage.getItem("ttsModel") || "gpt-4o-mini-tts",
  ruVoice: localStorage.getItem("ruVoice") || "alloy",
  zhVoice: localStorage.getItem("zhVoice") || "nova",
  bankUrl: localStorage.getItem("bankUrl") || "",
  translateModel: localStorage.getItem("translateModel") || "deepseek-chat",
  translateProvider: localStorage.getItem("translateProvider") || "deepseek",
  translateApiKey: localStorage.getItem("translateApiKey") || ""
};

apiKeyInput.value = persisted.apiKey;
ttsProvider.value = persisted.provider;
ttsModelInput.value = persisted.model;
ruVoiceInput.value = persisted.ruVoice;
zhVoiceInput.value = persisted.zhVoice;
bankUrl.value = persisted.bankUrl;
const translateModelInput = document.getElementById("translateModel");
if (translateModelInput) {
  translateModelInput.value = persisted.translateModel;
}
if (translateProviderInput) {
  translateProviderInput.value = persisted.translateProvider;
}
if (translateApiKeyInput) {
  translateApiKeyInput.value = persisted.translateApiKey;
}

function saveSettings() {
  localStorage.setItem("ttsApiKey", apiKeyInput.value.trim());
  localStorage.setItem("ttsProvider", ttsProvider.value);
  localStorage.setItem("ttsModel", ttsModelInput.value.trim());
  localStorage.setItem("ruVoice", ruVoiceInput.value.trim());
  localStorage.setItem("zhVoice", zhVoiceInput.value.trim());
  localStorage.setItem("bankUrl", bankUrl.value.trim());
  if (translateModelInput) {
    localStorage.setItem("translateModel", translateModelInput.value.trim());
  }
  if (translateProviderInput) {
    localStorage.setItem("translateProvider", translateProviderInput.value);
  }
  if (translateApiKeyInput) {
    localStorage.setItem("translateApiKey", translateApiKeyInput.value.trim());
  }
}

function defaultTranslateModel(provider) {
  return provider === "deepseek" ? "deepseek-chat" : "gpt-4o-mini";
}

function ensureTranslateModel() {
  if (!translateModelInput || !translateProviderInput) return;
  const provider = translateProviderInput.value;
  const model = translateModelInput.value.trim();
  const needsDeepSeek = provider === "deepseek";
  const isDeepSeekModel = model.startsWith("deepseek-");
  if (needsDeepSeek && (!model || !isDeepSeekModel)) {
    translateModelInput.value = defaultTranslateModel(provider);
  }
  if (!needsDeepSeek && (!model || isDeepSeekModel)) {
    translateModelInput.value = defaultTranslateModel(provider);
  }
}

function keyForWord(word) {
  return `${word.ru}__${word.zh}`;
}

function masteredKey(bank) {
  return `mastered:${bank}`;
}

function getMasteredSet(bank) {
  const raw = localStorage.getItem(masteredKey(bank));
  if (!raw) return new Set();
  try {
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

function setMasteredSet(bank, set) {
  localStorage.setItem(masteredKey(bank), JSON.stringify(Array.from(set)));
}

function renderBankOptions() {
  bankSelect.innerHTML = "";
  Object.keys(builtInBanks).forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    option.textContent = name;
    bankSelect.appendChild(option);
  });
  if (!currentBankName) {
    currentBankName = Object.keys(builtInBanks)[0];
  }
  bankSelect.value = currentBankName;
}

function applyMasteredFilter(bankWords) {
  const masteredSet = getMasteredSet(currentBankName);
  return bankWords.filter((word) => !masteredSet.has(keyForWord(word)));
}

function getTotalPages() {
  return Math.ceil(words.length / PAGE_SIZE);
}

function getPageWords() {
  const start = currentPage * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  return words.slice(start, end);
}

function renderPagination() {
  const totalPages = getTotalPages();
  if (totalPages <= 1) return "";

  const pageInfo = `第 ${currentPage + 1}/${totalPages} 页 (共 ${words.length} 词)`;
  return `
    <div class="pagination">
      <button class="ghost page-btn" data-action="prev" ${currentPage === 0 ? 'disabled' : ''}>上一页</button>
      <span class="page-info">${pageInfo}</span>
      <button class="ghost page-btn" data-action="next" ${currentPage >= totalPages - 1 ? 'disabled' : ''}>下一页</button>
    </div>
  `;
}

function renderWordList() {
  wordListEl.innerHTML = "";
  if (words.length === 0) {
    wordListEl.innerHTML = `<div class="word-card"><div class="ru">全部掌握!</div><div class="zh">请刷新或选择其他词库</div></div>`;
    return;
  }

  // 渲染分页控件
  const paginationTop = document.createElement("div");
  paginationTop.innerHTML = renderPagination();
  if (paginationTop.firstElementChild) {
    wordListEl.appendChild(paginationTop.firstElementChild);
  }

  // 只渲染当前页的词汇
  const pageWords = getPageWords();
  const startIndex = currentPage * PAGE_SIZE;

  pageWords.forEach((word, i) => {
    const index = startIndex + i;
    const card = document.createElement("div");
    card.className = "word-card";
    if (index === currentIndex) {
      card.style.borderColor = "rgba(211, 74, 36, 0.6)";
    }
    const zhText = word.zh || "待翻译";
    card.innerHTML = `
      <div class="ru">${word.ru}</div>
      <div class="zh">${zhText}</div>
      <button data-index="${index}" class="ghost">播放这一词</button>
    `;
    card.querySelector("button").addEventListener("click", () => {
      currentIndex = index;
      updateCurrentWord();
      playSingleWord();
    });
    wordListEl.appendChild(card);
  });

  // 渲染底部分页控件
  const paginationBottom = document.createElement("div");
  paginationBottom.innerHTML = renderPagination();
  if (paginationBottom.firstElementChild) {
    wordListEl.appendChild(paginationBottom.firstElementChild);
  }

  // 绑定分页按钮事件
  wordListEl.querySelectorAll(".page-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const action = btn.dataset.action;
      if (action === "prev" && currentPage > 0) {
        currentPage--;
        renderWordList();
      } else if (action === "next" && currentPage < getTotalPages() - 1) {
        currentPage++;
        renderWordList();
      }
    });
  });
}

function updateCurrentWord() {
  if (!words[currentIndex]) {
    currentWordEl.textContent = "—";
    currentTranslationEl.textContent = "—";
    return;
  }
  currentWordEl.textContent = words[currentIndex].ru;
  currentTranslationEl.textContent = words[currentIndex].zh;
  renderWordList();
}

async function loadBankFromUrl(url) {
  if (!url) return null;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error("词库刷新失败，请检查 URL 是否可用。");
  }
  const rawText = await response.text();
  try {
    const data = JSON.parse(rawText);
    if (!Array.isArray(data)) {
      throw new Error("词库格式应为数组：[{ru, zh}]");
    }
    return data
      .filter((item) => item && item.ru)
      .map((item) => ({ ru: item.ru, zh: item.zh || "" }));
  } catch {
    const lines = rawText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    return lines.map((ru) => ({ ru, zh: "" }));
  }
}

async function loadBank(name) {
  statusText.textContent = "正在加载词库...";
  isLoading = true;
  try {
    const customUrl = bankUrl.value.trim();
    const builtIn = builtInBanks[name] || {};
    const sourceUrl = customUrl || builtIn.sourceUrl;
    const remote = await loadBankFromUrl(sourceUrl);
    const selected = remote || builtIn.words || [];
    words = applyMasteredFilter(selected);
    currentIndex = 0;
    currentPage = 0;
    updateCurrentWord();
    statusText.textContent = remote ? "已从在线词库刷新。" : "词库已加载。";
  } catch (error) {
    statusText.textContent = error.message;
    const fallback = builtInBanks[name]?.words || [];
    words = applyMasteredFilter(fallback);
    currentIndex = 0;
    currentPage = 0;
    updateCurrentWord();
  } finally {
    isLoading = false;
  }
}

function setStatus(message) {
  statusText.textContent = message;
}

async function playAudio(text, lang, voice) {
  const provider = ttsProvider.value;
  if (provider === "openai" && apiKeyInput.value.trim()) {
    try {
      await playOpenAI(text, voice);
      return;
    } catch (error) {
      setStatus("OpenAI 语音失败，切换为浏览器语音。");
      return playBrowserTTS(text, lang);
    }
  }
  return playBrowserTTS(text, lang);
}

function playBrowserTTS(text, lang) {
  return new Promise((resolve) => {
    if (!("speechSynthesis" in window)) {
      setStatus("浏览器不支持语音合成。");
      resolve();
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.onend = resolve;
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
  });
}

async function playOpenAI(text, voice) {
  const apiKey = apiKeyInput.value.trim();
  const model = ttsModelInput.value.trim() || "gpt-4o-mini-tts";
  const response = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      voice: voice || "alloy",
      input: text,
      format: "mp3"
    })
  });
  if (!response.ok) {
    throw new Error("TTS API 请求失败，请检查 Key 或网络。");
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  await new Promise((resolve) => {
    audioPlayer.src = url;
    audioPlayer.onended = resolve;
    audioPlayer.play();
  });
  URL.revokeObjectURL(url);
}

function translationCacheKey() {
  return `translations:${currentBankName}`;
}

function getTranslationCache() {
  const raw = localStorage.getItem(translationCacheKey());
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function setTranslationCache(cache) {
  localStorage.setItem(translationCacheKey(), JSON.stringify(cache));
}

async function translateToChinese(word) {
  const provider = translateProviderInput?.value || "openai";
  const apiKey = translateApiKeyInput?.value.trim();
  if (!apiKey) {
    setStatus("缺少翻译 API Key，已跳过中文。");
    return "";
  }
  ensureTranslateModel();
  const model = translateModelInput?.value.trim() || defaultTranslateModel(provider);
  const endpoint =
    provider === "deepseek"
      ? "https://api.deepseek.com/v1/chat/completions"
      : "https://api.openai.com/v1/chat/completions";
  let response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content:
              "Translate the Russian word into simplified Chinese. Reply with only the Chinese translation."
          },
          { role: "user", content: word }
        ]
      })
    });
  } catch {
    throw new Error("翻译请求失败，可能被浏览器拦截或网络不可用。");
  }
  if (!response.ok) {
    throw new Error("翻译 API 请求失败，请检查 Key 或网络。");
  }
  const data = await response.json();
  const text = data.choices?.[0]?.message?.content?.trim() || "";
  return text.replace(/^["'“”]+|["'“”]+$/g, "");
}

async function ensureTranslation(word) {
  if (word.zh) return word.zh;
  const cache = getTranslationCache();
  if (cache[word.ru]) {
    word.zh = cache[word.ru];
    return word.zh;
  }
  setStatus("正在翻译...");
  const translation = await translateToChinese(word.ru);
  if (translation) {
    word.zh = translation;
    cache[word.ru] = translation;
    setTranslationCache(cache);
    updateCurrentWord();
  }
  return translation;
}

async function playSingleWord() {
  if (!words[currentIndex]) return;
  const word = words[currentIndex];
  setStatus("正在播放...");
  try {
    const zh = await ensureTranslation(word);
    await playAudio(word.ru, "ru-RU", ruVoiceInput.value.trim());
    if (zh) {
      await playAudio(zh, "zh-CN", zhVoiceInput.value.trim());
    }
  } catch (error) {
    setStatus(error.message);
  }
}

async function playLoop() {
  if (isPlaying || isLoading) return;
  isPlaying = true;
  playToggle.textContent = "停止播放";
  while (isPlaying && words.length > 0) {
    await playSingleWord();
    if (!isPlaying) break;
    currentIndex = (currentIndex + 1) % words.length;
    updateCurrentWord();
  }
  playToggle.textContent = "开始连续播放";
  isPlaying = false;
}

function stopPlayback() {
  isPlaying = false;
  audioPlayer.pause();
  audioPlayer.currentTime = 0;
  if ("speechSynthesis" in window) {
    speechSynthesis.cancel();
  }
  setStatus("已停止播放。");
}

function markMastered() {
  if (!words[currentIndex]) return;
  const masteredSet = getMasteredSet(currentBankName);
  masteredSet.add(keyForWord(words[currentIndex]));
  setMasteredSet(currentBankName, masteredSet);
  words.splice(currentIndex, 1);
  if (currentIndex >= words.length) currentIndex = 0;
  updateCurrentWord();
  setStatus("已标记掌握，后续不再出现。");
}

function advanceWord() {
  if (words.length === 0) return;
  currentIndex = (currentIndex + 1) % words.length;
  updateCurrentWord();
  playSingleWord();
}

bankSelect.addEventListener("change", () => {
  currentBankName = bankSelect.value;
  saveSettings();
  loadBank(currentBankName);
});

refreshBank.addEventListener("click", () => {
  saveSettings();
  loadBank(currentBankName);
});

playToggle.addEventListener("click", () => {
  if (isPlaying) {
    stopPlayback();
    playToggle.textContent = "开始连续播放";
    return;
  }
  playLoop();
});

nextWord.addEventListener("click", advanceWord);
masteredBtn.addEventListener("click", markMastered);

// 防抖保存设置
let saveTimeout = null;
function debouncedSave() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(saveSettings, 300);
}

// API Key 输入时实时保存（防抖）
apiKeyInput.addEventListener("input", debouncedSave);
apiKeyInput.addEventListener("change", saveSettings);
ttsProvider.addEventListener("change", saveSettings);
ttsModelInput.addEventListener("input", debouncedSave);
ttsModelInput.addEventListener("change", saveSettings);
ruVoiceInput.addEventListener("input", debouncedSave);
ruVoiceInput.addEventListener("change", saveSettings);
zhVoiceInput.addEventListener("input", debouncedSave);
zhVoiceInput.addEventListener("change", saveSettings);
bankUrl.addEventListener("input", debouncedSave);
bankUrl.addEventListener("change", saveSettings);
if (translateModelInput) {
  translateModelInput.addEventListener("input", debouncedSave);
  translateModelInput.addEventListener("change", saveSettings);
}
if (translateProviderInput) {
  translateProviderInput.addEventListener("change", () => {
    ensureTranslateModel();
    saveSettings();
  });
}
if (translateApiKeyInput) {
  translateApiKeyInput.addEventListener("input", debouncedSave);
  translateApiKeyInput.addEventListener("change", saveSettings);
}

ensureTranslateModel();

renderBankOptions();
loadBank(currentBankName);
