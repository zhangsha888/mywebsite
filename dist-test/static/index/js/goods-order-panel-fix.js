/**
 * 订单确认弹窗强制修复（不依赖模板是否更新）
 * GOODS_UI_BUILD:20260602f
 */
(function (win, doc) {
    var BUILD = '20260602f';

    function isOrderPanelOpen() {
        return !!(
            doc.querySelector('.pro_mengban.glass_mask') ||
            doc.body.classList.contains('order-panel-open') ||
            doc.querySelector('.order-confirm-panel.open')
        );
    }

    function pruneEmptyAmountBoxes() {
        doc.querySelectorAll('.order-confirm-panel .amount-view .amount-box').forEach(function (el) {
            var price = (el.getAttribute('data-price') || '').trim();
            var text = (el.textContent || '').trim();
            if (!price || price === '0' || text === '￥' || text === '¥' || /^\s*[￥¥]\s*$/.test(text)) {
                el.parentNode && el.parentNode.removeChild(el);
            }
        });
    }

    function removeExpectProfitRow() {
        doc.querySelectorAll('.expect_profit, .goods-order-expect').forEach(function (el) {
            el.parentNode && el.parentNode.removeChild(el);
        });
    }

    function removeYieldLabels() {
        doc.querySelectorAll('.period_footer, .period-widget-footer').forEach(function (el) {
            el.parentNode && el.parentNode.removeChild(el);
        });
        doc.querySelectorAll('.period-widget').forEach(function (card) {
            var nodes = card.querySelectorAll('div, p, span');
            for (var i = 0; i < nodes.length; i++) {
                var t = (nodes[i].textContent || '').trim();
                if (/^收益\s*[\d.]+\s*%?$/.test(t)) {
                    nodes[i].parentNode && nodes[i].parentNode.removeChild(nodes[i]);
                }
            }
        });
    }

    function getConfirmPanel() {
        var open = doc.querySelector('.pro_mengban.glass_mask .order-confirm-panel');
        if (open) {
            return open;
        }
        return doc.querySelector('.order-confirm-panel');
    }

    function ensureSubmitBar() {
        var panel = getConfirmPanel();
        if (!panel) {
            return;
        }

        panel.style.setProperty('display', 'flex', 'important');
        panel.style.setProperty('flex-direction', 'column', 'important');
        panel.style.setProperty('max-height', '92vh', 'important');
        panel.style.setProperty('overflow', 'hidden', 'important');

        var body = panel.querySelector('.panel-body');
        if (body) {
            body.style.setProperty('flex', '1', 'important');
            body.style.setProperty('overflow-y', 'auto', 'important');
            body.style.setProperty('min-height', '0', 'important');
        }

        var bar = panel.querySelector('.goods-order-submit-bar, #goods-order-submit-fallback');
        if (!bar) {
            bar = doc.createElement('div');
            bar.id = 'goods-order-submit-fallback';
            bar.className = 'goods-order-submit-bar';
            bar.setAttribute('data-build', BUILD);
            bar.innerHTML =
                '<div class="row btn_confirm">' +
                '<div class="col">' +
                '<button type="button" class="button goods-order-submit-btn" onclick="addorder()">确认下单</button>' +
                '</div></div>';
            panel.appendChild(bar);
        }

        bar.style.setProperty('display', 'block', 'important');
        bar.style.setProperty('visibility', 'visible', 'important');
        bar.style.setProperty('flex-shrink', '0', 'important');

        var btn = bar.querySelector('.goods-order-submit-btn, .button');
        if (btn) {
            btn.style.setProperty('display', 'block', 'important');
            btn.style.setProperty('visibility', 'visible', 'important');
            btn.style.setProperty('width', '100%', 'important');
            btn.style.setProperty('height', '48px', 'important');
            btn.style.setProperty('line-height', '48px', 'important');
            btn.style.setProperty('margin', '0', 'important');
            btn.style.setProperty('border', 'none', 'important');
            btn.style.setProperty('border-radius', '12px', 'important');
            btn.style.setProperty('font-size', '16px', 'important');
            btn.style.setProperty('font-weight', '600', 'important');
            btn.style.setProperty('color', '#fff', 'important');
            btn.style.setProperty('background', 'linear-gradient(180deg,#4d9bff 0%,#3b7eff 100%)', 'important');
        }

        var oldBtn = panel.querySelector('.panel-body .btn_confirm');
        if (oldBtn && oldBtn !== bar.querySelector('.btn_confirm')) {
            oldBtn.style.setProperty('display', 'none', 'important');
        }
    }

    function runFix() {
        if (!doc.querySelector('.goods-chart-body')) {
            return;
        }
        removeYieldLabels();
        removeExpectProfitRow();
        pruneEmptyAmountBoxes();
        if (isOrderPanelOpen() || doc.querySelector('.order-confirm-panel')) {
            ensureSubmitBar();
        }
    }
    win.__goodsOrderPanelRunFix = runFix;

    if (!doc.getElementById('goods-order-panel-fix-style')) {
        var style = doc.createElement('style');
        style.id = 'goods-order-panel-fix-style';
        style.setAttribute('data-build', BUILD);
        style.textContent =
            '.period_footer,.period-widget-footer{display:none!important;height:0!important;overflow:hidden!important;visibility:hidden!important}' +
            '.order-confirm-panel.open{display:flex!important;flex-direction:column!important;max-height:92vh!important;overflow:hidden!important;background:#1b1a1e!important}' +
            '.order-confirm-panel.open .panel-body{flex:1 1 auto!important;min-height:0!important;overflow-y:auto!important;position:relative!important;top:auto!important;bottom:auto!important}' +
            '.goods-order-submit-bar,#goods-order-submit-fallback{display:block!important;visibility:visible!important;flex-shrink:0!important;padding:10px 14px 16px!important;background:#1b1a1e!important;border-top:1px solid rgba(255,255,255,.08)!important;z-index:10!important}' +
            '.goods-order-submit-bar .button,.goods-order-submit-btn{display:block!important;visibility:visible!important;width:100%!important;height:48px!important;line-height:48px!important;border-radius:12px!important;font-size:16px!important;font-weight:600!important;color:#fff!important;background:linear-gradient(180deg,#4d9bff 0%,#3b7eff 100%)!important;border:none!important}' +
            'body.goods-chart-body.order-panel-open .goods-order-overlays,.goods-order-overlays[data-force-show="1"]{display:block!important;visibility:visible!important;pointer-events:auto!important;z-index:9999!important}' +
            'body.goods-chart-body.order-panel-open .pro_mengban.glass_mask{display:block!important;background:rgba(0,0,0,.55)!important}';
        (doc.head || doc.documentElement).appendChild(style);
    }

    function wrapToggle() {
        if (!win.toggle_order_confirm_panel || win.toggle_order_confirm_panel.__panelFixed) {
            return;
        }
        var origToggle = win.toggle_order_confirm_panel;
        win.toggle_order_confirm_panel = function () {
            var r = origToggle.apply(this, arguments);
            setTimeout(runFix, 0);
            setTimeout(runFix, 200);
            return r;
        };
        win.toggle_order_confirm_panel.__panelFixed = true;
    }

    runFix();
    wrapToggle();
    doc.addEventListener('DOMContentLoaded', function () { runFix(); wrapToggle(); });
    win.addEventListener('load', function () { runFix(); wrapToggle(); });

    if (win.MutationObserver && doc.body) {
        new MutationObserver(function () {
            wrapToggle();
            runFix();
        }).observe(doc.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'hidden']
        });
    }

    var n = 0;
    var timer = win.setInterval(function () {
        wrapToggle();
        runFix();
        n += 1;
        if (n >= 60) {
            win.clearInterval(timer);
        }
    }, 500);
})(window, document);
