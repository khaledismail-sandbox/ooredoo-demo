/* ==========================================================================
   Ooredoo Qatar demo — Amplitude wiring
   - unified CDN loader (Analytics + Session Replay + Web Experiment) + engagement
   - explicit taxonomy only: every event is fired by name from a UI trigger
   - frustrationInteractions autocapture, with an explicit fallback detector
   - Experiment flag: usage-breakdown-tap-unresponsive-reduction
   ========================================================================== */
(function () {
  'use strict';

  var OOD = window.OOD;
  var CFG = OOD.CONFIG;

  var LOG_TAG = '[Ooredoo demo]';

  /* Everything this app sends, mirrored for live walk-throughs:
       window.__OOREDOO__.events    -> [{ name, props, options, at }]
       window.__OOREDOO__.outgoing  -> event_type of every event the SDK sends
       window.__OOREDOO__.frustration -> { mode, nativeSeen, fired }
       window.__OOREDOO__.experiment  -> { present, variant, source }           */
  var DBG = window.__OOREDOO__ = {
    events: [],
    outgoing: [],
    outgoingFull: [],
    frustration: { mode: 'pending', nativeSeen: false, fired: [] },
    experiment: { present: false, variant: null, source: null },
    sdk: { loaded: false, version: null, frustrationNativeSupported: null },
    dump: function () { return DBG.events.slice(); }
  };

  function ampReady() {
    return typeof window.amplitude !== 'undefined' && typeof window.amplitude.track === 'function';
  }

  function banner(lines) {
    var el = document.getElementById('dev-banner');
    if (el) { el.textContent = lines; el.hidden = false; }
  }

  /* ====================================================================== */
  /* 1. SDK version / frustration-support detection                          */
  /* ====================================================================== */

  /* frustrationInteractions (dead + rage click autocapture) needs a recent
     Browser SDK 2.x. We read the version where the SDK exposes it and parse
     it; when the version cannot be read we arm the fallback detector in
     shadow mode and let the first observed native event stand it down. */
  var NATIVE_MIN = [2, 18, 0];

  function readSdkVersion() {
    var a = window.amplitude;
    var cands = [];
    if (a) {
      cands.push(a.VERSION, a.version, a.__VERSION__);
      try {
        if (a._instance && a._instance.version) cands.push(a._instance.version);
        if (typeof a.getInstance === 'function') {
          var inst = a.getInstance();
          if (inst && (inst.version || inst.VERSION)) cands.push(inst.version || inst.VERSION);
        }
      } catch (e) { /* ignore */ }
    }
    for (var i = 0; i < cands.length; i++) {
      if (typeof cands[i] === 'string' && /^\d+\.\d+/.test(cands[i])) return cands[i];
    }

    /* The unified loader resolves the Browser SDK bundle at runtime, e.g.
       https://cdn.amplitude.com/libs/analytics-browser-2.42.4-min.js.gz
       — the URL is the most reliable version source with this loader. */
    var urls = [];
    try {
      for (var s = 0; s < document.scripts.length; s++) urls.push(document.scripts[s].src || '');
    } catch (e) { /* ignore */ }
    try {
      if (window.performance && performance.getEntriesByType) {
        performance.getEntriesByType('resource').forEach(function (r) { urls.push(r.name || ''); });
      }
    } catch (e) { /* ignore */ }
    for (var u = 0; u < urls.length; u++) {
      var m = String(urls[u]).match(/analytics-browser-(\d+\.\d+\.\d+)/);
      if (m) return m[1];
    }
    return null;
  }

  function versionAtLeast(v, min) {
    var p = String(v).split('.').map(function (x) { return parseInt(x, 10) || 0; });
    for (var i = 0; i < min.length; i++) {
      if ((p[i] || 0) > min[i]) return true;
      if ((p[i] || 0) < min[i]) return false;
    }
    return true;
  }

  /* ====================================================================== */
  /* 2. init                                                                 */
  /* ====================================================================== */

  /* Ledger of frustration events THIS app emitted through the fallback
     detector. The SDK's plugin pipeline runs asynchronously, so a simple
     in-flight boolean would already be false by the time the observer sees the
     event; instead each self-emission is recorded and then consumed by the
     first matching observation. Without this the fallback's own first event
     would look like proof that native autocapture is alive, and the fallback
     would stand itself down for the rest of the session. */
  var selfEmitted = [];

  function markSelfEmitted(name) {
    selfEmitted.push({ name: name, t: Date.now() });
    if (selfEmitted.length > 50) selfEmitted.shift();
  }

  function consumeSelfEmitted(name) {
    var now = Date.now();
    for (var i = selfEmitted.length - 1; i >= 0; i--) {
      if (now - selfEmitted[i].t > 5000) break;
      if (selfEmitted[i].name === name) { selfEmitted.splice(i, 1); return true; }
    }
    return false;
  }

  /* Observer plugin: mirrors every outgoing event type so we can tell whether
     native frustration autocapture is actually firing. */
  var observerPlugin = {
    name: 'ooredoo-demo-observer',
    type: 'enrichment',
    setup: function () { return Promise.resolve(); },
    execute: function (event) {
      try {
        DBG.outgoing.push(event.event_type);
        if (DBG.outgoingFull.length < 400) {
          var rec = { name: event.event_type, props: event.event_properties || {} };
          /* reserved fields, so a demo can prove they travel top-level */
          ['revenue', 'price', 'quantity', 'revenueType', 'country', 'user_id', 'device_id']
            .forEach(function (k) { if (event[k] !== undefined) rec[k] = event[k]; });
          DBG.outgoingFull.push(rec);
        }
        if ((event.event_type === '[Amplitude] Dead Click' || event.event_type === '[Amplitude] Rage Click') &&
            /* not one of ours ... */
            !consumeSelfEmitted(event.event_type) &&
            /* ... and native support is not already known to be absent */
            DBG.sdk.frustrationNativeSupported !== false) {
          if (!DBG.frustration.nativeSeen) {
            DBG.frustration.nativeSeen = true;
            if (DBG.frustration.mode !== 'native') {
              DBG.frustration.mode = 'native';
              console.info(LOG_TAG + ' frustration path: NATIVE autocapture confirmed (' +
                           event.event_type + ' observed) — fallback detector stood down.');
            }
          }
        }
      } catch (e) { /* never break the pipeline */ }
      return Promise.resolve(event);
    }
  };

  OOD.initAmplitude = function () {
    if (typeof window.amplitude === 'undefined') {
      console.error(LOG_TAG + ' Amplitude unified loader did not load — analytics disabled.');
      banner('Amplitude unified loader did not load — analytics disabled.');
      return;
    }
    DBG.sdk.loaded = true;

    if (window.sessionReplay) amplitude.add(window.sessionReplay.plugin({ sampleRate: 1 }));
    if (window.engagement)    amplitude.add(window.engagement.plugin());
    amplitude.add(observerPlugin);

    amplitude.init(CFG.AMP_KEY, {
      fetchRemoteConfig: true,
      autocapture: {
        attribution: false, pageViews: false, sessions: false, formInteractions: false,
        fileDownloads: false, elementInteractions: false,
        frustrationInteractions: true   // dead clicks + rage clicks ONLY
      }
    });

    /* --- Experiment SDK presence (hard requirement) --------------------- */
    checkExperimentPresence(true);
    /* remote config resolves asynchronously — re-check once it has settled */
    setTimeout(function () { checkExperimentPresence(false); }, 3000);

    /* --- frustration path ---------------------------------------------- */
    resolveFrustrationPath(true);
    /* the Browser SDK bundle is fetched asynchronously by the loader, so the
       version may only become readable a moment later — re-probe and stand the
       fallback down if native support turns out to be there. */
    [400, 1200, 3000].forEach(function (ms) {
      setTimeout(function () { resolveFrustrationPath(false); }, ms);
    });

    /* --- attribution: nothing may ever resolve to "(none)" -------------- */
    sendAttributionIdentify();
  };

  /* Decide (and if necessary re-decide) which frustration path is active.
     Never silently drop the signal: the fallback is armed unless native
     support is positively established, and it stands itself down the moment
     native support is confirmed — by version or by an observed event. */
  var fallbackInstalled = false;

  function resolveFrustrationPath(initial) {
    if (DBG.frustration.mode === 'native' && !initial) return;

    var v = readSdkVersion();
    if (v) DBG.sdk.version = v;
    var nativeOk = v ? versionAtLeast(v, NATIVE_MIN) : null;
    DBG.sdk.frustrationNativeSupported = nativeOk;

    if (nativeOk === true) {
      var was = DBG.frustration.mode;
      DBG.frustration.mode = 'native';
      if (was !== 'native') {
        console.info(LOG_TAG + ' frustration path: NATIVE — Browser SDK ' + v +
                     ' supports autocapture.frustrationInteractions' +
                     (fallbackInstalled ? '; fallback detector stood down.' : '.'));
      }
      return;
    }

    if (!initial) return;      // keep waiting for the async bundle

    DBG.frustration.mode = 'fallback';
    console.warn(LOG_TAG + ' frustration path: FALLBACK detector armed' +
                 (v ? ' (Browser SDK ' + v + ' is older than 2.18)' : ' (SDK version not yet readable)') +
                 ' — "[Amplitude] Dead Click" / "[Amplitude] Rage Click" will be fired explicitly ' +
                 'via amplitude.track. It stands itself down automatically if native support or ' +
                 'native frustration events are detected.');
    installFallbackFrustrationDetector();
  }

  /* ====================================================================== */
  /* 3. Experiment                                                           */
  /* ====================================================================== */

  function experimentGlobals() {
    return {
      lower: window.experiment,                                     // spec-named global
      namespace: window.Experiment,                                 // unified-loader namespace
      onAmplitude: window.amplitude ? window.amplitude.experiment : undefined,
      web: window.webExperiment                                     // web-experiment client
    };
  }

  function checkExperimentPresence(initial) {
    var g = experimentGlobals();
    var present = !!(g.lower || g.namespace || g.onAmplitude || g.web);
    DBG.experiment.present = present;
    OOD.experimentPresent = present;

    if (present) {
      console.info(LOG_TAG + ' Amplitude Experiment SDK detected' + (initial ? '' : ' (re-check)') +
                   ' — globals: ' +
                   [g.lower && 'window.experiment', g.namespace && 'window.Experiment',
                    g.onAmplitude && 'amplitude.experiment', g.web && 'window.webExperiment']
                     .filter(Boolean).join(', ') + '.');
      var el = document.getElementById('dev-banner');
      if (el && el.dataset.reason === 'experiment') el.hidden = true;
    } else {
      console.error('%c' + LOG_TAG + ' ***** EXPERIMENT SDK NOT DETECTED *****',
                    'background:#7A1C1C;color:#fff;font-weight:700;padding:2px 6px');
      console.error(LOG_TAG + ' window.experiment / window.Experiment / amplitude.experiment / ' +
                    'window.webExperiment are all missing after the unified loader initialised. ' +
                    'Flag "' + CFG.FLAG_KEY + '" cannot be evaluated — /plans will default to the ' +
                    'CONTROL arm. Check that Web Experiment is enabled for this API key and that ' +
                    'fetchRemoteConfig:true is reaching the config endpoint.');
      var b = document.getElementById('dev-banner');
      if (b) {
        b.dataset.reason = 'experiment';
        banner('Dev notice: Amplitude Experiment SDK not detected — flag "' + CFG.FLAG_KEY +
               '" defaults to control.');
      }
    }
    return present;
  }

  /* Resolve the flag once per session. cb(variant, source). */
  OOD.resolveVariant = function (cb) {
    var s = OOD.state;
    if (s.variant) { cb(s.variant, s.variantSource); return; }

    function done(variant, source) {
      s.variant = variant;
      s.variantSource = source;
      DBG.experiment.variant = variant;
      DBG.experiment.source = source;
      console.info(LOG_TAG + ' flag "' + CFG.FLAG_KEY + '" => ' + variant + ' (source: ' + source + ')');
      cb(variant, source);
    }

    /* Demo override, so both arms can be shown on demand:
         ?variant=treatment | ?variant=control  (sticky for the browser)      */
    var q = null;
    try { q = new URLSearchParams(location.search).get('variant'); } catch (e) { q = null; }
    if (q === 'treatment' || q === 'control') {
      OOD.store.set(OOD.LS.variant, q);
      return done(q, 'query_override');
    }
    var stored = OOD.store.get(OOD.LS.variant, null);
    if (stored === 'treatment' || stored === 'control') return done(stored, 'stored_override');

    if (!OOD.experimentPresent) {
      console.warn(LOG_TAG + ' Experiment SDK unavailable — defaulting flag "' + CFG.FLAG_KEY +
                   '" to control.');
      return done('control', 'default_control_sdk_missing');
    }

    var g = experimentGlobals();
    var settled = false;
    var timer = setTimeout(function () {
      if (settled) return;
      settled = true;
      console.warn(LOG_TAG + ' Experiment fetch for "' + CFG.FLAG_KEY +
                   '" did not resolve within 1500 ms — defaulting to control.');
      done('control', 'default_control_timeout');
    }, 1500);

    function settle(variant, source) {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      done(variant, source);
    }

    function readFrom(client, label) {
      if (!client) return false;
      try {
        if (typeof client.variant === 'function') {
          var v = client.variant(CFG.FLAG_KEY);
          var val = v && (v.value || v.key);
          if (val) { settle(val === 'treatment' ? 'treatment' : 'control', label); return true; }
        }
        if (typeof client.getVariants === 'function') {
          var all = client.getVariants() || {};
          var vv = all[CFG.FLAG_KEY];
          var val2 = vv && (vv.value || vv.key);
          if (val2) { settle(val2 === 'treatment' ? 'treatment' : 'control', label); return true; }
        }
      } catch (e) { /* try the next client */ }
      return false;
    }

    /* Already-initialised clients first. */
    if (readFrom(g.lower, 'experiment_sdk_window_experiment')) return;
    if (readFrom(g.onAmplitude, 'experiment_sdk_amplitude_experiment')) return;
    if (readFrom(g.web, 'experiment_sdk_web_experiment')) return;

    /* Explicit init path (needs a deployment key). */
    var ns = g.namespace;
    if (ns && typeof ns.initializeWithAmplitudeAnalytics === 'function' && CFG.EXPERIMENT_DEPLOYMENT_KEY) {
      try {
        var client = ns.initializeWithAmplitudeAnalytics(CFG.EXPERIMENT_DEPLOYMENT_KEY, {
          fetchTimeoutMillis: 1200
        });
        Promise.resolve(client.start ? client.start() : client.fetch()).then(function () {
          if (!readFrom(client, 'experiment_sdk_explicit_init')) {
            settle('control', 'default_control_no_variant');
          }
        })['catch'](function (err) {
          console.warn(LOG_TAG + ' Experiment fetch failed: ' + err + ' — defaulting to control.');
          settle('control', 'default_control_fetch_failed');
        });
        return;
      } catch (e) {
        console.warn(LOG_TAG + ' Experiment init threw: ' + e + ' — defaulting to control.');
        return settle('control', 'default_control_init_threw');
      }
    }

    console.warn(LOG_TAG + ' Experiment SDK is present but exposes no evaluated variant for "' +
                 CFG.FLAG_KEY + '" (no deployment key configured) — defaulting to control. ' +
                 'Use ?variant=treatment to demo the treatment arm.');
    settle('control', 'default_control_no_client');
  };

  /* ====================================================================== */
  /* 4. identify / attribution                                               */
  /* ====================================================================== */

  function attribution() {
    var q;
    try { q = new URLSearchParams(location.search); } catch (e) { q = null; }
    function p(k) {
      var v = q ? q.get(k) : null;
      return (v && String(v).trim()) ? String(v).trim() : 'direct';
    }
    var ref = document.referrer && String(document.referrer).trim();
    var refDomain;
    if (ref) {
      try { refDomain = new URL(ref).hostname || CFG.CANON_DOMAIN; }
      catch (e) { refDomain = CFG.CANON_DOMAIN; }
    } else {
      refDomain = CFG.CANON_DOMAIN;
    }
    return {
      utm_source: p('utm_source'),
      utm_medium: p('utm_medium'),
      utm_campaign: p('utm_campaign'),
      referrer: ref || 'direct',
      referring_domain: refDomain
    };
  }

  function sendAttributionIdentify() {
    if (!ampReady()) return;
    var a = attribution();
    OOD.attributionSnapshot = a;
    var idf = new amplitude.Identify()
      .set('utm_source', a.utm_source)
      .set('utm_medium', a.utm_medium)
      .set('utm_campaign', a.utm_campaign)
      .setOnce('initial_utm_source', a.utm_source)
      .setOnce('initial_utm_medium', a.utm_medium)
      .setOnce('initial_utm_campaign', a.utm_campaign)
      .set('referrer', a.referrer)
      .set('referring_domain', a.referring_domain);
    amplitude.identify(idf, { country: CFG.COUNTRY });
    console.debug(LOG_TAG + ' attribution identify', a);
  }
  OOD.sendAttributionIdentify = sendAttributionIdentify;

  /* ====================================================================== */
  /* 5. track gate                                                           */
  /* ====================================================================== */

  /* Every custom event carries country: "Qatar" as an EVENT PROPERTY, and the
     same value is passed as Amplitude's reserved country in event options so
     the built-in Country dimension never resolves to "(none)". */
  OOD.track = function (name, props, extraOptions) {
    var p = {};
    var src = props || {};
    for (var k in src) if (Object.prototype.hasOwnProperty.call(src, k)) p[k] = src[k];
    p.country = CFG.COUNTRY;

    var options = { country: CFG.COUNTRY };
    if (extraOptions) {
      for (var o in extraOptions) if (Object.prototype.hasOwnProperty.call(extraOptions, o)) options[o] = extraOptions[o];
    }

    DBG.events.push({ name: name, props: p, options: options, at: new Date().toISOString() });
    console.debug(LOG_TAG + ' track', name, p, options);
    if (ampReady()) amplitude.track(name, p, options);
  };

  /* Page views are fired explicitly on every route change with exactly the
     five [Amplitude] Page * properties — no country, no extras. */
  OOD.trackPageViewed = function (route, planId) {
    var path = OOD.canonPath(route, planId);
    var url = CFG.CANON_ORIGIN + path;
    var loc = url + (location.search || '');
    var props = {
      '[Amplitude] Page Domain': CFG.CANON_DOMAIN,
      '[Amplitude] Page Location': loc,
      '[Amplitude] Page Path': path,
      '[Amplitude] Page Title': OOD.title(route),
      '[Amplitude] Page URL': url
    };
    DBG.events.push({ name: '[Amplitude] Page Viewed', props: props, options: { country: CFG.COUNTRY }, at: new Date().toISOString() });
    console.debug(LOG_TAG + ' track [Amplitude] Page Viewed', props);
    if (ampReady()) amplitude.track('[Amplitude] Page Viewed', props, { country: CFG.COUNTRY });
  };

  /* ====================================================================== */
  /* 6. taxonomy helpers                                                     */
  /* ====================================================================== */

  OOD.usageProps = function () {
    var p = OOD.state.persona;
    if (!p) return {};
    return {
      avg_monthly_gb: p.avg_monthly_gb,
      months_over_quota: p.months_over_quota,
      overage_charge_qar: p.overage_charge_qar,
      quota_exceeded: p.quota_exceeded
    };
  };

  OOD.upgradeCount = function () {
    if (!OOD.state.user) return 0;
    return parseInt(OOD.store.get(OOD.LS.upgrades + OOD.state.user.userId, '0'), 10) || 0;
  };

  /* Monthly payable = plan + activation fee + tax, less any applied promo. */
  OOD.monthlyPayable = function (plan) {
    var gross = plan.qar + 0 + 0;
    if (OOD.state.promo.applied) {
      return Math.round((gross * (1 - CFG.PROMO_PCT / 100)) * 100) / 100;
    }
    return gross;
  };

  OOD.planProps = function (plan, extra) {
    var per = OOD.state.persona || OOD.PERSONAS.B;
    var out = {
      plan_id: plan.id,
      plan_family: plan.family,
      plan_monthly_qar: plan.qar,
      current_monthly_spend_qar: per.current_plan_qar + per.overage_charge_qar,
      activation_fee_qar: 0,
      tax_qar: 0,
      monthly_payable_qar: OOD.monthlyPayable(plan),
      activation_fee_waived: true,
      is_first_upgrade: OOD.upgradeCount() === 0,
      is_returning_customer: per.userProps.account_age_days >= 365
    };
    /* one reference per upgrade attempt, carried from Plan Upgrade Started
       through Upgrade Promo Applied to Plan Upgrade Confirmed */
    var ref = (OOD.state.lastUpgrade && OOD.state.lastUpgrade.reference) || OOD.state.pendingReference;
    if (ref) out.upgrade_reference = ref;
    if (extra) {
      for (var k in extra) if (Object.prototype.hasOwnProperty.call(extra, k)) out[k] = extra[k];
    }
    return out;
  };

  /* ====================================================================== */
  /* 7. login / logout                                                       */
  /* ====================================================================== */

  OOD.buildUserId = function (name, demoNumber) {
    return (name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '') || 'user') +
           '_' + demoNumber + '_' + new Date().toISOString().split('T')[0].replace(/-/g, '');
  };

  OOD.login = function (name, demoNumber) {
    var personaKey = OOD.store.get(OOD.LS.persona, '0') === '1' ? 'A' : 'B';
    var persona = OOD.PERSONAS[personaKey];
    var userId = OOD.buildUserId(name, demoNumber);

    if (ampReady()) amplitude.setUserId(userId);

    /* All persona user properties are set immediately after setUserId. */
    if (ampReady()) {
      var up = persona.userProps;
      var idf = new amplitude.Identify()
        .set('usage_insights_enabled', up.usage_insights_enabled)
        .set('plan_generation', up.plan_generation)
        .set('nojoom_tier', up.nojoom_tier)
        .set('account_age_days', up.account_age_days)
        .set('device_type', up.device_type);
      amplitude.identify(idf, { country: CFG.COUNTRY });
      /* re-assert attribution against the now-identified user */
      sendAttributionIdentify();
    }

    OOD.state.user = {
      userId: userId,
      name: name.trim() || 'user',
      demoNumber: demoNumber,
      personaKey: personaKey
    };
    OOD.state.persona = persona;
    OOD.state.selectedPlanId = null;
    OOD.state.lastUpgrade = null;
    OOD.state.breakdownTaps = 0;
    OOD.state.promo = { attempted: null, applied: false };

    OOD.store.setJSON(OOD.LS.session, {
      name: OOD.state.user.name,
      demoNumber: demoNumber,
      personaKey: personaKey,
      userId: userId
    });
    OOD.store.set(OOD.LS.seen + userId, '1');

    OOD.track('Logged In', {
      user_id_scheme: 'name_demo_date',
      nojoom_tier: persona.userProps.nojoom_tier,
      plan_generation: persona.userProps.plan_generation,
      usage_insights_enabled: persona.userProps.usage_insights_enabled,
      is_returning_customer: persona.userProps.account_age_days >= 365,
      screen_name: 'login'
    });

    console.info(LOG_TAG + ' logged in as ' + userId + ' (persona ' + personaKey + ')');
  };

  OOD.restoreSession = function () {
    var s = OOD.store.getJSON(OOD.LS.session, null);
    if (!s || !s.userId || !OOD.PERSONAS[s.personaKey]) return false;
    var persona = OOD.PERSONAS[s.personaKey];
    OOD.state.user = {
      userId: s.userId, name: s.name, demoNumber: s.demoNumber, personaKey: s.personaKey
    };
    OOD.state.persona = persona;
    if (ampReady()) {
      amplitude.setUserId(s.userId);
      var up = persona.userProps;
      amplitude.identify(new amplitude.Identify()
        .set('usage_insights_enabled', up.usage_insights_enabled)
        .set('plan_generation', up.plan_generation)
        .set('nojoom_tier', up.nojoom_tier)
        .set('account_age_days', up.account_age_days)
        .set('device_type', up.device_type), { country: CFG.COUNTRY });
    }
    console.info(LOG_TAG + ' session restored for ' + s.userId + ' (persona ' + s.personaKey + ')');
    return true;
  };

  OOD.logout = function () {
    OOD.store.del(OOD.LS.session);
    OOD.state.user = null;
    OOD.state.persona = null;
    OOD.state.selectedPlanId = null;
    OOD.state.lastUpgrade = null;
    OOD.state.plansVisit = null;
    OOD.state.variant = null;
    OOD.state.variantSource = null;
    OOD.state.breakdownTaps = 0;
    if (ampReady()) amplitude.reset();
    /* reset() clears the device id too, so re-assert attribution for the
       fresh anonymous identity — nothing may resolve to "(none)". */
    sendAttributionIdentify();
    console.info(LOG_TAG + ' logged out (amplitude.reset()).');
  };

  /* ====================================================================== */
  /* 8. route-change instrumentation                                         */
  /* ====================================================================== */

  /* Abandonment: the user compared plans and left without starting an upgrade.
     The "visit" opens on /plans entry and stays open while they move around
     the plan-consideration flow (plan detail, search, the upgrade steps); it
     closes — as an abandonment — the moment they leave that flow entirely
     without a Plan Upgrade Started. Closing only on the /plans route itself
     would silently drop every drop-off that happens one screen deeper. */
  function maybeAbandonPlans(from, to) {
    var s = OOD.state;
    if (!s.plansVisit || s.plansVisit.abandoned) return;
    if (!OOD.inPlansFlow(from)) return;
    if (OOD.inPlansFlow(to)) return;
    if (s.plansVisit.upgradeStarted) return;

    s.plansVisit.abandoned = true;
    OOD.track('Plan Comparison Abandoned', {
      plans_shown: s.plansVisit.plansShown,
      plan_family_filter: s.planFamilyFilter,
      variant: s.variant || 'control',
      breakdown_taps: s.breakdownTaps,
      seconds_on_plans: Math.max(1, Math.round((Date.now() - s.plansVisit.enteredAt) / 1000)),
      exit_from: OOD.screenName(from),
      exit_to: OOD.screenName(to),
      screen_name: 'plans'
    });
  }

  OOD.onRouteLeave = function (from, to) {
    if (from === to) return;
    maybeAbandonPlans(from, to);
    if (from === '/plans' && to !== '/plans') OOD.state.recoShownForVisit = false;
  };

  /* Fired by views.js after each render. */
  OOD.onRouteEnter = function (route, planId) {
    OOD.trackPageViewed(route, planId);
  };

  /* ====================================================================== */
  /* 9. Session Ended                                                        */
  /* ====================================================================== */

  var sessionStartedAt = Date.now();

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState !== 'hidden') return;
    var now = Date.now();
    if (now - OOD.state.sessionEndedAt < 2000) return;   // de-dupe rapid toggles
    OOD.state.sessionEndedAt = now;

    /* leaving the tab while still comparing plans is also an abandon */
    maybeAbandonPlans(OOD.state.route, '__exit__');

    OOD.track('Session Ended', {
      screen_name: OOD.screenName(OOD.state.route),
      session_seconds: Math.max(1, Math.round((now - sessionStartedAt) / 1000)),
      exit_reason: 'visibility_hidden'
    });
    if (ampReady() && typeof amplitude.flush === 'function') amplitude.flush();
  });

  /* ====================================================================== */
  /* 10. fallback frustration detector                                       */
  /* ====================================================================== */

  function selectorOf(el) {
    var tag = (el.tagName || '').toLowerCase();
    var cls = (el.getAttribute('class') || '').trim();
    var parts = cls ? cls.split(/\s+/).filter(Boolean) : [];
    return tag + (parts.length ? '.' + parts.join('.') : '');
  }

  function textOf(el) {
    var t = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
    return t.length > 128 ? t.slice(0, 128) : t;
  }

  function elementProps(el, extra) {
    var rect = el.getBoundingClientRect ? el.getBoundingClientRect() : { left: 0, top: 0 };
    var p = {
      '[Amplitude] Element Selector': selectorOf(el),
      '[Amplitude] Element Text': textOf(el),
      '[Amplitude] Element Tag': (el.tagName || '').toLowerCase(),
      '[Amplitude] Element Class': el.getAttribute('class') || '',
      '[Amplitude] Element Position Left': Math.round(rect.left),
      '[Amplitude] Element Position Top': Math.round(rect.top),
      '[Amplitude] Page Domain': CFG.CANON_DOMAIN,
      '[Amplitude] Page Path': OOD.canonPath(OOD.state.route, OOD.state.planId),
      '[Amplitude] Page Title': OOD.title(OOD.state.route),
      '[Amplitude] Page URL': CFG.CANON_ORIGIN + OOD.canonPath(OOD.state.route, OOD.state.planId)
    };
    if (extra) for (var k in extra) if (Object.prototype.hasOwnProperty.call(extra, k)) p[k] = extra[k];
    return p;
  }

  /* Autocapture-shaped: no country event property (native autocapture has
     none either), but the reserved country is still supplied so geo charts
     never show "(none)". */
  function emitFrustration(name, el, extra) {
    /* the native path owns the signal once it is confirmed */
    if (DBG.frustration.mode === 'native' || DBG.frustration.nativeSeen) return;
    var props = elementProps(el, extra);
    DBG.frustration.fired.push({ name: name, selector: props['[Amplitude] Element Selector'], at: new Date().toISOString() });
    DBG.events.push({ name: name, props: props, options: { country: CFG.COUNTRY }, at: new Date().toISOString() });
    console.debug(LOG_TAG + ' track (fallback) ' + name, props);
    if (ampReady()) {
      markSelfEmitted(name);
      amplitude.track(name, props, { country: CFG.COUNTRY });
    }
  }

  var CLICKABLE = 'button, a, [role="button"], .row, .chip, .tab, .allow-card, .pill, .bookmark, .star';

  function installFallbackFrustrationDetector() {
    if (fallbackInstalled) return;
    fallbackInstalled = true;
    var rage = { el: null, times: [] };

    document.addEventListener('click', function (ev) {
      var el = ev.target && ev.target.closest ? ev.target.closest(CLICKABLE) : null;
      if (!el) return;

      /* ---- rage click: >= 3 clicks on the same element within 2000 ms ---- */
      var now = Date.now();
      if (rage.el !== el) { rage.el = el; rage.times = []; }
      rage.times = rage.times.filter(function (t) { return now - t < 2000; });
      rage.times.push(now);
      if (rage.times.length >= 3) {
        emitFrustration('[Amplitude] Rage Click', el, { '[Amplitude] Clicks': rage.times.length });
      }

      /* ---- dead click: no DOM change within 3000 ms --------------------- */
      var urlBefore = location.href;
      var changed = false;
      var mo = new MutationObserver(function () { changed = true; });
      mo.observe(document.getElementById('phone') || document.body, {
        subtree: true, childList: true, attributes: true, characterData: true
      });
      setTimeout(function () {
        mo.disconnect();
        if (changed) return;
        if (location.href !== urlBefore) return;
        emitFrustration('[Amplitude] Dead Click', el);
      }, 3000);
    }, true);

    console.info(LOG_TAG + ' fallback frustration detector installed ' +
                 '(dead click: no DOM change within 3 s; rage click: >= 3 clicks / 2 s).');
  }
})();
