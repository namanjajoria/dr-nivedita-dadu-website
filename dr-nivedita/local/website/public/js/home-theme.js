// Homepage colour previews for the client: palettes 1, 3 and 4 (1 is the default; peach is not offered).
// ?theme=3|4 (or the switcher) picks another one. Loaded without defer in <head> so html[data-theme] is
// set before first paint. Remove once the client picks a palette.
(function () {
  var d = document, themes = ['1', '3', '4'], fallback = '1';
  var w = '<span class="theme-switch-word">Theme </span>';
  var pick = new URLSearchParams(location.search).get('theme');
  if (themes.indexOf(pick) < 0) pick = fallback;
  d.documentElement.setAttribute('data-theme', pick);

  d.addEventListener('DOMContentLoaded', function () {
    var bar = d.createElement('div');
    bar.className = 'theme-switch';
    bar.setAttribute('role', 'group');
    bar.setAttribute('aria-label', 'Colour theme preview');
    bar.innerHTML = '<span class="theme-switch-label">Colour theme</span>';
    themes.forEach(function (t) {
      var b = d.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-pressed', String(t === pick));
      b.innerHTML = '<span class="theme-switch-dot theme-switch-dot--' + t + '"></span>' + w + t;
      b.addEventListener('click', function () {
        pick = t;
        d.documentElement.setAttribute('data-theme', t);
        bar.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        // keep the link shareable: the address bar always shows the theme on screen
        var q = new URLSearchParams(location.search);
        if (t === fallback) q.delete('theme'); else q.set('theme', t);
        var s = q.toString();
        history.replaceState(null, '', location.pathname + (s ? '?' + s : '') + location.hash);
      });
      bar.appendChild(b);
    });
    d.body.appendChild(bar);
  });
})();
