/**
 * 产品下单页兜底修复（不依赖模板是否更新）
 * GOODS_UI_BUILD:20260916x
 */
(function (win, doc) {
    var BUILD = '20260916x';
    if (win.__GOODS_PAGE_FIX_BUILD__ === BUILD) {
        return;
    }
    win.__GOODS_PAGE_FIX_BUILD__ = BUILD;

    function isGoodsPage() {
        var body = doc.body;
        return !!(
            doc.querySelector('.trade-view') ||
            doc.querySelector('#container') ||
            doc.querySelector('#ecKx') ||
            (body && body.classList && body.classList.contains('goods-chart-body'))
        );
    }

    function boot() {
        if (!doc.body || !isGoodsPage()) {
            return;
        }

        doc.documentElement.classList.add('goods-chart-root');
        doc.body.classList.add('goods-chart-body');

        var css =
            'html.goods-chart-root,html:has(.goods-chart-body){height:100%!important;overflow:hidden!important}' +
            'body.goods-chart-body{height:100%!important;overflow:hidden!important;' +
            '--goods-tabbar-h:calc(56px + env(safe-area-inset-bottom,0px));--goods-tradebar-h:64px}' +
            'body.goods-chart-body ion-content.trade-content{position:fixed!important;top:44px!important;' +
            'bottom:calc(var(--goods-tabbar-h) + var(--goods-tradebar-h))!important;left:0!important;right:0!important;' +
            'overflow-y:scroll!important;-webkit-overflow-scrolling:touch!important;touch-action:pan-y!important;z-index:1!important}' +
            'body.goods-chart-body ion-content .scroll-bar{display:none!important;pointer-events:none!important}' +
            'body.goods-chart-body #app,body.goods-chart-body .box,body.goods-chart-body .trade-view,body.goods-chart-body ion-view{min-height:0!important;height:auto!important;overflow:hidden!important}' +
            'body.goods-chart-body .trade-content footer.goods-chart-area,body.goods-chart-body .goods-chart-area{width:auto!important;margin:0 12px 8px!important;height:auto!important;min-height:0!important;max-height:none!important;position:relative!important;left:auto!important;right:auto!important;touch-action:pan-y!important}' +
            'body.goods-chart-body #container,body.goods-chart-body #ecKx{height:min(280px,42vh)!important;max-height:280px!important;background:#fff!important;touch-action:pan-y!important}' +
            'body.goods-chart-body .trade-content .scroll.goods-page-scroll{display:block!important;min-height:auto!important;padding-bottom:12px!important;transform:none!important;touch-action:pan-y!important}' +
            'body.goods-chart-body .goods-trade-bar,body.goods-chart-body .trade_bar.goods-trade-bar{position:fixed!important;left:0!important;right:0!important;bottom:var(--goods-tabbar-h)!important;z-index:1002!important;margin:0!important;padding:8px 12px!important;width:100%!important;min-height:var(--goods-tradebar-h)!important;height:auto!important;display:flex!important;gap:10px!important;box-sizing:border-box!important;background:rgba(238,245,251,.96)!important}' +
            'body.goods-chart-body #app>.box>.footer,body.goods-chart-body #app>.box>.app-footer-nav,body.goods-chart-body #h5-tabbar .home-ui-tabbar{display:flex!important;visibility:visible!important;position:fixed!important;left:0!important;right:0!important;bottom:0!important;z-index:1001!important}' +
            'body.goods-chart-body .history-panel:not(.is-visible){display:none!important;visibility:hidden!important;height:0!important;overflow:hidden!important;opacity:0!important;pointer-events:none!important;position:fixed!important;left:-9999px!important;width:0!important}' +
            'body.goods-chart-body .order-state-panel:not(.open){display:none!important;visibility:hidden!important}' +
            'body.goods-chart-body .order_mengban:not(.glass_mask),body.goods-chart-body .pro_mengban:not(.glass_mask){display:none!important}' +
            'body.goods-chart-body .goods-order-overlays[hidden]:not([data-force-show]){display:none!important;pointer-events:none!important}' +
            'body.goods-chart-body.order-panel-open .goods-order-overlays,body.goods-chart-body.order-state-open .goods-order-overlays,body.goods-chart-body .goods-order-overlays[data-force-show="1"]{display:block!important;visibility:visible!important;pointer-events:auto!important;position:fixed!important;inset:0!important;z-index:9999!important}' +
            'body.goods-chart-body .order-confirm-panel.open,body.goods-chart-body .order-state-panel.open{display:flex!important;flex-direction:column!important;align-items:stretch!important;visibility:visible!important;position:fixed!important;top:50%!important;left:50%!important;transform:translate(-50%,-50%)!important;z-index:10002!important;margin:0!important;width:92%!important;max-width:400px!important;background:#1b1a1e!important;overflow:hidden!important}' +
            'body.goods-chart-body .order-state-panel.open>.panel-header,body.goods-chart-body .order-state-panel.open>.panel-body{width:100%!important;max-width:100%!important;float:none!important;box-sizing:border-box!important}' +
            'body.goods-chart-body .order-state-panel.open .panel-body{flex:1 1 auto!important;position:relative!important;top:auto!important;left:auto!important;right:auto!important;bottom:auto!important}' +
            'body.goods-chart-body .order-state-panel.open .paysuccess.success{display:block!important;width:100%!important;float:none!important}' +
            'body.goods-chart-body .order-state-panel.open .circle_wrapper,body.goods-chart-body .order-state-panel.open .goods-order-countdown{position:relative!important;margin:0 auto 10px!important;left:auto!important;right:auto!important;top:auto!important;bottom:auto!important;float:none!important}' +
            'body.goods-chart-body .order-state-panel.open .button_row{width:100%!important;display:flex!important;justify-content:center!important;float:none!important;position:relative!important;bottom:auto!important;left:auto!important;right:auto!important}' +
            'body.goods-chart-body .order-state-panel.open .button_row .col{width:100%!important;max-width:100%!important;float:none!important;flex:1 1 auto!important;padding:0 16px!important}' +
            'body.goods-chart-body .order-state-panel.open .pay_order_sen,body.goods-chart-body .order-state-panel.open .goods-countdown-num{display:flex!important;visibility:visible!important;opacity:1!important;color:#ffd54f!important}';

        if (!doc.getElementById('goods-page-fix-style')) {
            var style = doc.createElement('style');
            style.id = 'goods-page-fix-style';
            style.setAttribute('data-build', BUILD);
            style.textContent = css;
            (doc.head || doc.documentElement).appendChild(style);
        }

        var sweeping = false;
        var sweepTimer = 0;

        function hideNode(el) {
            if (!el || !el.classList || el.classList.contains('is-visible') || el.classList.contains('open')) {
                return;
            }
            if (el.getAttribute('hidden') === 'hidden' && el.style.display === 'none') {
                return;
            }
            el.style.setProperty('display', 'none', 'important');
            el.style.setProperty('visibility', 'hidden', 'important');
            el.setAttribute('hidden', 'hidden');
        }

        function sweep() {
            if (sweeping || !doc.body || !doc.body.classList) {
                return;
            }
            if (doc.body.classList.contains('order-panel-open') || doc.body.classList.contains('order-state-open')) {
                return;
            }
            sweeping = true;
            try {
                var list, i;
                list = doc.querySelectorAll('.history-panel:not(.is-visible)');
                for (i = 0; i < list.length; i++) {
                    hideNode(list[i]);
                }

                list = doc.querySelectorAll('.order-state-panel:not(.open)');
                for (i = 0; i < list.length; i++) {
                    hideNode(list[i]);
                }

                list = doc.querySelectorAll('.order_mengban:not(.glass_mask), .pro_mengban:not(.glass_mask)');
                for (i = 0; i < list.length; i++) {
                    hideNode(list[i]);
                }

            var ov = doc.querySelector('.goods-order-overlays');
            if (ov && !ov.hasAttribute('data-force-show') && !doc.body.classList.contains('order-panel-open') && !doc.body.classList.contains('order-state-open')) {
                if (ov.getAttribute('hidden') !== 'hidden') {
                    ov.setAttribute('hidden', 'hidden');
                    ov.style.setProperty('display', 'none', 'important');
                }
            }
            } finally {
                sweeping = false;
            }
        }

        function scheduleSweep() {
            if (sweepTimer) {
                return;
            }
            sweepTimer = win.setTimeout(function () {
                sweepTimer = 0;
                sweep();
            }, 80);
        }

        sweep();
        doc.addEventListener('DOMContentLoaded', scheduleSweep);
        win.addEventListener('load', scheduleSweep);

        // 只监听节点增删，不监听 style，避免 setProperty 触发死循环卡死
        if (win.MutationObserver && doc.body) {
            new MutationObserver(function () {
                scheduleSweep();
            }).observe(doc.body, {
                childList: true,
                subtree: true
            });
        }

        var ticks = 0;
        var timer = win.setInterval(function () {
            scheduleSweep();
            ticks += 1;
            if (ticks >= 20) {
                win.clearInterval(timer);
            }
        }, 500);
    }

    if (doc.body) {
        boot();
    } else if (doc.addEventListener) {
        doc.addEventListener('DOMContentLoaded', boot);
    }
})(window, document);
