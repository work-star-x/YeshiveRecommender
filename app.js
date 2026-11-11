function stripShortYeshivaDescriptions(yeshivot) {
  return yeshivot.map(({ tagline, matchSummary, ...yeshiva }) => yeshiva);
}

const appData = window.APP_DATA;
const RATING_QUESTION_IDS = new Set(['q4', 'q6', 'q7', 'q10', 'q12', 'q14', 'q15']);

function normalizeQuestions(questions) {
  return questions.map((question) => {
    const type = question.type || (RATING_QUESTION_IDS.has(question.id) ? 'rating' : 'yes-no');
    if (type !== 'rating') return { ...question, type };

    const isRatingOptions = question.options.every((option) => /^[1-4]$/.test(String(option.id)));
    if (isRatingOptions) return { ...question, type };

    const agreeOption = question.options.find((option) => option.id === 'yes' || option.label?.trim() === 'כן');
    const disagreeOption = question.options.find((option) => option.id === 'no' || option.label?.trim() === 'לא');
    if (!agreeOption || !disagreeOption) return { ...question, type };

    const tags = [...new Set([
      ...(agreeOption.tags || []),
      ...(disagreeOption.tags || []),
      ...Object.keys(agreeOption.weights || {}),
      ...Object.keys(disagreeOption.weights || {})
    ])];
    const agreeWeights = agreeOption.weights || {};
    const disagreeWeights = disagreeOption.weights || {};
    return {
      ...question,
      type,
      options: [1, 2, 3, 4].map((value) => {
        const ratio = (value - 1) / 3;
        const weights = Object.fromEntries(tags.map((tag) => {
          const agreeWeight = Number(agreeWeights[tag] ?? 1);
          const disagreeWeight = Number(disagreeWeights[tag] ?? -agreeWeight);
          const weight = disagreeWeight + ((agreeWeight - disagreeWeight) * ratio);
          return [tag, Number(weight.toFixed(2))];
        }));
        return { id: String(value), label: String(value), tags, weights };
      })
    };
  });
}

appData.questions = normalizeQuestions(appData.questions);
appData.yeshivot = stripShortYeshivaDescriptions(appData.yeshivot);
const bundledContent = JSON.parse(JSON.stringify({ questions: appData.questions, yeshivot: appData.yeshivot }));
const supabaseConfig = window.SUPABASE_CONFIG || {};
const hasSupabaseConfig = Boolean(
  window.supabase?.createClient
  && supabaseConfig.url
  && supabaseConfig.anonKey
  && !supabaseConfig.url.includes('YOUR_PROJECT')
  && !supabaseConfig.anonKey.includes('YOUR_SUPABASE')
);
const supabaseClient = hasSupabaseConfig
  ? window.supabase.createClient(supabaseConfig.url, supabaseConfig.anonKey)
  : null;

const state = {
  currentIndex: 0,
  ratingTransition: false,
  ratingTransitionTimeout: null,
  answers: {},
  preferredAreaGroups: [],
  completed: false,
  started: false,
  adminAuthenticated: false,
  adminTab: 'questions',
  adminEmail: '',
  adminStats: null,
  adminStatsError: '',
  selectedParameterId: '',
  adminParametersDraft: null,
  pendingRequests: [],
  cloudMessage: ''
};

const root = document.getElementById('app');

async function loadCloudContent() {
  if (!supabaseClient) return;
  const { data, error } = await supabaseClient
    .from('site_content')
    .select('questions, yeshivot, parameters')
    .eq('id', 'main')
    .maybeSingle();

  if (error) {
    console.error('לא ניתן לטעון את תוכן האתר מהענן.', error);
    return;
  }

  if (data?.questions && data?.yeshivot) {
    appData.questions = normalizeQuestions(data.questions);
    appData.yeshivot = stripShortYeshivaDescriptions(data.yeshivot);
    if (Array.isArray(data.parameters)) initializeParameters(data.parameters);
  }
}

async function saveCloudContent() {
  if (!supabaseClient) throw new Error('יש להגדיר חיבור Supabase לפני שמירת שינויים.');
  const { error } = await supabaseClient.from('site_content').upsert({
    id: 'main',
    questions: appData.questions,
    yeshivot: appData.yeshivot,
    parameters: appData.parameters,
    updated_at: new Date().toISOString(),
    updated_by: state.adminUserId || null
  });
  if (error) throw error;
}

async function loadPendingRequests() {
  if (!supabaseClient || !state.adminAuthenticated) return;
  const { data, error } = await supabaseClient
    .from('submissions')
    .select('id, yeshiva_id, yeshiva_name, request_type, notes, answers, resolved_tags, created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });
  if (error) throw error;
  state.pendingRequests = data.map((row) => ({
    id: row.id,
    yeshivaId: row.yeshiva_id,
    yeshivaName: row.yeshiva_name,
    type: row.request_type,
    details: row.notes || '',
    answers: row.answers,
    resolvedTags: row.resolved_tags || [],
    submittedAt: row.created_at
  }));
}

const TAG_LABELS = {
  gemara: 'גמרא',
  gavoa: 'גובה',
  hesder: 'הסדר',
  intellectual_open: 'פתיחות מחשבתית',
  academic_integration: 'שילוב אקדמי',
  community: 'קהילה',
  academic: 'אקדמיה',
  modern_israel: 'ציונות מודרנית',
  serious_learning: 'לימוד רציני',
  leadership: 'מנהיגות',
  torah_values: 'ערכי תורה',
  warm_thinking: 'חשיבה חמה',
  kollel: 'כולל',
  mishpacha: 'משפחה',
  classical_haredi: 'חרדי קלאסי',
  traditional: 'מסורתי',
  formal: 'מסודר',
  quiet: 'שקט',
  discussion: 'דיון',
  modern: 'מודרני',
  purpose: 'מטרה',
  academic_integration: 'שילוב אקדמי',
  community: 'קהילה',
  warm_thinking: 'חשיבה חמה',
  kollel: 'כולל',
  mishna: 'משנה',
  halacha: 'הלכה',
  text_study: 'לימוד טקסט',
  national: 'לאומי'
};

function initializeParameters(parameters = appData.parameters) {
  const knownTags = new Set(Array.isArray(parameters) ? [] : Object.keys(TAG_LABELS));
  appData.questions.forEach((question) => {
    question.options.forEach((option) => {
      (option.tags || []).forEach((tag) => knownTags.add(tag));
      Object.keys(option.weights || {}).forEach((tag) => knownTags.add(tag));
    });
  });
  appData.yeshivot.forEach((yeshiva) => {
    Object.keys(yeshiva.profileTags || {}).forEach((tag) => knownTags.add(tag));
  });
  const normalized = Array.isArray(parameters)
    ? parameters.filter((parameter) => parameter?.id).map((parameter) => ({
      id: String(parameter.id),
      label: String(parameter.label || TAG_LABELS[parameter.id] || formatTagLabel(parameter.id)),
      description: String(parameter.description || '')
    }))
    : [];
  const existingIds = new Set(normalized.map((parameter) => parameter.id));
  knownTags.forEach((id) => {
    if (!existingIds.has(id)) normalized.push({
      id,
      label: TAG_LABELS[id] || id.replace(/_/g, ' '),
      description: ''
    });
  });
  appData.parameters = normalized.sort((left, right) => left.label.localeCompare(right.label, 'he'));
}

initializeParameters();
bundledContent.parameters = JSON.parse(JSON.stringify(appData.parameters));

async function recordAnalyticsEvent(eventType, results = [], profile = null) {
  if (!supabaseClient) return;
  const payload = {
    p_event_type: eventType,
    p_results: results
  };
  if (profile) payload.p_profile = profile;
  const { error } = await supabaseClient.rpc('record_public_analytics_event', {
    ...payload
  });
  if (error) {
    console.error(`לא ניתן לשמור אירוע אנליטיקה (${eventType}).`, error);
  }
}

async function recordCompletionAnalytics() {
  const rankedResults = computeScores(appData.yeshivot.length);
  const results = rankedResults.map((yeshiva, index) => ({
    yeshiva_id: yeshiva.id,
    score: yeshiva.score,
    rank: index + 1
  }));
  await recordAnalyticsEvent('completion', results, rankedResults[0]?.userProfile || buildUserProfile());
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function formatTagLabel(tag) {
  return TAG_LABELS[tag] || tag.replace(/_/g, ' ');
}

function getAreaGroups() {
  return [...new Set(appData.yeshivot.map((yeshiva) => yeshiva.areaGroup).filter(Boolean))]
    .sort((left, right) => left.localeCompare(right, 'he'));
}

function getShareUrl() {
  return window.location.href.split('#')[0];
}

async function shareContent(title, text) {
  const url = getShareUrl();

  try {
    if (typeof navigator.share === 'function') {
      await navigator.share({ title, text, url });
      return 'השיתוף נפתח.';
    }

    if (!navigator.clipboard?.writeText) {
      throw new Error('Clipboard API is unavailable.');
    }
    await navigator.clipboard.writeText(`${title}\n\n${text}\n${url}`);
    return 'הקישור הועתק ללוח.';
  } catch (error) {
    if (error?.name === 'AbortError') return '';
    console.error('לא ניתן לשתף או להעתיק ללוח.', error);
    return 'השיתוף או ההעתקה ללוח נכשלו. אפשר להעתיק את כתובת האתר משורת הכתובת.';
  }
}

// Rendered ahead of the click so navigator.share runs while the tap's user activation is still valid.
async function createResultsImageFile() {
  const exportNode = document.getElementById('results-export');
  if (!exportNode || !window.htmlToImage?.toBlob) return null;

  const imageBlob = await window.htmlToImage.toBlob(exportNode, {
    pixelRatio: 2,
    cacheBust: true,
    skipFonts: true,
    backgroundColor: '#102047'
  });
  return imageBlob ? new File([imageBlob], 'yeshiva-matches.png', { type: 'image/png' }) : null;
}

function downloadFile(file) {
  const fileUrl = URL.createObjectURL(file);
  const downloadLink = document.createElement('a');
  downloadLink.href = fileUrl;
  downloadLink.download = file.name;
  document.body.append(downloadLink);
  downloadLink.click();
  downloadLink.remove();
  window.setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);
}

async function shareResultsImage(title, text, imageFilePromise, fallbackText = text) {
  const url = getShareUrl();
  const canShare = typeof navigator.share === 'function';

  if (canShare) {
    const imageFile = await Promise.race([imageFilePromise, new Promise((resolve) => window.setTimeout(resolve, 1500, undefined))]);
    if (imageFile && navigator.canShare?.({ files: [imageFile] })) {
      try {
        await navigator.share({ files: [imageFile], title, text, url });
        return 'התמונה והתוצאות שותפו.';
      } catch (error) {
        if (error?.name === 'AbortError') throw error;
        console.warn('שיתוף התמונה נכשל, מנסה לשתף טקסט.', error);
      }
    }
    await navigator.share({ title, text: fallbackText, url });
    return 'השיתוף נפתח.';
  }

  const imageFile = await imageFilePromise;
  if (imageFile) downloadFile(imageFile);
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(`${fallbackText}\n${url}`);
    return imageFile ? 'התמונה הורדה והקישור הועתק.' : 'הקישור הועתק ללוח.';
  }
  return imageFile ? 'התמונה הורדה.' : 'לא ניתן לשתף כרגע.';
}

function showNotice(message) {
  if (!message) return;
  const notice = document.createElement('div');
  notice.className = 'notice';
  notice.setAttribute('role', 'status');
  notice.textContent = message;
  root.append(notice);
  window.setTimeout(() => notice.remove(), 3500);
}

function renderWelcome() {
  root.innerHTML = `
    <section class="welcome-panel">
      <span class="welcome-kicker">2 דקות ו...</span>
      <h2>נמצא את הישיבה<br />שלך</h2>
      <p>ענה על מספר שאלות קצרות, ותקבל המלצות מותאמות בדיוק אליך. (בלי נדר בכפוף לתנאי המבצע)</p>
      <fieldset class="area-preference-control">
        <legend>בחר אזורי לימוד:  </legend>
        <div class="area-options">
          <label class="area-option"><input type="checkbox" id="area-all" ${state.preferredAreaGroups.length === 0 ? 'checked' : ''} /><span>כל האזורים</span></label>
          ${getAreaGroups().map((areaGroup) => `<label class="area-option"><input type="checkbox" class="area-checkbox" value="${escapeHtml(areaGroup)}" ${state.preferredAreaGroups.includes(areaGroup) ? 'checked' : ''} /><span>${escapeHtml(areaGroup)}</span></label>`).join('')}
        </div>
      </fieldset>
      <div class="welcome-actions">
        <button class="nav-button primary start-button" type="button" id="start-button">התחל</button>
        <button class="nav-button secondary share-button" type="button" id="share-app-button" aria-label="שתף את הכלי" title="שתף">
          <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
            <polyline points="16 6 12 2 8 6"></polyline>
            <line x1="12" y1="2" x2="12" y2="15"></line>
          </svg>
        </button>
      </div>
    </section>
  `;

  document.getElementById('start-button').addEventListener('click', () => {
    state.started = true;
    render();
  });
  const areaAll = document.getElementById('area-all');
  const areaBoxes = [...document.querySelectorAll('.area-checkbox')];
  const syncAreas = () => {
    state.preferredAreaGroups = areaBoxes.filter((box) => box.checked).map((box) => box.value);
    areaAll.checked = state.preferredAreaGroups.length === 0;
  };
  areaAll.addEventListener('change', () => {
    areaBoxes.forEach((box) => { box.checked = false; });
    syncAreas();
  });
  areaBoxes.forEach((box) => box.addEventListener('change', syncAreas));
  document.getElementById('share-app-button').addEventListener('click', async () => {
    const message = await shareContent(appData.app.title, 'כלי קצר למציאת ישיבה שמתאימה לסגנון הלימוד ולערכים שלך.');
    showNotice(message);
    if (message === 'השיתוף נפתח.' || message === 'הקישור הועתק ללוח.') {
      await recordAnalyticsEvent('share_home');
    }
  });
}

function getOrderedQuestions() {
  return [
    ...appData.questions.filter((question) => question.type !== 'rating'),
    ...appData.questions.filter((question) => question.type === 'rating')
  ];
}

function buildQuestionMarkup(question, index, allQuestions) {
  const options = [...question.options].sort((left, right) => Number(left.id !== 'no') - Number(right.id !== 'no'));
  const selectedOptionId = state.answers[question.id];
  const progressPercent = (index / allQuestions.length) * 100;
  const isRating = question.type === 'rating';

  return `
    <div class="question-panel">
      <div class="progress-wrap" aria-label="התקדמות השאלון">
        <div class="progress-meta">
          <span>שאלה ${index + 1} מתוך ${allQuestions.length}</span>
          <span>${Math.round(progressPercent)}%</span>
        </div>
        <div class="progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(progressPercent)}">
          <div class="progress-fill" style="width: ${progressPercent}%"></div>
        </div>
      </div>

      <h2 class="question-heading">${escapeHtml(question.text)}</h2>

      ${isRating ? `
        <div class="rating-scale-helper" aria-hidden="true">
          <span>לא מסכים בכלל</span>
          <span>מסכים ממש</span>
        </div>
      ` : ''}

      <div class="option-grid ${isRating ? 'rating-option-grid' : ''}" role="list">
        ${options
          .map(
            (option) => `
              <button
                class="option-button ${selectedOptionId === option.id ? 'selected' : ''}"
                type="button"
                data-question-id="${escapeHtml(question.id)}"
                data-option-id="${escapeHtml(option.id)}"
                aria-pressed="${selectedOptionId === option.id}"
                ${isRating ? `aria-label="${escapeHtml(option.label)} - ${option.id === '1' ? 'לא מסכים בכלל' : option.id === '4' ? 'מסכים ממש' : 'דרגת הסכמה'}"` : ''}
              >
                <strong>${escapeHtml(option.label)}</strong>
              </button>
            `
          )
          .join('')}
      </div>

      <div class="controls">
        <button class="nav-button secondary" type="button" id="prev-button" aria-label="חזרה לשאלה הקודמת" title="חזרה" ${index === 0 ? 'disabled' : ''}>
          <svg aria-hidden="true" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
        <button class="nav-button primary" type="button" id="next-button" aria-label="לשאלה הבאה" title="הבא" ${!selectedOptionId ? 'disabled' : ''}>
          <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
      </div>
    </div>
  `;
}

function getSelectedTags() {
  const tags = new Set();
  appData.questions.forEach((question) => {
    const optionId = state.answers[question.id];
    if (!optionId) return;
    const selectedOption = question.options.find((option) => option.id === optionId);
    if (!selectedOption) return;
    (selectedOption.tags || []).forEach((tag) => tags.add(tag));
    Object.keys(selectedOption.weights || {}).forEach((tag) => tags.add(tag));
  });
  return tags;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getQuestionAnswerWeights(question, optionId) {
  if (!question || !optionId) return {};
  const option = question.options.find((item) => item.id === optionId);
  if (!option) return {};
  const bundledQuestion = bundledContent.questions.find((item) => item.id === question.id);
  const bundledOption = bundledQuestion?.options.find((item) => item.id === option.id);
  const sourceWeights = option.weights && Object.keys(option.weights).length
    ? option.weights
    : bundledOption?.weights || {};
  const direction = option.id === 'no' || option.label?.trim() === 'לא' ? -1 : 1;
  const tags = Array.isArray(option.tags) ? option.tags : Object.keys(sourceWeights);
  return Object.fromEntries(tags.map((tag) => [tag, Number(sourceWeights[tag] ?? direction)]));
}

function buildUserProfile() {
  const parameterIds = (appData.parameters || []).map((parameter) => parameter.id);
  const rawScores = Object.fromEntries(parameterIds.map((id) => [id, 0]));
  const parameterBounds = Object.fromEntries(parameterIds.map((id) => [id, { min: 0, max: 0 }]));

  appData.questions.forEach((question) => {
    const optionWeights = question.options.map((option) => getQuestionAnswerWeights(question, option.id));
    parameterIds.forEach((parameterId) => {
      const values = optionWeights.map((weights) => Number(weights[parameterId] || 0));
      if (!values.some((value) => value !== 0)) return;
      parameterBounds[parameterId].min += Math.min(...values);
      parameterBounds[parameterId].max += Math.max(...values);
    });

    const optionId = state.answers[question.id];
    if (!optionId) return;

    const weights = getQuestionAnswerWeights(question, optionId);
    Object.entries(weights).forEach(([parameterId, weight]) => {
      if (!Object.hasOwn(rawScores, parameterId)) return;
      rawScores[parameterId] += Number(weight || 0);
    });
  });

  return Object.fromEntries(
    parameterIds.map((parameterId) => {
      const raw = Number(rawScores[parameterId] || 0);
      const { min, max } = parameterBounds[parameterId];
      const normalized = max > min ? 1 + ((raw - min) / (max - min)) * 9 : 5;
      return [parameterId, Number(normalized.toFixed(1))];
    })
  );
}

const MAHANAYIM_THRESHOLDS = {
  cultural_openness: 7,
  conservatism_authority: 3,
  classic_study: 4
};

const MAHANAYIM_BONUS = 5;
function computeScores(limit = 3) {
  const userProfile = buildUserProfile();

  return appData.yeshivot
    .filter((yeshiva) => state.preferredAreaGroups.length === 0
      || state.preferredAreaGroups.includes(yeshiva.areaGroup))
    .map((yeshiva) => {
      const parameterValues = appData.parameters.map((parameter) => {
        const userValue = Number(userProfile[parameter.id] || 5);
        const yeshivaValue = Number(yeshiva.profileTags?.[parameter.id] || 5);
        return Math.abs(userValue - yeshivaValue);
      });

      const averageDeviation = parameterValues.reduce((sum, value) => sum + value, 0) / Math.max(1, parameterValues.length);
      const baseScore = clamp((1 - (averageDeviation / 9)) * 100, 0, 100);
      const receivesMahanayimBonus = yeshiva.id === 'machanim'
        && userProfile.cultural_openness >= MAHANAYIM_THRESHOLDS.cultural_openness
        && userProfile.conservatism_authority <= MAHANAYIM_THRESHOLDS.conservatism_authority
        && userProfile.classic_study <= MAHANAYIM_THRESHOLDS.classic_study;
      const conditionalBonus = receivesMahanayimBonus ? MAHANAYIM_BONUS : 0;
      const adjustedScore = clamp(baseScore + conditionalBonus, 0, 100);

      return {
        ...yeshiva,
        score: Number(adjustedScore.toFixed(1)),
        conditionalBonus,
        userProfile
      };
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);
}

function renderResults() {
  document.querySelector('main.card')?.classList.add('results-mode');
  const results = computeScores();
  const resultsShareText = 'אלו הישיבות שיצאו לי, בדוק את שלך';
  const resultsFallbackText = `${resultsShareText}:\n${results
    .map((yeshiva, index) => `${index + 1}. ${yeshiva.name} - ${Math.round(yeshiva.score)}%`)
    .join('\n')}`;

  root.innerHTML = `
    <section class="results-panel">
      <div class="results-export" id="results-export">
        <div class="top-three">
          ${results
            .map(
              (yeshiva, index) => `
              <article class="result-card rank-${index + 1}">
                <span class="result-rank">${index + 1}</span>
                <div class="result-main">
                  <h3>${escapeHtml(yeshiva.name)}</h3>
                  <span class="result-area">${escapeHtml(yeshiva.area || 'מיקום לא צוין')}</span>
                </div>
                <strong class="result-percentage">${Math.round(yeshiva.score)}%</strong>
              </article>
            `
            )
            .join('')}
        </div>
      </div>

      <div class="results-actions">
        <button class="secondary-action-button" type="button" id="share-results-button" aria-label="שתף את התוצאות"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M12 16V3m0 0L7 8m5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" /></svg>שתף את התוצאות</button>
        <button class="secondary-action-button" type="button" id="suggest-yeshiva-button">הצע ישיבה או עדכן פרטים</button>
        <button class="reset-button" type="button" id="reset-button" aria-label="התחל מחדש" title="התחל מחדש">
          <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.23-5.19" />
          </svg>
        </button>
      </div>
    </section>
  `;

  const imageFilePromise = createResultsImageFile().catch((error) => {
    console.error('לא ניתן ליצור תמונת תוצאות.', error);
    return null;
  });
  document.getElementById('share-results-button').addEventListener('click', async () => {
    let message;
    try {
      message = await shareResultsImage('ההתאמות שלי לישיבה', resultsShareText, imageFilePromise, resultsFallbackText);
    } catch (error) {
      if (error?.name === 'AbortError') return;
      console.error('לא ניתן ליצור או לשתף תמונת תוצאות.', error);
      message = 'לא ניתן ליצור את תמונת התוצאות כרגע.';
    }
    showNotice(message);
    if (message.includes('שותפו') || message.includes('השיתוף נפתח') || message.includes('הקישור הועתק')) {
      await recordAnalyticsEvent('share_results');
    }
  });
  document.getElementById('suggest-yeshiva-button').addEventListener('click', renderFeedbackModal);

  const resetButton = document.getElementById('reset-button');
  resetButton.addEventListener('click', () => {
    state.currentIndex = 0;
    state.answers = {};
    state.completed = false;
    state.started = false;
    render();
  });
}

function getSavedRequests() {
  return state.pendingRequests;
}

function renderFeedbackModal() {
  const questionsMarkup = appData.questions.map((question, index) => `
    <fieldset class="feedback-question">
      <legend>${index + 1}. ${escapeHtml(question.text)}</legend>
      <div class="feedback-options">
        ${question.options.map((option) => `
          <label class="feedback-option">
            <input type="radio" name="answer-${escapeHtml(question.id)}" value="${escapeHtml(option.id)}" ${state.answers[question.id] === option.id ? 'checked' : ''} required />
            <span>${escapeHtml(option.label)}</span>
          </label>
        `).join('')}
      </div>
    </fieldset>
  `).join('');

  root.insertAdjacentHTML('beforeend', `
    <div class="modal-backdrop" id="feedback-modal" role="presentation">
      <section class="feedback-modal" role="dialog" aria-modal="true" aria-labelledby="feedback-title">
        <div class="modal-heading">
          <div>
            <p class="eyebrow">המשוב שלך עוזר לנו להשתפר</p>
            <h2 id="feedback-title">הצעה או עדכון לישיבה</h2>
          </div>
          <button class="icon-button" type="button" id="close-feedback" aria-label="סגירה">×</button>
        </div>
        <p class="modal-intro">התשובות שסימנת כבר מסומנות. אפשר לעבור עליהן ולשנות לפני שליחת ההצעה.</p>
        <form id="feedback-form">
          <div class="feedback-fields">
            <label>סוג הפנייה
              <select name="requestType" id="feedback-request-type" required>
                <option value="suggest">הצעת ישיבה חדשה</option>
                <option value="update">עדכון פרטים של ישיבה</option>
              </select>
            </label>
            <div class="yeshiva-name-field">
              <label for="feedback-yeshiva-name">שם הישיבה</label>
              <input name="yeshivaName" id="feedback-yeshiva-name" type="text" required maxlength="120" autocomplete="off" aria-autocomplete="list" aria-controls="yeshiva-suggestions" aria-expanded="false" />
              <div class="yeshiva-suggestions hidden" id="yeshiva-suggestions" role="listbox"></div>
              <p class="field-validation" id="yeshiva-validation" aria-live="polite"></p>
            </div>
            <input name="yeshivaId" id="feedback-yeshiva-id" type="hidden" />
            <label>הערות למנהל (לא חובה)
              <textarea name="details" rows="3" maxlength="2000"></textarea>
            </label>
          </div>
          <div class="feedback-question-list">${questionsMarkup}</div>
          <p class="local-save-note">הפנייה תישלח למערכת ותופיע בלוח הניהול.</p>
          <div class="modal-actions">
            <button class="nav-button secondary" type="button" id="cancel-feedback">ביטול</button>
            <button class="nav-button primary" type="submit">שליחת הצעה</button>
          </div>
        </form>
      </section>
    </div>
  `);

  const modal = document.getElementById('feedback-modal');
  const closeModal = () => modal.remove();
  document.getElementById('close-feedback').addEventListener('click', closeModal);
  document.getElementById('cancel-feedback').addEventListener('click', closeModal);
  modal.addEventListener('click', (event) => {
    if (event.target === modal) closeModal();
  });
  const form = document.getElementById('feedback-form');
  const requestType = document.getElementById('feedback-request-type');
  const yeshivaNameInput = document.getElementById('feedback-yeshiva-name');
  const yeshivaIdInput = document.getElementById('feedback-yeshiva-id');
  const suggestions = document.getElementById('yeshiva-suggestions');
  const validationMessage = document.getElementById('yeshiva-validation');
  const submitButton = form.querySelector('button[type="submit"]');
  let selectedYeshivaId = '';
  let validationSequence = 0;
  let nameCheckTimer;

  const matchingYeshivot = (query) => {
    const normalizedQuery = normalizeYeshivaName(query);
    if (!normalizedQuery) return [];
    return appData.yeshivot.filter((yeshiva) => [yeshiva.name, yeshiva.shortName]
      .some((name) => normalizeYeshivaName(name).includes(normalizedQuery)));
  };
  const setValidation = (message, invalid = false) => {
    validationMessage.textContent = message;
    validationMessage.classList.toggle('invalid', invalid);
    yeshivaNameInput.setAttribute('aria-invalid', String(invalid));
  };
  const clearSelection = () => {
    selectedYeshivaId = '';
    yeshivaIdInput.value = '';
  };
  const closeSuggestions = () => {
    suggestions.classList.add('hidden');
    yeshivaNameInput.setAttribute('aria-expanded', 'false');
  };
  const updateRequestFields = () => {
    clearSelection();
    setValidation('');
    closeSuggestions();
    if (requestType.value === 'update') {
      yeshivaNameInput.placeholder = 'הקלד/י לחיפוש ובחר/י ישיבה מהרשימה';
      yeshivaNameInput.setAttribute('role', 'combobox');
      yeshivaNameInput.setAttribute('aria-required', 'true');
    } else {
      yeshivaNameInput.placeholder = 'שם הישיבה החדשה';
      yeshivaNameInput.removeAttribute('role');
      yeshivaNameInput.removeAttribute('aria-required');
      validateSuggestedName();
    }
  };
  const renderSuggestions = (items) => {
    suggestions.innerHTML = items.length
      ? items.map((yeshiva) => `<button class="yeshiva-suggestion" type="button" role="option" aria-selected="false" data-yeshiva-id="${escapeHtml(yeshiva.id)}">${escapeHtml(yeshiva.name)}</button>`).join('')
      : '<p class="suggestion-empty">לא נמצאו ישיבות מתאימות.</p>';
    suggestions.classList.remove('hidden');
    yeshivaNameInput.setAttribute('aria-expanded', 'true');
  };
  const validateSuggestedName = () => {
    const name = yeshivaNameInput.value.trim();
    const sequence = ++validationSequence;
    window.clearTimeout(nameCheckTimer);
    if (requestType.value !== 'suggest' || !name) {
      setValidation('');
      submitButton.disabled = false;
      return;
    }

    submitButton.disabled = true;
    setValidation('בודק אם הישיבה כבר קיימת…');
    nameCheckTimer = window.setTimeout(async () => {
      try {
        let existingYeshivot = appData.yeshivot;
        if (supabaseClient) {
          const { data, error } = await supabaseClient
            .from('site_content')
            .select('yeshivot')
            .eq('id', 'main')
            .maybeSingle();
          if (error) throw error;
          if (data?.yeshivot) existingYeshivot = data.yeshivot;
        }
        if (sequence !== validationSequence) return;
        const normalizedName = normalizeYeshivaName(name);
        const duplicate = existingYeshivot.some((yeshiva) => [yeshiva.name, yeshiva.shortName]
          .some((existingName) => normalizeYeshivaName(existingName) === normalizedName));
        setValidation(duplicate ? 'ישיבה בשם זה כבר קיימת. בחר/י באפשרות עדכון.' : 'השם זמין להצעה.');
        yeshivaNameInput.setAttribute('aria-invalid', String(duplicate));
        submitButton.disabled = duplicate;
      } catch (error) {
        if (sequence !== validationSequence) return;
        console.error('בדיקת שם הישיבה נכשלה.', error);
        setValidation('לא ניתן לאמת את השם כרגע. נסה/י שוב.', true);
        submitButton.disabled = true;
      }
    }, 250);
  };

  requestType.addEventListener('change', updateRequestFields);
  yeshivaNameInput.addEventListener('input', () => {
    clearSelection();
    if (requestType.value === 'update') {
      const items = matchingYeshivot(yeshivaNameInput.value);
      setValidation(yeshivaNameInput.value.trim() ? 'בחר/י ישיבה מהרשימה כדי להמשיך.' : '');
      submitButton.disabled = true;
      if (yeshivaNameInput.value.trim()) renderSuggestions(items);
      else closeSuggestions();
    } else {
      validateSuggestedName();
    }
  });
  suggestions.addEventListener('click', (event) => {
    const option = event.target.closest('[data-yeshiva-id]');
    if (!option) return;
    const yeshiva = appData.yeshivot.find((item) => item.id === option.dataset.yeshivaId);
    if (!yeshiva) {
      setValidation('הישיבה שנבחרה אינה זמינה עוד. חפש/י שוב.', true);
      clearSelection();
      return;
    }
    selectedYeshivaId = yeshiva.id;
    yeshivaIdInput.value = yeshiva.id;
    yeshivaNameInput.value = yeshiva.name;
    setValidation(`נבחרה: ${yeshiva.name}`);
    submitButton.disabled = false;
    closeSuggestions();
  });
  yeshivaNameInput.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeSuggestions();
  });
  modal.addEventListener('click', (event) => {
    if (!suggestions.contains(event.target) && event.target !== yeshivaNameInput) closeSuggestions();
  });
  updateRequestFields();

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!supabaseClient) {
      showNotice('השליחה אינה זמינה כרגע. יש להגדיר חיבור למסד הנתונים.');
      return;
    }

    const formData = new FormData(form);
    const type = String(formData.get('requestType'));
    const submittedName = String(formData.get('yeshivaName') || '').trim();
    if (type === 'update') {
      const selectedYeshiva = appData.yeshivot.find((yeshiva) => yeshiva.id === selectedYeshivaId);
      if (!selectedYeshiva || yeshivaIdInput.value !== selectedYeshiva.id || submittedName !== selectedYeshiva.name) {
        showNotice('כדי לעדכן ישיבה, יש לבחור ישיבה תקפה מהרשימה.');
        setValidation('יש לבחור ישיבה מהרשימה.', true);
        return;
      }
    } else {
      const duplicate = appData.yeshivot.some((yeshiva) => [yeshiva.name, yeshiva.shortName]
        .some((name) => normalizeYeshivaName(name) === normalizeYeshivaName(submittedName)));
      if (duplicate || submitButton.disabled) {
        showNotice(duplicate ? 'הישיבה כבר קיימת. בחר/י באפשרות עדכון.' : 'יש להמתין לאימות שם הישיבה.');
        return;
      }
    }
    const answers = Object.fromEntries(appData.questions.map((question) => [
      question.id,
      formData.get(`answer-${question.id}`)
    ]));
    if (Object.values(answers).some((answer) => !answer)) {
      showNotice('יש לענות על כל השאלות לפני שליחת הפנייה.');
      return;
    }
    try {
      const { error } = await supabaseClient.from('submissions').insert({
        yeshiva_name: submittedName,
        yeshiva_id: type === 'update' ? selectedYeshivaId : null,
        request_type: type,
        notes: String(formData.get('details') || '').trim() || null,
        answers,
        status: 'pending'
      });
      if (error) throw error;
    } catch (error) {
      console.error('Submission insert failed.', error);
      if (error.message?.includes('already exists')) {
        showNotice('הישיבה כבר קיימת. בחר/י באפשרות עדכון.');
      } else if (error.message?.includes('Updates must reference')) {
        showNotice('הבחירה אינה תקפה עוד. בחר/י ישיבה מהרשימה ונסה/י שוב.');
      } else {
        showNotice('שליחת הפנייה נכשלה. בדוק/י את החיבור ונסה/י שוב.');
      }
      return;
    }

    modal.innerHTML = `
      <section class="feedback-modal feedback-success" role="dialog" aria-modal="true" aria-labelledby="feedback-success-title">
        <span class="success-mark" aria-hidden="true">✓</span>
        <h2 id="feedback-success-title">תודה על ההצעה</h2>
        <p>הפנייה נשלחה בהצלחה ותופיע בלוח הניהול.</p>
        <button class="nav-button primary" type="button" id="finish-feedback">סיום</button>
      </section>
    `;
    document.getElementById('finish-feedback').addEventListener('click', closeModal);
  });
}

function renderAdminLogin() {
  if (!supabaseClient) {
    root.innerHTML = `
      <section class="admin-login">
        <p class="eyebrow">אזור מנהלים</p>
        <h2>הניהול אינו מוגדר</h2>
        <p>יש להגדיר Supabase בקובץ הפריסה ולוודא שמסד הנתונים הוקם לפי הוראות README.</p>
        <a class="text-link" href="#">חזרה לאתר</a>
      </section>
    `;
    return;
  }

  root.innerHTML = `
    <section class="admin-login">
      <p class="eyebrow">אזור מנהלים</p>
      <h2>כניסה ללוח הניהול</h2>
      <p>התחבר עם חשבון מנהל מורשה.</p>
      <form id="admin-login-form">
        <label for="admin-email">כתובת דוא״ל</label>
        <input id="admin-email" name="email" type="email" autocomplete="username" required />
        <label for="admin-password">סיסמה</label>
        <input id="admin-password" name="password" type="password" autocomplete="current-password" required />
        <p class="form-error hidden" id="admin-login-error"></p>
        <div class="admin-login-actions">
          <a class="text-link" href="#">חזרה לאתר</a>
          <button class="nav-button primary" type="submit">כניסה</button>
        </div>
      </form>
    </section>
  `;

  document.getElementById('admin-login-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const submitButton = event.currentTarget.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: formData.get('email'),
      password: formData.get('password')
    });

    if (!error && data.user) {
      const { data: adminRow, error: adminError } = await supabaseClient
        .from('admins')
        .select('user_id')
        .eq('user_id', data.user.id)
        .maybeSingle();

      if (!adminError && adminRow) {
        state.adminAuthenticated = true;
        state.adminEmail = data.user.email;
        state.adminUserId = data.user.id;
        try {
          await loadPendingRequests();
          renderAdminPanel();
        } catch (loadError) {
          showAdminError(loadError.message);
        }
        return;
      }

      await supabaseClient.auth.signOut();
    }

    const errorMessage = error?.message || 'לחשבון זה אין הרשאת מנהל.';
    const errorElement = document.getElementById('admin-login-error');
    errorElement.textContent = errorMessage;
    errorElement.classList.remove('hidden');
    submitButton.disabled = false;
  });
}

function showAdminError(message) {
  state.adminMessage = message;
  renderAdminPanel(state.adminTab, message);
}

function normalizeYeshivaName(name) {
  return String(name || '').trim().toLocaleLowerCase('he');
}

function requestMatchesYeshiva(request, yeshiva) {
  if (request.yeshivaId) return request.yeshivaId === yeshiva.id;
  const requestName = normalizeYeshivaName(request.yeshivaName);
  return [yeshiva.name, yeshiva.shortName, yeshiva.id]
    .some((name) => normalizeYeshivaName(name) === requestName);
}

function getQuestionOption(question, optionId) {
  const option = question?.options.find((item) => item.id === optionId);
  if (option || question?.type !== 'rating') return option;
  if (optionId === 'yes') return question.options.find((item) => item.id === '4');
  if (optionId === 'no') return question.options.find((item) => item.id === '1');
  return undefined;
}

function deriveSubmissionTagWeights(requests) {
  const submissionWeights = requests.map((request) => {
    const tagCounts = new Map();
    let answeredQuestions = 0;

    appData.questions.forEach((question) => {
      const selectedOption = getQuestionOption(question, request.answers?.[question.id]);
      if (!selectedOption) return;

      answeredQuestions += 1;
      new Set(selectedOption.tags).forEach((tag) => tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1));
    });

    const weights = new Map();
    if (answeredQuestions) {
      tagCounts.forEach((count, tag) => weights.set(tag, (count / answeredQuestions) * 5));
    }
    return weights;
  }).filter((weights) => weights.size);

  const allTags = new Set(submissionWeights.flatMap((weights) => [...weights.keys()]));
  const averageWeights = {};
  allTags.forEach((tag) => {
    const total = submissionWeights.reduce((sum, weights) => sum + (weights.get(tag) || 0), 0);
    averageWeights[tag] = Math.round((total / submissionWeights.length) * 10) / 10;
  });
  return averageWeights;
}

function getRequestTagWeights(request) {
  return deriveSubmissionTagWeights([request]);
}

function getSuggestionDeltas(yeshiva, requests) {
  const currentWeights = yeshiva?.profileTags || {};
  const byParameter = new Map();
  requests.forEach((request) => {
    const suggestions = getRequestTagWeights(request);
    Object.entries(suggestions).forEach(([tag, suggestedWeight]) => {
      if ((request.resolvedTags || []).includes(tag)) return;
      if (!byParameter.has(tag)) byParameter.set(tag, []);
      byParameter.get(tag).push({
        request,
        delta: Math.round((suggestedWeight - (currentWeights[tag] || 0)) * 10) / 10
      });
    });
  });
  return [...byParameter.entries()].map(([tag, suggestions]) => ({
    tag,
    currentWeight: currentWeights[tag] || 0,
    suggestions,
    averageDelta: Math.round(suggestions.reduce((sum, item) => sum + item.delta, 0) / suggestions.length * 10) / 10
  }));
}

function applyRequestsToYeshiva(yeshiva, requests) {
  const updatedWeights = deriveSubmissionTagWeights(requests);
  return {
    ...yeshiva,
    profileTags: {
      ...yeshiva.profileTags,
      ...Object.fromEntries(Object.entries(updatedWeights).map(([tag, value]) => [tag, clamp(value, 1, 10)]))
    }
  };
}

function createYeshivaFromRequest(request, profileTags) {
  const baseId = normalizeYeshivaName(request.yeshivaName)
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-|-$/g, '') || `suggested-${Date.now()}`;
  const id = appData.yeshivot.some((yeshiva) => yeshiva.id === baseId)
    ? `${baseId}-${Date.now()}`
    : baseId;

  return {
    id,
    name: request.yeshivaName,
    shortName: request.yeshivaName,
    area: 'מיקום לא צוין',
    areaGroup: '',
    description: request.details || 'ישיבה שהוצעה על ידי משתמשים.',
    profileTags: Object.fromEntries(appData.parameters.map((parameter) => [
      parameter.id,
      clamp(Number(profileTags[parameter.id] || 5), 1, 10)
    ]))
  };
}

async function updateSubmissionStatuses(requestIds, status) {
  const { error } = await supabaseClient
    .from('submissions')
    .update({ status, reviewed_by: state.adminUserId, reviewed_at: new Date().toISOString() })
    .in('id', requestIds);
  if (error) throw error;
  await loadPendingRequests();
}

async function resolveParameterSuggestions(requests, tags) {
  for (const request of requests) {
    const resolvedTags = [...new Set([...(request.resolvedTags || []), ...tags.filter((tag) => Object.hasOwn(getRequestTagWeights(request), tag))])];
    const allTags = Object.keys(getRequestTagWeights(request));
    const isResolved = allTags.every((tag) => resolvedTags.includes(tag));
    const { error } = await supabaseClient
      .from('submissions')
      .update({
        resolved_tags: resolvedTags,
        ...(isResolved ? { status: 'applied', reviewed_by: state.adminUserId, reviewed_at: new Date().toISOString() } : {})
      })
      .eq('id', request.id);
    if (error) throw error;
  }
  await loadPendingRequests();
}

async function applyParameterSuggestion(yeshivaId, requestId, tag) {
  const request = getSavedRequests().find((item) => item.id === requestId);
  const currentYeshivot = state.adminYeshivotDraft || appData.yeshivot;
  const yeshiva = currentYeshivot.find((item) => item.id === yeshivaId);
  if (!request || !yeshiva || (request.resolvedTags || []).includes(tag)) return;
  const delta = getSuggestionDeltas(yeshiva, [request]).find((item) => item.tag === tag)?.suggestions[0]?.delta;
  if (delta === undefined) return;
  const previousYeshivot = appData.yeshivot;
  appData.yeshivot = currentYeshivot.map((item) => item.id === yeshivaId
    ? { ...item, profileTags: { ...item.profileTags, [tag]: clamp(Math.round(((item.profileTags[tag] || 5) + delta) * 10) / 10, 1, 10) } }
    : item);
  try {
    await saveCloudContent();
    await resolveParameterSuggestions([request], [tag]);
    state.adminYeshivotDraft = null;
    renderAdminPanel('yeshivot', 'השינוי לפרמטר התקבל.');
  } catch (error) {
    appData.yeshivot = previousYeshivot;
    renderAdminPanel('yeshivot', `לא ניתן להחיל את השינוי: ${error.message}`);
  }
}

async function applyAllParameterSuggestions(yeshiva, requests) {
  if (!yeshiva || !requests.length) return;
  const suggestions = getSuggestionDeltas(yeshiva, requests);
  const previousYeshivot = appData.yeshivot;
  const currentYeshivot = state.adminYeshivotDraft || appData.yeshivot;
  appData.yeshivot = currentYeshivot.map((item) => {
    if (item.id !== yeshiva.id) return item;
    const profileTags = { ...item.profileTags };
    suggestions.forEach(({ tag, averageDelta }) => {
      profileTags[tag] = clamp(Math.round(((profileTags[tag] || 5) + averageDelta) * 10) / 10, 1, 10);
    });
    return { ...item, profileTags };
  });
  try {
    await saveCloudContent();
    await resolveParameterSuggestions(requests, suggestions.map((item) => item.tag));
    state.adminYeshivotDraft = null;
    renderAdminPanel('yeshivot', 'ההצעות התקבלו לפי ממוצע השינויים לכל פרמטר.');
  } catch (error) {
    appData.yeshivot = previousYeshivot;
    renderAdminPanel('yeshivot', `לא ניתן להחיל את ההצעות: ${error.message}`);
  }
}

async function dismissAllYeshivaSuggestions(requests) {
  try {
    await updateSubmissionStatuses(requests.map((request) => request.id), 'dismissed');
    renderAdminPanel('yeshivot', 'כל ההצעות לישיבה נדחו והוסרו.');
  } catch (error) {
    renderAdminPanel('yeshivot', `לא ניתן לדחות את ההצעות: ${error.message}`);
  }
}

async function dismissSubmission(requestId) {
  try {
    await updateSubmissionStatuses([requestId], 'dismissed');
    renderAdminPanel('yeshivot', 'הפנייה נדחתה והוסרה מהתור.');
  } catch (error) {
    renderAdminPanel('yeshivot', `לא ניתן לעדכן את הפנייה: ${error.message}`);
  }
}

async function applySubmissionGroup(requests) {
  if (!requests.length) return;
  const previousYeshivot = appData.yeshivot;
  const currentYeshivot = state.adminYeshivotDraft || appData.yeshivot;
  const matchingYeshiva = currentYeshivot.find((yeshiva) => requestMatchesYeshiva(requests[0], yeshiva));
  if (!matchingYeshiva && requests.some((request) => request.type === 'update')) {
    renderAdminPanel('yeshivot', 'הישיבה שאליה מתייחסת בקשת העדכון אינה קיימת עוד. לא ניתן להחיל את העדכון.');
    return;
  }
  const profileTags = deriveSubmissionTagWeights(requests);

  if (matchingYeshiva) {
    appData.yeshivot = currentYeshivot.map((yeshiva) => yeshiva.id === matchingYeshiva.id
      ? applyRequestsToYeshiva(yeshiva, requests)
      : yeshiva);
  } else {
    appData.yeshivot = [...currentYeshivot, createYeshivaFromRequest(requests[0], profileTags)];
  }

  try {
    validateYeshivot(appData.yeshivot);
    await saveCloudContent();
    await updateSubmissionStatuses(requests.map((request) => request.id), 'applied');
    state.adminYeshivotDraft = null;
    renderAdminPanel('yeshivot', requests.length > 1
      ? `עודכנו תגיות הפרופיל לפי ממוצע של ${requests.length} פניות.`
      : 'הפרופיל עודכן לפי הפנייה.');
  } catch (error) {
    appData.yeshivot = previousYeshivot;
    renderAdminPanel('yeshivot', `עדכון הענן נכשל: ${error.message}`);
  }
}

function renderSubmissionCard(request, isNewSuggestion = false) {
  const requestAnswers = Object.entries(request.answers || {}).map(([questionId, optionId]) => {
    const question = appData.questions.find((item) => item.id === questionId);
    const option = getQuestionOption(question, optionId);
    const legacyRatingAnswer = question?.type === 'rating' && (optionId === 'yes' || optionId === 'no')
      ? `${optionId === 'yes' ? 'כן' : 'לא'} (תשובה קודמת)`
      : '';
    return `<li>${escapeHtml(question?.text || questionId)}: ${escapeHtml(legacyRatingAnswer || option?.label || optionId)}</li>`;
  }).join('');

  return `
    <article class="request-card">
      <div class="request-heading">
        <div>
          <strong>${request.type === 'update' ? 'בקשת עדכון' : 'הצעת ישיבה'}</strong>
          <span>${escapeHtml(request.yeshivaName)}</span>
        </div>
        <time>${escapeHtml(new Date(request.submittedAt).toLocaleString('he-IL'))}</time>
      </div>
      ${request.details ? `<p>${escapeHtml(request.details)}</p>` : '<p class="muted-note">לא נוספו הערות.</p>'}
      <details class="submission-answers">
        <summary>תשובות לשאלון</summary>
        <ul>${requestAnswers}</ul>
      </details>
      <div class="submission-actions">
        ${isNewSuggestion ? `<button class="text-button" type="button" data-submission-action="apply" data-submission-id="${escapeHtml(request.id)}">צור ישיבה מההצעה</button>` : ''}
        <button class="text-button danger-button" type="button" data-submission-action="dismiss" data-submission-id="${escapeHtml(request.id)}">דחה והסר</button>
      </div>
    </article>
  `;
}

function renderQuestionEditor(question, questionIndex) {
  return `
    <article class="admin-question-card" data-question-card data-question-index="${questionIndex}">
      <header class="editor-card-header">
        <h3>שאלה ${questionIndex + 1}</h3>
        <button class="icon-button danger-icon" type="button" data-action="remove-question" data-question-index="${questionIndex}" aria-label="הסר שאלה" title="הסר שאלה"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M4 7h16M10 11v6m4-6v6M5 7l1 13h12l1-13M9 7V4h6v3" /></svg></button>
      </header>
      <p class="muted-note">${question.type === 'rating' ? 'שאלת דירוג · סולם 1–4' : 'שאלת כן/לא'}</p>
      <div class="editor-fields">
        <label>מזהה שאלה
          <input data-question-field="id" value="${escapeHtml(question.id)}" required />
        </label>
        <label>נוסח השאלה
          <input data-question-field="text" value="${escapeHtml(question.text)}" required />
        </label>
      </div>
      <div class="option-editor-list">
        ${question.options.map((option, optionIndex) => `
          <div class="admin-option-card" data-option-card>
            <label>מזהה אפשרות<input data-option-field="id" value="${escapeHtml(option.id)}" required /></label>
            <label>נוסח האפשרות<input data-option-field="label" value="${escapeHtml(option.label)}" required /></label>
            <fieldset class="parameter-checkboxes">
              <legend>פרמטרים שמשפיעים על ההתאמה</legend>
              <div class="parameter-checkbox-list">
                ${appData.parameters.map((parameter) => `
                  <label><input data-option-field="tags" type="checkbox" value="${escapeHtml(parameter.id)}" ${option.tags.includes(parameter.id) ? 'checked' : ''} />${escapeHtml(parameter.label)}</label>
                `).join('')}
              </div>
            </fieldset>
            <button class="text-button danger-button" type="button" data-action="remove-option" data-question-index="${questionIndex}" data-option-index="${optionIndex}">הסר אפשרות</button>
          </div>
        `).join('')}
      </div>
      <button class="text-button add-option-button" type="button" data-action="add-option" data-question-index="${questionIndex}">הוסף אפשרות</button>
    </article>
  `;
}

function renderYeshivaEditor(yeshiva, index) {
  const requests = getSavedRequests().filter((request) => requestMatchesYeshiva(request, yeshiva));
  const suggestionRows = getSuggestionDeltas(yeshiva, requests);
  const suggestionsByTag = new Map(suggestionRows.map((row) => [row.tag, row]));
  return `
    <section class="yeshiva-editor" data-yeshiva-editor>
      <div class="editor-fields">
        <label>מזהה<input data-yeshiva-field="id" value="${escapeHtml(yeshiva.id)}" required /></label>
        <label>שם הישיבה<input data-yeshiva-field="name" value="${escapeHtml(yeshiva.name)}" required /></label>
        <label>שם קצר<input data-yeshiva-field="shortName" value="${escapeHtml(yeshiva.shortName || '')}" /></label>
        <label>אזור גאוגרפי<input data-yeshiva-field="area" value="${escapeHtml(yeshiva.area || '')}" placeholder="יישוב או אזור" required /></label>
        <label>אזור להתאמה
          <input data-yeshiva-field="areaGroup" list="area-groups-${escapeHtml(yeshiva.id)}" value="${escapeHtml(yeshiva.areaGroup || '')}" placeholder="בחר או הקלד אזור" />
          <datalist id="area-groups-${escapeHtml(yeshiva.id)}">${getAreaGroups().map((areaGroup) => `<option value="${escapeHtml(areaGroup)}"></option>`).join('')}</datalist>
        </label>
        <label class="wide-field">תיאור הישיבה<textarea data-yeshiva-field="description" rows="4">${escapeHtml(yeshiva.description || '')}</textarea></label>
      </div>
      <section class="profile-weights">
        <div class="section-heading">
          <h4>פרמטרים ומשקלים</h4>
          <span class="muted-note">כל פרמטר נע בין 1 ל-10</span>
        </div>
        <div class="weight-list">
          ${appData.parameters.map(({ id: tag, label, description }) => {
            const weight = Number(yeshiva.profileTags?.[tag] ?? 5);
            const suggestion = suggestionsByTag.get(tag);
            const suggestionDelta = suggestion?.averageDelta || 0;
            const deltaClass = suggestionDelta > 0 ? 'positive' : suggestionDelta < 0 ? 'negative' : 'neutral';
            const suggestionActions = suggestion?.suggestions || [];
            const suggestionControl = suggestionActions.length === 1
              ? `<button class="parameter-change ${deltaClass}" type="button" title="קבל את השינוי המוצע" data-parameter-action="accept-one" data-yeshiva-id="${escapeHtml(yeshiva.id)}" data-submission-id="${escapeHtml(suggestionActions[0].request.id)}" data-parameter-id="${escapeHtml(tag)}">${suggestionDelta > 0 ? '+' : ''}${suggestionDelta.toFixed(1)}</button>`
              : suggestionActions.length > 1
                ? `<details class="parameter-suggestion-details"><summary class="parameter-change ${deltaClass}" title="${escapeHtml(suggestionActions.map((item) => `${item.delta > 0 ? '+' : ''}${item.delta.toFixed(1)}`).join(' · '))}">ממוצע ${suggestionDelta > 0 ? '+' : ''}${suggestionDelta.toFixed(1)} · ${suggestionActions.length}</summary><div class="parameter-suggestion-popover">${suggestionActions.map((item) => `<button class="parameter-change ${item.delta > 0 ? 'positive' : item.delta < 0 ? 'negative' : 'neutral'}" type="button" data-parameter-action="accept-one" data-yeshiva-id="${escapeHtml(yeshiva.id)}" data-submission-id="${escapeHtml(item.request.id)}" data-parameter-id="${escapeHtml(tag)}">${item.delta > 0 ? '+' : ''}${item.delta.toFixed(1)} · ${escapeHtml(new Date(item.request.submittedAt).toLocaleDateString('he-IL'))}</button>`).join('')}</div></details>`
                : '<span class="muted-note">אין הצעה ממתינה</span>';
            return `
            <div class="weight-row" data-weight-row data-parameter-id="${escapeHtml(tag)}" data-parameter-weight="${weight}">
              <div class="parameter-name-wrap">
                <span class="parameter-name">${escapeHtml(label)}</span>
                <span class="parameter-subtext">${escapeHtml(description || '')}</span>
              </div>
              <label class="parameter-weight-field">
                <span class="sr-only">משקל ${escapeHtml(label)}</span>
                <input class="parameter-weight" data-weight-field="weight" type="number" min="1" max="10" step="0.1" value="${Number(weight).toFixed(1)}" required />
              </label>
              ${suggestionControl}
            </div>
          `}).join('')}
        </div>
      </section>
      ${yeshiva.id === 'machanim' ? '<p class="muted-note">תוספת התאמה מותנית: פתיחות תרבותית 6 ומעלה, שמרנות 4 ומטה, ואופי לימוד 4 ומטה.</p>' : ''}
      <button class="text-button danger-button remove-yeshiva-button" type="button" data-action="remove-yeshiva" data-yeshiva-index="${index}">הסר ישיבה</button>
    </section>
  `;
}

function renderYeshivaRequestGroup(yeshiva, requests, index = -1) {
  const title = yeshiva?.name || requests[0].yeshivaName;
  const isNewSuggestion = !yeshiva;
  return `
    <details class="managed-yeshiva ${requests.length ? 'has-pending' : ''}" ${requests.length ? 'open' : ''}>
      <summary>
        <span class="managed-yeshiva-title">${escapeHtml(title)}</span>
        ${isNewSuggestion ? '<span class="pending-badge new-yeshiva-badge">ישיבה חדשה</span>' : ''}
        ${requests.length ? `<span class="pending-badge">${requests.length} פניות ממתינות</span>` : ''}
        <span class="summary-chevron" aria-hidden="true">⌄</span>
      </summary>
      ${yeshiva ? renderYeshivaEditor(yeshiva, index) : '<p class="managed-profile-summary">הישיבה טרם נוספה לפרופילים.</p>'}
      ${requests.length ? `<div class="yeshiva-bulk-actions">
        ${yeshiva ? `<button class="nav-button primary" type="button" data-parameter-action="accept-all" data-yeshiva-id="${escapeHtml(yeshiva.id)}">קבל את כל ההצעות</button>` : `<button class="nav-button primary" type="button" data-average-name="${escapeHtml(normalizeYeshivaName(title))}">צור ישיבה לפי ממוצע ההצעות (${requests.length})</button>`}
        <button class="text-button danger-button" type="button" data-parameter-action="dismiss-all" data-yeshiva-id="${escapeHtml(yeshiva?.id || '')}" data-group-name="${escapeHtml(normalizeYeshivaName(title))}">דחה ונקה את כל ההצעות</button>
      </div>` : ''}
      <div class="submission-list">${requests.map((request) => renderSubmissionCard(request, isNewSuggestion)).join('')}</div>
    </details>
  `;
}

function validateQuestions(questions) {
  if (!Array.isArray(questions) || !questions.length) throw new Error('יש להזין לפחות שאלה אחת.');
  if (questions.some((question) => !question.id || !question.text || !Array.isArray(question.options) || !question.options.length)) {
    throw new Error('לכל שאלה נדרשים מזהה, טקסט ולפחות אפשרות אחת.');
  }
  if (questions.some((question) => question.options.some((option) => !option.id || !option.label || !Array.isArray(option.tags)))) {
    throw new Error('לכל אפשרות נדרשים מזהה, טקסט ותגיות.');
  }
}

function validateYeshivot(yeshivot) {
  if (!Array.isArray(yeshivot) || !yeshivot.length) throw new Error('יש להזין לפחות פרופיל ישיבה אחד.');
  if (yeshivot.some((yeshiva) => !yeshiva.id || !yeshiva.name || !yeshiva.profileTags || typeof yeshiva.profileTags !== 'object')) {
    throw new Error('לכל ישיבה נדרשים מזהה, שם ופרופיל תגיות.');
  }
}

function readQuestionsFromEditor() {
  return [...root.querySelectorAll('[data-question-card]')].map((card) => {
    const id = card.querySelector('[data-question-field="id"]').value.trim();
    const originalQuestionIndex = Number(card.dataset.questionIndex);
    const existingQuestion = appData.questions[originalQuestionIndex] || appData.questions.find((question) => question.id === id);
    const bundledQuestion = bundledContent.questions.find((question) => question.id === existingQuestion?.id)
      || bundledContent.questions.find((question) => question.id === id);
    return {
      id,
      text: card.querySelector('[data-question-field="text"]').value.trim(),
      type: existingQuestion?.type || (RATING_QUESTION_IDS.has(id) ? 'rating' : 'yes-no'),
      options: [...card.querySelectorAll('[data-option-card]')].map((optionCard) => {
        const optionId = optionCard.querySelector('[data-option-field="id"]').value.trim();
        const tags = [...optionCard.querySelectorAll('[data-option-field="tags"]:checked')].map((input) => input.value);
        const existingOption = existingQuestion?.options.find((option) => option.id === optionId);
        const bundledOption = bundledQuestion?.options.find((option) => option.id === optionId);
        const sourceWeights = Object.keys(existingOption?.weights || {}).length
          ? existingOption.weights
          : bundledOption?.weights || {};
        const label = optionCard.querySelector('[data-option-field="label"]').value.trim();
        const fallbackWeight = optionId === 'no' || label === 'לא' ? -1 : 1;
        const weights = Object.fromEntries(tags.map((tag) => [tag, Number(sourceWeights[tag] ?? fallbackWeight)]));
        return {
          id: optionId,
          label,
          tags,
          weights
        };
      })
    };
  });
}

function readYeshivotFromEditor() {
  return [...root.querySelectorAll('[data-yeshiva-editor]')].map((editor) => {
    const profileTags = {};
    editor.querySelectorAll('[data-weight-row]').forEach((row) => {
      const rawValue = Number(row.querySelector('[data-weight-field="weight"]').value);
      const clampedValue = Number(Math.min(10, Math.max(1, Number.isFinite(rawValue) ? rawValue : 5)).toFixed(1));
      profileTags[row.dataset.parameterId] = clampedValue;
    });
    const readField = (name) => editor.querySelector(`[data-yeshiva-field="${name}"]`).value.trim();
    return {
      id: readField('id'),
      name: readField('name'),
      shortName: readField('shortName'),
      area: readField('area'),
      areaGroup: readField('areaGroup'),
      description: editor.querySelector('[data-yeshiva-field="description"]').value.trim(),
      profileTags
    };
  });
}

function renderParameterEditor(parameter, index) {
  return `
    <article class="parameter-editor-card" data-parameter-card>
      <label>מזהה מערכת
        <input data-parameter-field="id" value="${escapeHtml(parameter.id)}" required />
      </label>
      <label>שם לתצוגה
        <input data-parameter-field="label" value="${escapeHtml(parameter.label)}" required />
      </label>
      <label>הסבר קטן
        <input data-parameter-field="description" value="${escapeHtml(parameter.description || '')}" />
      </label>
      <button class="text-button danger-button" type="button" data-parameter-action="remove" data-parameter-index="${index}">הסר פרמטר מכל המערכת</button>
    </article>
  `;
}

function readParametersFromEditor() {
  return [...root.querySelectorAll('[data-parameter-card]')].map((card) => ({
    id: card.querySelector('[data-parameter-field="id"]').value.trim(),
    label: card.querySelector('[data-parameter-field="label"]').value.trim(),
    description: card.querySelector('[data-parameter-field="description"]')?.value.trim() || ''
  }));
}

function validateParameters(parameters) {
  if (!parameters.length) throw new Error('יש להשאיר לפחות פרמטר אחד.');
  const ids = parameters.map((parameter) => parameter.id);
  if (ids.some((id) => !id) || new Set(ids).size !== ids.length || parameters.some((parameter) => !parameter.label)) {
    throw new Error('לכל פרמטר נדרשים מזהה ושם תצוגה, והמזהים חייבים להיות ייחודיים.');
  }
  if (ids.some((id) => !/^[\p{L}\p{N}_-]+$/u.test(id))) {
    throw new Error('מזהי פרמטרים יכולים להכיל אותיות, מספרים, מקף וקו תחתון בלבד.');
  }
}

function renderStatisticsPanel() {
  if (state.adminStatsError) return `<section class="statistics-panel"><p class="admin-message">${escapeHtml(state.adminStatsError)}</p></section>`;
  if (!state.adminStats) return '<section class="statistics-panel"><p class="empty-state">טוען נתונים מצטברים…</p></section>';

  const stats = state.adminStats || {};
  const shareMetrics = [
    { label: 'דף הבית', value: Number(stats.home_shares || 0) },
    { label: 'עמוד התוצאות', value: Number(stats.results_shares || 0) }
  ];
  const maxShare = Math.max(1, ...shareMetrics.map((item) => item.value));
  const distribution = stats.parameter_distribution || {};
  const analyticsById = new Map((stats.yeshivot || []).map((item) => [item.yeshiva_id, item]));
  const yeshivot = appData.yeshivot.map((yeshiva) => ({
    yeshiva,
    stats: analyticsById.get(yeshiva.id) || {}
  }));
  const maxPlacements = Math.max(1, ...yeshivot.flatMap(({ stats }) => [
    Number(stats.first_place || 0),
    Number(stats.second_place || 0),
    Number(stats.third_place || 0)
  ]));
  const selectedParameter = appData.parameters.find((parameter) => parameter.id === state.selectedParameterId)
    || appData.parameters[0];
  const parameterBuckets = selectedParameter ? distribution[selectedParameter.id] || {} : {};
  const parameterValues = Array.from({ length: 10 }, (_, index) => Number(parameterBuckets[index + 1] || 0));
  const parameterResponseCount = parameterValues.reduce((sum, count) => sum + count, 0);
  const parameterAverage = parameterResponseCount
    ? parameterValues.reduce((sum, count, index) => sum + count * (index + 1), 0) / parameterResponseCount
    : 0;
  const mostCommonValue = parameterValues.indexOf(Math.max(...parameterValues)) + 1;
  const maxParameterBucket = Math.max(1, ...parameterValues);

  return `
    <section class="statistics-panel" role="tabpanel">
      <div class="analytics-notice">הנתונים מצטברים בלבד. לא נשמרים פרטי משתמשים או מזהי דפדפן; כל השלמת שאלון נספרת בנפרד.</div>
      <div class="analytics-summary">
        <article class="analytics-card"><span>שיתופים מדף הבית</span><strong>${shareMetrics[0].value}</strong></article>
        <article class="analytics-card"><span>שיתופים מתוצאות</span><strong>${shareMetrics[1].value}</strong></article>
        <article class="analytics-card"><span>השלמות שאלון</span><strong>${Number(stats.completions || 0)}</strong></article>
      </div>

      <section class="analytics-share-section">
        <h3>שיתופים לפי נקודת כניסה</h3>
        <div class="share-chart">
          ${shareMetrics.map(({ label, value }) => `
            <div class="share-bar-row">
              <span>${label}</span>
              <div class="analytics-bar-track">
                <span class="analytics-bar home-share" style="width:${Math.max(8, (value / maxShare) * 100)}%"></span>
              </div>
              <strong>${value}</strong>
            </div>
          `).join('')}
        </div>
      </section>

      <section class="analytics-yeshivot">
        <h3>התאמות לפי ישיבה</h3>
        ${yeshivot.length ? yeshivot.map(({ yeshiva, stats }) => {
          const placements = [
            { label: 'מקום ראשון', value: Number(stats.first_place || 0), className: 'first' },
            { label: 'מקום שני', value: Number(stats.second_place || 0), className: 'second' },
            { label: 'מקום שלישי', value: Number(stats.third_place || 0), className: 'third' }
          ];
          const averageScore = Number(stats.average_score || 0);
          return `<article class="analytics-yeshiva-card">
            <h4>${escapeHtml(yeshiva.name)}</h4>
            <div class="analytics-rank-chart" aria-label="דירוגי התאמה">
              ${placements.map(({ label, value, className }) => `<div class="analytics-bar-row">
                <span>${label}</span><strong>${value}</strong>
                <div class="analytics-bar-track" role="img" aria-label="${label}: ${value}">
                  <span class="analytics-bar ${className}" style="width:${Math.max(0, Math.min(100, value / maxPlacements * 100))}%"></span>
                </div>
              </div>`).join('')}
              <div class="analytics-bar-row average-score-row">
                <span>ממוצע התאמה</span><strong>${averageScore.toFixed(1)}%</strong>
                <div class="analytics-bar-track" role="img" aria-label="ממוצע התאמה: ${averageScore.toFixed(1)} אחוז">
                  <span class="analytics-bar average" style="width:${Math.max(0, Math.min(100, averageScore))}%"></span>
                </div>
              </div>
            </div>
          </article>`;
        }).join('') : '<p class="empty-state">עדיין אין ישיבות להצגה.</p>'}
      </section>

      <section class="analytics-parameter-section">
        <div class="parameter-distribution-heading">
          <div>
            <h3>התפלגות לפי פרמטר</h3>
            <p class="muted-note">ערכי הפרופיל של המשיבים, בסולם 1–10.</p>
          </div>
          <label class="parameter-distribution-select">
            <span>פרמטר</span>
            <select id="parameter-distribution-select">
              ${appData.parameters.map((parameter) => `
                <option value="${escapeHtml(parameter.id)}" ${parameter.id === selectedParameter?.id ? 'selected' : ''}>${escapeHtml(parameter.label)}</option>
              `).join('')}
            </select>
          </label>
        </div>
        ${selectedParameter ? `<p class="parameter-distribution-description">${escapeHtml(selectedParameter.description || '')}</p>` : ''}
        <div class="parameter-distribution-summary">
          <div><span>שאלונים שנכללו</span><strong>${parameterResponseCount}</strong></div>
          <div><span>ממוצע</span><strong>${parameterResponseCount ? `${parameterAverage.toFixed(1)} / 10` : '—'}</strong></div>
          <div><span>הערך הנפוץ</span><strong>${parameterResponseCount ? `${mostCommonValue} / 10` : '—'}</strong></div>
        </div>
        ${parameterResponseCount
          ? `<div class="parameter-distribution-list" role="img" aria-label="התפלגות ${escapeHtml(selectedParameter.label)} בין 1 ל-10">
              ${parameterValues.map((count, index) => {
                const percentage = (count / parameterResponseCount) * 100;
                return `<div class="parameter-distribution-row">
                  <span class="distribution-value">${index + 1}</span>
                  <div class="distribution-track" aria-hidden="true"><span class="distribution-bar" style="width:${(count / maxParameterBucket) * 100}%"></span></div>
                  <span class="distribution-count"><strong>${count}</strong><small>${percentage.toFixed(0)}%</small></span>
                </div>`;
              }).join('')}
            </div>`
          : '<p class="parameter-distribution-empty">ההתפלגות תופיע לאחר שמשתמשים ישלימו שאלונים.</p>'}
      </section>

      <div class="statistics-actions">
        <button class="text-button danger-button" type="button" id="reset-statistics">אפס את כל הסטטיסטיקה</button>
      </div>
    </section>
  `;
}

async function loadAdminStatistics() {
  const { data, error } = await supabaseClient.rpc('get_admin_analytics');
  if (error) {
    state.adminStatsError = `לא ניתן לטעון נתונים סטטיסטיים: ${error.message}`;
    console.error('Admin analytics load failed.', error);
  } else {
    state.adminStats = data;
    state.adminStatsError = '';
  }
  if (state.adminTab === 'statistics') renderAdminPanel('statistics');
}

async function resetAdminStatistics() {
  if (!window.confirm('לאפס את כל נתוני הסטטיסטיקה? לא ניתן לבטל פעולה זו.')) return;
  const button = document.getElementById('reset-statistics');
  if (button) button.disabled = true;
  try {
    const { error } = await supabaseClient.rpc('reset_admin_analytics');
    if (error) throw error;
    state.adminStats = { completions: 0, home_shares: 0, results_shares: 0, yeshivot: [] };
    state.adminStatsError = '';
    await loadAdminStatistics();
    renderAdminPanel('statistics', 'כל נתוני הסטטיסטיקה אופסו.');
  } catch (error) {
    console.error('Admin analytics reset failed.', error);
    state.adminStatsError = `לא ניתן לאפס את הסטטיסטיקה: ${error.message}`;
    renderAdminPanel('statistics');
  }
}

function validateQuestions(questions) {
  if (!questions.length) throw new Error('יש להוסיף לפחות שאלה אחת.');
  const questionIds = questions.map((question) => question.id);
  if (questionIds.some((id) => !id) || new Set(questionIds).size !== questionIds.length) {
    throw new Error('מזהי השאלות חייבים להיות מלאים וייחודיים.');
  }
  if (questions.some((question) => !question.text || !question.options.length)) {
    throw new Error('לכל שאלה נדרש נוסח ולפחות אפשרות אחת.');
  }
  if (questions.some((question) => {
    const ids = question.options.map((option) => option.id);
    return ids.some((id) => !id) || new Set(ids).size !== ids.length || question.options.some((option) => !option.label);
  })) {
    throw new Error('אפשרויות בכל שאלה צריכות מזהים ייחודיים ונוסח.');
  }
  if (questions.some((question) => question.type === 'rating'
    && (question.options.length !== 4 || [1, 2, 3, 4].some((value) => !question.options.some((option) => option.id === String(value)))))) {
    throw new Error('בשאלת דירוג נדרשות בדיוק ארבע אפשרויות עם המזהים 1–4.');
  }
}

function validateYeshivot(yeshivot) {
  if (!yeshivot.length) throw new Error('יש להוסיף לפחות ישיבה אחת.');
  const ids = yeshivot.map((yeshiva) => yeshiva.id);
  if (ids.some((id) => !id) || new Set(ids).size !== ids.length) {
    throw new Error('מזהי הישיבות חייבים להיות מלאים וייחודיים.');
  }
  if (yeshivot.some((yeshiva) => !yeshiva.name || !yeshiva.area || Object.values(yeshiva.profileTags).some((weight) => !Number.isFinite(weight) || weight < 1 || weight > 10))) {
    throw new Error('לכל ישיבה נדרש שם ומשקלים מספריים בין 1 ל-10.');
  }
}

function readCurrentAdminDraft() {
  if (state.adminTab === 'questions' && document.getElementById('questions-form')) {
    state.adminQuestionsDraft = readQuestionsFromEditor();
  }
  if (state.adminTab === 'yeshivot' && document.getElementById('yeshivot-form')) {
    state.adminYeshivotDraft = readYeshivotFromEditor();
  }
  if (state.adminTab === 'parameters' && document.getElementById('parameters-form')) {
    state.adminParametersDraft = readParametersFromEditor();
  }
}

function renderAdminPanel(activeTab = state.adminTab, message = '') {
  if (!state.adminAuthenticated || !supabaseClient) {
    renderAdminLogin();
    return;
  }
  state.adminTab = activeTab;
  const isQuestionsTab = activeTab === 'questions';
  const isYeshivotTab = activeTab === 'yeshivot';
  const isParametersTab = activeTab === 'parameters';
  const isStatisticsTab = activeTab === 'statistics';
  const questions = state.adminQuestionsDraft || appData.questions;
  const yeshivot = state.adminYeshivotDraft || appData.yeshivot;
  const parameters = state.adminParametersDraft || appData.parameters;
  const requests = getSavedRequests();
  const groups = new Map();
  requests.forEach((request) => {
    const key = normalizeYeshivaName(request.yeshivaName);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(request);
  });
  const assignedRequestIds = new Set();
  const managedYeshivotMarkup = yeshivot.map((yeshiva, index) => {
    const relatedRequests = requests.filter((request) => requestMatchesYeshiva(request, yeshiva));
    relatedRequests.forEach((request) => assignedRequestIds.add(request.id));
    return renderYeshivaRequestGroup(yeshiva, relatedRequests, index);
  }).join('');
  const newSuggestionGroups = [...groups.values()].filter((group) => !assignedRequestIds.has(group[0].id));
  const requestsMarkup = managedYeshivotMarkup + newSuggestionGroups
    .map((group) => renderYeshivaRequestGroup(null, group)).join('');

  root.innerHTML = `
    <section class="admin-panel">
      <header class="admin-header">
        <div><p class="eyebrow">ניהול מאובטח</p><h2>ניהול נתוני האתר</h2><p class="admin-user-label">${escapeHtml(state.adminEmail)}</p></div>
        <div class="admin-header-actions">
          <button class="icon-button" type="button" id="admin-lock" aria-label="התנתקות ונעילה" title="התנתקות ונעילה"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="M10 17l5-5-5-5m5 5H3m9-9h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></svg></button>
          <a class="text-link" href="#">חזרה לאתר</a>
        </div>
      </header>
      ${message ? `<p class="admin-message" role="status">${escapeHtml(message)}</p>` : ''}
      ${state.cloudMessage ? `<p class="security-note">${escapeHtml(state.cloudMessage)}</p>` : ''}

      <nav class="admin-tabs" role="tablist" aria-label="עמודי ניהול">
        <button class="admin-tab ${isQuestionsTab ? 'active' : ''}" type="button" role="tab" aria-selected="${isQuestionsTab}" data-admin-tab="questions">ניהול שאלות</button>
        <button class="admin-tab ${isYeshivotTab ? 'active' : ''}" type="button" role="tab" aria-selected="${isYeshivotTab}" data-admin-tab="yeshivot">ניהול ישיבות</button>
        <button class="admin-tab ${isParametersTab ? 'active' : ''}" type="button" role="tab" aria-selected="${isParametersTab}" data-admin-tab="parameters">ניהול פרמטרים</button>
        <button class="admin-tab ${isStatisticsTab ? 'active' : ''}" type="button" role="tab" aria-selected="${isStatisticsTab}" data-admin-tab="statistics">סטטיסטיקה</button>
      </nav>

      ${isQuestionsTab ? `
        <form id="questions-form" class="dataset-form" role="tabpanel">
          <div class="editor-list">${questions.map(renderQuestionEditor).join('')}</div>
          <div class="admin-actions">
            <button class="text-button" type="button" data-action="add-question">הוסף שאלה</button>
            <button class="nav-button primary" type="submit">שמור שאלות</button>
          </div>
        </form>
      ` : isYeshivotTab ? `
        <form id="yeshivot-form" class="dataset-form" role="tabpanel">
          <section class="requests-section">
            <div class="section-heading"><div><p class="eyebrow">${requests.length} פניות ממתינות</p><h3>ישיבות ופניות משויכות</h3></div></div>
            <div class="managed-yeshivot-list">${requestsMarkup || '<p class="empty-state">אין עדיין ישיבות או פניות לניהול.</p>'}</div>
          </section>
          <div class="admin-actions">
            <button class="text-button" type="button" data-action="add-yeshiva">הוסף ישיבה</button>
            <button class="nav-button primary" type="submit">שמור פרופילי ישיבות</button>
          </div>
        </form>
      ` : isParametersTab ? `
        <form id="parameters-form" class="dataset-form" role="tabpanel">
          <section class="parameter-management-section">
            <div class="section-heading"><div><p class="eyebrow">${parameters.length} פרמטרים</p><h3>פרמטרים גלובליים</h3></div></div>
            <p class="muted-note">הוספה יוצרת פרמטר לכל פרופילי הישיבות. הסרה מוחקת אותו מכל פרופיל, מתשובות השאלון ומכללי הבונוס.</p>
            <div class="parameter-editor-list">${parameters.map(renderParameterEditor).join('')}</div>
          </section>
          <div class="admin-actions">
            <button class="text-button" type="button" data-parameter-action="add">הוסף פרמטר</button>
            <button class="nav-button primary" type="submit">שמור פרמטרים ועדכן מערכת</button>
          </div>
        </form>
      ` : renderStatisticsPanel()}
      <button class="text-button reset-cloud-button" type="button" id="reset-dataset">שחזר נתוני ברירת מחדל</button>
    </section>
  `;

  document.getElementById('admin-lock').addEventListener('click', async () => {
    await supabaseClient.auth.signOut();
    state.adminAuthenticated = false;
    state.adminEmail = '';
    state.adminUserId = '';
    renderAdminLogin();
  });
  document.getElementById('reset-statistics')?.addEventListener('click', resetAdminStatistics);
  document.getElementById('parameter-distribution-select')?.addEventListener('change', (event) => {
    state.selectedParameterId = event.currentTarget.value;
    renderAdminPanel('statistics');
  });
  root.querySelectorAll('[data-admin-tab]').forEach((button) => {
    button.addEventListener('click', () => {
      readCurrentAdminDraft();
      renderAdminPanel(button.dataset.adminTab);
      if (button.dataset.adminTab === 'statistics') void loadAdminStatistics();
    });
  });
  root.querySelectorAll('[data-action]').forEach((button) => {
    button.addEventListener('click', () => {
      if (state.adminTab === 'questions') {
        const questionsDraft = readQuestionsFromEditor();
        const questionIndex = Number(button.dataset.questionIndex);
        if (button.dataset.action === 'add-question') {
          questionsDraft.push({ id: `question-${Date.now()}`, text: '', options: [{ id: 'option-1', label: '', tags: [] }] });
        } else if (button.dataset.action === 'remove-question') {
          questionsDraft.splice(questionIndex, 1);
        } else if (button.dataset.action === 'add-option') {
          questionsDraft[questionIndex].options.push({ id: `option-${Date.now()}`, label: '', tags: [] });
        } else if (button.dataset.action === 'remove-option') {
          questionsDraft[questionIndex].options.splice(Number(button.dataset.optionIndex), 1);
        }
        state.adminQuestionsDraft = questionsDraft;
        renderAdminPanel('questions');
        return;
      }

      const yeshivotDraft = readYeshivotFromEditor();
      const yeshivaIndex = Number(button.dataset.yeshivaIndex);
      if (button.dataset.action === 'add-yeshiva') {
        yeshivotDraft.push({
          id: `yeshiva-${Date.now()}`,
          name: '', shortName: '', description: '',
          area: 'מיקום לא צוין', areaGroup: '',
          profileTags: Object.fromEntries(appData.parameters.map((parameter) => [parameter.id, 5]))
        });
      } else if (button.dataset.action === 'remove-yeshiva') {
        yeshivotDraft.splice(yeshivaIndex, 1);
      }
      state.adminYeshivotDraft = yeshivotDraft;
      renderAdminPanel('yeshivot');
    });
  });
  root.querySelectorAll('[data-parameter-action]').forEach((button) => {
    button.addEventListener('click', async () => {
      const action = button.dataset.parameterAction;
      if (action === 'add') {
        const draft = readParametersFromEditor();
        let id = 'new_parameter';
        let suffix = 2;
        while (draft.some((parameter) => parameter.id === id)) id = `new_parameter_${suffix++}`;
        draft.push({ id, label: 'פרמטר חדש' });
        state.adminParametersDraft = draft;
        renderAdminPanel('parameters');
      } else if (action === 'remove') {
        const draft = readParametersFromEditor();
        draft.splice(Number(button.dataset.parameterIndex), 1);
        state.adminParametersDraft = draft;
        renderAdminPanel('parameters');
      } else if (action === 'accept-one') {
        state.adminYeshivotDraft = readYeshivotFromEditor();
        await applyParameterSuggestion(button.dataset.yeshivaId, button.dataset.submissionId, button.dataset.parameterId);
      } else if (action === 'accept-all') {
        state.adminYeshivotDraft = readYeshivotFromEditor();
        const yeshiva = appData.yeshivot.find((item) => item.id === button.dataset.yeshivaId);
        const draftYeshiva = state.adminYeshivotDraft.find((item) => item.id === button.dataset.yeshivaId);
        const requests = draftYeshiva ? getSavedRequests().filter((request) => requestMatchesYeshiva(request, draftYeshiva)) : [];
        await applyAllParameterSuggestions(draftYeshiva || yeshiva, requests);
      } else if (action === 'dismiss-all') {
        const yeshiva = appData.yeshivot.find((item) => item.id === button.dataset.yeshivaId);
        const requests = getSavedRequests().filter((request) => yeshiva
          ? requestMatchesYeshiva(request, yeshiva)
          : normalizeYeshivaName(request.yeshivaName) === button.dataset.groupName);
        await dismissAllYeshivaSuggestions(requests);
      }
    });
  });
  root.querySelectorAll('[data-submission-action]').forEach((button) => {
    button.addEventListener('click', async () => {
      const requestId = button.dataset.submissionId;
      if (button.dataset.submissionAction === 'dismiss') {
        await dismissSubmission(requestId);
        return;
      }
      const request = getSavedRequests().find((item) => item.id === requestId);
      if (request) await applySubmissionGroup([request]);
    });
  });
  root.querySelectorAll('[data-average-name]').forEach((button) => {
    button.addEventListener('click', async () => {
      const key = button.dataset.averageName;
      const target = appData.yeshivot.find((yeshiva) => yeshiva.id === button.dataset.averageId);
      const group = getSavedRequests().filter((request) => target
        ? requestMatchesYeshiva(request, target)
        : normalizeYeshivaName(request.yeshivaName) === key);
      await applySubmissionGroup(group);
    });
  });

  document.getElementById('questions-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const questions = readQuestionsFromEditor();
    const previousQuestions = appData.questions;
    try {
      validateQuestions(questions);
      appData.questions = questions;
      await saveCloudContent();
      state.adminQuestionsDraft = null;
      renderAdminPanel('questions', 'השאלות נשמרו במסד הנתונים המשותף.');
    } catch (error) {
      appData.questions = previousQuestions;
      state.adminQuestionsDraft = questions;
      renderAdminPanel('questions', `לא נשמר: ${error.message}`);
    }
  });

  document.getElementById('parameters-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const parameters = readParametersFromEditor();
    const questions = state.adminQuestionsDraft || appData.questions;
    const yeshivot = state.adminYeshivotDraft || appData.yeshivot;
    const previous = {
      parameters: appData.parameters,
      questions: appData.questions,
      yeshivot: appData.yeshivot
    };
    try {
      validateParameters(parameters);
      validateQuestions(questions);
      validateYeshivot(yeshivot);
      const parameterIds = new Set(parameters.map((parameter) => parameter.id));
      const previousIds = new Set(appData.parameters.map((parameter) => parameter.id));
      const addedIds = parameters.filter((parameter) => !previousIds.has(parameter.id)).map((parameter) => parameter.id);
      appData.parameters = parameters;
      appData.questions = questions.map((question) => ({
        ...question,
        options: question.options.map((option) => ({
          ...option,
          tags: option.tags.filter((tag) => parameterIds.has(tag))
        }))
      }));
      appData.yeshivot = yeshivot.map((yeshiva) => {
        const profileTags = Object.fromEntries(Object.entries(yeshiva.profileTags).filter(([tag]) => parameterIds.has(tag)));
        addedIds.forEach((tag) => { profileTags[tag] = 5; });
        return {
          ...yeshiva,
          profileTags
        };
      });
      await saveCloudContent();
      state.adminParametersDraft = null;
      state.adminQuestionsDraft = null;
      state.adminYeshivotDraft = null;
      renderAdminPanel('parameters', 'הפרמטרים נשמרו והוחלו על השאלון ועל כל פרופילי הישיבות.');
    } catch (error) {
      appData.parameters = previous.parameters;
      appData.questions = previous.questions;
      appData.yeshivot = previous.yeshivot;
      state.adminParametersDraft = parameters;
      state.adminQuestionsDraft = questions;
      state.adminYeshivotDraft = yeshivot;
      renderAdminPanel('parameters', `לא ניתן לשמור פרמטרים: ${error.message}`);
    }
  });

  document.getElementById('yeshivot-form')?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const yeshivot = readYeshivotFromEditor();
    const previousYeshivot = appData.yeshivot;
    try {
      validateYeshivot(yeshivot);
      appData.yeshivot = yeshivot;
      await saveCloudContent();
      state.adminYeshivotDraft = null;
      renderAdminPanel('yeshivot', 'פרופילי הישיבות נשמרו במסד הנתונים המשותף.');
    } catch (error) {
      appData.yeshivot = previousYeshivot;
      state.adminYeshivotDraft = yeshivot;
      renderAdminPanel('yeshivot', `לא נשמר: ${error.message}`);
    }
  });

  document.getElementById('reset-dataset').addEventListener('click', async () => {
    const previousQuestions = appData.questions;
    const previousYeshivot = appData.yeshivot;
    const previousParameters = appData.parameters;
    appData.questions = JSON.parse(JSON.stringify(bundledContent.questions));
    appData.yeshivot = JSON.parse(JSON.stringify(bundledContent.yeshivot));
    appData.parameters = JSON.parse(JSON.stringify(bundledContent.parameters));
    try {
      const { error } = await supabaseClient.rpc('restore_site_defaults', {
        p_questions: appData.questions,
        p_yeshivot: appData.yeshivot,
        p_parameters: appData.parameters
      });
      if (error) throw error;
      state.adminStats = { completions: 0, home_shares: 0, results_shares: 0, yeshivot: [] };
      state.adminStatsError = '';
      state.adminQuestionsDraft = null;
      state.adminYeshivotDraft = null;
      state.adminParametersDraft = null;
      renderAdminPanel(state.adminTab, 'נתוני ברירת המחדל נשמרו והסטטיסטיקה אופסה.');
    } catch (error) {
      appData.questions = previousQuestions;
      appData.yeshivot = previousYeshivot;
      appData.parameters = previousParameters;
      renderAdminPanel(state.adminTab, `שחזור הנתונים נכשל: ${error.message}`);
    }
  });
}

function renderQuestionnaire() {
  const questions = getOrderedQuestions();
  const firstPartCount = questions.filter((question) => question.type !== 'rating').length;
  const ratingStartIndex = firstPartCount;

  if (state.ratingTransition) {
    root.innerHTML = `
      <section class="rating-transition-panel" aria-labelledby="rating-transition-title">
        <div class="rating-transition-art" aria-hidden="true">
          <span class="rating-spark spark-one">✦</span>
          <span class="rating-spark spark-two">✧</span>
          <svg class="rating-ruler" viewBox="0 0 64 64" fill="none" aria-hidden="true">
            <path d="M12 18a4 4 0 0 1 4-4h32a4 4 0 0 1 4 4v12H12V18Z" fill="currentColor" fill-opacity=".12" stroke="currentColor" stroke-width="3" />
            <path d="M20 15v9m8-9v5m8-5v9m8-9v5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" />
            <path d="m16 42 5-5m0 0 5 5m-5-5v13m8-9h9m-9 5h6" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span class="rating-spark spark-three">✦</span>
        </div>
        <h2 id="rating-transition-title">שאלות דירוג</h2>
        <p>עכשיו עוברים לשאלות דירוג. בחרו עד כמה אתם מסכימים עם כל משפט, בסולם של 1 עד 4.</p>
      </section>
    `;
    window.clearTimeout(state.ratingTransitionTimeout);
    state.ratingTransitionTimeout = window.setTimeout(() => {
      if (!state.ratingTransition || window.location.hash === '#admin-secret') return;
      state.ratingTransition = false;
      state.currentIndex = ratingStartIndex;
      render();
    }, 1700);
    return;
  }

  const currentQuestion = questions[state.currentIndex];
  if (!currentQuestion) {
    state.completed = true;
    void recordCompletionAnalytics();
    renderResults();
    return;
  }
  root.innerHTML = buildQuestionMarkup(currentQuestion, state.currentIndex, questions);

  const prevButton = document.getElementById('prev-button');
  const nextButton = document.getElementById('next-button');
  const optionButtons = root.querySelectorAll('.option-button');

  optionButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const { questionId, optionId } = button.dataset;
      state.answers[questionId] = optionId;

      advanceQuestion(questions, firstPartCount);
    });
  });

  prevButton.addEventListener('click', () => {
    if (state.currentIndex === ratingStartIndex && firstPartCount > 0) {
      state.currentIndex -= 1;
      render();
    } else if (state.currentIndex > 0) {
      state.currentIndex -= 1;
      render();
    }
  });

  nextButton.addEventListener('click', () => {
    if (!state.answers[currentQuestion.id]) {
      return;
    }

    advanceQuestion(questions, firstPartCount);
  });
}

function advanceQuestion(questions, firstPartCount) {
  if (state.currentIndex === firstPartCount - 1 && firstPartCount < questions.length) {
    state.ratingTransition = true;
    render();
    return;
  }
  if (state.currentIndex === questions.length - 1) {
    state.completed = true;
    void recordCompletionAnalytics();
    renderResults();
    return;
  }
  state.currentIndex += 1;
  render();
}

function render() {
  if (window.location.hash === '#admin-secret') {
    if (state.adminAuthenticated) {
      renderAdminPanel();
    } else {
      renderAdminLogin();
    }
    return;
  }

  state.adminAuthenticated = false;
  document.querySelector('main.card')?.classList.toggle('results-mode', state.completed);

  if (state.completed) {
    renderResults();
    return;
  }

  if (!state.started) {
    renderWelcome();
    return;
  }

  renderQuestionnaire();
}

async function restoreAdminSession() {
  if (!supabaseClient) return;
  const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
  const session = sessionData?.session;
  if (sessionError || !session) {
    state.adminAuthenticated = false;
    return;
  }

  const { data: adminRow, error } = await supabaseClient
    .from('admins')
    .select('user_id')
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (error || !adminRow) {
    await supabaseClient.auth.signOut();
    state.adminAuthenticated = false;
    return;
  }

  state.adminAuthenticated = true;
  state.adminEmail = session.user.email;
  state.adminUserId = session.user.id;
  try {
    await loadPendingRequests();
  } catch (loadError) {
    state.cloudMessage = `לא ניתן לטעון פניות: ${loadError.message}`;
  }
}

async function handleRouteChange() {
  if (window.location.hash === '#admin-secret') {
    await restoreAdminSession();
  }
  render();
}

async function initializeApp() {
  if (supabaseClient) {
    await loadCloudContent();
    await restoreAdminSession();
    supabaseClient.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        state.adminAuthenticated = false;
        state.adminEmail = '';
        state.adminUserId = '';
        if (window.location.hash === '#admin-secret') renderAdminLogin();
      }
    });
    supabaseClient
      .channel('public-site-content')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'site_content',
        filter: 'id=eq.main'
      }, (payload) => {
        if (!payload.new?.questions || !payload.new?.yeshivot) return;
        appData.questions = normalizeQuestions(payload.new.questions);
        appData.yeshivot = stripShortYeshivaDescriptions(payload.new.yeshivot);
        if (Array.isArray(payload.new.parameters)) initializeParameters(payload.new.parameters);
        if (window.location.hash !== '#admin-secret') render();
      })
      .subscribe();
  }

  window.addEventListener('hashchange', handleRouteChange);
  await handleRouteChange();
}

initializeApp();
