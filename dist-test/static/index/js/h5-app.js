/**
 * H5 静态应用公共逻辑：站点配置、Tabbar、鉴权守卫
 */
(function (window, $) {
    'use strict';

    if (!$ || !window.H5) {
        return;
    }

    var siteConfig = null;

    function loadSiteConfig() {
        if (siteConfig) {
            return $.Deferred().resolve(siteConfig).promise();
        }
        return H5.apiRequest('GET', '/index/h5api/site_config', null, { skipAuthRedirect: true })
            .then(function (res) {
                if (res && res.code === 1) {
                    siteConfig = res.data;
                    if (window.H5 && typeof H5.saveBrand === 'function') {
                        H5.saveBrand(siteConfig);
                    }
                    if (siteConfig.ui_lang) {
                        window.__UI_LANG__ = siteConfig.ui_lang;
                        window.__UI_LANG_NAME__ = siteConfig.ui_lang_name;
                        if (window.UII18n && typeof window.UII18n.apply === 'function') {
                            window.UII18n.apply();
                        }
                    }
                    if (siteConfig.web_name) {
                        document.title = siteConfig.web_name;
                    }
                    if (window.H5 && typeof H5.applyCachedBrandDom === 'function') {
                        H5.applyCachedBrandDom();
                    }
                }
                return siteConfig;
            });
    }

    function renderTabbar(active) {
        var conf = siteConfig || {};
        var kf = conf.zxkf || 'javascript:;';
        var html = '<nav class="home-ui-tabbar app-footer-nav">' +
            '<a href="' + H5.pageUrl('home.html') + '" class="' + (active === 'home' ? 'tab-active' : '') + '" data-tab="home"><span class="tab-icon">🏠</span><span>首页</span></a>' +
            '<a href="' + H5.pageUrl('hold.html') + '" class="' + (active === 'hold' ? 'tab-active' : '') + '" data-tab="hold"><span class="tab-icon">📋</span><span>订单记录</span></a>' +
            '<a href="' + H5.pageUrl('trade.html') + '" class="' + (active === 'trade' ? 'tab-active' : '') + '" data-tab="trade"><span class="tab-icon">📈</span><span>产品交易</span></a>' +
            '<a href="javascript:;" onclick="window.open(\'' + kf.replace(/'/g, "\\'") + '\',\'_blank\')" data-tab="kf"><span class="tab-icon">🎧</span><span>在线客服</span></a>' +
            '<a href="' + H5.pageUrl('mine.html') + '" class="' + (active === 'member' ? 'tab-active' : '') + '" data-tab="member"><span class="tab-icon">👤</span><span>个人中心</span></a>' +
            '</nav>';
        var mount = document.getElementById('h5-tabbar');
        if (mount) {
            mount.innerHTML = html;
        }
    }

    function bootPage(options) {
        options = options || {};
        H5.installAjaxHook();
        return loadSiteConfig().then(function () {
            if (options.requireAuth && !H5.requireAuth()) {
                return null;
            }
            if (options.tab) {
                renderTabbar(options.tab);
            }
            if (typeof options.onReady === 'function') {
                return options.onReady(siteConfig);
            }
            return siteConfig;
        }).fail(function () {
            if (typeof options.onReady === 'function') {
                try {
                    return options.onReady(null);
                } catch (e) {}
            }
            return null;
        });
    }

    window.H5App = {
        loadSiteConfig: loadSiteConfig,
        renderTabbar: renderTabbar,
        bootPage: bootPage,
        getSiteConfig: function () { return siteConfig; }
    };
})(window, window.jQuery);
