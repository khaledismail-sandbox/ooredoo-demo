/* ==========================================================================
   Ooredoo Qatar demo — boot
   Order matters: Amplitude init (+ attribution identify) -> session restore
   -> handlers -> first route render (which fires the first page view).
   ========================================================================== */
(function () {
  'use strict';

  var OOD = window.OOD;

  function start() {
    OOD.ui.paintStatusBar();
    OOD.initAmplitude();
    OOD.restoreSession();
    OOD.installHandlers();
    OOD.router.sync(true);

    window.__OOREDOO__.state = OOD.state;
    window.__OOREDOO__.config = OOD.CONFIG;

    console.info('[Ooredoo demo] ready — base "' + (OOD.CONFIG.BASE || '(root)') +
      '", route "' + OOD.state.route + '". Inspect window.__OOREDOO__ for the event log, ' +
      'the resolved experiment variant and the active frustration path.');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
