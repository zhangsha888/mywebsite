/**
 * 首页/交易页公用行情轮询
 * 暴露 window.H5Quotes.poll(onData, options)
 */
(function (window, $) {
    'use strict';

    function normalizePrice(v) {
        if (v === undefined || v === null || v === '') {
            return '';
        }
        return String(v).replace(/,/g, '').trim();
    }

    function priceChanged(oldText, newPrice) {
        var a = parseFloat(normalizePrice(oldText));
        var b = parseFloat(normalizePrice(newPrice));
        if (isNaN(a) || isNaN(b)) {
            return normalizePrice(oldText) !== normalizePrice(newPrice);
        }
        return Math.abs(a - b) > 1e-10;
    }

    function restartFlash($el, cls) {
        cls = cls || 'price-flash';
        if (!$el || !$el.length || !$el[0]) {
            return;
        }
        $el.removeClass(cls);
        // 强制重开动效
        void $el[0].offsetWidth;
        $el.addClass(cls);
        clearTimeout($el.data('flashTimer'));
        $el.data('flashTimer', setTimeout(function () {
            $el.removeClass(cls);
        }, 480));
    }

    function formatPct(pct) {
        var n = parseFloat(pct);
        if (isNaN(n)) {
            n = 0;
        }
        return (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
    }

    /**
     * @param {function} onData 回调 (map)
     * @param {object} options { intervalMs }
     * @returns {{ stop: function }}
     */
    function poll(onData, options) {
        options = options || {};
        var intervalMs = options.intervalMs || 1000;
        var stopped = false;
        var inFlight = false;
        var timer = null;

        function schedule(ms) {
            if (stopped) {
                return;
            }
            clearTimeout(timer);
            timer = setTimeout(tick, ms);
        }

        function tick() {
            if (stopped || inFlight) {
                schedule(intervalMs);
                return;
            }
            if (document.hidden) {
                schedule(intervalMs);
                return;
            }
            inFlight = true;
            var req = H5.apiRequest('GET', '/index/h5api/pro_quotes', { _t: Date.now() }, { cache: false, timeout: 12000 });
            $.when(req).done(function (res) {
                if (stopped) {
                    return;
                }
                if (res && res.code === 1 && res.data) {
                    try {
                        onData(res.data);
                    } catch (e) {}
                }
            }).always(function () {
                inFlight = false;
                schedule(intervalMs);
            });
        }

        tick();
        return {
            stop: function () {
                stopped = true;
                clearTimeout(timer);
            }
        };
    }

    window.H5Quotes = {
        poll: poll,
        priceChanged: priceChanged,
        restartFlash: restartFlash,
        formatPct: formatPct,
        normalizePrice: normalizePrice
    };
})(window, window.jQuery);
