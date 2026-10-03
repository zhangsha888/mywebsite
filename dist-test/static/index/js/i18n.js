/**
 * 前台 UI 多语言（仅 index 模块，后台 admin 不加载）
 */
(function (global) {
    'use strict';

    var COOKIE_KEY = 'think_var';
    var PACK_URL = '/index/i18n/lang_pack';
    var STORAGE_LANG = 'h5_ui_lang';
    /** 语言选择器：H5 静态站启用，PHP 模板页由服务端控制 */
    var PICKER_ENABLED = !!(global.H5_CONFIG && global.H5_CONFIG.staticPages);
    var SKIP_TAGS = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1, INPUT: 1, SELECT: 1, OPTION: 1 };
    var observer = null;
    var applyTimer = null;

    var state = {
        lang: (global.__UI_LANG__ || 'zh-cn').toLowerCase(),
        langName: global.__UI_LANG_NAME__ || '简体中文',
        pack: null,
        sortedKeys: null,
        applying: false
    };

    function readCookie(name) {
        var m = document.cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
        return m ? decodeURIComponent(m[1]) : '';
    }

    function shouldSkipNode(node) {
        if (!node || node.nodeType !== 1) return true;
        if (node.getAttribute && node.getAttribute('data-i18n-skip') === '1') return true;
        if (node.closest && node.closest('[data-i18n-skip="1"]')) return true;
        if (node.classList && (node.classList.contains('pro-title') || node.classList.contains('identifying'))) {
            return true;
        }
        var p = node.parentElement;
        while (p) {
            if (p.getAttribute && p.getAttribute('data-i18n-skip') === '1') return true;
            if (SKIP_TAGS[p.tagName]) return true;
            p = p.parentElement;
        }
        return false;
    }

    function isTranslatableText(text) {
        if (!text) return false;
        var t = text.replace(/\s+/g, '');
        if (!t) return false;
        if (!/[\u4e00-\u9fff]/.test(t)) return false;
        if (/^[\d\s¥$€£+\-.,:%/USDTusdt]+$/.test(t)) return false;
        return true;
    }

    function getSortedKeys() {
        if (!state.pack) return [];
        if (!state.sortedKeys) {
            state.sortedKeys = Object.keys(state.pack).sort(function (a, b) {
                return b.length - a.length;
            });
        }
        return state.sortedKeys;
    }

    function translateString(text) {
        if (!text || state.lang === 'zh-cn' || !state.pack) return text;
        var out = text;
        var keys = getSortedKeys();
        var i, k, v;
        for (i = 0; i < keys.length; i++) {
            k = keys[i];
            v = state.pack[k];
            if (!v || k === v) continue;
            if (out.indexOf(k) !== -1) {
                out = out.split(k).join(v);
            }
        }
        return out;
    }

    function applyAttrs(root) {
        if (!state.pack || state.lang === 'zh-cn') return;
        var keys = getSortedKeys();
        var nodes = (root || document).querySelectorAll('[placeholder],[title],[aria-label]');
        var i, el, attrs, a, raw, next;
        for (i = 0; i < nodes.length; i++) {
            el = nodes[i];
            if (shouldSkipNode(el)) continue;
            attrs = ['placeholder', 'title', 'aria-label'];
            for (a = 0; a < attrs.length; a++) {
                raw = el.getAttribute(attrs[a]);
                if (!raw || !isTranslatableText(raw)) continue;
                next = translateString(raw);
                if (next !== raw) el.setAttribute(attrs[a], next);
            }
        }
    }

    function walkText(root) {
        if (!state.pack || state.lang === 'zh-cn') return;
        var keys = getSortedKeys();
        var walker = document.createTreeWalker(root || document.body, NodeFilter.SHOW_TEXT, {
            acceptNode: function (node) {
                if (!node.nodeValue || !isTranslatableText(node.nodeValue)) {
                    return NodeFilter.FILTER_REJECT;
                }
                var p = node.parentElement;
                if (!p || shouldSkipNode(p)) return NodeFilter.FILTER_REJECT;
                return NodeFilter.FILTER_ACCEPT;
            }
        });
        var n;
        while ((n = walker.nextNode())) {
            var raw = n.nodeValue;
            var next = translateString(raw);
            if (next !== raw) n.nodeValue = next;
        }
    }

    function applyDom(root) {
        if (!state.pack || state.lang === 'zh-cn' || state.applying) return;
        state.applying = true;
        try {
            walkText(root || document.body);
            applyAttrs(root || document.body);
            updateLangTriggers();
        } finally {
            state.applying = false;
        }
    }

    function scheduleApply(root) {
        if (state.lang === 'zh-cn') return;
        clearTimeout(applyTimer);
        applyTimer = setTimeout(function () {
            applyDom(root);
        }, 80);
    }

    function startObserver() {
        if (state.lang === 'zh-cn' || !window.MutationObserver) return;
        if (observer) return;
        observer = new MutationObserver(function (mutations) {
            var i, m;
            for (i = 0; i < mutations.length; i++) {
                m = mutations[i];
                if (m.type === 'childList' && (m.addedNodes.length || m.changedNodes.length)) {
                    scheduleApply();
                    return;
                }
            }
        });
        observer.observe(document.body, { childList: true, subtree: true, characterData: true });
    }

    function readPageLang() {
        var m = global.location.search.match(/[?&]lang=([^&]+)/i);
        if (m) {
            return decodeURIComponent(m[1]).toLowerCase();
        }
        try {
            var stored = localStorage.getItem(STORAGE_LANG);
            if (stored) {
                return String(stored).toLowerCase();
            }
        } catch (e) {}
        return '';
    }

    function resolvePackUrl(lang) {
        var path = PACK_URL + '?lang=' + encodeURIComponent(lang) + '&_=' + Date.now();
        if (global.H5 && typeof global.H5.cfg === 'function' && global.H5_CONFIG && global.H5_CONFIG.staticPages) {
            var base = (global.H5.cfg().apiBase || '').replace(/\/+$/, '');
            if (base) {
                return base + path;
            }
        }
        return path;
    }

    function fetchPack(lang, cb) {
        var cacheKey = 'ui_i18n_pack_v2_' + lang;
        try {
            var cached = sessionStorage.getItem(cacheKey);
            if (cached) {
                var obj = JSON.parse(cached);
                if (obj && obj.pack) {
                    cb(null, obj);
                    return;
                }
            }
        } catch (e) {}

        var xhr = new XMLHttpRequest();
        xhr.open('GET', resolvePackUrl(lang), true);
        xhr.onreadystatechange = function () {
            if (xhr.readyState !== 4) return;
            if (xhr.status !== 200) {
                cb(new Error('load failed'));
                return;
            }
            try {
                var res = JSON.parse(xhr.responseText);
                if (res.code !== 1 || !res.pack) {
                    cb(new Error('bad pack'));
                    return;
                }
                try {
                    sessionStorage.setItem(cacheKey, JSON.stringify(res));
                } catch (e2) {}
                cb(null, res);
            } catch (err) {
                cb(err);
            }
        };
        xhr.send();
    }

    function updateLangTriggers() {
        var label = '🌐 ' + state.langName;
        var nodes = document.querySelectorAll('.ui-lang-trigger, .home-ui-lang, .login-lang, .gate-lang');
        var i;
        for (i = 0; i < nodes.length; i++) {
            nodes[i].textContent = label;
        }
    }

    function setLangAndReload(lang) {
        try {
            localStorage.setItem(STORAGE_LANG, lang);
        } catch (e) {}
        var url = window.location.href;
        var hasQ = url.indexOf('?') !== -1;
        if (/([?&])lang=[^&]*/i.test(url)) {
            url = url.replace(/([?&])lang=[^&]*/i, '$1lang=' + encodeURIComponent(lang));
        } else {
            url += (hasQ ? '&' : '?') + 'lang=' + encodeURIComponent(lang);
        }
        window.location.href = url;
    }

    function ensureModal() {
        if (document.getElementById('uiI18nModal')) return;
        var mask = document.createElement('div');
        mask.id = 'uiI18nModal';
        mask.className = 'ui-i18n-modal-mask';
        mask.innerHTML =
            '<div class="ui-i18n-modal-panel">' +
            '<div class="ui-i18n-modal-head"><span>语言设置</span>' +
            '<button type="button" class="ui-i18n-modal-cancel">取消</button></div>' +
            '<div class="ui-i18n-modal-body"><div class="ui-i18n-lang-grid" id="uiI18nLangGrid"></div></div>' +
            '</div>';
        document.body.appendChild(mask);

        var langs = [
            { code: 'zh-cn', label: '简体中文' },
            { code: 'zh-tw', label: '繁體中文' },
            { code: 'en', label: 'English' },
            { code: 'ja', label: '日本語' },
            { code: 'vi', label: 'Tiếng Việt' },
            { code: 'id', label: 'Bahasa Indonesia' },
            { code: 'ko', label: '한국어' },
            { code: 'fr', label: 'Français' },
            { code: 'de', label: 'Deutsch' }
        ];
        var grid = document.getElementById('uiI18nLangGrid');
        var i, a;
        for (i = 0; i < langs.length; i++) {
            a = document.createElement('a');
            a.href = 'javascript:;';
            a.className = 'ui-i18n-lang-item' + (langs[i].code === state.lang ? ' is-active' : '');
            a.setAttribute('data-lang', langs[i].code);
            a.textContent = langs[i].label;
            a.addEventListener('click', (function (code) {
                return function () {
                    setLangAndReload(code);
                };
            })(langs[i].code));
            grid.appendChild(a);
        }

        mask.querySelector('.ui-i18n-modal-cancel').addEventListener('click', closePicker);
        mask.addEventListener('click', function (e) {
            if (e.target === mask) closePicker();
        });
        applyDom(mask);
    }

    function openPicker() {
        if (!PICKER_ENABLED) {
            return;
        }
        ensureModal();
        var mask = document.getElementById('uiI18nModal');
        if (mask) mask.classList.add('is-open');
    }

    function closePicker() {
        var mask = document.getElementById('uiI18nModal');
        if (mask) mask.classList.remove('is-open');
    }

    function patchDialogs() {
        if (state.lang === 'zh-cn') return;

        var rawAlert = global.alert;
        if (rawAlert && !rawAlert.__uiI18nPatched) {
            global.alert = function (msg) {
                return rawAlert.call(global, translateString(String(msg)));
            };
            global.alert.__uiI18nPatched = true;
        }

        if (global.layer && global.layer.msg && !global.layer.msg.__uiI18nPatched) {
            var rawMsg = global.layer.msg;
            global.layer.msg = function (msg) {
                var args = Array.prototype.slice.call(arguments);
                args[0] = translateString(String(msg));
                return rawMsg.apply(global.layer, args);
            };
            global.layer.msg.__uiI18nPatched = true;
        }
    }

    function boot() {
        var pageLang = readPageLang();
        var cookieLang = readCookie(COOKIE_KEY);
        if (pageLang) {
            state.lang = pageLang;
        } else if (cookieLang) {
            state.lang = cookieLang.toLowerCase();
        }

        document.documentElement.setAttribute('lang', state.lang);
        updateLangTriggers();
        bindTriggers();

        if (state.lang === 'zh-cn') return;

        fetchPack(state.lang, function (err, res) {
            if (!err && res) {
                state.pack = res.pack;
                state.sortedKeys = null;
                if (res.lang_name) state.langName = res.lang_name;
            }
            applyDom();
            patchDialogs();
            startObserver();
            updateLangTriggers();
        });
    }

    function bindTriggers() {
        document.addEventListener('click', function (e) {
            var t = e.target;
            if (!t) return;
            if (t.closest && t.closest('#mineLangBtn')) {
                e.preventDefault();
                openPicker();
                return;
            }
            if (t.closest && (t.closest('.ui-lang-trigger') || t.closest('.home-ui-lang') || t.closest('.login-lang') || t.closest('.gate-lang'))) {
                e.preventDefault();
                openPicker();
            }
        });
    }

    function t(text) {
        return translateString(String(text || ''));
    }

    global.UII18n = {
        getLang: function () { return state.lang; },
        t: t,
        apply: applyDom,
        scheduleApply: scheduleApply,
        openPicker: openPicker,
        closePicker: closePicker,
        setLang: setLangAndReload
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', boot);
    } else {
        boot();
    }
})(window);
