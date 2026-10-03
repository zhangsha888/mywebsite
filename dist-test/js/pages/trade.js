(function (window, $) {
    'use strict';

    var FALLBACK_IMG = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2248%22 height=%2248%22%3E%3Crect fill=%22%23e8ecf0%22 width=%2248%22 height=%2248%22 rx=%2210%22/%3E%3C/svg%3E';
    var quotePoller = null;

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function media(path) {
        if (window.H5 && H5.mediaUrl) {
            return H5.mediaUrl(path || '/public/jpg/logo.png');
        }
        return path || '/public/jpg/logo.png';
    }

    function isDown(vo) {
        if (typeof vo.is_up !== 'undefined' && vo.is_up !== null && vo.is_up !== '') {
            return parseInt(vo.is_up, 10) === 0;
        }
        if (typeof vo.isup !== 'undefined') {
            return parseInt(vo.isup, 10) === 0;
        }
        if (typeof vo.is_rise !== 'undefined') {
            return parseInt(vo.is_rise, 10) === 2;
        }
        return parseFloat(vo.pct) < 0;
    }

    function renderList(pro) {
        var html = '';
        var list = pro || [];
        if (!list.length) {
            $('#tradeList').html('<div class="trade-ui-empty" style="padding:40px 16px;text-align:center;color:#999;">暂无产品</div>');
            return;
        }
        list.forEach(function (vo) {
            var down = isDown(vo);
            var pct = typeof vo.pct !== 'undefined' ? parseFloat(vo.pct) : 0;
            if (isNaN(pct)) pct = 0;
            var thumb = media(vo.img);
            var dealing = parseInt(vo.is_deal, 10) === 1;
            var pctText = (window.H5Quotes ? H5Quotes.formatPct(pct) : ((pct >= 0 ? '+' : '') + pct.toFixed(2) + '%'));
            html += '<a href="' + H5.pageUrl('goods.html?pid=' + vo.pid) + '" class="trade-ui-card' + (dealing ? '' : ' is-closed') + '" id="pid' + vo.pid + '" data-open="' + esc(vo.Open || '') + '" data-deal="' + (dealing ? '1' : '0') + '">' +
                '<img class="trade-ui-thumb" src="' + esc(thumb) + '" alt="" onerror="this.src=\'' + FALLBACK_IMG + '\'">' +
                '<div class="trade-ui-main"><div class="trade-ui-name">' + esc(vo.ptitle) + '</div>' +
                '<div class="trade-ui-vol">• 24H量 <span class="vol-val" id="trade_vol_' + vo.pid + '">' + esc(vo.vol_24h || '--') + '</span>' +
                (dealing ? '' : ' <span class="trade-closed-tag">休市</span>') +
                '</div></div>' +
                '<div class="trade-ui-quote">' +
                '<span class="trade-ui-price ' + (down ? 'down' : '') + '" id="trade_p_' + vo.pid + '">' + esc(vo.Price) + '</span>' +
                '<span class="trade-ui-pct ' + (down ? 'down' : '') + '" id="trade_ch_' + vo.pid + '">' + pctText + '</span>' +
                '</div></a>';
        });
        $('#tradeList').html(html);
    }

    function applyTradeQuotes(list) {
        if (!list || !window.H5Quotes) {
            return;
        }
        $.each(list, function (pid, v) {
            var $price = $('#trade_p_' + pid);
            var $pct = $('#trade_ch_' + pid);
            var $card = $('#pid' + pid);
            if (!$price.length || !v || typeof v.Price === 'undefined') {
                return;
            }
            if (H5Quotes.priceChanged($price.text(), v.Price)) {
                $price.text(v.Price);
                H5Quotes.restartFlash($price);
            }
            var pct = typeof v.pct !== 'undefined' ? parseFloat(v.pct) : 0;
            if (isNaN(pct)) pct = 0;
            var down = (typeof v.isup !== 'undefined') ? parseInt(v.isup, 10) === 0 : pct < 0;
            $pct.text(H5Quotes.formatPct(pct));
            $price.toggleClass('down', down);
            $pct.toggleClass('down', down);
            if ($card.length && typeof v.is_deal !== 'undefined') {
                var dealing = parseInt(v.is_deal, 10) === 1;
                $card.attr('data-deal', dealing ? '1' : '0').toggleClass('is-closed', !dealing);
                var $tag = $card.find('.trade-closed-tag');
                if (dealing) {
                    $tag.remove();
                } else if (!$tag.length) {
                    $card.find('.trade-ui-vol').append(' <span class="trade-closed-tag">休市</span>');
                }
            }
            if (typeof v.vol_24h !== 'undefined' && v.vol_24h !== '') {
                $card.find('#trade_vol_' + pid).text(v.vol_24h);
            }
        });
    }

    function startTradeQuotes() {
        if (quotePoller && quotePoller.stop) {
            quotePoller.stop();
        }
        if (!window.H5Quotes) {
            return;
        }
        quotePoller = H5Quotes.poll(applyTradeQuotes, { intervalMs: 1000 });
    }

    window.H5PageTrade = {
        init: function () {
            H5App.bootPage({ requireAuth: true, tab: 'trade', onReady: function () {
                $('#tradeList').html('<div style="padding:40px 16px;text-align:center;color:#999;">加载中...</div>');
                return H5.apiRequest('GET', '/index/h5api/trade_list').then(function (res) {
                    if (res && res.code === 1) {
                        renderList(res.data && res.data.pro);
                        startTradeQuotes();
                    } else {
                        $('#tradeList').html('<div style="padding:40px 16px;text-align:center;color:#999;">加载失败</div>');
                    }
                }).fail(function () {
                    $('#tradeList').html('<div style="padding:40px 16px;text-align:center;color:#999;">网络错误</div>');
                });
            }});
        }
    };
})(window, window.jQuery);
