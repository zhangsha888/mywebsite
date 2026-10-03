/**
 * H5 API 请求封装：自动拼接 API 域名、携带 Token、处理跨域
 */
(function (window) {
    'use strict';

    var STORAGE_TOKEN = 'h5_auth_token';
    var STORAGE_GATE = 'h5_gate_token';
    var STORAGE_USER = 'h5_auth_user';
    var STORAGE_LANG = 'h5_ui_lang';

    function cfg() {
        return window.H5_CONFIG || { apiBase: '' };
    }

    function warnBadApiBase() {
        try {
            if (window.__H5_API_BASE_WARNED__) {
                return;
            }
            var base = String((cfg().apiBase || '')).trim();
            if (!base || /你的API|example\.com|localhost|127\.0\.0\.1/i.test(base) || !/^https?:\/\//i.test(base)) {
                window.__H5_API_BASE_WARNED__ = true;
                console.warn('[H5] 请先在 config.js 把 apiBase 改成真实 PHP API 域名（https://...），否则跨域接口会失败。当前: ' + (base || '(空)'));
            }
        } catch (e) {}
    }
    warnBadApiBase();

    function getToken() {
        try {
            return localStorage.getItem(STORAGE_TOKEN) || '';
        } catch (e) {
            return '';
        }
    }

    function setAuth(auth, gateToken) {
        if (!auth || !auth.token) {
            return;
        }
        try {
            localStorage.setItem(STORAGE_TOKEN, auth.token);
            localStorage.setItem(STORAGE_USER, JSON.stringify(auth));
            if (gateToken) {
                localStorage.setItem(STORAGE_GATE, gateToken);
            }
        } catch (e) {}
    }

    function clearAuth() {
        try {
            localStorage.removeItem(STORAGE_TOKEN);
            localStorage.removeItem(STORAGE_USER);
        } catch (e) {}
    }

    function getGateToken() {
        try {
            return localStorage.getItem(STORAGE_GATE) || '';
        } catch (e) {
            return '';
        }
    }

    function setGateToken(token) {
        try {
            localStorage.setItem(STORAGE_GATE, token || '');
        } catch (e) {}
    }

    function getPageLang() {
        try {
            var m = window.location.search.match(/[?&]lang=([^&]+)/i);
            if (m) {
                return decodeURIComponent(m[1]);
            }
            var stored = localStorage.getItem(STORAGE_LANG);
            if (stored) {
                return stored;
            }
        } catch (e) {}
        return '';
    }

    function withLangParam(url) {
        var lang = getPageLang();
        if (!lang) {
            return url;
        }
        return url + (url.indexOf('?') >= 0 ? '&' : '?') + 'lang=' + encodeURIComponent(lang);
    }

    function apiUrl(path) {
        var base = (cfg().apiBase || '').replace(/\/+$/, '');
        if (!path) {
            return withLangParam(base);
        }
        if (/^https?:\/\//i.test(path)) {
            return path;
        }
        if (path.charAt(0) !== '/') {
            path = '/' + path;
        }
        return withLangParam(base + path);
    }

    /** 静态站用目录路径 /gate/，避免部分平台 gate.html -> /gate 死循环 */
    function rewriteHtmlPageHref(href) {
        if (!href || typeof href !== 'string') {
            return href;
        }
        if (/^https?:\/\//i.test(href) || href.indexOf('javascript:') === 0 || href.charAt(0) === '#') {
            return href;
        }
        if (!cfg().staticPages) {
            return href;
        }
        var m = href.match(/^(\/[A-Za-z0-9_-]+)\.html(\?[^#]*)?(#.*)?$/i);
        if (m) {
            return m[1] + '/' + (m[2] || '') + (m[3] || '');
        }
        return href;
    }

    function pageUrl(page) {
        if (!page) {
            return '/';
        }
        if (page.charAt(0) === '/') {
            return rewriteHtmlPageHref(page);
        }
        if (cfg().staticPages) {
            var m = page.match(/^([A-Za-z0-9_-]+)\.html(\?[^#]*)?(#.*)?$/i);
            if (m) {
                return '/' + m[1] + '/' + (m[2] || '') + (m[3] || '');
            }
        }
        return '/' + page;
    }

    function installStaticLinkRewrite() {
        if (!cfg().staticPages || window.__H5_LINK_REWRITE__) {
            return;
        }
        window.__H5_LINK_REWRITE__ = true;
        function patchLinks(root) {
            var scope = root || document;
            var links = scope.querySelectorAll('a[href*=".html"]');
            for (var i = 0; i < links.length; i++) {
                var href = links[i].getAttribute('href');
                if (href) {
                    links[i].setAttribute('href', rewriteHtmlPageHref(href));
                }
            }
        }
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', function () { patchLinks(); });
        } else {
            patchLinks();
        }
    }
    installStaticLinkRewrite();

    /**
     * 媒体资源 URL：静态站本地 /static 保留；上传图/幻灯片等走 API 域名
     */
    function mediaUrl(path) {
        if (!path) {
            return '';
        }
        path = String(path).replace(/\\/g, '/');
        if (/^https?:\/\//i.test(path) || path.indexOf('data:') === 0 || path.indexOf('blob:') === 0) {
            return path;
        }
        if (path.indexOf('/static/') === 0) {
            return path;
        }
        var base = (cfg().apiBase || '').replace(/\/+$/, '');
        if (!base || !cfg().staticPages) {
            return path.charAt(0) === '/' ? path : '/' + path;
        }
        if (path.charAt(0) !== '/') {
            path = '/' + path;
        }
        return base + path;
    }

    function brandMonogram(name) {
        var s = String(name || '').trim();
        if (!s) {
            return '·';
        }
        // 优先中文/字母数字首字
        var m = s.match(/[\u4e00-\u9fffA-Za-z0-9]/);
        return m ? m[0].toUpperCase() : s.charAt(0);
    }

    /**
     * 安全套用品牌 Logo：图片可访问才显示，失败则显示名称首字，避免空白白框
     */
    function applyBrandLogo(root, src, name) {
        if (!root) {
            return;
        }
        var wrap = typeof root === 'string' ? document.querySelector(root) : root;
        if (!wrap) {
            return;
        }
        var fallback = wrap.querySelector('.logo-fallback, .fallback');
        var mono = brandMonogram(name);
        if (fallback) {
            fallback.textContent = mono;
            fallback.style.display = '';
            fallback.style.opacity = '1';
        }
        wrap.classList.remove('has-logo');
        wrap.classList.add('show-fallback');

        if (!src) {
            var oldOnly = wrap.querySelector('img');
            if (oldOnly) {
                oldOnly.style.display = 'none';
            }
            return;
        }

        var img = wrap.querySelector('img');
        if (!img) {
            img = document.createElement('img');
            img.alt = name || '';
            wrap.insertBefore(img, wrap.firstChild);
        }
        img.onload = function () {
            this.style.display = '';
            wrap.classList.add('has-logo');
            wrap.classList.remove('show-fallback');
            if (fallback) {
                fallback.style.display = 'none';
            }
        };
        img.onerror = function () {
            this.style.display = 'none';
            wrap.classList.remove('has-logo');
            wrap.classList.add('show-fallback');
            if (fallback) {
                fallback.textContent = mono;
                fallback.style.display = '';
                fallback.style.opacity = '1';
            }
        };
        if (img.getAttribute('src') === src && img.complete && img.naturalWidth > 0) {
            img.onload();
        } else {
            img.style.display = 'none';
            img.src = src;
        }
    }

    function backendPage(path) {
        var token = getToken();
        var url = apiUrl(path);
        if (token) {
            url += (url.indexOf('?') >= 0 ? '&' : '?') + 'h5_token=' + encodeURIComponent(token);
        }
        return url;
    }

    function authHeaders() {
        var token = getToken();
        var headers = { 'X-H5-Client': '1' };
        if (token) {
            headers.Authorization = 'Bearer ' + token;
        }
        return headers;
    }

    function apiRequest(method, path, data, options) {
        var opts = options || {};
        var url = apiUrl(path);
        var m = (method || 'GET').toUpperCase();
        var ajaxOpts = {
            url: url,
            type: m,
            headers: authHeaders(),
            dataType: opts.dataType || 'json',
            timeout: opts.timeout || 30000,
            // 行情轮询等 GET 禁止浏览器/中间层缓存
            cache: typeof opts.cache === 'boolean' ? opts.cache : (m !== 'GET')
        };
        if (data) {
            ajaxOpts.data = data;
        }
        if (opts.processData === false) {
            ajaxOpts.processData = false;
            ajaxOpts.contentType = false;
        }
        return $.ajax(ajaxOpts).then(function (res) {
            if (res && res.code === -401) {
                clearAuth();
                if (!opts.skipAuthRedirect) {
                    window.location.href = pageUrl('login.html');
                }
                return $.Deferred().reject(res).promise();
            }
            return res;
        });
    }

    function requireAuth(redirectPage) {
        var token = getToken();
        if (!token) {
            window.location.href = pageUrl(redirectPage || 'login.html');
            return false;
        }
        return true;
    }

    function installAjaxHook() {
        if (!window.jQuery || window.__H5_AJAX_HOOKED__) {
            return;
        }
        window.__H5_AJAX_HOOKED__ = true;
        var $ = window.jQuery;

        function rewriteUrl(url) {
            if (typeof url !== 'string') {
                return url;
            }
            if (/^https?:\/\//i.test(url)) {
                return url;
            }
            if (url.indexOf('/index/') === 0 || url.indexOf('/static/') === 0) {
                if (url.indexOf('/index/') === 0) {
                    return apiUrl(url);
                }
            }
            return url;
        }

        var origAjax = $.ajax;
        $.ajax = function (url, options) {
            var settings;
            if (typeof url === 'object') {
                settings = url;
            } else {
                settings = options || {};
                settings.url = url;
            }
            settings.url = rewriteUrl(settings.url);
            settings.headers = $.extend({}, authHeaders(), settings.headers || {});
            var origError = settings.error;
            settings.error = function (xhr) {
                if (xhr && xhr.status === 401) {
                    clearAuth();
                    window.location.href = pageUrl('login.html');
                    return;
                }
                if (origError) {
                    origError.apply(this, arguments);
                }
            };
            return origAjax.call(this, settings);
        };

        $.get = function (url, data, success, type) {
            return $.ajax({
                url: rewriteUrl(url),
                type: 'GET',
                data: data,
                success: success,
                dataType: type
            });
        };

        $.getJSON = function (url, data, success) {
            return $.get(url, data, success, 'json');
        };

        $.post = function (url, data, success, type) {
            return $.ajax({
                url: rewriteUrl(url),
                type: 'POST',
                data: data,
                success: success,
                dataType: type
            });
        };
    }

    var STORAGE_BRAND = 'h5_site_brand';

    function getCachedBrand() {
        try {
            var raw = localStorage.getItem(STORAGE_BRAND);
            if (!raw) {
                return null;
            }
            var o = JSON.parse(raw);
            return o && typeof o === 'object' ? o : null;
        } catch (e) {
            return null;
        }
    }

    function saveBrand(conf) {
        if (!conf) {
            return;
        }
        var name = conf.web_name || '';
        var logo = conf.web_logo || '';
        if (!name && !logo) {
            return;
        }
        try {
            var prev = getCachedBrand() || {};
            localStorage.setItem(STORAGE_BRAND, JSON.stringify({
                web_name: name || prev.web_name || '',
                web_logo: logo || prev.web_logo || '',
                ts: Date.now()
            }));
        } catch (e) {}
    }

    /** 首屏立即套用缓存品牌，避免先闪默认名 */
    function applyCachedBrandDom() {
        var brand = getCachedBrand();
        if (!brand) {
            return null;
        }
        var name = brand.web_name || '';
        var logo = brand.web_logo || '';
        try {
            if (name) {
                document.title = name;
                var titles = document.querySelectorAll('.home-ui-brand-text h1, .login-brand h1, .gate-brand-text h2');
                for (var i = 0; i < titles.length; i++) {
                    titles[i].textContent = name;
                }
                var ens = document.querySelectorAll('.home-ui-brand-text p, .login-brand .en, .gate-brand-text p');
                for (var j = 0; j < ens.length; j++) {
                    ens[j].style.display = 'none';
                }
            }
            var src = logo ? mediaUrl(logo) : '';
            applyBrandLogo(document.querySelector('.login-logo-wrap'), src, name);
            applyBrandLogo(document.querySelector('.gate-brand .logo-circle'), src, name);
            var homeImg = document.querySelector('.home-ui-brand > img');
            if (homeImg) {
                if (src) {
                    homeImg.onload = function () { this.style.display = ''; };
                    homeImg.onerror = function () { this.style.display = 'none'; };
                    homeImg.src = src;
                } else {
                    homeImg.style.display = 'none';
                }
            }
        } catch (e) {}
        return brand;
    }

    window.H5 = {
        cfg: cfg,
        apiUrl: apiUrl,
        pageUrl: pageUrl,
        mediaUrl: mediaUrl,
        backendPage: backendPage,
        getToken: getToken,
        setAuth: setAuth,
        clearAuth: clearAuth,
        getGateToken: getGateToken,
        setGateToken: setGateToken,
        getPageLang: getPageLang,
        authHeaders: authHeaders,
        apiRequest: apiRequest,
        requireAuth: requireAuth,
        installAjaxHook: installAjaxHook,
        getCachedBrand: getCachedBrand,
        saveBrand: saveBrand,
        applyCachedBrandDom: applyCachedBrandDom,
        applyBrandLogo: applyBrandLogo,
        brandMonogram: brandMonogram
    };

    // DOM 就绪立刻套用（脚本在 head 时等 DOMContentLoaded）
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            applyCachedBrandDom();
        });
    } else {
        applyCachedBrandDom();
    }
})(window);
