(function () {
    var turnoverEl = document.getElementById('statTurnover');
    var onlineEl = document.getElementById('statOnline');
    if (!turnoverEl || !onlineEl) return;

    function formatTurnover() {
        var n = 1.45 + Math.random() * 0.55;
        return '¥' + n.toFixed(2) + '万亿';
    }

    function formatOnline() {
        var n = Math.floor(165 + Math.random() * 95);
        return n + '万人';
    }

    function flash(el, text) {
        el.classList.add('tick');
        setTimeout(function () {
            el.textContent = text;
            el.classList.remove('tick');
        }, 120);
    }

    function tick() {
        flash(turnoverEl, formatTurnover());
        flash(onlineEl, formatOnline());
    }

    turnoverEl.textContent = formatTurnover();
    onlineEl.textContent = formatOnline();

    setInterval(tick, 2200 + Math.floor(Math.random() * 800));
})();
