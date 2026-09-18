/* ==========================================================================
   Ooredoo Qatar demo — core
   Config, personas, plans catalog, state, storage, router.
   Loaded first; everything else hangs off window.OOD.
   ========================================================================== */
(function () {
  'use strict';

  var OOD = window.OOD = window.OOD || {};

  /* ---------------------------------------------------------------- config */

  OOD.CONFIG = {
    AMP_KEY: '0d135cb349890f3715863642f065bcbd',
    FLAG_KEY: 'usage-breakdown-tap-unresponsive-reduction',

    /* Amplitude Experiment deployment key. The unified loader with
       fetchRemoteConfig:true is expected to supply an initialised client; this
       constant is only used for the explicit-init fallback path. Left empty by
       design — see README. */
    EXPERIMENT_DEPLOYMENT_KEY: '',

    /* Page-view properties are canonicalised to the production origin so that
       demo data is identical whether the app is opened on GitHub Pages or from
       a local mirror. */
    CANON_DOMAIN: 'khaledismail-sandbox.github.io',
    CANON_ORIGIN: 'https://khaledismail-sandbox.github.io',
    CANON_BASE: '/ooredoo-demo',

    COUNTRY: 'Qatar',
    CURRENCY: 'QAR',
    SUPPORT_LINE: '111',
    PROMO_CODE: 'OOREDOO10',
    PROMO_PCT: 10,
    BASE: window.__BASE__ || ''
  };

  var BASE = OOD.CONFIG.BASE;

  /* --------------------------------------------------------------- storage */

  OOD.today = function () {
    return new Date().toISOString().split('T')[0].replace(/-/g, '');
  };

  var LS = {
    session: 'ooredoo_demo_session_' + OOD.today(),
    persona: 'ooredoo_demo_persona_toggle',
    variant: 'ooredoo_demo_variant_override',
    shortlist: 'ooredoo_demo_shortlist',
    upgrades: 'ooredoo_demo_upgrades_',
    seen: 'ooredoo_demo_seen_'
  };
  OOD.LS = LS;

  OOD.store = {
    get: function (k, fallback) {
      try {
        var v = localStorage.getItem(k);
        return v === null ? fallback : v;
      } catch (e) { return fallback; }
    },
    set: function (k, v) {
      try { localStorage.setItem(k, v); } catch (e) { /* private mode */ }
    },
    del: function (k) {
      try { localStorage.removeItem(k); } catch (e) { /* private mode */ }
    },
    getJSON: function (k, fallback) {
      try {
        var v = localStorage.getItem(k);
        return v ? JSON.parse(v) : fallback;
      } catch (e) { return fallback; }
    },
    setJSON: function (k, v) { OOD.store.set(k, JSON.stringify(v)); }
  };

  /* -------------------------------------------------------------- personas
     Two personas. The hidden footer toggle on /login decides which one the
     NEXT login resolves to. Toggle off (default) => Persona B, the demo
     default: "Quota-Blind Legacy Postpaid".                               */

  OOD.PERSONAS = {
    /* Persona A — "Insight-Enabled Upgrader" (toggle ON) */
    A: {
      key: 'A',
      /* user properties set via identify() immediately after setUserId */
      userProps: {
        usage_insights_enabled: true,
        plan_generation: 'current',
        nojoom_tier: 'nojoom_gold',
        account_age_days: 520,
        device_type: 'mobile'
      },
      /* hardcoded consumption profile */
      avg_monthly_gb: 24,
      months_over_quota: 0,
      overage_charge_qar: 0,
      quota_exceeded: false,
      current_plan_name: 'Shahry 40 GB',
      current_plan_id: 'shahry_40',
      current_plan_gb: 40,
      current_plan_qar: 175,
      /* display-only extras */
      nojoom_points: 12450,
      nojoom_label: 'Gold',
      voice_units_used: 412,
      voice_units_total: 800,
      msisdn: '3355 7104'
    },

    /* Persona B — "Quota-Blind Legacy Postpaid" (toggle OFF, the default) */
    B: {
      key: 'B',
      userProps: {
        usage_insights_enabled: false,
        plan_generation: 'legacy',
        nojoom_tier: 'nojoom_basic',
        account_age_days: 410,
        device_type: 'mobile'
      },
      avg_monthly_gb: 38,
      months_over_quota: 2,
      overage_charge_qar: 45,
      quota_exceeded: true,
      current_plan_name: 'Shahry Legacy 30 GB',
      current_plan_id: 'shahry_legacy_30',
      current_plan_gb: 30,
      current_plan_qar: 175,
      nojoom_points: 3180,
      nojoom_label: 'Basic',
      voice_units_used: 297,
      voice_units_total: 500,
      msisdn: '3312 4498'
    }
  };

  /* ------------------------------------------------------------ plans data
     Six postpaid plans across five families, QAR 125–450. Card copy on
     /plans describes plans in GB ONLY — that opacity is the point of the
     story; the consumption-based recommendation only appears in the
     experiment's treatment arm (and on the standalone /plans/recommended). */

  OOD.PLANS = [
    {
      id: 'data_add_on_20',
      name: 'Shahry Data Add-On 20 GB',
      family: 'data_add_on',
      family_label: 'Data Add-On',
      gb: 20,
      qar: 125,
      gb_copy: '20 GB local data per month.',
      minutes: 'Unlimited Ooredoo-to-Ooredoo minutes',
      inclusions: [
        '20 GB local data, renews monthly',
        'Unlimited Ooredoo-to-Ooredoo minutes',
        '300 local flexible minutes + 300 SMS',
        'Nojoom points on every bill'
      ]
    },
    {
      id: 'shahry_40',
      name: 'Shahry 40 GB',
      family: 'shahry_postpaid',
      family_label: 'Shahry',
      gb: 40,
      qar: 175,
      gb_copy: '40 GB local data per month.',
      minutes: '800 local flexible minutes',
      inclusions: [
        '40 GB local data, renews monthly',
        '800 local flexible minutes + 500 SMS',
        'Unlimited Ooredoo-to-Ooredoo minutes',
        'Ooredoo TV Lite included',
        'Nojoom points on every bill'
      ]
    },
    {
      id: 'shahry_60',
      name: 'Shahry 60 GB',
      family: 'shahry_postpaid',
      family_label: 'Shahry',
      gb: 60,
      qar: 220,
      gb_copy: '60 GB local data per month.',
      minutes: '1,200 local flexible minutes',
      inclusions: [
        '60 GB local data, renews monthly',
        '1,200 local flexible minutes + 1,000 SMS',
        'Unlimited Ooredoo-to-Ooredoo minutes',
        '5 GB GCC roaming data',
        'Ooredoo TV Lite included',
        'Double Nojoom points for 6 months'
      ]
    },
    {
      id: 'qatarna_plus_100',
      name: 'Qatarna+ 100 GB',
      family: 'qatarna_plus',
      family_label: 'Qatarna+',
      gb: 100,
      qar: 300,
      gb_copy: '100 GB local data per month.',
      minutes: 'Unlimited local minutes',
      inclusions: [
        '100 GB local data, renews monthly',
        'Unlimited local minutes + unlimited SMS',
        '10 GB GCC roaming data',
        '200 international minutes',
        'Ooredoo TV Standard included',
        'Priority Nojoom tier progress'
      ]
    },
    {
      id: 'home_plus_250',
      name: 'Shahry Home+ 250 GB Bundle',
      family: 'home_plus_bundle',
      family_label: 'Home+',
      gb: 250,
      qar: 380,
      gb_copy: '250 GB shared between mobile and Ooredoo Fibre.',
      minutes: 'Unlimited local minutes',
      inclusions: [
        '250 GB shared mobile + Ooredoo Fibre data',
        'Unlimited local minutes + unlimited SMS',
        'Ooredoo Fibre 300 Mbps at home',
        'Ooredoo TV Entertainment included',
        '15 GB GCC roaming data'
      ]
    },
    {
      id: 'family_share_300',
      name: 'Shahry Family Share 300 GB',
      family: 'family_share',
      family_label: 'Family Share',
      gb: 300,
      qar: 450,
      gb_copy: '300 GB shared across up to 5 SIMs.',
      minutes: 'Unlimited local minutes on all SIMs',
      inclusions: [
        '300 GB shared across up to 5 SIMs',
        'Unlimited local minutes + SMS on every SIM',
        '4 extra SIMs at no monthly charge',
        '20 GB GCC roaming data pooled',
        'Ooredoo TV Entertainment included',
        'Family Nojoom points pooling'
      ]
    }
  ];

  OOD.FAMILIES = [
    { key: 'all', label: 'All plans' },
    { key: 'shahry_postpaid', label: 'Shahry' },
    { key: 'qatarna_plus', label: 'Qatarna+' },
    { key: 'data_add_on', label: 'Data Add-On' },
    { key: 'home_plus_bundle', label: 'Home+' },
    { key: 'family_share', label: 'Family Share' }
  ];

  OOD.planById = function (id) {
    for (var i = 0; i < OOD.PLANS.length; i++) {
      if (OOD.PLANS[i].id === id) return OOD.PLANS[i];
    }
    return null;
  };

  /* Per-app data breakdown — Persona A's insight view (sums to 24.0 GB). */
  OOD.APP_USAGE = [
    { app: 'Instagram', gb: 7.9, colour: '#C13584', initial: 'IG' },
    { app: 'TikTok', gb: 5.6, colour: '#111114', initial: 'TT' },
    { app: 'YouTube', gb: 4.3, colour: '#E62117', initial: 'YT' },
    { app: 'Netflix', gb: 2.1, colour: '#B9090B', initial: 'NF' },
    { app: 'WhatsApp', gb: 1.6, colour: '#1EA65A', initial: 'WA' },
    { app: 'Snapchat', gb: 1.1, colour: '#E3B900', initial: 'SC' },
    { app: 'Safari & Chrome', gb: 0.8, colour: '#2B6CE8', initial: 'WB' },
    { app: 'Ooredoo TV', gb: 0.4, colour: '#ED1C24', initial: 'OO' },
    { app: 'Other apps', gb: 0.2, colour: '#8A9099', initial: '••' }
  ];

  /* Persona B's *would-have-been* breakdown, used only by the standalone
     /plans/recommended showcase page (sums to 38.0 GB). */
  OOD.APP_USAGE_LEGACY = [
    { app: 'Instagram', gb: 11.4, colour: '#C13584', initial: 'IG' },
    { app: 'TikTok', gb: 9.2, colour: '#111114', initial: 'TT' },
    { app: 'YouTube', gb: 6.8, colour: '#E62117', initial: 'YT' },
    { app: 'Netflix', gb: 3.6, colour: '#B9090B', initial: 'NF' },
    { app: 'WhatsApp', gb: 2.4, colour: '#1EA65A', initial: 'WA' },
    { app: 'Snapchat', gb: 1.9, colour: '#E3B900', initial: 'SC' },
    { app: 'Safari & Chrome', gb: 1.5, colour: '#2B6CE8', initial: 'WB' },
    { app: 'Ooredoo TV', gb: 0.8, colour: '#ED1C24', initial: 'OO' },
    { app: 'Other apps', gb: 0.4, colour: '#8A9099', initial: '••' }
  ];

  OOD.HELP_ARTICLES = [
    {
      id: 'help_data_usage',
      title: 'How is my data usage measured on Shahry?',
      cat: 'Data usage',
      mins: 3,
      body: [
        'Your Shahry data allowance renews on your bill date. Usage is metered in real time across 4G and 5G, and every megabyte you consume in Qatar counts against your local data allowance.',
        'Data used while roaming outside Qatar is metered separately against your GCC or international roaming add-on, so it never touches your local allowance.',
        'When you pass your monthly allowance, out-of-bundle data is charged per GB and appears on your bill as a separate data overage line. Postpaid lines are never disconnected for going over — the charge simply lands on the next bill.'
      ]
    },
    {
      id: 'help_overage',
      title: 'Why do I have a data overage charge on my bill?',
      cat: 'Billing',
      mins: 2,
      body: [
        'A data overage charge appears when your local data usage passes the allowance included in your plan during a billing cycle.',
        'If you go over in two or more months out of three, moving to a plan with a larger allowance is almost always cheaper than paying out-of-bundle rates. Compare plans under Plans, or call ' + '111' + ' and ask for a usage review.',
        'Overage charges are billed in the cycle in which they occur and are shown separately from your monthly plan charge.'
      ]
    },
    {
      id: 'help_plan_change',
      title: 'Changing your plan: what happens to my bill and Nojoom points?',
      cat: 'Plans',
      mins: 4,
      body: [
        'You can move to a higher Shahry, Qatarna+ or Home+ plan at any time from the app. There is no activation fee for an in-app upgrade, and Qatar applies no tax on mobile plan charges.',
        'The new monthly charge starts from your next bill date. Any unused allowance from the current cycle is not carried over.',
        'Your Nojoom points balance is never reset by a plan change, and higher plans earn points faster. Hala prepaid customers who move to a Shahry postpaid plan keep their Nojoom balance too.'
      ]
    }
  ];

  /* ----------------------------------------------------------------- state */

  OOD.state = {
    route: '/',
    planId: null,          // for /plans/:planId
    prevRoute: null,
    user: null,            // { userId, name, demoNumber, personaKey }
    persona: null,         // OOD.PERSONAS.A | .B
    selectedPlanId: null,  // plan being upgraded to
    lastUpgrade: null,     // { reference, planId, promoApplied }
    variant: null,         // 'control' | 'treatment'
    variantSource: null,
    planFamilyFilter: 'all',
    shortlist: OOD.store.getJSON(LS.shortlist, []),
    plansVisit: null,      // { upgradeStarted, enteredAt, abandoned }
    breakdownTaps: 0,
    recoShownForVisit: false,
    ratings: {},
    openArticle: null,
    searchQuery: '',
    searchResults: null,
    promo: { attempted: null, applied: false },
    pendingReference: null,   // carries upgrade_reference from Started to Confirmed
    showcaseOpen: true,       // /plans/recommended breakdown open by default
    sessionEndedAt: 0
  };

  /* ---------------------------------------------------------------- routes */

  OOD.ROUTE_TITLES = {
    '/': 'Ooredoo Qatar — Home',
    '/login': 'Log In',
    '/usage': 'My Usage',
    '/usage/breakdown': 'Usage Breakdown',
    '/plans': 'Upgrade Your Plan',
    '/plans/detail': 'Plan Detail',
    '/plans/upgrade': 'Confirm Upgrade',
    '/plans/confirmation': 'Upgrade Confirmed',
    '/plans/recommended': 'Recommended Plans',
    '/bill': 'My Bill',
    '/help': 'Help',
    '/search': 'Search Plans',
    '/nojoom': 'Nojoom',
    '/more': 'More'
  };

  /* Static routes, longest-first (must mirror the list in index.html). */
  OOD.STATIC_ROUTES = [
    '/plans/confirmation', '/plans/recommended', '/usage/breakdown', '/plans/upgrade',
    '/nojoom', '/search', '/plans', '/usage', '/login', '/help', '/bill', '/more', '/'
  ];

  /* Routes that require an identified user. */
  var AUTH_ROUTES = [
    '/usage', '/usage/breakdown', '/plans', '/plans/upgrade', '/plans/confirmation',
    '/bill', '/nojoom', '/more'
  ];

  OOD.requiresAuth = function (route) {
    if (route === '/plans/recommended') return false;   // standalone showcase
    if (AUTH_ROUTES.indexOf(route) >= 0) return true;
    return route.indexOf('/plans/') === 0;              // plan detail
  };

  /* Turn a pathname into { route, planId }. `route` is one of STATIC_ROUTES
     or the literal '/plans/detail' pseudo-route for plan detail pages. */
  OOD.parsePath = function (pathname) {
    var p = (pathname || '/').replace(/\/(index|404)\.html$/, '');
    if (p.length > 1 && p.slice(-1) === '/') p = p.slice(0, -1);
    var r = p.slice(BASE.length) || '/';
    if (r.charAt(0) !== '/') r = '/' + r;

    if (OOD.STATIC_ROUTES.indexOf(r) >= 0) return { route: r, planId: null };

    var dyn = r.match(/^\/plans\/([A-Za-z0-9_-]+)$/);
    if (dyn && OOD.planById(dyn[1])) return { route: '/plans/detail', planId: dyn[1] };
    /* unknown plan id / unknown path: land on a real screen AND rewrite the
       address bar, so the URL never shows a route that does not exist */
    if (dyn) return { route: '/plans', planId: null, fallback: true };

    return { route: '/', planId: null, fallback: r !== '/' };
  };

  /* Route -> href (what the address bar shows). */
  OOD.href = function (route, planId) {
    var r = route === '/plans/detail' ? '/plans/' + planId : route;
    return BASE + (r === '/' ? '/' : r);
  };

  /* Route -> canonical production path, used for page-view properties. */
  OOD.canonPath = function (route, planId) {
    var r = route === '/plans/detail' ? '/plans/' + planId : route;
    return OOD.CONFIG.CANON_BASE + (r === '/' ? '/' : r);
  };

  OOD.title = function (route) {
    return OOD.ROUTE_TITLES[route] || OOD.ROUTE_TITLES['/'];
  };

  /* ------------------------------------------------------- route utilities */

  /* The "plan consideration" set: moving between these is still comparing,
     not abandoning. */
  OOD.inPlansFlow = function (route) {
    return route === '/plans' || route === '/plans/detail' ||
           route === '/plans/upgrade' || route === '/plans/confirmation' ||
           route === '/search';
  };

  OOD.screenName = function (route) {
    if (route === '/') return 'home';
    return route.replace(/^\//, '').replace(/[/-]/g, '_');
  };

  /* --------------------------------------------------------------- helpers */

  OOD.esc = function (s) {
    return String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };

  OOD.qar = function (n, dp) {
    var d = dp === undefined ? 2 : dp;
    return 'QAR ' + Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  };

  OOD.num = function (n, dp) {
    var d = dp === undefined ? 1 : dp;
    return Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  };

  OOD.ref = function () {
    var hex = '0123456789ABCDEF', out = '';
    for (var i = 0; i < 6; i++) out += hex.charAt(Math.floor(Math.random() * 16));
    return 'OOR-UPG-' + out;
  };

  OOD.billPeriod = function () {
    var now = new Date();
    var m = ['January', 'February', 'March', 'April', 'May', 'June',
             'July', 'August', 'September', 'October', 'November', 'December'];
    var prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return m[prev.getMonth()] + ' ' + prev.getFullYear();
  };

  OOD.dueDate = function () {
    var d = new Date();
    d.setDate(d.getDate() + 9);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  OOD.nextBillDate = function () {
    var d = new Date();
    d.setMonth(d.getMonth() + 1);
    d.setDate(1);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  /* --------------------------------------------- plan-fit / recommendation */

  /* A plan "fits" when its allowance leaves ~25% headroom over the persona's
     average monthly consumption. Current plan is never a fit-upgrade. */
  OOD.fittingPlans = function (persona) {
    var need = Math.ceil(persona.avg_monthly_gb * 1.25);
    return OOD.PLANS.filter(function (p) {
      return p.gb >= need && p.id !== persona.current_plan_id;
    });
  };

  OOD.recommendedPlan = function (persona) {
    var fits = OOD.fittingPlans(persona);
    if (!fits.length) return OOD.planById('shahry_60');
    return fits.reduce(function (a, b) { return b.qar < a.qar ? b : a; });
  };

  /* The consumption-based line rendered on treatment plan cards (and on the
     standalone showcase page). Built entirely from the hardcoded profile.
     For Persona B + Shahry 60 GB this renders exactly:
       "Based on your last 3 months (avg 38 GB, over quota in 2 of 3),
        Shahry 60 GB fits your usage and would have saved you QAR 45/month." */
  OOD.recoLine = function (persona, plan) {
    var head = 'Based on your last 3 months (avg ' + persona.avg_monthly_gb +
               ' GB, over quota in ' + persona.months_over_quota + ' of 3), ' +
               plan.name + ' fits your usage';
    if (persona.overage_charge_qar > 0) {
      return head + ' and would have saved you QAR ' + persona.overage_charge_qar + '/month.';
    }
    return head + ' with room to spare.';
  };

  /* ---------------------------------------------------------------- router */

  OOD.router = {
    /* Resolve a requested route through the auth guard + persona guards. */
    guard: function (route, planId) {
      var s = OOD.state;

      if (OOD.requiresAuth(route) && !s.user) {
        return { route: '/login', planId: null, redirected: true };
      }
      /* Persona B has no usage insights: the breakdown screen is unreachable,
         even by typing the URL. */
      if (route === '/usage/breakdown' && s.persona && !s.persona.userProps.usage_insights_enabled) {
        return { route: '/usage', planId: null, redirected: true };
      }
      /* Upgrade steps need a selected plan. */
      if (route === '/plans/upgrade' && !s.selectedPlanId) {
        return { route: '/plans', planId: null, redirected: true };
      }
      if (route === '/plans/confirmation' && !s.lastUpgrade) {
        return { route: '/plans', planId: null, redirected: true };
      }
      if (route === '/login' && s.user) {
        return { route: '/', planId: null, redirected: true };
      }
      return { route: route, planId: planId, redirected: false };
    },

    /* Normalise any route string to a known route (so a hand-typed
       "/plans/shahry_60" behaves exactly like a deep link would). */
    normalise: function (route, planId) {
      if (route === '/plans/detail') {
        return { route: '/plans/detail', planId: planId || null };
      }
      if (OOD.STATIC_ROUTES.indexOf(route) >= 0) {
        return { route: route, planId: null };
      }
      return OOD.parsePath(OOD.CONFIG.BASE + route);
    },

    /* Programmatic navigation. */
    go: function (route, planId, opts) {
      var o = opts || {};
      var norm = OOD.router.normalise(route, planId);
      var res = OOD.router.guard(norm.route, norm.planId);
      var s = OOD.state;

      if (OOD.onRouteLeave) OOD.onRouteLeave(s.route, res.route);

      s.prevRoute = s.route;
      s.route = res.route;
      s.planId = res.planId || null;

      /* Re-selecting the screen you are already on replaces the history entry
         instead of stacking a duplicate one (so Back is never a visible no-op). */
      var url = OOD.href(s.route, s.planId);
      var sameUrl = (location.pathname + location.search) === url ||
                    location.pathname === url;
      if (o.replace || sameUrl) history.replaceState({ route: s.route, planId: s.planId }, '', url);
      else history.pushState({ route: s.route, planId: s.planId }, '', url);

      OOD.render();
      return res;
    },

    back: function () {
      if (history.length > 1) history.back();
      else OOD.router.go('/');
    },

    /* Read the current location, apply guards, and render. */
    sync: function (isInitial) {
      var parsed = OOD.parsePath(location.pathname);
      var res = OOD.router.guard(parsed.route, parsed.planId);
      var s = OOD.state;

      if (!isInitial && OOD.onRouteLeave) OOD.onRouteLeave(s.route, res.route);

      s.prevRoute = isInitial ? null : s.route;
      s.route = res.route;
      s.planId = res.planId || null;

      if (res.redirected || parsed.fallback) {
        history.replaceState({ route: s.route, planId: s.planId }, '', OOD.href(s.route, s.planId));
      }
      OOD.render();
    }
  };

  window.addEventListener('popstate', function () {
    OOD.router.sync(false);
  });

  /* OOD.render is defined in views.js; OOD.onRouteLeave in analytics.js. */
  OOD.render = function () {};
  OOD.onRouteLeave = null;
})();
