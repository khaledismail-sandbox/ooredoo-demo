/* ==========================================================================
   Ooredoo Qatar demo — views, render loop and every UI trigger
   Each route is a real client-side route; every taxonomy event below is fired
   explicitly by name from a real interaction or route entry.
   ========================================================================== */
(function () {
  'use strict';

  var OOD = window.OOD;
  var ui = OOD.ui;
  var esc = OOD.esc;
  var CFG = OOD.CONFIG;
  var S = OOD.state;

  var lastRouteKey = null;

  function merge() {
    var out = {};
    for (var i = 0; i < arguments.length; i++) {
      var o = arguments[i] || {};
      for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) out[k] = o[k];
    }
    return out;
  }

  function personaOrDefault() {
    return S.persona || OOD.PERSONAS.B;
  }

  /* ====================================================================== */
  /* Home — "/"                                                              */
  /* ====================================================================== */

  function viewHome() {
    var html = ui.homeHeader();

    if (!S.user) {
      html += '<div class="pad" style="margin-top:6px">' +
        '<div class="card card-pad">' +
          '<h2 class="card-title">Log in to manage your line</h2>' +
          '<p class="card-sub">See your data, calls and Nojoom points, pay your bill and ' +
          'change your Shahry plan in a couple of taps.</p>' +
          '<div style="margin-top:14px"><button class="btn btn-primary" data-act="go" data-route="/login">' +
          'Log in</button></div>' +
        '</div>' +
      '</div>' +
      renderOffers() +
      '<div class="pad" style="margin-top:14px">' + ui.supportStrip() + '</div>' +
      '<div class="bottom-space"></div>';
      return html;
    }

    var p = S.persona;
    var dataLeft = Math.max(0, p.current_plan_gb - p.avg_monthly_gb);
    var unitsLeft = Math.max(0, p.voice_units_total - p.voice_units_used);
    var reco = OOD.recommendedPlan(p);

    html += ui.simPill(p);
    html += ui.nojoomRibbon(p);

    /* allowance cards, as in the real app */
    html += '<div class="allowances">' +
      '<button class="allow-card' + (p.quota_exceeded ? ' over' : '') + '" data-act="go" data-route="/usage">' +
        '<span class="icon-tile">' + ui.icon('data', 20) + '</span>' +
        '<span class="label">Local &amp; Roaming Data</span>' +
        '<span class="metric"><span class="num">' + OOD.num(dataLeft, 1) + '</span>' +
        '<span class="unit">GB</span><span class="arrow">' + ui.icon('arrowUpRight', 18) + '</span></span>' +
        (p.quota_exceeded ? '<span class="over-tag">Over quota</span>' : '') +
        '<span class="foot">' + (p.quota_exceeded
          ? OOD.num(p.avg_monthly_gb, 1) + ' GB used of ' + p.current_plan_gb + ' GB'
          : 'Renews on ' + OOD.nextBillDate()) + '</span>' +
      '</button>' +
      '<button class="allow-card" data-act="go" data-route="/usage">' +
        '<span class="icon-tile">' + ui.icon('call', 20) + '</span>' +
        '<span class="label">Local Calls &amp; SMS</span>' +
        '<span class="metric"><span class="num">' + unitsLeft + '</span>' +
        '<span class="unit">units</span><span class="arrow">' + ui.icon('arrowUpRight', 18) + '</span></span>' +
        '<span class="foot">Renews on ' + OOD.nextBillDate() + '</span>' +
      '</button>' +
    '</div>' +
    '<div class="link-row"><button class="text-link" data-act="go" data-route="/usage">All allowances ' +
      ui.icon('chevR', 16) + '</button></div>';

    /* pill actions */
    html += '<div class="pill-row">' +
      '<button class="pill" data-act="go" data-route="/plans"><span class="circ">' +
        ui.icon('arrowUpRight', 15) + '</span>Manage plan</button>' +
      '<button class="pill" data-act="buy-addons"><span class="circ">' +
        ui.icon('plus', 15) + '</span>Buy add-ons</button>' +
    '</div>';

    /* bill card */
    html += '<div class="pad" style="margin-top:14px">' +
      '<div class="bill-hero">' +
        '<div style="flex:1 1 auto">' +
          '<div class="lbl">My Bill</div>' +
          '<div class="amount">' + OOD.qar(p.current_plan_qar + p.overage_charge_qar) + '</div>' +
          '<div class="lbl">Total for all accounts</div>' +
        '</div>' +
        '<button class="btn btn-outline btn-sm" data-act="go" data-route="/bill">View &amp; Pay Bill</button>' +
      '</div>' +
    '</div>';

    /* recommended-for-you card (fires Recommended Plan Tapped) */
    html += '<div class="pad" style="margin-top:12px">' +
      '<div class="card card-pad" style="border:1.6px solid var(--ood-red)">' +
        '<span class="badge red">Recommended for you</span>' +
        '<h2 class="card-title" style="margin-top:10px">' + esc(reco.name) + '</h2>' +
        '<p class="card-sub">' + esc(reco.gb_copy) + ' ' + esc(reco.minutes) + '.</p>' +
        '<div style="display:flex;align-items:center;gap:12px;margin-top:14px">' +
          '<span style="font-size:20px;font-weight:800;color:var(--ood-red);letter-spacing:-.5px">' +
            OOD.qar(reco.qar, 0) + '</span>' +
          '<span style="font-size:11.5px;color:var(--muted)">per month</span>' +
          '<button class="btn btn-primary btn-sm" style="margin-left:auto" data-act="reco-tap" ' +
            'data-plan="' + reco.id + '">See plan</button>' +
        '</div>' +
      '</div>' +
    '</div>';

    html += renderOffers();

    html += '<div class="section-title">Quick links</div>' +
      '<div class="pad"><div class="rows">' +
        row('data', 'My Usage', 'Data, calls and SMS for this cycle', 'go', { route: '/usage' }) +
        row('search', 'Search plans', 'Find a Shahry, Qatarna+ or Home+ plan', 'go', { route: '/search' }) +
        row('gift', 'Nojoom rewards', 'Points balance, tier and redemptions', 'go', { route: '/nojoom' }) +
        row('help', 'Help &amp; support', 'Data usage, billing and plan changes', 'go', { route: '/help' }) +
      '</div></div>';

    html += '<div class="pad" style="margin-top:14px">' + ui.supportStrip() + '</div>';
    html += '<div class="bottom-space"></div>';
    return html;
  }

  function row(icon, title, sub, act, data) {
    var attrs = ' data-act="' + act + '"';
    if (data) for (var k in data) if (Object.prototype.hasOwnProperty.call(data, k)) {
      attrs += ' data-' + k + '="' + esc(data[k]) + '"';
    }
    return '<button class="row"' + attrs + '>' +
      '<span class="icon-tile">' + ui.icon(icon, 19) + '</span>' +
      '<span class="row-main"><span class="row-title">' + title + '</span>' +
      '<span class="row-sub">' + sub + '</span></span>' +
      '<span class="row-end">' + ui.icon('arrowR', 19) + '</span>' +
    '</button>';
  }

  function renderOffers() {
    return '<div class="section-title">Ooredoo offers</div>' +
      '<div class="offer-strip">' +
        '<div class="offer-tile red"><span class="ot-tag">Shahry</span>' +
          '<h4>Double your data for 3 months</h4>' +
          '<p>Move up a Shahry tier and get double data on us.</p></div>' +
        '<div class="offer-tile dark"><span class="ot-tag">Nojoom</span>' +
          '<h4>Pay your bill with points</h4>' +
          '<p>Redeem Nojoom points against any Ooredoo bill.</p></div>' +
        '<div class="offer-tile teal"><span class="ot-tag">Hala</span>' +
          '<h4>Hala to Shahry in minutes</h4>' +
          '<p>Keep your number and your Nojoom balance.</p></div>' +
      '</div>';
  }

  /* ====================================================================== */
  /* Login — "/login"                                                        */
  /* ====================================================================== */

  function viewLogin() {
    var saved = OOD.store.getJSON(OOD.LS.session, null) || {};
    var name = saved.name || '';
    var demo = saved.demoNumber || 1;
    var toggleOn = OOD.store.get(OOD.LS.persona, '0') === '1';

    return '' +
      '<div class="login-wrap">' +
        '<div class="login-hero">' +
          ui.brand(34, 26) +
          '<h1>Log in to Ooredoo Qatar</h1>' +
          '<p>Manage your Shahry line, check your usage and redeem Nojoom points.</p>' +
        '</div>' +
        '<div class="field">' +
          '<label for="li-name">Name</label>' +
          '<input id="li-name" type="text" autocomplete="off" placeholder="e.g. khaled" value="' + esc(name) + '">' +
        '</div>' +
        '<div class="field">' +
          '<label for="li-demo">Demo number</label>' +
          '<input id="li-demo" type="number" min="1" step="1" value="' + esc(demo) + '">' +
        '</div>' +
        '<div class="uid-preview">' +
          '<div class="k">Your demo user ID</div>' +
          '<div class="v" id="uid-preview">' + esc(OOD.buildUserId(name || 'user', demo)) + '</div>' +
        '</div>' +
        '<div style="margin-top:18px">' +
          '<button class="btn btn-primary" data-act="login-submit">Log In</button>' +
        '</div>' +
        '<p class="kv-note" style="margin-top:14px;text-align:center">' +
          'Demo build &#183; no real Ooredoo credentials are used or stored.</p>' +
        '<div class="login-foot">' +
          '<span>Ooredoo Q.P.S.C. &#183; Doha, Qatar</span>' +
          '<button class="foot-dot" data-act="foot-dot" role="switch" aria-checked="' +
            (toggleOn ? 'true' : 'false') + '" tabindex="-1"></button>' +
          '<span>v7.4.1</span>' +
        '</div>' +
      '</div>';
  }

  /* ====================================================================== */
  /* Usage — "/usage" and "/usage/breakdown"                                 */
  /* ====================================================================== */

  function viewUsage() {
    var p = S.persona;
    var quota = p.current_plan_gb;
    var used = p.avg_monthly_gb;
    var pct = Math.min(100, Math.round(used / Math.max(quota, used) * 100));
    var capPct = Math.min(100, Math.round(quota / Math.max(quota, used) * 100));
    var insights = p.userProps.usage_insights_enabled;

    var html = ui.pageHeader('My Usage');

    html += '<div class="pad stack">' +
      '<div class="card quota-card">' +
        '<div class="quota-top">' +
          '<div>' +
            '<div style="font-size:12.5px;color:var(--muted);font-weight:600">Local data this cycle</div>' +
            '<div class="quota-used" style="margin-top:4px">' + OOD.num(used, 1) +
              ' <span class="of">GB of ' + quota + ' GB</span></div>' +
          '</div>' +
          '<span class="badge ' + (p.quota_exceeded ? 'red' : 'green') + '">' +
            (p.quota_exceeded ? 'Over quota' : 'Within quota') + '</span>' +
        '</div>' +
        '<div class="quota-bar"><i class="fill" style="width:' + pct + '%"></i>' +
          '<i class="cap" style="left:' + capPct + '%"></i></div>' +
        '<div class="quota-meta"><span>' + esc(p.current_plan_name) + '</span>' +
          '<span>Renews ' + OOD.nextBillDate() + '</span></div>' +
      '</div>' +

      '<div class="card">' +
        '<div class="bill-line"><span class="k">Plan charge</span>' +
          '<span class="v">' + OOD.qar(p.current_plan_qar) + '</span></div>' +
        '<div class="bill-line' + (p.overage_charge_qar > 0 ? ' flag' : '') + '">' +
          '<span class="k">Data overage this cycle</span>' +
          '<span class="v">' + OOD.qar(p.overage_charge_qar) + '</span></div>' +
        '<div class="bill-line"><span class="k">Months over quota (last 3)</span>' +
          '<span class="v">' + p.months_over_quota + ' of 3</span></div>' +
        '<div class="bill-line"><span class="k">Average monthly data</span>' +
          '<span class="v">' + OOD.num(p.avg_monthly_gb, 1) + ' GB</span></div>' +
      '</div>' +

      ui.breakdownToggle() +

      (insights
        ? '<div class="note green">' + ui.icon('shield', 18) +
          '<span><b>Usage insights are on for your line.</b> Per-app data figures are refreshed ' +
          'every few hours so you can see what is consuming your allowance.</span></div>'
        : '<div class="note neutral">' + ui.icon('info', 18) +
          '<span><b>Per-app usage insights are not available on your plan generation.</b> ' +
          'Totals above are network-metered and always up to date.</span></div>') +

      '<div class="card">' +
        '<div class="bill-line"><span class="k">Local calls &amp; SMS used</span>' +
          '<span class="v">' + p.voice_units_used + ' of ' + p.voice_units_total + ' units</span></div>' +
        '<div class="bill-line"><span class="k">Ooredoo-to-Ooredoo minutes</span>' +
          '<span class="v">Unlimited</span></div>' +
        '<div class="bill-line"><span class="k">GCC roaming data used</span>' +
          '<span class="v">0.0 GB</span></div>' +
      '</div>' +

      '<div class="rows">' +
        row('plans', 'Compare plans', 'See Shahry, Qatarna+ and Home+ options', 'go', { route: '/plans' }) +
        row('bill', 'My Bill', 'Charges for ' + OOD.billPeriod(), 'go', { route: '/bill' }) +
      '</div>' +

      ui.supportStrip() +
    '</div><div class="bottom-space"></div>';

    return html;
  }

  function viewUsageBreakdown() {
    var p = S.persona;
    var total = OOD.APP_USAGE.reduce(function (t, r) { return t + r.gb; }, 0);
    return ui.pageHeader('Usage Breakdown') +
      '<div class="pad stack">' +
        '<div class="card card-pad">' +
          '<h2 class="card-title">What used your data</h2>' +
          '<p class="card-sub">Cycle to date on ' + esc(p.current_plan_name) +
            '. Sorted by local data consumed.</p>' +
        '</div>' +
        ui.appUsageList(OOD.APP_USAGE, total) +
        '<div class="note">' + ui.icon('info', 18) +
          '<span>Streaming and social video are the biggest consumers on your line. ' +
          'Setting video quality to Standard in those apps typically cuts data use by a third.</span></div>' +
        '<div class="rows">' +
          row('plans', 'Find a plan that fits this usage', 'Compare Shahry and Qatarna+ allowances', 'go', { route: '/plans' }) +
        '</div>' +
      '</div><div class="bottom-space"></div>';
  }

  /* ====================================================================== */
  /* Plans — "/plans"                                                        */
  /* ====================================================================== */

  function plansForFilter() {
    if (S.planFamilyFilter === 'all') return OOD.PLANS.slice();
    return OOD.PLANS.filter(function (p) { return p.family === S.planFamilyFilter; });
  }

  /* The list the user actually sees:
       control   -> everything in the current family filter (GB copy only)
       treatment -> only the plans that fit the hardcoded consumption profile.
     The treatment filter is never relaxed: if a family contains nothing that
     fits, the empty state says so. Falling back to the unfiltered family would
     put a "fits your usage" line on a plan that does not fit. */
  function fitsPlan(plan) {
    var fits = OOD.fittingPlans(personaOrDefault());
    for (var i = 0; i < fits.length; i++) if (fits[i].id === plan.id) return true;
    return false;
  }

  function plansForRender() {
    var list = plansForFilter();
    if (S.variant !== 'treatment') return list;
    return list.filter(fitsPlan);
  }

  function viewPlans() {
    var p = personaOrDefault();
    var list = plansForRender();
    var reco = OOD.recommendedPlan(p);
    var treatment = S.variant === 'treatment';

    var html = ui.pageHeader('Upgrade Your Plan',
      '<button class="icon-btn" data-act="go" data-route="/search" aria-label="Search plans">' +
      ui.icon('search', 21) + '</button>');

    html += '<div class="pad stack">' +
      '<div class="card card-pad">' +
        '<div style="display:flex;align-items:center;gap:12px">' +
          '<span class="icon-tile">' + ui.icon('sim', 19) + '</span>' +
          '<span style="flex:1 1 auto">' +
            '<div style="font-size:12px;color:var(--muted);font-weight:600">Your current plan</div>' +
            '<div style="font-size:15.5px;font-weight:800;letter-spacing:-.2px;margin-top:2px">' +
              esc(p.current_plan_name) + '</div>' +
          '</span>' +
          '<span style="text-align:right">' +
            '<div style="font-size:17px;font-weight:800;color:var(--ood-red);letter-spacing:-.4px">' +
              OOD.qar(p.current_plan_qar, 0) + '</div>' +
            '<div style="font-size:11px;color:var(--muted)">per month</div>' +
          '</span>' +
        '</div>' +
      '</div>' +
      ui.breakdownToggle() +
    '</div>';

    /* family filter chips */
    html += '<div class="chips" style="margin-top:14px">';
    for (var i = 0; i < OOD.FAMILIES.length; i++) {
      var f = OOD.FAMILIES[i];
      html += '<button class="chip" data-act="chip" data-family="' + f.key + '" aria-selected="' +
        (S.planFamilyFilter === f.key ? 'true' : 'false') + '">' + esc(f.label) + '</button>';
    }
    html += '</div>';

    if (treatment) {
      html += '<div class="pad" style="margin-top:12px">' +
        '<div class="note">' + ui.icon('speed', 18) +
        '<span><b>Filtered to plans that fit your usage.</b> Based on your last 3 months ' +
        '(avg ' + p.avg_monthly_gb + ' GB, over quota in ' + p.months_over_quota + ' of 3).</span>' +
        '</div></div>';
    }

    html += '<div class="pad stack" style="margin-top:12px">';
    if (!list.length) {
      html += '<div class="empty">' + (treatment
        ? 'Nothing in this family fits ' + OOD.num(p.avg_monthly_gb, 0) +
          ' GB a month.<br>Try another family, or call ' + CFG.SUPPORT_LINE + '.'
        : 'No plans in this family right now.<br>Try another family or call ' +
          CFG.SUPPORT_LINE + '.') + '</div>';
    }
    for (var j = 0; j < list.length; j++) {
      var plan = list[j];
      var isCurrent = plan.id === p.current_plan_id;
      /* the consumption line is only ever attached to a plan that really fits */
      var showReco = treatment && !isCurrent && fitsPlan(plan);
      html += ui.planCard(plan, {
        current: isCurrent,
        reco: treatment && plan.id === reco.id,
        ribbon: treatment && plan.id === reco.id ? 'Best fit' : null,
        recoLine: showReco ? esc(OOD.recoLine(p, plan)) : null
      });
    }
    html += ui.supportStrip();
    html += '</div><div class="bottom-space"></div>';
    return html;
  }

  /* ====================================================================== */
  /* Plan detail — "/plans/:planId"                                          */
  /* ====================================================================== */

  function viewPlanDetail() {
    var plan = OOD.planById(S.planId);
    if (!plan) return viewPlans();
    var p = personaOrDefault();
    var shortlisted = S.shortlist.indexOf(plan.id) >= 0;
    var isCurrent = plan.id === p.current_plan_id;
    var delta = plan.qar - p.current_plan_qar;

    return ui.pageHeader('Plan Detail',
      '<button class="bookmark" style="width:32px;height:32px;border-radius:10px" ' +
      'data-act="shortlist" data-plan="' + plan.id + '" aria-pressed="' + (shortlisted ? 'true' : 'false') +
      '" aria-label="Shortlist plan">' + ui.icon(shortlisted ? 'bookmarkFill' : 'bookmark', 17) + '</button>') +
      '<div class="pad stack">' +
        '<div class="card card-pad">' +
          '<span class="badge grey">' + esc(plan.family_label) + '</span>' +
          '<h2 class="card-title" style="font-size:21px;margin-top:10px">' + esc(plan.name) + '</h2>' +
          '<p class="card-sub">' + esc(plan.gb_copy) + ' ' + esc(plan.minutes) + '.</p>' +
        '</div>' +
        '<div class="spec-grid">' +
          '<div><div class="k">Local data</div><div class="v">' + plan.gb + ' GB</div></div>' +
          '<div><div class="k">Monthly</div><div class="v">' + OOD.qar(plan.qar, 0) + '</div></div>' +
          '<div><div class="k">Activation fee</div><div class="v">' + OOD.qar(0, 0) + '</div></div>' +
          '<div><div class="k">Tax</div><div class="v">' + OOD.qar(0, 0) + '</div></div>' +
        '</div>' +
        '<div class="card card-pad">' +
          '<h3 class="card-title" style="font-size:14.5px">What&#39;s included</h3>' +
          '<ul class="incl">' +
            plan.inclusions.map(function (t) {
              return '<li><span class="tick">' + ui.icon('tick', 17) + '</span><span>' + esc(t) + '</span></li>';
            }).join('') +
          '</ul>' +
        '</div>' +
        '<div class="card">' +
          '<div class="bill-line"><span class="k">Your plan today</span>' +
            '<span class="v">' + esc(p.current_plan_name) + ' &#183; ' + OOD.qar(p.current_plan_qar, 0) + '</span></div>' +
          '<div class="bill-line"><span class="k">Monthly difference</span>' +
            '<span class="v">' + (delta >= 0 ? '+' : '&#8722;') + OOD.qar(Math.abs(delta), 0) + '</span></div>' +
          '<div class="bill-line"><span class="k">Activation fee</span>' +
            '<span class="v">Waived</span></div>' +
        '</div>' +
        (isCurrent
          ? '<div class="note neutral">' + ui.icon('info', 18) +
            '<span>This is your current plan. Pick a different plan to upgrade.</span></div>'
          : '<button class="btn btn-primary" data-act="upgrade-start" data-plan="' + plan.id + '">' +
            'Upgrade to this plan</button>') +
        '<p class="kv-note">Upgrades take effect from your next bill date (' + OOD.nextBillDate() +
          '). No activation fee, and Qatar applies no tax on plan charges.</p>' +
      '</div><div class="bottom-space"></div>';
  }

  /* ====================================================================== */
  /* Confirm upgrade — "/plans/upgrade"                                      */
  /* ====================================================================== */

  function viewUpgrade() {
    var plan = OOD.planById(S.selectedPlanId);
    if (!plan) return viewPlans();
    var p = S.persona;
    var payable = OOD.monthlyPayable(plan);

    return ui.pageHeader('Confirm Upgrade') +
      '<div class="pad stack">' +
        '<h2 class="hero-title" style="margin-left:0;margin-right:0">Confirm your upgrade</h2>' +
        '<p class="hero-sub" style="margin-left:0;margin-right:0">Review the change before we ' +
          'apply it to your line.</p>' +
        '<div class="card">' +
          '<div class="bill-line"><span class="k">Current plan</span>' +
            '<span class="v">' + esc(p.current_plan_name) + '</span></div>' +
          '<div class="bill-line"><span class="k">New plan</span>' +
            '<span class="v">' + esc(plan.name) + '</span></div>' +
          '<div class="bill-line"><span class="k">Data allowance</span>' +
            '<span class="v">' + p.current_plan_gb + ' GB &#8594; ' + plan.gb + ' GB</span></div>' +
          '<div class="bill-line"><span class="k">Monthly plan charge</span>' +
            '<span class="v">' + OOD.qar(plan.qar) + '</span></div>' +
          '<div class="bill-line"><span class="k">Activation fee (waived)</span>' +
            '<span class="v">' + OOD.qar(0) + '</span></div>' +
          '<div class="bill-line"><span class="k">Tax</span>' +
            '<span class="v">' + OOD.qar(0) + '</span></div>' +
          /* an itemised total has to add up, so the discount gets its own line */
          (S.promo.applied
            ? '<div class="bill-line flag"><span class="k">Promo ' + esc(CFG.PROMO_CODE) +
              ' (' + CFG.PROMO_PCT + '% for 3 months)</span>' +
              '<span class="v">&#8722;' + OOD.qar(plan.qar - payable) + '</span></div>'
            : '') +
          '<div class="bill-line total"><span class="k">Monthly payable</span>' +
            '<span class="v" id="payable-value">' + OOD.qar(payable) + '</span></div>' +
        '</div>' +
        '<div class="card card-pad">' +
          '<h3 class="card-title" style="font-size:14.5px">Promo code</h3>' +
          '<p class="card-sub">Have an Ooredoo offer code? Apply it to this upgrade.</p>' +
          '<div class="field inline-field" style="margin-top:12px">' +
            '<input id="promo-input" type="text" autocomplete="off" placeholder="Enter code" value="' +
              esc(S.promo.attempted || '') + '">' +
            '<button class="btn btn-outline" data-act="promo-apply">Apply</button>' +
          '</div>' +
          '<div id="promo-status" style="margin-top:10px">' + promoStatusHtml() + '</div>' +
        '</div>' +
        '<button class="btn btn-primary" data-act="upgrade-confirm">Confirm upgrade</button>' +
        '<button class="btn btn-ghost" data-act="go" data-route="/plans">Keep comparing plans</button>' +
        '<p class="kv-note">Your Nojoom points balance is not affected by a plan change.</p>' +
      '</div><div class="bottom-space"></div>';
  }

  function promoStatusHtml() {
    if (!S.promo.attempted) {
      return '<span class="kv-note">Codes are case-insensitive.</span>';
    }
    if (S.promo.applied) {
      return '<span class="badge green">' + ui.icon('check', 14) + ' ' + CFG.PROMO_PCT +
             '% off for 3 months applied</span>';
    }
    return '<span class="badge red">' + esc(S.promo.attempted) + ' is not a valid code</span>';
  }

  /* ====================================================================== */
  /* Upgrade confirmed — "/plans/confirmation"                               */
  /* ====================================================================== */

  function viewConfirmation() {
    var up = S.lastUpgrade;
    if (!up) return viewPlans();
    var plan = OOD.planById(up.planId);
    var p = S.persona;

    return '' +
      '<div class="success-wrap">' +
        '<span class="success-ring">' + ui.icon('check', 38, 2.2) + '</span>' +
        '<h1>Upgrade confirmed</h1>' +
        '<p>You are moving to <b>' + esc(plan.name) + '</b>. The new allowance starts on ' +
          OOD.nextBillDate() + '.</p>' +
        '<div class="ref-box"><div class="k">Upgrade reference</div>' +
          '<div class="v">' + esc(up.reference) + '</div></div>' +
      '</div>' +
      '<div class="pad stack" style="margin-top:18px">' +
        '<div class="card">' +
          '<div class="bill-line"><span class="k">Previous plan</span>' +
            '<span class="v">' + esc(p.current_plan_name) + '</span></div>' +
          '<div class="bill-line"><span class="k">New plan</span>' +
            '<span class="v">' + esc(plan.name) + '</span></div>' +
          '<div class="bill-line"><span class="k">Monthly plan charge</span>' +
            '<span class="v">' + OOD.qar(plan.qar) + '</span></div>' +
          (up.promoApplied
            ? '<div class="bill-line"><span class="k">Promo</span><span class="v">' + CFG.PROMO_PCT +
              '% off for 3 months</span></div>' : '') +
          '<div class="bill-line total"><span class="k">Monthly payable</span>' +
            '<span class="v">' + OOD.qar(up.payable) + '</span></div>' +
        '</div>' +
        '<div class="note green">' + ui.icon('shield', 18) +
          '<span>No activation fee and no tax. Your Nojoom points balance is unchanged.</span></div>' +
        '<button class="btn btn-primary" data-act="go" data-route="/">Back to Home</button>' +
        '<button class="btn btn-ghost" data-act="go" data-route="/bill">View my bill</button>' +
      '</div><div class="bottom-space"></div>';
  }

  /* ====================================================================== */
  /* Bill — "/bill"                                                          */
  /* ====================================================================== */

  function billOffer() {
    var p = personaOrDefault();
    var reco = OOD.recommendedPlan(p);
    if (p.overage_charge_qar > 0) {
      return {
        offer_type: 'overage_elimination',
        offer_pct: Math.round(p.overage_charge_qar / (p.current_plan_qar + p.overage_charge_qar) * 100),
        saving_qar: p.overage_charge_qar,
        plan: reco,
        head: 'Stop paying for extra data',
        body: 'You paid ' + OOD.qar(p.overage_charge_qar, 0) + ' in data overage this cycle. ' +
              reco.name + ' includes ' + reco.gb + ' GB for ' + OOD.qar(reco.qar, 0) + '/month.'
      };
    }
    return {
      offer_type: 'promo_first_three_months',
      offer_pct: CFG.PROMO_PCT,
      saving_qar: Math.round(reco.qar * CFG.PROMO_PCT / 100),
      plan: reco,
      head: 'More data, ' + CFG.PROMO_PCT + '% off for 3 months',
      body: reco.name + ' gives you ' + reco.gb + ' GB. Use code ' + CFG.PROMO_CODE +
            ' at upgrade and save ' + OOD.qar(Math.round(reco.qar * CFG.PROMO_PCT / 100), 0) + '/month.'
    };
  }

  function viewBill() {
    var p = S.persona;
    var offer = billOffer();
    var total = p.current_plan_qar + p.overage_charge_qar;

    return ui.pageHeader('My Bill') +
      '<div class="pad stack">' +
        '<div class="bill-hero">' +
          '<div style="flex:1 1 auto">' +
            '<div class="lbl">' + OOD.billPeriod() + ' &#183; due ' + OOD.dueDate() + '</div>' +
            '<div class="amount">' + OOD.qar(total) + '</div>' +
            '<div class="lbl">' + esc(p.msisdn) + ' &#183; ' + esc(p.current_plan_name) + '</div>' +
          '</div>' +
          '<button class="btn btn-primary btn-sm" data-act="pay-now">Pay now</button>' +
        '</div>' +
        '<div class="card">' +
          '<div class="bill-line"><span class="k">Monthly plan charge</span>' +
            '<span class="v">' + OOD.qar(p.current_plan_qar) + '</span></div>' +
          '<div class="bill-line' + (p.overage_charge_qar > 0 ? ' flag' : '') + '">' +
            '<span class="k">Data overage (out of bundle)</span>' +
            '<span class="v">' + OOD.qar(p.overage_charge_qar) + '</span></div>' +
          '<div class="bill-line"><span class="k">International &amp; roaming</span>' +
            '<span class="v">' + OOD.qar(0) + '</span></div>' +
          '<div class="bill-line"><span class="k">Tax</span><span class="v">' + OOD.qar(0) + '</span></div>' +
          '<div class="bill-line total"><span class="k">Total due</span>' +
            '<span class="v">' + OOD.qar(total) + '</span></div>' +
        '</div>' +

        '<div class="offer-banner">' +
          '<span class="tag">Upgrade offer</span>' +
          '<h3>' + esc(offer.head) + '</h3>' +
          '<p>' + esc(offer.body) + '</p>' +
          '<button class="btn" data-act="offer-cta" data-plan="' + offer.plan.id + '">See the plan</button>' +
        '</div>' +

        '<div class="rows">' +
          row('bill', 'Bill history', 'Last 12 months of Ooredoo bills', 'bill-history', null) +
          row('wallet', 'Pay with Nojoom points', Number(p.nojoom_points).toLocaleString('en-US') +
              ' points available', 'go', { route: '/nojoom' }) +
          row('data', 'What used my data', 'Open My Usage for this cycle', 'go', { route: '/usage' }) +
        '</div>' +
        ui.supportStrip() +
      '</div><div class="bottom-space"></div>';
  }

  /* ====================================================================== */
  /* Help — "/help"                                                          */
  /* ====================================================================== */

  function viewHelp() {
    var html = ui.pageHeader('Help') +
      '<div class="pad">' +
        '<h2 class="hero-title" style="margin-left:0;margin-right:0">How can we help?</h2>' +
        '<p class="hero-sub" style="margin-left:0;margin-right:0">Answers about data usage, ' +
          'billing and changing your plan.</p>' +
      '</div><div class="pad">';

    for (var i = 0; i < OOD.HELP_ARTICLES.length; i++) {
      var a = OOD.HELP_ARTICLES[i];
      var open = S.openArticle === a.id;
      var rating = S.ratings[a.id] || 0;
      html += '<article class="article">' +
        '<button class="a-head" data-act="article" data-id="' + a.id + '">' +
          '<span class="icon-tile">' + ui.icon('help', 19) + '</span>' +
          '<span style="flex:1 1 auto;min-width:0">' +
            '<span class="a-title">' + esc(a.title) + '</span>' +
            '<span class="a-meta">' + esc(a.cat) + ' &#183; ' + a.mins + ' min read</span>' +
          '</span>' +
          '<span class="a-chev">' + ui.icon(open ? 'chevD' : 'chevR', 19) + '</span>' +
        '</button>';
      if (open) {
        html += '<div class="a-body">' +
          a.body.map(function (t) { return '<p>' + esc(t) + '</p>'; }).join('') +
          '<div class="rating">' +
            '<span class="lbl">Was this helpful?</span>' +
            [1, 2, 3, 4, 5].map(function (n) {
              return '<button class="star' + (n <= rating ? ' on' : '') + '" data-act="rate" data-id="' +
                a.id + '" data-v="' + n + '" aria-label="Rate ' + n + ' out of 5">&#9733;</button>';
            }).join('') +
            (rating ? '<span class="thanks">Thanks for rating</span>' : '') +
          '</div>' +
        '</div>';
      }
      html += '</article>';
    }

    html += '</div><div class="pad" style="margin-top:14px">' +
      '<div class="rows">' +
        row('call', 'Call Ooredoo Care', 'Dial ' + CFG.SUPPORT_LINE + ' free from your mobile', 'call-111', null) +
        row('plans', 'Compare plans', 'Shahry, Qatarna+, Home+ and Family Share', 'go', { route: '/plans' }) +
        row('data', 'My Usage', 'Data, calls and SMS for this cycle', 'go', { route: '/usage' }) +
      '</div>' +
    '</div><div class="bottom-space"></div>';
    return html;
  }

  /* ====================================================================== */
  /* Search — "/search"                                                      */
  /* ====================================================================== */

  function searchMatches(q) {
    var s = String(q || '').trim().toLowerCase();
    if (!s) return [];
    return OOD.PLANS.filter(function (p) {
      var hay = (p.name + ' ' + p.family_label + ' ' + p.family + ' ' + p.gb + ' gb ' +
                 p.qar + ' ' + p.gb_copy).toLowerCase();
      return hay.indexOf(s) >= 0;
    });
  }

  function viewSearch() {
    return ui.pageHeader('Search Plans') +
      '<div class="pad">' +
        '<div class="search-bar">' + ui.icon('search', 19) +
          '<input id="search-input" type="search" autocomplete="off" ' +
            'placeholder="Search Shahry, Qatarna+, GB or price" value="' + esc(S.searchQuery) + '">' +
          '<button class="clear" data-act="search-clear" aria-label="Clear">&#215;</button>' +
        '</div>' +
        '<p class="kv-note" style="margin-top:10px">Try &ldquo;60 GB&rdquo;, &ldquo;Qatarna&rdquo; ' +
          'or &ldquo;family&rdquo;.</p>' +
      '</div>' +
      '<div class="pad stack" id="search-results" style="margin-top:6px">' + searchResultsHtml() + '</div>' +
      '<div class="bottom-space"></div>';
  }

  function searchResultsHtml() {
    var q = S.searchQuery;
    if (!String(q).trim()) {
      return '<div class="empty">Search the full Ooredoo postpaid range &mdash; Shahry, Qatarna+, ' +
             'Data Add-On, Home+ and Family Share.</div>';
    }
    var res = searchMatches(q);
    if (!res.length) {
      return '<div class="empty">No plans match &ldquo;' + esc(q) + '&rdquo;.<br>' +
             'Call ' + CFG.SUPPORT_LINE + ' and we will find the right plan for you.</div>';
    }
    var html = '<div class="kv-note" style="margin-bottom:2px">' + res.length + ' plan' +
               (res.length === 1 ? '' : 's') + ' found</div>';
    for (var i = 0; i < res.length; i++) {
      html += ui.planCard(res[i], { current: res[i].id === personaOrDefault().current_plan_id });
    }
    return html;
  }

  function repaintSearchResults() {
    var el = document.getElementById('search-results');
    if (el) el.innerHTML = searchResultsHtml();
  }

  /* ====================================================================== */
  /* Nojoom — "/nojoom"                                                      */
  /* ====================================================================== */

  function viewNojoom() {
    var p = S.persona;
    var tiers = ['Basic', 'Silver', 'Gold', 'Red'];
    var idx = tiers.indexOf(p.nojoom_label);
    return ui.pageHeader('Nojoom') +
      '<div class="pad stack">' +
        '<div class="nojoom-hero">' +
          '<div style="font-size:12px;letter-spacing:.6px;text-transform:uppercase;opacity:.9;' +
            'font-weight:700">Nojoom points</div>' +
          '<div class="pts" style="margin-top:8px">' + Number(p.nojoom_points).toLocaleString('en-US') +
            '<small>points</small></div>' +
          '<span class="tier">' + ui.icon('star', 14) + ' Nojoom ' + esc(p.nojoom_label) + '</span>' +
          '<div class="tier-track">' + tiers.map(function (t, i) {
            return '<i class="' + (i <= idx ? 'on' : '') + '"></i>';
          }).join('') + '</div>' +
          '<div class="tier-labels">' + tiers.map(function (t) {
            return '<span>' + t + '</span>';
          }).join('') + '</div>' +
        '</div>' +
        '<div class="rows">' +
          row('wallet', 'Pay your bill with points', '100 points = ' + OOD.qar(1, 0), 'redeem', null) +
          row('gift', 'Nojoom partner offers', 'Dining, travel and retail across Qatar', 'redeem', null) +
          row('data', 'Swap points for data', '2,500 points = 5 GB local data', 'redeem', null) +
        '</div>' +
        '<div class="note">' + ui.icon('info', 18) +
          '<span>Nojoom points are earned on every Ooredoo bill and never expire while your ' +
          'line is active. Higher Shahry plans earn points faster.</span></div>' +
        ui.supportStrip() +
      '</div><div class="bottom-space"></div>';
  }

  /* ====================================================================== */
  /* More — "/more"                                                          */
  /* ====================================================================== */

  function viewMore() {
    var p = S.persona;
    return ui.pageHeader('More') +
      '<div class="pad stack">' +
        '<div class="card card-pad">' +
          '<div style="display:flex;align-items:center;gap:12px">' +
            '<span class="icon-tile" style="width:46px;height:46px;border-radius:14px">' +
              ui.icon('person', 24) + '</span>' +
            '<span style="flex:1 1 auto;min-width:0">' +
              '<div style="font-size:16px;font-weight:800;letter-spacing:-.2px">' +
                esc(S.user.name.charAt(0).toUpperCase() + S.user.name.slice(1)) + '</div>' +
              '<div style="font-size:12.5px;color:var(--muted);margin-top:2px">' +
                esc(p.msisdn) + ' &#183; ' + esc(p.current_plan_name) + '</div>' +
            '</span>' +
            '<span class="badge gold">Nojoom ' + esc(p.nojoom_label) + '</span>' +
          '</div>' +
          '<div class="uid-preview" style="margin-top:14px">' +
            '<div class="k">Signed in as</div><div class="v">' + esc(S.user.userId) + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="rows">' +
          row('data', 'My Usage', 'Data, calls and SMS for this cycle', 'go', { route: '/usage' }) +
          row('bill', 'My Bill', OOD.billPeriod() + ' &#183; ' +
              OOD.qar(p.current_plan_qar + p.overage_charge_qar, 0), 'go', { route: '/bill' }) +
          row('plans', 'Manage plan', 'Upgrade your Shahry or Qatarna+ plan', 'go', { route: '/plans' }) +
          row('search', 'Search plans', 'Find a plan by name, GB or price', 'go', { route: '/search' }) +
          row('gift', 'Nojoom rewards', 'Points, tier and redemptions', 'go', { route: '/nojoom' }) +
          row('help', 'Help &amp; support', 'Articles and Ooredoo Care', 'go', { route: '/help' }) +
        '</div>' +
        '<div class="rows">' +
          row('roam', 'Roaming guide', 'Discover before you travel', 'soon', null) +
          row('sim', 'SIM management', 'eSIM, PUK retrieval and SIM swap', 'soon', null) +
          row('tv', 'Ooredoo TV', 'Manage your entertainment package', 'soon', null) +
        '</div>' +
        '<div class="rows">' +
          row('call', 'Call Ooredoo Care', 'Dial ' + CFG.SUPPORT_LINE + ' free from your mobile', 'call-111', null) +
          row('logout', 'Log out', 'Ends this demo session', 'logout', null) +
        '</div>' +
        '<p class="kv-note">Ooredoo Q.P.S.C. &#183; demo build v7.4.1 &#183; no real account data.</p>' +
      '</div><div class="bottom-space"></div>';
  }

  /* ====================================================================== */
  /* Standalone showcase — "/plans/recommended"                              */
  /* Reached only by typing the URL. Nothing in the app links here, it never  */
  /* reads the experiment flag, and it fires no taxonomy events.              */
  /* ====================================================================== */

  function viewRecommended() {
    var p = personaOrDefault();
    var fits = OOD.fittingPlans(p);
    var reco = OOD.recommendedPlan(p);
    var rows = p.userProps.usage_insights_enabled ? OOD.APP_USAGE : OOD.APP_USAGE_LEGACY;
    var total = rows.reduce(function (t, r) { return t + r.gb; }, 0);
    var open = S.showcaseOpen !== false;

    var html = ui.pageHeader('Recommended Plans') +
      '<div class="pad">' +
        '<h2 class="hero-title" style="margin-left:0;margin-right:0">Plans that fit your usage</h2>' +
        '<p class="hero-sub" style="margin-left:0;margin-right:0">Built from your last 3 months on ' +
          esc(p.current_plan_name) + '.</p>' +
      '</div>' +
      '<div class="pad stack">' +
        '<div class="note">' + ui.icon('speed', 18) +
          '<span><b>' + OOD.num(p.avg_monthly_gb, 0) + ' GB average per month</b>, over quota in ' +
          p.months_over_quota + ' of the last 3 cycles' +
          (p.overage_charge_qar > 0 ? ', ' + OOD.qar(p.overage_charge_qar, 0) +
            ' of overage on your latest bill' : '') + '.</span></div>';

    for (var i = 0; i < fits.length; i++) {
      html += ui.planCard(fits[i], {
        reco: fits[i].id === reco.id,
        ribbon: fits[i].id === reco.id ? 'Best fit' : null,
        recoLine: esc(OOD.recoLine(p, fits[i])),
        noShortlist: true
      });
    }

    html += '<button class="btn btn-ghost" data-act="showcase-breakdown">' +
      (open ? 'Hide what&#39;s using your data' : 'See what&#39;s using your data') + '</button>';

    if (open) {
      html += ui.appUsageList(rows, total);
    }

    html += '<div class="note neutral">' + ui.icon('info', 18) +
      '<span>Standalone showcase screen. It is not linked from anywhere in the app and is not ' +
      'part of the experiment.</span></div>' +
      ui.supportStrip() +
      '</div><div class="bottom-space"></div>';
    return html;
  }

  /* ====================================================================== */
  /* render                                                                  */
  /* ====================================================================== */

  var VIEWS = {
    '/': viewHome,
    '/login': viewLogin,
    '/usage': viewUsage,
    '/usage/breakdown': viewUsageBreakdown,
    '/plans': viewPlans,
    '/plans/detail': viewPlanDetail,
    '/plans/upgrade': viewUpgrade,
    '/plans/confirmation': viewConfirmation,
    '/plans/recommended': viewRecommended,
    '/bill': viewBill,
    '/help': viewHelp,
    '/search': viewSearch,
    '/nojoom': viewNojoom,
    '/more': viewMore
  };

  OOD.render = function (opts) {
    var o = opts || {};
    var route = S.route;
    var view = VIEWS[route] || viewHome;

    var screen = document.getElementById('screen');
    screen.innerHTML = view();
    ui.paintTabbar(route);
    document.title = OOD.title(route);

    /* Guarded so an unchanged class never writes the attribute — a stray
       mutation inside #phone would suppress a legitimate dead click. */
    var phone = document.getElementById('phone');
    var wantWash = route === '/';
    if (phone && phone.classList.contains('home-wash') !== wantWash) {
      phone.classList.toggle('home-wash', wantWash);
    }

    if (!o.keepScroll) screen.scrollTop = 0;

    var key = route + '|' + (S.planId || '');
    var isEntry = key !== lastRouteKey;
    if (isEntry && !o.silent) {
      lastRouteKey = key;
      onEnter(route);
    }

    if (route === '/search') {
      var si = document.getElementById('search-input');
      if (si && isEntry) { try { si.focus(); } catch (e) { /* ignore */ } }
    }
  };

  /* --------------------------------------------------- route-entry events */

  function onEnter(route) {
    /* [Amplitude] Page Viewed fires on EVERY route change, including the
       standalone showcase page. */
    OOD.onRouteEnter(route, S.planId);

    if (route === '/') {
      var a = OOD.attributionSnapshot || {};
      OOD.track('App Home Opened', {
        screen_name: 'home',
        logged_in: !!S.user,
        nojoom_tier: S.persona ? S.persona.userProps.nojoom_tier : 'not_logged_in',
        plan_generation: S.persona ? S.persona.userProps.plan_generation : 'not_logged_in',
        utm_source: a.utm_source || 'direct',
        utm_medium: a.utm_medium || 'direct',
        utm_campaign: a.utm_campaign || 'direct'
      });
      return;
    }

    if (route === '/usage') {
      var p = S.persona;
      OOD.track('Usage Summary Viewed', merge(OOD.usageProps(), {
        screen_name: 'usage',
        plan_id: p.current_plan_id,
        plan_monthly_qar: p.current_plan_qar,
        quota_gb: p.current_plan_gb
      }));
      /* exactly one of these two fires per /usage load */
      if (p.userProps.usage_insights_enabled) {
        OOD.track('Usage Insights Loaded', merge(OOD.usageProps(), {
          screen_name: 'usage',
          insight_source: 'per_app_metering',
          apps_reported: OOD.APP_USAGE.length
        }));
      } else {
        OOD.track('Usage Insights Unavailable', merge(OOD.usageProps(), {
          screen_name: 'usage',
          unavailable_reason: 'legacy_plan_generation',
          plan_generation: p.userProps.plan_generation
        }));
      }
      return;
    }

    if (route === '/plans') {
      S.plansVisit = {
        enteredAt: Date.now(),
        upgradeStarted: false,
        abandoned: false,
        plansShown: plansForRender().length
      };
      S.promo = { attempted: null, applied: false };

      OOD.resolveVariant(function (variant) {
        if (S.route !== '/plans') return;
        S.plansVisit.plansShown = plansForRender().length;

        OOD.track('Plan Options Viewed', {
          screen_name: 'plans',
          plans_shown: S.plansVisit.plansShown,
          plan_family_filter: S.planFamilyFilter,
          variant: variant,
          variant_source: S.variantSource,
          flag_key: CFG.FLAG_KEY
        });

        if (variant === 'treatment' && !S.recoShownForVisit) {
          S.recoShownForVisit = true;
          var per = personaOrDefault();
          var reco = OOD.recommendedPlan(per);
          OOD.track('Plan Recommendation Shown', merge(
            OOD.planProps(reco),
            OOD.usageProps(),
            {
              screen_name: 'plans',
              plans_shown: S.plansVisit.plansShown,
              variant: variant,
              flag_key: CFG.FLAG_KEY,
              recommendation_copy: OOD.recoLine(per, reco)
            }
          ));
        }
        /* re-render with the resolved arm (no analytics side effects) */
        OOD.render({ silent: true, keepScroll: true });
      });
      return;
    }

    if (route === '/bill') {
      var o = billOffer();
      OOD.track('Upgrade Offer Viewed', {
        screen_name: 'bill',
        offer_type: o.offer_type,
        offer_pct: o.offer_pct,
        saving_qar: o.saving_qar,
        plan_id: o.plan.id,
        plan_family: o.plan.family,
        plan_monthly_qar: o.plan.qar
      });
      return;
    }
  }

  /* ====================================================================== */
  /* interactions                                                            */
  /* ====================================================================== */

  function handleBreakdownTap() {
    var p = S.persona;
    if (p && p.userProps.usage_insights_enabled) {
      OOD.router.go('/usage/breakdown');
      return;
    }
    /* Persona B: the control is visually enabled but does nothing at all —
       no navigation, no DOM change. Only the event is emitted, so repeated
       taps also produce dead-click / rage-click signals. */
    S.breakdownTaps++;
    OOD.track('Usage Breakdown Tap Unresponsive', merge(OOD.usageProps(), {
      screen_name: OOD.screenName(S.route),
      element_selector: 'button.usage-breakdown-toggle',
      element_text: "See what's using your data",
      tap_index: S.breakdownTaps,
      plan_generation: p ? p.userProps.plan_generation : 'unknown',
      variant: S.variant || 'control'
    }));
  }

  function doLogin() {
    var nameEl = document.getElementById('li-name');
    var demoEl = document.getElementById('li-demo');
    var name = nameEl ? nameEl.value : '';
    var demo = demoEl ? (parseInt(demoEl.value, 10) || 1) : 1;
    if (!String(name).trim()) { ui.toast('Enter a name to continue'); return; }
    OOD.login(name, demo);
    OOD.router.go('/');
  }

  function startUpgrade(planId, entryPoint) {
    var plan = OOD.planById(planId);
    if (!plan) return;
    S.selectedPlanId = planId;
    S.promo = { attempted: null, applied: false };
    S.lastUpgrade = { reference: OOD.ref(), planId: planId, promoApplied: false, payable: plan.qar };
    if (S.plansVisit) S.plansVisit.upgradeStarted = true;

    OOD.track('Plan Upgrade Started', merge(OOD.planProps(plan), {
      screen_name: OOD.screenName(S.route),
      entry_point: entryPoint,
      variant: S.variant || 'control',
      plan_gb: plan.gb,
      current_plan_id: S.persona.current_plan_id,
      current_plan_gb: S.persona.current_plan_gb
    }));

    /* lastUpgrade is only a carrier for the reference until confirmation */
    var ref = S.lastUpgrade.reference;
    S.lastUpgrade = null;
    S.pendingReference = ref;
    OOD.router.go('/plans/upgrade');
  }

  function applyPromo() {
    var el = document.getElementById('promo-input');
    var code = el ? String(el.value || '').trim() : '';
    if (!code) { ui.toast('Enter a promo code'); return; }
    var plan = OOD.planById(S.selectedPlanId);
    var ok = code.toUpperCase() === CFG.PROMO_CODE;
    S.promo = { attempted: code, applied: ok };

    OOD.track('Upgrade Promo Applied', merge(OOD.planProps(plan), {
      screen_name: 'plans_upgrade',
      offer_attempted: code.toUpperCase(),
      offer_applied: ok,
      offer_pct: ok ? CFG.PROMO_PCT : 0
    }));

    OOD.render({ silent: true, keepScroll: true });
    ui.toast(ok ? CFG.PROMO_PCT + '% off applied for 3 months' : 'That code is not valid');
  }

  function confirmUpgrade() {
    var plan = OOD.planById(S.selectedPlanId);
    if (!plan) { OOD.router.go('/plans'); return; }
    var p = S.persona;
    var payable = OOD.monthlyPayable(plan);
    var reference = S.pendingReference || OOD.ref();

    S.lastUpgrade = {
      reference: reference,
      planId: plan.id,
      promoApplied: S.promo.applied,
      payable: payable
    };

    /* Revenue: Amplitude's reserved fields travel top-level in event options,
       alongside the event properties. */
    OOD.track('Plan Upgrade Confirmed', merge(OOD.planProps(plan), {
      screen_name: 'plans_upgrade',
      variant: S.variant || 'control',
      plan_gb: plan.gb,
      upgrade_reference: reference,
      mrr_delta_qar: plan.qar - p.current_plan_qar,
      overage_avoided_qar: p.overage_charge_qar,
      promo_applied: S.promo.applied,
      current_plan_id: p.current_plan_id
    }), {
      revenue: plan.qar,
      price: plan.qar,
      quantity: 1,
      revenueType: 'plan_upgrade'
    });

    /* a confirmed upgrade means the next one is no longer the first */
    if (S.user) {
      OOD.store.set(OOD.LS.upgrades + S.user.userId, String(OOD.upgradeCount() + 1));
    }
    /* The promo belongs to the upgrade that just completed — clearing it here
       stops a consumed discount leaking into monthly_payable_qar on later
       events. Clearing selectedPlanId means browser-back to /plans/upgrade
       returns to /plans instead of allowing a second, un-started confirm. */
    S.promo = { attempted: null, applied: false };
    S.selectedPlanId = null;
    S.pendingReference = null;
    OOD.router.go('/plans/confirmation');
  }

  function browseFamily(family) {
    S.planFamilyFilter = family;
    var shown = plansForRender().length;
    var label = 'All plans';
    for (var i = 0; i < OOD.FAMILIES.length; i++) {
      if (OOD.FAMILIES[i].key === family) label = OOD.FAMILIES[i].label;
    }
    OOD.track('Plan Family Browsed', {
      screen_name: 'plans',
      plan_family_name: family === 'all' ? 'all_plans' : family,
      plan_family_label: label,
      plans_shown: shown,
      variant: S.variant || 'control'
    });
    if (S.plansVisit) S.plansVisit.plansShown = shown;
    OOD.render({ silent: true, keepScroll: true });
  }

  function shortlist(planId) {
    var plan = OOD.planById(planId);
    if (!plan) return;
    var i = S.shortlist.indexOf(planId);
    if (i >= 0) {
      /* un-shortlisting is not part of the taxonomy — no event */
      S.shortlist.splice(i, 1);
      OOD.store.setJSON(OOD.LS.shortlist, S.shortlist);
      OOD.render({ silent: true, keepScroll: true });
      ui.toast('Removed from your shortlist');
      return;
    }
    S.shortlist.push(planId);
    OOD.store.setJSON(OOD.LS.shortlist, S.shortlist);
    OOD.track('Plan Shortlisted', merge(OOD.planProps(plan), {
      screen_name: OOD.screenName(S.route),
      plan_gb: plan.gb,
      shortlist_size: S.shortlist.length
    }));
    OOD.render({ silent: true, keepScroll: true });
    ui.toast('Saved to your shortlist');
  }

  function rateArticle(id, value) {
    var art = null;
    for (var i = 0; i < OOD.HELP_ARTICLES.length; i++) {
      if (OOD.HELP_ARTICLES[i].id === id) art = OOD.HELP_ARTICLES[i];
    }
    if (!art) return;
    S.ratings[id] = value;
    OOD.track('Help Article Read', {
      screen_name: 'help',
      help_article_rating: value,
      help_article_id: art.id,
      help_article_title: art.title,
      help_article_category: art.cat
    });
    OOD.render({ silent: true, keepScroll: true });
  }

  var searchTimer = null;
  function runSearch(reason) {
    /* a debounce that lands after the user has navigated away must not fire */
    if (S.route !== '/search') return;
    var q = String(S.searchQuery || '').trim();
    if (q.length < 2) { repaintSearchResults(); return; }
    var res = searchMatches(q);
    OOD.track('Plans Searched', {
      screen_name: 'search',
      search_query: q,
      plans_returned: res.length,
      search_trigger: reason
    });
    repaintSearchResults();
  }

  /* ---------------------------------------------------------- delegation */

  function install() {
    var screen = document.getElementById('screen');

    screen.addEventListener('click', function (ev) {
      var t = ev.target;

      /* the control under test — matched by its own class */
      if (t.closest && t.closest('.usage-breakdown-toggle')) {
        handleBreakdownTap();
        return;
      }

      var el = t.closest ? t.closest('[data-act]') : null;
      if (!el) return;
      var act = el.getAttribute('data-act');

      switch (act) {
        case 'back':
          OOD.router.back();
          break;
        case 'go':
          OOD.router.go(el.getAttribute('data-route'));
          break;
        case 'login-submit':
          doLogin();
          break;
        case 'foot-dot': {
          var on = OOD.store.get(OOD.LS.persona, '0') === '1';
          OOD.store.set(OOD.LS.persona, on ? '0' : '1');
          el.setAttribute('aria-checked', on ? 'false' : 'true');
          break;
        }
        case 'buy-addons':
          S.planFamilyFilter = 'data_add_on';
          OOD.router.go('/plans');
          break;
        case 'reco-tap': {
          var rp = OOD.planById(el.getAttribute('data-plan'));
          if (rp) {
            OOD.track('Recommended Plan Tapped', merge(OOD.planProps(rp), {
              screen_name: 'home',
              plan_gb: rp.gb,
              surface: 'home_recommended_card'
            }));
            OOD.router.go('/plans/detail', rp.id);
          }
          break;
        }
        case 'chip':
          browseFamily(el.getAttribute('data-family'));
          break;
        case 'plan-detail':
          OOD.router.go('/plans/detail', el.getAttribute('data-plan'));
          break;
        case 'shortlist':
          shortlist(el.getAttribute('data-plan'));
          break;
        case 'upgrade-start':
          startUpgrade(el.getAttribute('data-plan'), OOD.screenName(S.route));
          break;
        case 'promo-apply':
          applyPromo();
          break;
        case 'upgrade-confirm':
          confirmUpgrade();
          break;
        case 'offer-cta':
          OOD.router.go('/plans/detail', el.getAttribute('data-plan'));
          break;
        case 'article':
          S.openArticle = S.openArticle === el.getAttribute('data-id') ? null : el.getAttribute('data-id');
          OOD.render({ silent: true, keepScroll: true });
          break;
        case 'rate':
          rateArticle(el.getAttribute('data-id'), parseInt(el.getAttribute('data-v'), 10));
          break;
        case 'search-clear':
          S.searchQuery = '';
          var si = document.getElementById('search-input');
          if (si) { si.value = ''; try { si.focus(); } catch (e) { /* ignore */ } }
          repaintSearchResults();
          break;
        case 'showcase-breakdown':
          S.showcaseOpen = S.showcaseOpen === false;
          OOD.render({ silent: true, keepScroll: true });
          break;
        case 'pay-now':
          ui.toast('Payment sheet is out of scope in this demo build');
          break;
        case 'bill-history':
          ui.toast('Bill history is out of scope in this demo build');
          break;
        case 'redeem':
          ui.toast('Nojoom redemption is out of scope in this demo build');
          break;
        case 'soon':
          ui.toast('Not part of this demo build');
          break;
        case 'call-111':
          ui.toast('Dialling ' + CFG.SUPPORT_LINE + ' — Ooredoo Care');
          break;
        case 'notifications':
          ui.toast('No new notifications');
          break;
        case 'logout':
          OOD.logout();
          lastRouteKey = null;
          OOD.router.go('/login');
          break;
        default:
          break;
      }
    });

    /* live user-id preview + search input */
    screen.addEventListener('input', function (ev) {
      var id = ev.target.id;
      if (id === 'li-name' || id === 'li-demo') {
        var n = (document.getElementById('li-name') || {}).value || '';
        var d = parseInt((document.getElementById('li-demo') || {}).value, 10) || 1;
        var pv = document.getElementById('uid-preview');
        if (pv) pv.textContent = OOD.buildUserId(n || 'user', d);
        return;
      }
      if (id === 'search-input') {
        S.searchQuery = ev.target.value;
        if (searchTimer) clearTimeout(searchTimer);
        searchTimer = setTimeout(function () { runSearch('debounce'); }, 700);
      }
    });

    screen.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Enter') return;
      var id = ev.target.id;
      if (id === 'li-name' || id === 'li-demo') { doLogin(); }
      if (id === 'search-input') {
        if (searchTimer) clearTimeout(searchTimer);
        S.searchQuery = ev.target.value;
        runSearch('submit');
      }
      if (id === 'promo-input') { applyPromo(); }
    });

    /* tab bar */
    var tabbar = document.getElementById('tabbar');
    tabbar.addEventListener('click', function (ev) {
      var b = ev.target.closest ? ev.target.closest('.tab') : null;
      if (!b) return;
      OOD.router.go(b.getAttribute('data-route'));
    });
  }

  OOD.installHandlers = install;
})();
