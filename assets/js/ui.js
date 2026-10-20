/* ==========================================================================
   Gen App demo — UI kit (Amplitude theme)
   Brand mark + wordmark (inline SVG), icon set, status bar, headers, tab bar, toast.
   ========================================================================== */
(function () {
  'use strict';

  var OOD = window.OOD;
  var esc = OOD.esc;
  var ui = OOD.ui = {};

  /* ------------------------------------------------------------ brand mark
     "Gen App" mark: a solid Amplitude-blue disc with a white peak-and-wave
     glyph (Amplitude-style). Square viewBox so the lockup aligns optically. */
  ui.logoMark = function (size, colour) {
    var h = size || 24;
    var c = colour || 'var(--ood-red)';
    return '<svg class="brand-mark" width="' + h + '" height="' + h + '" viewBox="0 0 100 100" ' +
      'fill="none" aria-hidden="true" focusable="false">' +
      '<circle cx="50" cy="50" r="50" fill="' + c + '"/>' +
      '<path d="M18 66 C30 66 36 60 42 44 C46 32 49 24 52 24 C55 24 58 34 62 50 C66 64 70 70 82 70" ' +
      'stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="M18 66 L82 66" stroke="#fff" stroke-width="8" stroke-linecap="round" opacity=".55"/>' +
      '</svg>';
  };

  /* -------------------------------------------------------------- wordmark
     "Gen App" set in the system sans, bold, tight tracking.                 */
  ui.logoWord = function (height, colour) {
    var h = height || 18;
    var w = Math.round(h * (370 / 100));
    var c = colour || 'var(--ink)';
    return '<svg class="brand-word" width="' + w + '" height="' + h + '" viewBox="0 0 370 100" ' +
      'role="img" aria-label="Gen App">' +
      '<text x="0" y="80" fill="' + c + '" font-family="-apple-system, BlinkMacSystemFont, ' +
      '&quot;Segoe UI&quot;, Roboto, Helvetica, Arial, sans-serif" font-size="92" ' +
      'font-weight="800" letter-spacing="-3">Gen App</text></svg>';
  };

  ui.brand = function (markSize, wordHeight) {
    return '<span class="brand">' + ui.logoMark(markSize || 22) +
           ui.logoWord(wordHeight || 17) + '</span>';
  };

  /* ------------------------------------------------------------------ icons
     Single-weight line icons, 24-unit grid, currentColor.                  */
  var P = {
    back: '<path d="M14.5 5.5 8 12l6.5 6.5"/>',
    chevR: '<path d="M9.5 5.5 16 12l-6.5 6.5"/>',
    chevD: '<path d="M5.5 9.5 12 16l6.5-6.5"/>',
    arrowR: '<path d="M4.5 12h14"/><path d="M13.5 6.5 19 12l-5.5 5.5"/>',
    arrowUpRight: '<path d="M7.5 16.5 16.5 7.5"/><path d="M9 7.5h7.5V15"/>',
    search: '<circle cx="11" cy="11" r="6.2"/><path d="M15.6 15.6 20 20"/>',
    bell: '<path d="M6.5 10a5.5 5.5 0 0 1 11 0c0 3 .7 4.4 1.5 5.4H5c.8-1 1.5-2.4 1.5-5.4Z"/>' +
          '<path d="M10 18.2a2.2 2.2 0 0 0 4 0"/>',
    chat: '<path d="M20 12.2c0 3.6-3.6 6.5-8 6.5-.9 0-1.8-.1-2.6-.35L5 20l1.1-3.1C4.8 15.7 4 14 4 12.2c0-3.6 3.6-6.5 8-6.5s8 2.9 8 6.5Z"/>' +
          '<circle cx="9" cy="12.2" r=".9" fill="currentColor" stroke="none"/>' +
          '<circle cx="12" cy="12.2" r=".9" fill="currentColor" stroke="none"/>' +
          '<circle cx="15" cy="12.2" r=".9" fill="currentColor" stroke="none"/>',
    data: '<path d="M8 19V7"/><path d="M4.8 10.2 8 6.6l3.2 3.6"/>' +
          '<path d="M16 5v12"/><path d="M12.8 13.8 16 17.4l3.2-3.6"/>',
    call: '<path d="M6.3 4.8h3l1.4 3.4-1.9 1.4a10.6 10.6 0 0 0 5.6 5.6l1.4-1.9 3.4 1.4v3a1.6 1.6 0 0 1-1.8 1.6A14.4 14.4 0 0 1 4.7 6.6a1.6 1.6 0 0 1 1.6-1.8Z"/>',
    sms: '<rect x="3.8" y="5.5" width="16.4" height="11.5" rx="2.4"/><path d="M4.6 7.2 12 12l7.4-4.8"/>',
    home: '<path d="M4.2 10.6 12 4.5l7.8 6.1V19a.9.9 0 0 1-.9.9h-3.6v-5.2H8.7V20H5.1a.9.9 0 0 1-.9-.9Z"/>',
    plans: '<path d="M12 3.8 20.2 8 12 12.2 3.8 8Z"/><path d="M3.8 12 12 16.2 20.2 12"/>' +
           '<path d="M3.8 16 12 20.2 20.2 16"/>',
    gift: '<rect x="3.8" y="9" width="16.4" height="11" rx="2"/><path d="M3.8 13.2h16.4"/>' +
          '<path d="M12 9v11"/><path d="M12 9S10.8 5 8.4 5a2.2 2.2 0 0 0 0 4Z"/>' +
          '<path d="M12 9s1.2-4 3.6-4a2.2 2.2 0 0 1 0 4Z"/>',
    bill: '<path d="M6 3.8h12v16.4l-2.4-1.6-2.4 1.6-2.4-1.6-2.4 1.6L6 20.2Z"/>' +
          '<path d="M9 8.4h6"/><path d="M9 12h6"/>',
    person: '<circle cx="12" cy="8.4" r="3.6"/><path d="M5 20c.6-3.6 3.5-5.6 7-5.6s6.4 2 7 5.6"/>',
    help: '<circle cx="12" cy="12" r="8.2"/>' +
          '<path d="M9.7 9.6a2.4 2.4 0 1 1 3.3 2.2c-.7.3-1 .9-1 1.6v.3"/>' +
          '<circle cx="12" cy="16.6" r=".95" fill="currentColor" stroke="none"/>',
    info: '<circle cx="12" cy="12" r="8.2"/><path d="M12 11v5.4"/>' +
          '<circle cx="12" cy="8" r=".95" fill="currentColor" stroke="none"/>',
    bookmark: '<path d="M6.5 4.2h11v15.6L12 16.2l-5.5 3.6Z"/>',
    bookmarkFill: '<path d="M6.5 4.2h11v15.6L12 16.2l-5.5 3.6Z" fill="currentColor"/>',
    check: '<path d="M5.5 12.6 10 17l8.5-9.5"/>',
    tick: '<path d="M4.8 12.4 9 16.6l10-10.8"/>',
    plus: '<path d="M12 5.5v13"/><path d="M5.5 12h13"/>',
    sim: '<path d="M6 3.8h7.5L18 8.3V20.2H6Z"/><rect x="9" y="12" width="6" height="5"/>',
    shield: '<path d="M12 3.6 19 6v5.6c0 4-2.9 7.3-7 8.8-4.1-1.5-7-4.8-7-8.8V6Z"/>' +
            '<path d="M9 12.2 11.3 14.5 15.4 10"/>',
    roam: '<circle cx="12" cy="12" r="8.2"/><path d="M3.8 12h16.4"/>' +
          '<path d="M12 3.8c2.6 2.4 3.9 5.2 3.9 8.2S14.6 17.8 12 20.2c-2.6-2.4-3.9-5.2-3.9-8.2S9.4 6.2 12 3.8Z"/>',
    tv: '<rect x="3.6" y="5.4" width="16.8" height="11.4" rx="2"/><path d="M8.5 20.2h7"/>',
    speed: '<path d="M4.4 16.6a8.2 8.2 0 1 1 15.2 0"/><path d="M12 12.6 15.6 9"/>' +
           '<circle cx="12" cy="13.4" r="1.1" fill="currentColor" stroke="none"/>',
    star: '<path d="M12 4.6l2.3 4.8 5.3.7-3.9 3.7.95 5.2L12 16.6l-4.65 2.4.95-5.2L4.4 10.1l5.3-.7Z"/>',
    logout: '<path d="M14.5 6.2V4.6H5.6v14.8h8.9v-1.6"/><path d="M10 12h9.4"/>' +
            '<path d="M16.6 8.8 19.8 12l-3.2 3.2"/>',
    globe: '<circle cx="12" cy="12" r="8.2"/><path d="M3.8 12h16.4"/>' +
           '<path d="M12 3.8c2.2 2.6 3.3 5.4 3.3 8.2s-1.1 5.6-3.3 8.2c-2.2-2.6-3.3-5.4-3.3-8.2S9.8 6.4 12 3.8Z"/>',
    clock: '<circle cx="12" cy="12" r="8.2"/><path d="M12 7.4V12l3.4 2"/>',
    wallet: '<rect x="3.6" y="6.4" width="16.8" height="11.2" rx="2.4"/>' +
            '<path d="M3.6 10.4h16.8"/><circle cx="16.4" cy="14" r="1.1" fill="currentColor" stroke="none"/>'
  };

  ui.icon = function (name, size, sw) {
    var body = P[name] || P.info;
    var s = size || 22;
    return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="' + (sw || 1.7) + '" stroke-linecap="round" ' +
      'stroke-linejoin="round" aria-hidden="true" focusable="false">' + body + '</svg>';
  };

  /* -------------------------------------------------------------- statusbar */
  ui.paintStatusBar = function () {
    var el = document.getElementById('sb-right');
    if (!el) return;
    el.innerHTML =
      /* signal */
      '<svg width="17" height="12" viewBox="0 0 17 12" fill="currentColor" aria-hidden="true">' +
      '<rect x="0" y="8" width="3" height="4" rx="1"/><rect x="4.6" y="5.6" width="3" height="6.4" rx="1"/>' +
      '<rect x="9.2" y="3" width="3" height="9" rx="1"/><rect x="13.8" y="0.4" width="3" height="11.6" rx="1"/></svg>' +
      /* wifi */
      '<svg width="15" height="12" viewBox="0 0 15 12" fill="none" stroke="currentColor" ' +
      'stroke-width="1.5" stroke-linecap="round" aria-hidden="true">' +
      '<path d="M1 4.4a9.3 9.3 0 0 1 13 0"/><path d="M3.4 7a5.9 5.9 0 0 1 8.2 0"/>' +
      '<circle cx="7.5" cy="9.9" r="1" fill="currentColor" stroke="none"/></svg>' +
      /* battery */
      '<svg width="25" height="12" viewBox="0 0 25 12" fill="none" aria-hidden="true">' +
      '<rect x="0.6" y="0.6" width="21" height="10.8" rx="3" stroke="currentColor" ' +
      'stroke-opacity=".45" stroke-width="1.1"/>' +
      '<rect x="2.2" y="2.2" width="15.4" height="7.6" rx="2" fill="currentColor"/>' +
      '<path d="M23.4 4.2v3.6a2 2 0 0 0 0-3.6Z" fill="currentColor" fill-opacity=".45"/></svg>';
  };

  /* ----------------------------------------------------------- app headers */

  /* Home header: brand lockup, chat/bell/search actions, greeting row —
     laid out as in the real app. */
  ui.homeHeader = function () {
    var s = OOD.state;
    var name = s.user ? s.user.name.charAt(0).toUpperCase() + s.user.name.slice(1) : 'guest';
    return '' +
      '<header class="app-header">' +
        '<div class="app-header-top">' +
          ui.brand(22, 17) +
          /* every header control navigates somewhere real — an inert control
             would manufacture dead/rage clicks that are not the story */
          '<div class="hdr-actions">' +
            '<button class="icon-btn" data-act="go" data-route="/help" aria-label="Chat with us">' +
              ui.icon('chat', 22) + '</button>' +
            '<button class="icon-btn" data-act="go" data-route="/search" aria-label="Search plans">' +
              ui.icon('search', 21) + '</button>' +
            '<button class="icon-btn" data-act="notifications" aria-label="Notifications">' +
              ui.icon('bell', 21) + '<span class="dot"></span></button>' +
          '</div>' +
        '</div>' +
        '<div class="greeting">' +
          ui.logoMark(15) +
          '<span class="hello">Hello, <b>' + esc(name) + '</b> &#128075;</span>' +
          '<span class="chev">' + ui.icon('chevD', 20) + '</span>' +
        '</div>' +
      '</header>';
  };

  /* Inner page header: back arrow + centred title (+ optional right slot). */
  ui.pageHeader = function (title, rightSlotHtml) {
    return '' +
      '<header class="page-header">' +
        '<button class="back" data-act="back" aria-label="Back">' + ui.icon('back', 22) + '</button>' +
        '<h1>' + esc(title) + '</h1>' +
        '<span class="hdr-slot">' + (rightSlotHtml || '') + '</span>' +
      '</header>';
  };

  /* ---------------------------------------------------------------- tab bar */

  var TABS = [
    { key: 'home',   label: 'Home',   icon: 'home',   route: '/' },
    { key: 'plans',  label: 'Plans',  icon: 'plans',  route: '/plans' },
    { key: 'nojoom', label: 'Nojoom', icon: 'gift',   route: '/nojoom', centre: true },
    { key: 'bill',   label: 'Bill',   icon: 'bill',   route: '/bill' },
    { key: 'more',   label: 'More',   icon: 'person', route: '/more' }
  ];

  ui.activeTab = function (route) {
    if (route === '/' || route === '/usage' || route === '/usage/breakdown') return 'home';
    if (route === '/nojoom') return 'nojoom';
    if (route === '/bill') return 'bill';
    if (route === '/more' || route === '/help') return 'more';
    if (route === '/search' || route.indexOf('/plans') === 0) return 'plans';
    return 'home';
  };

  ui.paintTabbar = function (route) {
    var el = document.getElementById('tabbar');
    if (!el) return;
    if (route === '/login') { el.className = 'tabbar hidden'; el.innerHTML = ''; return; }
    el.className = 'tabbar';
    var active = ui.activeTab(route);
    var html = '';
    for (var i = 0; i < TABS.length; i++) {
      var t = TABS[i];
      html += '<button class="tab' + (t.centre ? ' centre' : '') + '" data-tab="' + t.key +
        '" data-route="' + t.route + '"' + (active === t.key ? ' aria-current="page"' : '') + '>' +
        '<span class="t-ico">' + ui.icon(t.icon, t.centre ? 21 : 22) + '</span>' +
        '<span>' + t.label + '</span></button>';
    }
    el.innerHTML = html;
  };

  /* ------------------------------------------------------------------ toast */
  ui.toast = function (msg) {
    var host = document.getElementById('phone');
    if (!host) return;
    var old = host.querySelector('.toast');
    if (old) old.parentNode.removeChild(old);
    var el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    host.appendChild(el);
    setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 2200);
  };

  /* --------------------------------------------------------------- fragments */

  ui.supportStrip = function () {
    return '' +
      '<div class="support-strip">' +
        '<span class="icon-tile">' + ui.icon('call', 20) + '</span>' +
        '<span class="txt"><div class="t1">Need help with your plan?</div>' +
        '<div class="t2">Call Ooredoo Care, free from your mobile</div></span>' +
        '<span class="num">111</span>' +
      '</div>';
  };

  ui.nojoomRibbon = function (persona) {
    return '<div class="nojoom-ribbon">You are a <b>Nojoom ' + esc(persona.nojoom_label) +
           '</b> member &nbsp;&#183;&nbsp; ' + Number(persona.nojoom_points).toLocaleString('en-US') +
           ' points</div>';
  };

  ui.simPill = function (persona) {
    return '' +
      '<div class="sim-pill">' +
        '<span class="icon-tile" style="width:30px;height:30px;border-radius:9px">' + ui.icon('sim', 17) + '</span>' +
        '<span class="msisdn">' + esc(persona.msisdn) + '</span>' +
        '<span class="kind">Voice</span>' +
        '<span class="edge">5G</span>' +
      '</div>';
  };

  /* The control under test. The class is kept ALONE on the element so the
     autocapture element selector resolves to exactly
     "button.usage-breakdown-toggle", and the label text is fixed. */
  ui.breakdownToggle = function () {
    return '<button class="usage-breakdown-toggle">See what&#39;s using your data</button>';
  };

  ui.planCard = function (plan, opts) {
    var o = opts || {};
    var isCurrent = !!o.current;
    var shortlisted = OOD.state.shortlist.indexOf(plan.id) >= 0;
    var html = '<article class="plan-card' + (o.reco ? ' reco' : '') + '" data-plan="' + plan.id + '">';
    if (o.ribbon) html += '<span class="ribbon">' + esc(o.ribbon) + '</span>';
    html += '<div class="pc-top">' +
        '<div><div class="pc-name">' + esc(plan.name) + '</div>' +
        '<div class="pc-family">' + esc(plan.family_label) + '</div></div>' +
        '<div class="pc-price"><span class="amt">' + OOD.qar(plan.qar, 0) + '</span>' +
        '<span class="per">per month</span></div>' +
      '</div>' +
      '<div class="pc-gb">' + esc(plan.gb_copy) + '</div>';
    if (o.recoLine) {
      html += '<div class="reco-line">' + o.recoLine + '</div>';
    }
    if (isCurrent) {
      html += '<div class="current-tag">This is your current plan</div>';
    } else {
      html += '<div class="pc-actions">' +
          '<button class="btn btn-primary btn-sm" data-act="plan-detail" data-plan="' + plan.id + '">' +
            'Choose plan</button>' +
          /* the standalone showcase page fires no taxonomy events, so it gets
             no shortlist control */
          (o.noShortlist ? '' :
            '<button class="bookmark" data-act="shortlist" data-plan="' + plan.id + '" ' +
            'aria-pressed="' + (shortlisted ? 'true' : 'false') + '" aria-label="Shortlist ' +
            esc(plan.name) + '">' + ui.icon(shortlisted ? 'bookmarkFill' : 'bookmark', 19) + '</button>') +
        '</div>';
    }
    html += '</article>';
    return html;
  };

  ui.appUsageList = function (rows, total) {
    var max = rows.reduce(function (m, r) { return Math.max(m, r.gb); }, 0);
    var html = '<div class="card">';
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      html += '<div class="app-usage-row">' +
        '<span class="glyph" style="background:' + r.colour + '">' + esc(r.initial) + '</span>' +
        '<span style="flex:1 1 auto;min-width:0">' +
          '<span class="nm">' + esc(r.app) + '</span>' +
          '<span class="mini-bar"><i style="width:' + Math.max(4, Math.round(r.gb / max * 100)) + '%"></i></span>' +
        '</span>' +
        '<span class="gb">' + OOD.num(r.gb, 1) + '<small>GB</small></span>' +
      '</div>';
    }
    html += '</div>';
    if (total) {
      html += '<p class="kv-note" style="margin-top:10px">Total metered this cycle: <b>' +
              OOD.num(total, 1) + ' GB</b>. App-level figures are measured on device and may differ ' +
              'slightly from network-metered totals.</p>';
    }
    return html;
  };
})();
