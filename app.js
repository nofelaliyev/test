// ========================
//  SirSual — Core App Logic
// ========================

const DB = {
  get users()    { return JSON.parse(localStorage.getItem('ss_users') || '{}'); },
  get messages() { return JSON.parse(localStorage.getItem('ss_messages') || '[]'); },
  get session()  { return JSON.parse(localStorage.getItem('ss_session') || 'null'); },
  get polls()    { return JSON.parse(localStorage.getItem('ss_polls') || '[]'); },
  get voted()    { return JSON.parse(localStorage.getItem('ss_voted') || '{}'); },

  saveUsers(u)    { localStorage.setItem('ss_users', JSON.stringify(u)); },
  saveMessages(m) { localStorage.setItem('ss_messages', JSON.stringify(m)); },
  saveSession(s)  { localStorage.setItem('ss_session', JSON.stringify(s)); },
  clearSession()  { localStorage.removeItem('ss_session'); },
  savePolls(p)    { localStorage.setItem('ss_polls', JSON.stringify(p)); },
  saveVoted(v)    { localStorage.setItem('ss_voted', JSON.stringify(v)); },
};

// ---------- ROUTER ----------
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}

function route() {
  const hash = location.hash.replace('#', '') || '';
  const session = DB.session;

  if (hash.startsWith('u/')) {
    const username = hash.slice(2);
    loadSendPage(username);
    showPage('page-send');
    return;
  }

  if (session) {
    loadDashboard();
    showPage('page-dashboard');
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
  toast('Qeydiyyat uğurlu oldu! Xoş gəldiniz 🎉', 'success');
  location.hash = '';
  route();
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
  toast('Xoş gəldiniz, ' + users[username].name + '!', 'success');
  location.hash = '';
  route();
}

function logout() {
  DB.clearSession();
  toast('Çıxış edildi');
  location.hash = '';
  route();
}

// ---------- DASHBOARD ----------
function loadDashboard() {
  const session  = DB.session;
  const messages = DB.messages.filter(m => m.to === session.username);
  const unread   = messages.filter(m => !m.read);
  const total    = messages.length;

  document.getElementById('nav-username').textContent = session.name;
  document.getElementById('nav-avatar').textContent   = session.name[0].toUpperCase();
  document.getElementById('db-greeting').textContent  = 'Salam, ' + session.name + '! 👋';

  document.getElementById('stat-total').textContent   = total;
  document.getElementById('stat-unread').textContent  = unread.length;
  document.getElementById('stat-today').textContent   = todayCount(messages);

  const link = location.origin + location.pathname + '#u/' + session.username;
  document.getElementById('share-link').textContent = link;

  const si = document.getElementById('search-input');
  const sr = document.getElementById('search-results');
  if (si) si.value = '';
  if (sr) { sr.style.display = 'none'; sr.innerHTML = ''; }

  renderPolls();
  renderMessages('all');
  updateBadge(unread.length);
}

function todayCount(msgs) {
  const today = new Date().toDateString();
  return msgs.filter(m => new Date(m.createdAt).toDateString() === today).length;
}

function updateBadge(n) {
  const badge = document.getElementById('unread-badge');
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
  document.getElementById('modal-delete').classList.add('open');
}

function closeDeleteModal() {
  deleteTargetId = null;
  document.getElementById('modal-delete').classList.remove('open');
}

function deleteMessage() {
  if (!deleteTargetId) return;
  const messages = DB.messages.filter(m => m.id !== deleteTargetId);
  DB.saveMessages(messages);
  closeDeleteModal();
  loadDashboard();
  toast('Mesaj silindi');
}

// ---------- POLLS — DASHBOARD ----------
function renderPolls() {
  const session = DB.session;
  const polls   = DB.polls.filter(p => p.owner === session.username)
                          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const container = document.getElementById('polls-container');
  if (!container) return;

  if (!polls.length) {
    container.innerHTML = `
      <div class="empty-state" style="padding:32px 20px">
        <div class="empty-icon">📊</div>
        <p>Hələ anket yoxdur.<br>Yeni anket yarat, dostların səs versin!</p>
      </div>`;
    return;
  }

  container.innerHTML = polls.map(poll => {
    const total = Object.values(poll.votes).reduce((s, v) => s + v, 0);
    const optHtml = poll.options.map(opt => {
      const v   = poll.votes[opt.id] || 0;
      const pct = total ? Math.round(v / total * 100) : 0;
      return `
        <div class="poll-result-row">
          <div class="poll-result-label">
            <span>${escHtml(opt.text)}</span>
            <span class="poll-result-count">${v} səs · ${pct}%</span>
          </div>
          <div class="poll-bar-track">
            <div class="poll-bar-fill" style="width:${pct}%"></div>
          </div>
        </div>`;
    }).join('');

    return `
      <div class="poll-card">
        <div class="poll-card-header">
          <span class="poll-question">${escHtml(poll.question)}</span>
          <button class="btn btn-sm btn-ghost" onclick="confirmDeletePoll('${poll.id}')">Sil</button>
        </div>
        ${optHtml}
        <div class="poll-footer">📊 Cəmi ${total} səs · ${timeAgo(poll.createdAt)}</div>
      </div>`;
  }).join('');
}

function openPollModal() {
  document.getElementById('poll-question').value = '';
  renderOptionInputs(['', '']);
  document.getElementById('modal-poll').classList.add('open');
  document.getElementById('poll-question').focus();
}

function closePollModal() {
  document.getElementById('modal-poll').classList.remove('open');
}

let _pollOptions = ['', ''];

function renderOptionInputs(opts) {
  _pollOptions = opts.slice();
  const c = document.getElementById('poll-options-list');
  c.innerHTML = _pollOptions.map((v, i) => `
    <div class="poll-option-row">
      <input
        type="text"
        class="poll-option-input"
        placeholder="Seçim ${i + 1}"
        value="${escHtml(v)}"
        oninput="_pollOptions[${i}] = this.value"
        maxlength="80"
      >
      ${_pollOptions.length > 2
        ? `<button class="poll-option-remove" onclick="removeOption(${i})" title="Sil">✕</button>`
        : ''}
    </div>`).join('');
}

function addOption() {
  if (_pollOptions.length >= 5) return;
  _pollOptions.push('');
  renderOptionInputs(_pollOptions);
  const inputs = document.querySelectorAll('.poll-option-input');
  inputs[inputs.length - 1].focus();
}

function removeOption(i) {
  _pollOptions.splice(i, 1);
  renderOptionInputs(_pollOptions);
}

function createPoll() {
  const question = document.getElementById('poll-question').value.trim();
  const opts     = _pollOptions.map(o => o.trim()).filter(Boolean);

  if (!question) { toast('Sual daxil edin', 'error'); return; }
  if (opts.length < 2) { toast('Ən azı 2 seçim lazımdır', 'error'); return; }

  const session = DB.session;
  const polls   = DB.polls;
  const newPoll = {
    id: 'poll_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    owner: session.username,
    question,
    options: opts.map((text, i) => ({ id: 'opt_' + i, text })),
    votes: {},
    createdAt: new Date().toISOString(),
  };
  polls.push(newPoll);
  DB.savePolls(polls);
  closePollModal();
  renderPolls();
  toast('Anket yaradıldı! 🗳️', 'success');
}

let _deletePollId = null;

function confirmDeletePoll(id) {
  _deletePollId = id;
  document.getElementById('modal-delete-poll').classList.add('open');
}

function closeDeletePollModal() {
  _deletePollId = null;
  document.getElementById('modal-delete-poll').classList.remove('open');
}

function deletePoll() {
  if (!_deletePollId) return;
  DB.savePolls(DB.polls.filter(p => p.id !== _deletePollId));
  closeDeletePollModal();
  renderPolls();
  toast('Anket silindi');
}

// ---------- POLLS — SEND PAGE ----------
function renderSendPolls(username) {
  const polls = DB.polls.filter(p => p.owner === username)
                        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const container = document.getElementById('send-polls');
  if (!container) return;
  if (!polls.length) { container.style.display = 'none'; return; }

  container.style.display = 'block';
  container.innerHTML = polls.map(poll => {
    const voted   = DB.voted[poll.id];
    const total   = Object.values(poll.votes).reduce((s, v) => s + v, 0);

    if (voted) {
      return renderPollResults(poll, total, voted);
    }

    const optHtml = poll.options.map(opt => `
      <label class="vote-option">
        <input type="radio" name="vote_${poll.id}" value="${opt.id}">
        <span class="vote-option-text">${escHtml(opt.text)}</span>
      </label>`).join('');

    return `
      <div class="poll-card" id="poll-card-${poll.id}">
        <div class="poll-question" style="margin-bottom:12px">${escHtml(poll.question)}</div>
        <div class="vote-options">${optHtml}</div>
        <button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="castVote('${poll.id}')">
          🗳️ Səs ver
        </button>
        <div class="poll-footer">${total} səs</div>
      </div>`;
  }).join('');
}

function renderPollResults(poll, total, votedOptId) {
  const optHtml = poll.options.map(opt => {
    const v   = poll.votes[opt.id] || 0;
    const pct = total ? Math.round(v / total * 100) : 0;
    const isVoted = opt.id === votedOptId;
    return `
      <div class="poll-result-row${isVoted ? ' voted' : ''}">
        <div class="poll-result-label">
          <span>${escHtml(opt.text)}${isVoted ? ' ✓' : ''}</span>
          <span class="poll-result-count">${v} · ${pct}%</span>
        </div>
        <div class="poll-bar-track">
          <div class="poll-bar-fill${isVoted ? ' voted' : ''}" style="width:${pct}%"></div>
        </div>
      </div>`;
  }).join('');
  return `
    <div class="poll-card" id="poll-card-${poll.id}">
      <div class="poll-question" style="margin-bottom:12px">${escHtml(poll.question)}</div>
      ${optHtml}
      <div class="poll-footer">📊 ${total} səs</div>
    </div>`;
}

function castVote(pollId) {
  const selected = document.querySelector(`input[name="vote_${pollId}"]:checked`);
  if (!selected) { toast('Bir seçim seçin', 'error'); return; }

  const optId  = selected.value;
  const polls  = DB.polls;
  const poll   = polls.find(p => p.id === pollId);
  if (!poll) return;

  poll.votes[optId] = (poll.votes[optId] || 0) + 1;
  DB.savePolls(polls);

  const voted = DB.voted;
  voted[pollId] = optId;
  DB.saveVoted(voted);

  const total = Object.values(poll.votes).reduce((s, v) => s + v, 0);
  const card  = document.getElementById('poll-card-' + pollId);
  if (card) card.outerHTML = renderPollResults(poll, total, optId);

  toast('Səsiniz qeydə alındı! 🗳️', 'success');
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

  document.getElementById('send-avatar').textContent = user.name[0].toUpperCase();
  document.getElementById('send-name').textContent   = user.name;
  document.getElementById('send-handle').textContent = '@' + username;
  document.getElementById('send-target').value = username;
  document.getElementById('send-text').value   = '';
  document.getElementById('send-charcount').textContent = '0 / 500';
  renderSendPolls(username);
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
      <div class="search-avatar">${u.name[0].toUpperCase()}</div>
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
