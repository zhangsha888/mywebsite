(function (window, $) {
    'use strict';

    var logoutBound = false;
    var resumeBound = false;
    var refreshing = false;
    var lastRefreshAt = 0;
    var MIN_REFRESH_GAP = 600;

    function fmtMoney(n) {
        var num = parseFloat(n);
        if (isNaN(num)) {
            return '0.00';
        }
        return num.toFixed(2);
    }

    function maskPhoneLike(text) {
        var t = String(text == null ? '' : text).trim();
        if (t.length >= 2) {
            return t.charAt(0) + '*****';
        }
        return t || '—';
    }

    function setPnlClass($el, val) {
        var n = parseFloat(val);
        $el.removeClass('up down');
        if (isNaN(n) || n === 0) {
            return;
        }
        $el.addClass(n > 0 ? 'up' : 'down');
    }

    function toast(msg) {
        if (window.layer && layer.msg) {
            layer.msg(msg, { time: 1500 });
        } else {
            window.alert(msg);
        }
    }

    function bindLogoutOnce() {
        if (logoutBound) {
            return;
        }
        logoutBound = true;
        $(document).on('click', '#mineLogout', function (e) {
            e.preventDefault();
            if (!window.confirm('确定退出登录？')) {
                return;
            }
            H5.apiRequest('POST', '/index/h5api/logout', null, { skipAuthRedirect: true })
                .always(function () {
                    H5.clearAuth();
                    window.location.href = H5.pageUrl('login.html');
                });
        });
    }

    function renderMine(d) {
        var u = d.userInfo || {};
        var name = u.nickname || u.username || '用户';
        var account = u.real_utel || u.utel || u.uid || '—';
        var money = fmtMoney(u.usermoney);

        $('.mine-ui-user h2').text(name);
        $('#mineAccount').text(account);
        $('#minePhone').text(maskPhoneLike(u.utel || account));
        $('.mine-ui-badge-level').text('🛡 ' + (d.levelinfo || '普通会员'));
        $('.mine-ui-badge-credit').text('🌿 信用分:' + (u.comqua != null ? u.comqua : 100));
        $('#inviteCode').text(u.uid || '—');
        $('#totalBalance').text(money);
        $('#usdtApprox').text(d.usdt_approx != null ? d.usdt_approx : Math.round(parseFloat(u.usermoney || 0) / 7.25));
        $('#totalPloss').text(fmtMoney(d.total_ploss));
        $('#todayPloss').text(fmtMoney(d.today_ploss));
        setPnlClass($('#totalPloss'), d.total_ploss);
        setPnlClass($('#todayPloss'), d.today_ploss);
        $('.mine-ui-balance-box .amount').text('¥ ' + money);

        var badge = document.getElementById('mineMsgBadge');
        if (badge) {
            var n = parseInt(d.msg_unread_count, 10) || 0;
            badge.textContent = n > 99 ? '99+' : String(n);
            badge.classList.toggle('has-unread', n > 0);
        }

        if (d.jijinbao_enabled) {
            $('#mineJijinbaoLink').show();
        } else {
            $('#mineJijinbaoLink').hide();
        }

        if (d.conf && d.conf.web_name) {
            document.title = d.conf.web_name;
        }

        var conf = H5App.getSiteConfig();
        if (conf && conf.ui_lang_name && window.UII18n) {
            window.__UI_LANG__ = conf.ui_lang;
            window.__UI_LANG_NAME__ = conf.ui_lang_name;
            if (typeof window.UII18n.apply === 'function') {
                window.UII18n.apply();
            }
        }

        bindLogoutOnce();
    }

    function refreshMine(force) {
        var now = Date.now();
        if (!force && now - lastRefreshAt < MIN_REFRESH_GAP) {
            return $.Deferred().resolve().promise();
        }
        if (refreshing) {
            return $.Deferred().resolve().promise();
        }
        if (!window.H5 || typeof H5.getToken !== 'function' || !H5.getToken()) {
            return $.Deferred().resolve().promise();
        }
        refreshing = true;
        lastRefreshAt = now;
        return H5.apiRequest('GET', '/index/h5api/mine_data', { _t: now }, { cache: false })
            .then(function (res) {
                if (res && res.code === 1 && res.data) {
                    renderMine(res.data);
                } else if (force) {
                    toast((res && (res.msg || res.data)) || '加载失败');
                }
            })
            .fail(function () {
                if (force) {
                    toast('网络异常，请稍后重试');
                }
            })
            .always(function () {
                refreshing = false;
            });
    }

    function bindResumeRefresh() {
        if (resumeBound) {
            return;
        }
        resumeBound = true;
        // 从站内信/其他页返回（含 bfcache）时重新拉余额与未读数
        window.addEventListener('pageshow', function (e) {
            refreshMine(!!e.persisted);
        });
        document.addEventListener('visibilitychange', function () {
            if (document.visibilityState === 'visible') {
                refreshMine(false);
            }
        });
        window.addEventListener('focus', function () {
            refreshMine(false);
        });
    }

    window.copyInviteCode = function () {
        var code = String($('#inviteCode').text() || '').trim();
        if (!code || code === '—') {
            toast('暂无邀请码');
            return;
        }
        function ok() {
            toast('ID已复制');
        }
        function fallback() {
            var ta = document.createElement('textarea');
            ta.value = code;
            ta.style.position = 'fixed';
            ta.style.left = '-9999px';
            document.body.appendChild(ta);
            ta.select();
            try {
                document.execCommand('copy');
                ok();
            } catch (e) {
                toast('复制失败，请长按手动复制');
            }
            document.body.removeChild(ta);
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(code).then(ok).catch(fallback);
        } else {
            fallback();
        }
    };

    window.H5PageMine = {
        init: function () {
            H5.installAjaxHook();
            bindResumeRefresh();
            H5App.bootPage({
                requireAuth: true,
                tab: 'member',
                onReady: function () {
                    return refreshMine(true);
                }
            });
        }
    };
})(window, window.jQuery);
