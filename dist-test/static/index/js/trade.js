(function () {
    function getBase64Codec() {
        if (typeof Base64 === 'undefined') {
            return null;
        }
        if (typeof Base64.decode === 'function') {
            return Base64;
        }
        try {
            return new Base64();
        } catch (e) {
            return null;
        }
    }

    var Base64Codec = getBase64Codec();

    function parseProList(data) {
        if (!data) {
            return null;
        }
        if (typeof data === 'object') {
            return data;
        }
        var raw = String(data).trim();
        if (!raw) {
            return null;
        }
        if (raw.charAt(0) === '{' || raw.charAt(0) === '[') {
            try {
                return jQuery.parseJSON(raw);
            } catch (e) {
                return null;
            }
        }
        if (!Base64Codec) {
            return null;
        }
        try {
            return jQuery.parseJSON(Base64Codec.decode(raw));
        } catch (e) {
            return null;
        }
    }

    function formatPctFromServer(v) {
        if (typeof v.pct !== 'undefined' && v.pct !== null && v.pct !== '') {
            var n = parseFloat(v.pct);
            if (!isNaN(n)) {
                return { text: (n >= 0 ? '+' : '') + n.toFixed(2) + '%', up: n >= 0 };
            }
        }
        var open = parseFloat(v.Open);
        var price = parseFloat(v.Price);
        if (!open || isNaN(open) || isNaN(price)) {
            return { text: '+0.00%', up: true };
        }
        var pct = ((price - open) / open) * 100;
        var up = pct >= 0;
        return { text: (up ? '+' : '') + pct.toFixed(2) + '%', up: up };
    }

    function applyQuote(pid, v) {
        var $price = $('#trade_p_' + pid);
        var $pct = $('#trade_ch_' + pid);
        if (!$price.length || !v || typeof v.Price === 'undefined') {
            return;
        }

        var priceStr = String(v.Price);
        var oldVal = parseFloat(String($price.text()).replace(/,/g, ''));
        var newVal = parseFloat(String(priceStr).replace(/,/g, ''));

        if ($price.text() !== priceStr) {
            $price.text(priceStr);
            if (!isNaN(oldVal) && !isNaN(newVal) && oldVal !== newVal) {
                $price.addClass('price-flash');
                setTimeout(function () {
                    $price.removeClass('price-flash');
                }, 450);
            }
        }

        var q = formatPctFromServer(v);
        var isDown = v.isup === 0;
        if (typeof v.isup === 'undefined' || v.isup === null || v.isup === '') {
            isDown = !q.up;
        } else if (v.isup === 2) {
            isDown = !q.up;
        }

        if ($pct.length) {
            $pct.text(q.text);
            $pct.toggleClass('down', isDown || !q.up);
        }
        $price.toggleClass('down', isDown || !q.up);

        var $card = $('#pid' + pid);
        if ($card.length) {
            if (typeof v.Open !== 'undefined') {
                $card.attr('data-open', v.Open);
            }
            if (typeof v.is_deal !== 'undefined') {
                var dealing = parseInt(v.is_deal, 10) === 1;
                $card.attr('data-deal', dealing ? '1' : '0');
                $card.toggleClass('is-closed', !dealing);
                var $tag = $card.find('.trade-closed-tag');
                if (dealing) {
                    $tag.remove();
                } else if (!$tag.length) {
                    $card.find('.trade-ui-vol').append(' <span class="trade-closed-tag">休市</span>');
                }
            }
            if (typeof v.vol_24h !== 'undefined' && v.vol_24h !== '') {
                $card.find('#trade_vol_' + pid + ', .vol-val').first().text(v.vol_24h);
            }
        }
    }

    function ajaxTradePro() {
        if (typeof jQuery === 'undefined') {
            return;
        }
        if (window.H5 && H5.apiUrl) {
            $.getJSON(H5.apiUrl('/index/h5api/pro_quotes'), function (res) {
                if (!res || res.code !== 1) {
                    return;
                }
                var list = res.data || {};
                $.each(list, function (pid, v) {
                    applyQuote(pid, v);
                });
            });
            return;
        }
        $.get('/index/index/ajaxindexpro', function (data) {
            var list = parseProList(data);
            if (!list) {
                return;
            }
            $.each(list, function (pid, v) {
                applyQuote(pid, v);
            });
        });
    }

    $(function () {
        ajaxTradePro();
        setInterval(ajaxTradePro, 500);
    });
})();
