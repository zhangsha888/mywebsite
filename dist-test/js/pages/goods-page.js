(function (window, $) {
    'use strict';

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function loadScript(src) {
        return $.Deferred(function (def) {
            if (document.querySelector('script[src="' + src + '"]')) {
                def.resolve();
                return;
            }
            var s = document.createElement('script');
            s.src = src;
            s.onload = function () { def.resolve(); };
            s.onerror = function () { def.reject(new Error('load failed: ' + src)); };
            document.body.appendChild(s);
        }).promise();
    }

    function productName(pro) {
        var name = pro.ptitle || '';
        if (pro.showcode) {
            return name + ' (' + pro.showcode + ')';
        }
        if (pro.procode) {
            return name + ' (' + pro.procode + ')';
        }
        return name;
    }

    function productNameHtml(pro) {
        var name = esc(pro.ptitle || '');
        if (pro.showcode) {
            return name + '<em>' + esc(pro.showcode) + '</em>';
        }
        if (pro.procode) {
            return name + '<em>' + esc(pro.procode) + '</em>';
        }
        return name;
    }

    function setGlobals(d) {
        var pro = d.pro || {};
        var protime = d.protime || [];
        var proscale = d.proscale || [];
        var lossrate = d.lossrate || [];
        var payChoose = d.pay_choose || [];
        var playing = d.playing_method || [];

        window.order_type = 0;
        window.order_pid = pro.pid;
        window.order_price = payChoose[0] || 0;
        var firstMin = parseInt(protime[0], 10);
        window.order_sen = (!isNaN(firstMin) && firstMin > 0) ? firstMin * 60 : 60;
        window.order_shouyi = proscale[0] || 0;
        window.order_kuishun = lossrate[0] || 0;
        window.newprice = pro.Price || 0;
        window.rawData_data = [];
        window.my_money = d.usermoney || 0;
        window.order_min_price = d.order_min_price || 0;
        window.order_max_price = d.order_max_price || 0;
        window.game_mode = playing.indexOf('????') >= 0 && playing.indexOf('????') < 0 ? 'manual' : 'time';
        window.manual_shouyi = d.proscale_manual || 0;
        window.manual_kuishun = d.lossrate_manual || 0;
    }

    function renderQuote(pro) {
        var isUp = parseFloat(pro.chajia) >= 0;
        var cls = isUp ? 'rise' : 'fall';
        var sign = isUp ? '+' : '';
        var arrow = isUp ? '?? : '??;
        var title = productName(pro);

        $('.header-item.goodstitle').text(title);
        $('#goods-product-name').html(productNameHtml(pro));
        $('.order-product-name, .order-state-product-name').text(title);

        $('#goods-live-price').text(pro.Price).removeClass('rise fall').addClass(cls);
        $('#goods-change-wrap').removeClass('rise fall').addClass(cls);
        $('#goods-chg-val').text(sign + pro.chajia);
        $('#goods-chg-pct').text(arrow + Math.abs(pro.zhangfu) + '%');
        $('#goods-high').text(pro.High);
        $('#goods-low').text(pro.Low);
        $('#goods-chg-stat').text(pro.chajia);
        $('#goods-pct-stat').text(pro.zhangfu + '%');
        $('.col-nowprice').text(pro.Price);
    }

    function renderTradeBar(isopen) {
        var $bar = $('.goods-trade-bar');
        if (!Number(isopen)) {
            $bar.html('<p class="goods-market-closed xiushi">??????????/p>');
            return;
        }
        $bar.html(
            '<a class="goods-trade-btn goods-trade-hold" href="' + H5.pageUrl('hold.html') + '">' +
            '<span class="goods-trade-btn-label chicang">??</span></a>' +
            '<button type="button" class="goods-trade-btn goods-trade-up" data-trade-action="lookup">' +
            '<span class="goods-trade-btn-label maizhang">??</span></button>' +
            '<button type="button" class="goods-trade-btn goods-trade-down" data-trade-action="lookdown">' +
            '<span class="goods-trade-btn-label maidie">??</span></button>'
        );
        if (typeof bindGoodsTradeButtons === 'function') {
            bindGoodsTradeButtons();
        }
        if (typeof bindGoodsHoldButtons === 'function') {
            bindGoodsHoldButtons();
        }
    }

    function renderModeBoxes(playing) {
        var html = '';
        if (playing.indexOf('????') >= 0) {
            html += '<div class="mode-box active" data-mode="time">????</div>';
        }
        if (playing.indexOf('????') >= 0) {
            html += '<div class="mode-box' + (html ? '' : ' active') + '" data-mode="manual">????</div>';
        }
        $('#goods-mode-boxes').html(html || '<div class="mode-box active" data-mode="time">????</div>');
    }

    function renderPeriodWidgets(protime, proscale, lossrate) {
        var html = '';
        var shown = 0;
        (protime || []).forEach(function (vo, idx) {
            var mins = parseInt(vo, 10);
            if (isNaN(mins) || mins <= 0) {
                return;
            }
            var sen = mins * 60;
            html += '<div class="period-widget' + (shown === 0 ? ' active' : '') + '" data-sen="' + sen + '" data-shouyi="' + esc(proscale[idx] || 0) + '" data-kuishun="' + esc(lossrate[idx] || 0) + '">' +
                '<div class="period-widget-content goods-period-time">' +
                '<span class="final_time ng-binding">' + sen + '</span><span class="final_unit">??/span></div></div>';
            shown += 1;
        });
        $('#goods-period-widgets').html(html);
    }

    function renderAmountBoxes(payChoose, usermoney) {
        var html = '';
        (payChoose || []).forEach(function (vo, idx) {
            html += '<div class="amount-box ng-binding' + (idx === 0 ? ' active' : '') + '" data-price="' + esc(vo) + '">?? + esc(vo) + '</div>';
        });
        $('#goods-amount-boxes').html(html);
        $('#money').text('?? + (payChoose[0] || 0));
        $('.pay_mymoney').text('?? + usermoney);
        $('.goods-order-allin').attr('data-price', usermoney);
        $('.no-money').toggleClass('ng-hide', parseFloat(usermoney) > parseFloat(payChoose[0] || 0));
        $('.no-max').text('?????????? + (window.order_max_price || 0));
        $('.no-min').text('?????????? + (window.order_min_price || 0));
    }

    function applyChartLabels(labels) {
        labels = labels || {};
        if (labels.maizhang) { $('.maizhang').text(labels.maizhang); }
        if (labels.maidie) { $('.maidie').text(labels.maidie); }
        if (labels.chicang) { $('.chicang').text(String(labels.chicang).replace(/[:?]\s*$/, '')); }
        if (labels.xiushi) { $('.xiushi').text(labels.xiushi); }
    }

    function syncOrderDefaults() {
        if (typeof selectFirstPeriodWidget === 'function') {
            selectFirstPeriodWidget();
        } else {
            var $p = $('.period-widget').first();
            if ($p.length) {
                window.order_sen = parseInt($p.attr('data-sen'), 10) || window.order_sen;
                window.order_shouyi = $p.attr('data-shouyi') || window.order_shouyi;
                window.order_kuishun = $p.attr('data-kuishun') || window.order_kuishun;
            }
        }
        var $amt = $('.amount-box').first();
        if ($amt.length) {
            window.order_price = parseFloat($amt.attr('data-price')) || window.order_price;
            $amt.addClass('active');
        }
        if (typeof updateOrderSubmitState === 'function') {
            updateOrderSubmitState();
        }
    }

    function wrapOrderPanelFix() {
        if (!window.toggle_order_confirm_panel || window.toggle_order_confirm_panel.__h5PanelWrapped) {
            return;
        }
        var orig = window.toggle_order_confirm_panel;
        window.toggle_order_confirm_panel = function () {
            var r = orig.apply(this, arguments);
            setTimeout(function () {
                if (typeof window.__goodsOrderPanelRunFix === 'function') {
                    window.__goodsOrderPanelRunFix();
                }
            }, 0);
            return r;
        };
        window.toggle_order_confirm_panel.__h5PanelWrapped = true;
    }

    function startPolling(pid) {
        if (typeof getdata === 'function') {
            getdata(pid);
            if (!window.__goodsPriceTimer) {
                window.__goodsPriceTimer = setInterval(function () { getdata(pid); }, 1000);
            }
        }
        if (!window.__goodsReloadTimer) {
            window.__goodsReloadTimer = setInterval(function () { window.location.reload(); }, 1000 * 60 * 5);
        }
    }

    function loadChartScripts() {
        var v = '20260916x';
        return loadScript('/static/index/js/lodash.min.js')
            .then(function () { return loadScript('/static/index/js/lk/order.js?v=' + v); })
            .then(function () { return loadScript('/static/index/js/lk/chardata.js?v=' + v); })
            .then(function () { return loadScript('/static/index/js/echarts.js'); })
            .then(function () { return loadScript('/static/index/js/m.js?v=' + v); });
    }

    window.H5PageGoods = {
        init: function () {
            var m = /[?&]pid=(\d+)/.exec(window.location.search);
            var pid = m ? m[1] : '';
            if (!pid) {
                window.location.href = H5.pageUrl('trade.html');
                return;
            }

            H5App.bootPage({
                requireAuth: true,
                tab: 'trade',
                onReady: function () {
                    $('.header-item.goodstitle, #goods-product-name').text('????..');
                    $('.goods-trade-bar').html('<p class="goods-market-closed">????..</p>');
                    return H5.apiRequest('GET', '/index/h5api/goods_data', { pid: pid }, { timeout: 20000 }).then(function (res) {
                        if (!res || res.code !== 1 || !res.data || !res.data.pro) {
                            var msg = (res && (res.msg || res.data)) ? (res.msg || res.data) : '??????;
                            $('.header-item.goodstitle, #goods-product-name').text(msg);
                            $('.goods-trade-bar').html('<p class="goods-market-closed">' + msg + '</p>');
                            if (window.layer && layer.msg) {
                                layer.msg(msg);
                            }
                            setTimeout(function () { window.location.href = H5.pageUrl('trade.html'); }, 1200);
                            return;
                        }
                        var d = res.data;
                        setGlobals(d);
                        renderQuote(d.pro);
                        renderTradeBar(d.isopen);
                        renderModeBoxes(d.playing_method || []);
                        renderPeriodWidgets(d.protime, d.proscale, d.lossrate);
                        renderAmountBoxes(d.pay_choose, d.usermoney);
                        applyChartLabels(d.chart_labels || {});

                        return loadChartScripts().then(function () {
                            wrapOrderPanelFix();
                            syncOrderDefaults();
                            startPolling(pid);
                            if (typeof autoHeight === 'function') {
                                try { autoHeight(); } catch (e1) {}
                            }
                            if (typeof getonedata === 'function') {
                                try { getonedata(true); } catch (e2) {}
                            }
                        }).fail(function () {
                            $('.goods-trade-bar').append('<p class="goods-market-closed" style="margin-top:6px;">????????????</p>');
                            if (window.layer && layer.msg) {
                                layer.msg('????????');
                            }
                        });
                    }).fail(function (xhr) {
                        var msg = '????????';
                        if (xhr && xhr.responseJSON && (xhr.responseJSON.msg || xhr.responseJSON.data)) {
                            msg = xhr.responseJSON.msg || xhr.responseJSON.data;
                        }
                        $('.header-item.goodstitle, #goods-product-name').text(msg);
                        $('.goods-trade-bar').html('<p class="goods-market-closed">' + msg + '</p>');
                        if (window.layer && layer.msg) {
                            layer.msg(msg);
                        }
                        setTimeout(function () { window.location.href = H5.pageUrl('trade.html'); }, 1500);
                    });
                }
            });
        }
    };
})(window, window.jQuery);
