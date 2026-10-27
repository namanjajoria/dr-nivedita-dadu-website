// Homepage colour previews: ?theme=1|3|4 (or the switcher) sets html[data-theme] before first paint.
// Loaded without defer in <head> so the page never flashes peach. Remove once the client picks a palette.
(function () {
  var d = document, themes = ['peach', '1', '3', '4'];
  var w = '<span class="theme-switch-word">Theme </span>';
  var names = { peach: 'Peach', 1: w + '1', 3: w + '3', 4: w + '4' };
  var pick = new URLSearchParams(location.search).get('theme');
  if (themes.indexOf(pick) < 0) pick = 'peach';

  function apply(t) {
    if (t === 'peach') d.documentElement.removeAttribute('data-theme');
    else d.documentElement.setAttribute('data-theme', t);
  }
  apply(pick);

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
      b.innerHTML = '<span class="theme-switch-dot theme-switch-dot--' + t + '"></span>' + names[t];
      b.addEventListener('click', function () {
        pick = t;
        apply(t);
        bar.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        // keep the link shareable: the address bar always shows the theme on screen
        var q = new URLSearchParams(location.search);
        if (t === 'peach') q.delete('theme'); else q.set('theme', t);
        var s = q.toString();
        history.replaceState(null, '', location.pathname + (s ? '?' + s : '') + location.hash);
      });
      bar.appendChild(b);
    });
    d.body.appendChild(bar);
  });
})();
