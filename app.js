// ========================
//  SirSual — Core App Logic
// ========================

const DB = {
  get users()       { return JSON.parse(localStorage.getItem('ss_users') || '{}'); },
  get messages()    { return JSON.parse(localStorage.getItem('ss_messages') || '[]'); },
  get session()     { return JSON.parse(localStorage.getItem('ss_session') || 'null'); },
  get polls()       { return JSON.parse(localStorage.getItem('ss_polls') || '[]'); },
  get voted()       { return JSON.parse(localStorage.getItem('ss_voted') || '{}'); },
  get impressions() { return JSON.parse(localStorage.getItem('ss_impressions') || '[]'); },
  get impSeen()     { return JSON.parse(localStorage.getItem('ss_imp_seen') || '{}'); },
  get views()       { return JSON.parse(localStorage.getItem('ss_views')    || '{}'); },

  saveUsers(u)       { localStorage.setItem('ss_users',       JSON.stringify(u)); },
  saveMessages(m)    { localStorage.setItem('ss_messages',    JSON.stringify(m)); },
  saveSession(s)     { localStorage.setItem('ss_session',     JSON.stringify(s)); },
  clearSession()     { localStorage.removeItem('ss_session'); },
  savePolls(p)       { localStorage.setItem('ss_polls',       JSON.stringify(p)); },
  saveVoted(v)       { localStorage.setItem('ss_voted',       JSON.stringify(v)); },
  saveImpressions(i) { localStorage.setItem('ss_impressions', JSON.stringify(i)); },
  saveImpSeen(s)     { localStorage.setItem('ss_imp_seen',    JSON.stringify(s)); },
  saveViews(v)       { localStorage.setItem('ss_views',       JSON.stringify(v)); },
};

const TRAITS = [
  { key: 'əyləncəli',    emoji: '😄', label: 'Əyləncəli'    },
  { key: 'intellektual', emoji: '🧠', label: 'İntellektual'  },
  { key: 'dahi',         emoji: '💡', label: 'Dahi'          },
  { key: 'savadlı',      emoji: '📚', label: 'Savadlı'       },
  { key: 'mehriban',     emoji: '🤗', label: 'Mehriban'      },
  { key: 'kədərli',      emoji: '😔', label: 'Kədərli'       },
  { key: 'enerjili',     emoji: '🔥', label: 'Enerjili'      },
  { key: 'sərin',        emoji: '😎', label: 'Sərin'         },
  { key: 'etibarlı',     emoji: '🤝', label: 'Etibarlı'      },
  { key: 'yaradıcı',     emoji: '🎨', label: 'Yaradıcı'      },
  { key: 'komik',        emoji: '😂', label: 'Komik'         },
  { key: 'sirli',        emoji: '🌙', label: 'Sirli'         },
  { key: 'cəsur',        emoji: '🦁', label: 'Cəsur'         },
  { key: 'həssas',       emoji: '🌸', label: 'Həssas'        },
  { key: 'sadiq',        emoji: '💛', label: 'Sadiq'         },
  { key: 'ağıllı',       emoji: '🎯', label: 'Ağıllı'        },
];

// ---------- AVATAR HELPER ----------
function userAvatar(user) {
  return user.emoji || (user.name ? user.name[0].toUpperCase() : '?');
}

// ---------- NAVBAR ----------
function updateNavbar() {
  const session = DB.session;
  const nav = document.getElementById('nav-actions');
  if (!nav) return;
  if (session) {
    const user   = DB.users[session.username] || {};
    const avatar = user.emoji || session.name[0].toUpperCase();
    nav.innerHTML = `
      <a href="#u/${session.username}" class="nav-user" title="Profilimə bax">
        <div class="avatar-sm" id="nav-avatar">${avatar}</div>
        <span id="nav-username">${session.name}</span>
      </a>
      <button class="btn btn-ghost btn-sm" onclick="logout()">Çıxış</button>
    `;
  } else {
    nav.innerHTML = `
      <button class="btn btn-outline btn-sm" onclick="switchTab('login');showPage('page-auth')">Giriş</button>
      <button class="btn btn-primary btn-sm" onclick="switchTab('register');showPage('page-auth')">Qeydiyyat</button>
    `;
  }
}

// ---------- ROUTER ----------
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

function route() {
  updateNavbar();
  const hash    = location.hash.replace('#', '') || '';
  const session = DB.session;

  if (hash.startsWith('u/')) {
    showPage('page-send');
    loadSendPage(hash.slice(2));
    return;
  }

  if (session) {
    showPage('page-dashboard');
    loadDashboard();
  } else {
    showPage('page-auth');
  }
}

window.addEventListener('hashchange', route);
window.addEventListener('load', route);

// ---------- AUTH ----------
function switchTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
  document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
  document.getElementById(`form-${tab}`).classList.add('active');
}

function register() {
  const name     = document.getElementById('reg-name').value.trim();
  const username = document.getElementById('reg-username').value.trim().toLowerCase();
  const password = document.getElementById('reg-password').value;

  clearErrors();

  let valid = true;
  if (!name)     { showError('reg-name-err', 'Ad daxil edin'); valid = false; }
  if (!username) { showError('reg-username-err', 'İstifadəçi adı daxil edin'); valid = false; }
  if (username && !/^[a-z0-9_]{3,20}$/.test(username)) {
    showError('reg-username-err', 'Yalnız hərf, rəqəm, alt xətt (3-20 simvol)'); valid = false;
  }
  if (!password || password.length < 6) {
    showError('reg-password-err', 'Şifrə ən azı 6 simvol olmalıdır'); valid = false;
  }

  if (!valid) return;

  const users = DB.users;
  if (users[username]) {
    showError('reg-username-err', 'Bu istifadəçi adı artıq mövcuddur'); return;
  }

  users[username] = { name, username, password, createdAt: new Date().toISOString() };
  DB.saveUsers(users);
  DB.saveSession({ username, name });
  updateNavbar();
  showPage('page-dashboard');
  loadDashboard();
  toast('Qeydiyyat uğurlu oldu! Xoş gəldiniz 🎉', 'success');
}

function login() {
  const username = document.getElementById('login-username').value.trim().toLowerCase();
  const password = document.getElementById('login-password').value;

  clearErrors();

  const users = DB.users;
  if (!users[username] || users[username].password !== password) {
    showError('login-err', 'İstifadəçi adı və ya şifrə yanlışdır');
    return;
  }

  DB.saveSession({ username, name: users[username].name });
  updateNavbar();
  showPage('page-dashboard');
  loadDashboard();
  toast('Xoş gəldiniz, ' + users[username].name + '!', 'success');
}

function logout() {
  DB.clearSession();
  updateNavbar();
  showPage('page-auth');
  toast('Çıxış edildi');
}

// ---------- DASHBOARD ----------
function loadDashboard() {
  const session  = DB.session;
  const messages = DB.messages.filter(m => m.to === session.username);
  const unread   = messages.filter(m => !m.read);
  const total    = messages.length;

  const me = DB.users[session.username] || {};
  document.getElementById('db-avatar').textContent    = userAvatar(me);
  document.getElementById('db-greeting').textContent  = 'Salam, ' + session.name + '! 👋';
  document.getElementById('db-username').innerHTML    =
    `<a href="#u/${session.username}" class="profile-self-link">@${session.username} · Profilimə bax →</a>`;
  const navAvatar = document.getElementById('nav-avatar');
  if (navAvatar) navAvatar.textContent = userAvatar(me);

  document.getElementById('stat-total').textContent   = total;
  document.getElementById('stat-unread').textContent  = unread.length;
  document.getElementById('stat-today').textContent   = todayCount(messages);
  const viewCount = DB.views[session.username] || 0;
  document.getElementById('stat-views').textContent   = viewCount;

  const link = location.origin + location.pathname + '#u/' + session.username;
  document.getElementById('share-link').textContent = link;

  const si = document.getElementById('search-input');
  const sr = document.getElementById('search-results');
  if (si) si.value = '';
  if (sr) { sr.style.display = 'none'; sr.innerHTML = ''; }

  renderDashboardImpressions();
  renderLeaderboard();
  renderMessages('all');
  updateBadge(unread.length);
}

function todayCount(msgs) {
  const today = new Date().toDateString();
  return msgs.filter(m => new Date(m.createdAt).toDateString() === today).length;
}

function updateBadge(n) {
  const badge = document.getElementById('unread-badge');
  if (!badge) return;
  if (n > 0) {
    badge.textContent = n;
    badge.style.display = 'inline';
  } else {
    badge.style.display = 'none';
  }
}

function renderMessages(filter) {
  const session  = DB.session;
  const all      = DB.messages
    .filter(m => m.to === session.username)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  let filtered = all;
  if (filter === 'unread') filtered = all.filter(m => !m.read);
  if (filter === 'read')   filtered = all.filter(m => m.read);

  document.querySelectorAll('.filter-tab').forEach(t => {
    t.classList.toggle('active', t.dataset.filter === filter);
  });

  const container = document.getElementById('messages-container');
  container.innerHTML = '';

  if (!filtered.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">💌</div>
        <p>${filter === 'all'
          ? 'Hələ heç bir mesajınız yoxdur.<br>Linkini paylaş, mesajlar gəlsin!'
          : filter === 'unread'
          ? 'Oxunmamış mesaj yoxdur.'
          : 'Oxunmuş mesaj yoxdur.'
        }</p>
      </div>`;
    return;
  }

  filtered.forEach(msg => {
    const div = document.createElement('div');
    div.className = 'message-card' + (msg.read ? '' : ' unread');
    div.innerHTML = `
      <div class="message-text">${escHtml(msg.text)}</div>
      <div class="message-meta">
        <span class="message-time">🕐 ${timeAgo(msg.createdAt)}${msg.read ? '' : ' · <strong style="color:var(--secondary)">Yeni</strong>'}</span>
        <div class="message-actions">
          ${!msg.read ? `<button class="btn btn-sm btn-outline" onclick="markRead('${msg.id}')">Oxundu işarələ</button>` : ''}
          <button class="btn btn-sm btn-ghost" onclick="confirmDelete('${msg.id}')">Sil</button>
        </div>
      </div>`;
    container.appendChild(div);
  });
}

function markRead(id) {
  const messages = DB.messages;
  const msg = messages.find(m => m.id === id);
  if (msg) { msg.read = true; DB.saveMessages(messages); }
  loadDashboard();
  toast('Oxundu kimi işarələndi', 'success');
}

function markAllRead() {
  const session  = DB.session;
  const messages = DB.messages.map(m => {
    if (m.to === session.username) m.read = true;
    return m;
  });
  DB.saveMessages(messages);
  loadDashboard();
  toast('Bütün mesajlar oxundu kimi işarələndi', 'success');
}

let deleteTargetId = null;

function confirmDelete(id) {
  deleteTargetId = id;
  document.getElementById('modal-delete').style.display = 'flex';
}

function closeDeleteModal() {
  deleteTargetId = null;
  document.getElementById('modal-delete').style.display = 'none';
}

function deleteMessage() {
  if (!deleteTargetId) return;
  const messages = DB.messages.filter(m => m.id !== deleteTargetId);
  DB.saveMessages(messages);
  closeDeleteModal();
  loadDashboard();
  toast('Mesaj silindi');
}

// ---------- EMOJI PICKER ----------
const EMOJIS = [
  '😀','😄','😎','🥳','🤩','😍','🥰','🤔','😴','🥸','🤓','🧐',
  '👽','👾','🤖','💀','🎭','🦄','🐱','🐶','🦊','🐻','🐼','🐨',
  '🦁','🐯','🐸','🐵','🐧','🦋','🐙','🦈','🦉','🦚','🦜','🦝',
  '🌙','⭐','🌈','🔥','💎','⚡','🌊','🍀','🌸','🌺','🌻','🌴',
  '🍁','🎃','🎄','🎯','🚀','🎨','🎵','🎮','🏆','💫','🌀','❄️',
];

function openEmojiModal() {
  const grid = document.getElementById('emoji-grid');
  grid.innerHTML = EMOJIS.map(e =>
    `<button class="emoji-btn" onclick="selectEmoji(this.textContent)">${e}</button>`
  ).join('');
  document.getElementById('modal-emoji').style.display = 'flex';
}

function closeEmojiModal() {
  document.getElementById('modal-emoji').style.display = 'none';
}

function selectEmoji(emoji) {
  const session = DB.session;
  const users   = DB.users;
  users[session.username].emoji = emoji;
  DB.saveUsers(users);
  closeEmojiModal();

  // Update whichever avatar is currently visible
  const dbAv = document.getElementById('db-avatar');
  if (dbAv) dbAv.textContent = emoji;
  const sendAv = document.getElementById('send-avatar');
  if (sendAv) sendAv.textContent = emoji;

  updateNavbar();
  toast('Profil emojisi yeniləndi ' + emoji, 'success');
}

// ---------- IMPRESSION WIZARD ----------
let _impTarget = null;
let _impStep   = 1;
let _impTraits = [];

function openImpressionWizard(username, user) {
  _impTarget = username;
  _impStep   = 1;
  _impTraits = [];

  document.getElementById('imp-wizard-avatar').textContent = userAvatar(user);
  document.getElementById('imp-wizard-name').textContent   = user.name;
  document.getElementById('imp-msg').value = '';

  const grid = document.getElementById('imp-traits');
  grid.innerHTML = TRAITS.map(t => `
    <button class="imp-trait-btn" data-key="${t.key}" onclick="toggleTrait('${t.key}', this)">
      <span class="imp-trait-emoji">${t.emoji}</span>
      <span class="imp-trait-label">${t.label}</span>
    </button>`).join('');

  impGoTo(1);
  document.getElementById('imp-wizard').style.display = 'flex';
}

function closeImpressionWizard() {
  document.getElementById('imp-wizard').style.display = 'none';
}

function toggleTrait(key, btn) {
  if (_impTraits.includes(key)) {
    _impTraits = _impTraits.filter(k => k !== key);
    btn.classList.remove('selected');
  } else {
    _impTraits.push(key);
    btn.classList.add('selected');
  }
}

function impGoTo(step) {
  _impStep = step;
  document.getElementById('imp-s1').style.display = step === 1 ? 'block' : 'none';
  document.getElementById('imp-s2').style.display = step === 2 ? 'block' : 'none';
  document.getElementById('imp-step-label').textContent = `ADDIM ${step} / 2`;
  document.getElementById('imp-step-fill').style.width  = step === 1 ? '50%' : '100%';
  document.getElementById('imp-next-btn').textContent   = step === 1 ? 'İrəli →' : '✓ Göndər';
  document.getElementById('imp-back-btn').style.display = step === 1 ? 'none' : 'inline-flex';
}

function impNext() {
  if (_impStep === 1) {
    impGoTo(2);
  } else {
    submitImpression();
  }
}

function impBack() {
  if (_impStep === 2) impGoTo(1);
}

function submitImpression() {
  const message = document.getElementById('imp-msg').value.trim();
  const imps    = DB.impressions;
  imps.push({
    id:        'imp_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    to:        _impTarget,
    traits:    _impTraits,
    message,
    createdAt: new Date().toISOString(),
  });
  DB.saveImpressions(imps);
  markImpSeen(_impTarget);
  closeImpressionWizard();
  renderCharReport('send-char-report', _impTarget);
  toast('Rəyiniz göndərildi! 🙏', 'success');
}

function skipImpression() {
  markImpSeen(_impTarget);
  closeImpressionWizard();
}

function markImpSeen(username) {
  const seen = DB.impSeen;
  seen[username] = true;
  DB.saveImpSeen(seen);
}

function renderCharReport(containerId, username) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const imps  = DB.impressions.filter(i => i.to === username);
  const total = imps.length;

  if (!total) {
    container.innerHTML = `
      <div class="char-empty">
        <div class="char-empty-icon">🌟</div>
        <p>Hələ rəy yoxdur</p>
      </div>`;
    return;
  }

  const counts = {};
  imps.forEach(imp => imp.traits.forEach(k => { counts[k] = (counts[k] || 0) + 1; }));
  const sorted  = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  const maxCnt  = sorted[0][1];
  const topKey  = sorted[0][0];
  const topT    = TRAITS.find(t => t.key === topKey) || { emoji: '⭐', label: topKey };
  const topPct  = Math.round(sorted[0][1] / total * 100);

  const bars = sorted.slice(0, 6).map(([key, cnt], i) => {
    const t   = TRAITS.find(t => t.key === key) || { emoji: '⭐', label: key };
    const pct = Math.round(cnt / total * 100);
    const w   = Math.round(cnt / maxCnt * 100);
    return `
      <div class="char-row">
        <span class="char-row-emoji">${t.emoji}</span>
        <span class="char-row-label">${t.label}</span>
        <div class="char-bar-track">
          <div class="char-bar-fill" style="width:${w}%;transition-delay:${i * 60}ms"></div>
        </div>
        <span class="char-row-count">${pct}%</span>
      </div>`;
  }).join('');

  const extraBadges = sorted.slice(6).map(([key]) => {
    const t = TRAITS.find(t => t.key === key) || { emoji: '⭐', label: key };
    return `<span class="char-extra-badge">${t.emoji} ${t.label}</span>`;
  }).join('');

  container.innerHTML = `
    <div class="char-report-wrap">
      <div class="char-hero">
        <div class="char-hero-emoji">${topT.emoji}</div>
        <div class="char-hero-body">
          <div class="char-hero-label">${topT.label}</div>
          <div class="char-hero-sub">Ən çox seçilən xüsusiyyət · ${topPct}%</div>
        </div>
        <div class="char-hero-badge">#1</div>
      </div>
      <div class="char-bars">${bars}</div>
      ${extraBadges ? `<div class="char-extras">${extraBadges}</div>` : ''}
      <div class="char-footer">
        <span class="char-footer-icon">👁</span>
        ${total} nəfər rəy bildirdi
      </div>
    </div>`;
}

function renderDashboardImpressions() {
  const session = DB.session;
  const imps    = DB.impressions
    .filter(i => i.to === session.username)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  renderCharReport('db-char-report', session.username);

  const list = document.getElementById('db-imp-list');
  if (!list) return;

  if (!imps.length) {
    list.innerHTML = `<div class="empty-state" style="padding:24px 0"><div class="empty-icon">⭐</div><p>Hələ rəy yoxdur.</p></div>`;
    return;
  }

  list.innerHTML = imps.map(imp => {
    const traitBadges = imp.traits.map(k => {
      const t = TRAITS.find(t => t.key === k) || { emoji: '⭐', label: k };
      return `<span class="imp-badge-small">${t.emoji} ${t.label}</span>`;
    }).join('');
    return `
      <div class="message-card">
        ${traitBadges ? `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:${imp.message ? 10 : 0}px">${traitBadges}</div>` : ''}
        ${imp.message ? `<div class="message-text">${escHtml(imp.message)}</div>` : ''}
        <div class="message-meta">
          <span class="message-time">🕐 ${timeAgo(imp.createdAt)}</span>
        </div>
      </div>`;
  }).join('');
}

// ---------- SABLONLAR ----------
function sablonSec(btn) {
  const textarea = document.getElementById('send-text');
  textarea.value = btn.textContent.trim();
  updateCharCount();
  textarea.focus();
  document.querySelectorAll('.sablon-dugmeler button').forEach(b => b.classList.remove('aktiv'));
  btn.classList.add('aktiv');
}

// ---------- SEND PAGE ----------
function loadSendPage(username) {
  const users = DB.users;
  const user  = users[username];

  document.getElementById('send-not-found').style.display = user ? 'none' : 'block';
  document.getElementById('send-form-area').style.display = user ? 'block' : 'none';

  if (!user) return;

  const joinedDate  = new Date(user.createdAt).toLocaleDateString('az-AZ', { year: 'numeric', month: 'long', day: 'numeric' });
  const joinedShort = new Date(user.createdAt).toLocaleDateString('az-AZ', { year: 'numeric', month: 'short' });

  // Cover
  document.getElementById('send-avatar').textContent    = userAvatar(user);
  const editOverlay = document.getElementById('cover-edit-overlay');
  const session = DB.session;
  if (editOverlay) editOverlay.style.display = (session && session.username === username) ? 'flex' : 'none';
  document.getElementById('send-name').textContent   = user.name;
  document.getElementById('send-handle').textContent = '@' + username;
  document.getElementById('send-joined').textContent = '📅 ' + joinedShort + ' tarixindən';

  // Sidebar
  document.getElementById('sidebar-name').textContent     = user.name;
  document.getElementById('sidebar-username').textContent = '@' + username;
  document.getElementById('sidebar-joined').textContent   = joinedDate;

  // Form
  document.getElementById('send-target').value = username;
  document.getElementById('send-text').value   = '';
  document.getElementById('send-charcount').textContent = '0 / 500';

  const isOwn = session && session.username === username;

  // Increment profile view count (not for own profile)
  if (!isOwn) {
    const views = DB.views;
    views[username] = (views[username] || 0) + 1;
    DB.saveViews(views);
  }

  const viewCount = DB.views[username] || 0;
  const viewEl = document.getElementById('sidebar-views');
  if (viewEl) viewEl.textContent = viewCount + ' baxış';

  renderCharReport('send-char-report', username);

  if (!isOwn && !DB.impSeen[username]) {
    openImpressionWizard(username, user);
  }
}

function updateCharCount() {
  const ta  = document.getElementById('send-text');
  const cnt = document.getElementById('send-charcount');
  const n   = ta.value.length;
  cnt.textContent = n + ' / 500';
  cnt.className = 'char-counter' + (n > 450 ? ' danger' : n > 350 ? ' warn' : '');
}

function sendMessage() {
  const to   = document.getElementById('send-target').value;
  const text = document.getElementById('send-text').value.trim();

  if (!text) { showError('send-err', 'Mesaj boş ola bilməz'); return; }
  if (text.length > 500) { showError('send-err', 'Mesaj 500 simvoldan çox ola bilməz'); return; }

  clearErrors();

  const messages = DB.messages;
  messages.push({
    id: 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
    to,
    text,
    read: false,
    createdAt: new Date().toISOString(),
  });
  DB.saveMessages(messages);

  document.getElementById('send-text').value = '';
  document.getElementById('send-charcount').textContent = '0 / 500';

  document.getElementById('send-form-area').style.display  = 'none';
  document.getElementById('send-success').style.display    = 'block';

  setTimeout(() => {
    document.getElementById('send-form-area').style.display = 'block';
    document.getElementById('send-success').style.display   = 'none';
  }, 3000);
}

// ---------- LEADERBOARD ----------
function renderLeaderboard() {
  const container = document.getElementById('leaderboard-container');
  if (!container) return;

  const users    = DB.users;
  const messages = DB.messages;

  const scores = Object.keys(users).map(username => {
    const msgCount  = messages.filter(m => m.to === username).length;
    const viewCount = DB.views[username] || 0;
    return { username, name: users[username].name, emoji: users[username].emoji, msgCount, viewCount };
  }).filter(u => u.msgCount > 0)
    .sort((a, b) => b.msgCount - a.msgCount)
    .slice(0, 10);

  if (!scores.length) {
    container.innerHTML = `<div class="empty-state" style="padding:24px 0"><div class="empty-icon">🏆</div><p>Hələ mesaj yoxdur.</p></div>`;
    return;
  }

  const medals = ['🥇', '🥈', '🥉'];
  container.innerHTML = scores.map((u, i) => `
    <div class="lb-row">
      <span class="lb-rank">${medals[i] || (i + 1)}</span>
      <span class="lb-avatar">${u.emoji || u.name[0].toUpperCase()}</span>
      <div class="lb-info">
        <span class="lb-name">${escHtml(u.name)}</span>
        <span class="lb-handle">@${escHtml(u.username)}</span>
      </div>
      <div class="lb-stats">
        <span class="lb-stat">💬 ${u.msgCount}</span>
        <span class="lb-stat">👁 ${u.viewCount}</span>
      </div>
      <a href="#u/${escHtml(u.username)}" class="btn btn-sm btn-outline">Profil</a>
    </div>`).join('');
}

// ---------- SEARCH ----------
function searchUsers(query) {
  const session = DB.session;
  const results = document.getElementById('search-results');
  const q = query.trim().toLowerCase();

  if (!q) {
    results.style.display = 'none';
    results.innerHTML = '';
    return;
  }

  const users = DB.users;
  const matches = Object.values(users).filter(u => {
    if (u.username === session.username) return false;
    return u.name.toLowerCase().includes(q) || u.username.includes(q);
  });

  results.style.display = 'block';

  if (!matches.length) {
    results.innerHTML = `
      <div class="search-empty">
        <span>😕</span> "<strong>${escHtml(query)}</strong>" üzrə nəticə tapılmadı
      </div>`;
    return;
  }

  results.innerHTML = matches.map(u => `
    <div class="search-user-card">
      <div class="search-avatar">${userAvatar(u)}</div>
      <div class="search-info">
        <div class="search-name">${escHtml(u.name)}</div>
        <div class="search-handle">@${escHtml(u.username)}</div>
      </div>
      <a href="#u/${escHtml(u.username)}" class="btn btn-primary btn-sm">
        📨 Mesaj göndər
      </a>
    </div>
  `).join('');
}

// ---------- SHARE ----------
function copyShareLink() {
  const link = document.getElementById('share-link').textContent;
  navigator.clipboard.writeText(link).then(() => toast('Link kopyalandı! 🔗', 'success'));
}

// ---------- UTILS ----------
function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
            .replace(/"/g,'&quot;').replace(/\n/g,'<br>');
}

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60)        return 'Az əvvəl';
  if (diff < 3600)      return Math.floor(diff/60) + ' dəq əvvəl';
  if (diff < 86400)     return Math.floor(diff/3600) + ' saat əvvəl';
  if (diff < 604800)    return Math.floor(diff/86400) + ' gün əvvəl';
  return new Date(iso).toLocaleDateString('az-AZ');
}

function showError(id, msg) {
  const el = document.getElementById(id);
  if (el) { el.textContent = msg; el.classList.add('show'); }
}

function clearErrors() {
  document.querySelectorAll('.form-error').forEach(e => e.classList.remove('show'));
}

function toast(msg, type = '') {
  const c = document.getElementById('toast-container');
  const t = document.createElement('div');
  t.className = 'toast ' + type;
  t.innerHTML = (type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️') + ' ' + msg;
  c.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

// Enter key support
document.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const active = document.querySelector('.page.active');
    if (active?.id === 'page-auth') {
      const activeTab = document.querySelector('.auth-tab.active')?.dataset.tab;
      if (activeTab === 'login')    login();
      if (activeTab === 'register') register();
    }
  }
});
