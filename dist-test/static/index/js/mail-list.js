(function () {
    function uiT(s) {
        return (window.UII18n && typeof window.UII18n.t === 'function') ? window.UII18n.t(s) : s;
    }

    function esc(s) {
        return String(s || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function renderList(list, unread) {
        var $list = $('#mailUiList');
        var $empty = $('#mailUiEmpty');
        var $badge = $('#mailUnreadBadge');
        if (!$list.length) {
            return;
        }
        if (unread > 0 && $badge.length) {
            $badge.text('(' + unread + uiT('条未读') + ')').show();
        } else if ($badge.length) {
            $badge.hide();
        }
        if (!list || !list.length) {
            $list.hide().empty();
            if ($empty.length) {
                $empty.show();
            }
            return;
        }
        if ($empty.length) {
            $empty.hide();
        }
        var html = '';
        $.each(list, function (_, vo) {
            var unreadCls = vo.is_read === 0 ? 'is-unread' : '';
            var statusCls = vo.is_read === 0 ? 'unread' : 'read';
            var statusTxt = vo.is_read === 0 ? '未读' : '已读';
            var dot = vo.is_read === 0 ? '<span class="mail-ui-dot"></span>' : '';
            html += '<a href="' + (window.H5 && H5.pageUrl ? H5.pageUrl('mail_detail.html?id=' + vo.id) : '/mail_detail.html?id=' + vo.id) + '" class="mail-ui-card ' + unreadCls + '">' +
                '<div class="mail-ui-card-top">' +
                '<div class="mail-ui-title">' + dot + esc(vo.title) + '</div>' +
                '<span class="mail-ui-status ' + statusCls + '">' + statusTxt + '</span>' +
                '</div>' +
                '<p class="mail-ui-summary">' + esc(vo.summary) + '</p>' +
                '<div class="mail-ui-meta"><span>' + uiT('发送时间') + '</span><span class="time">' + esc(vo.time_str) + '</span></div>' +
                '</a>';
        });
        $list.html(html).show();
        if (window.UII18n && typeof window.UII18n.scheduleApply === 'function') {
            window.UII18n.scheduleApply($list[0]);
        }
    }

    function loadAjaxList() {
        if (!$('#mailUiAjaxLoad').length) {
            return;
        }
        var req = (H5 && H5.apiRequest)
            ? H5.apiRequest('GET', '/index/h5api/mail_list')
            : $.getJSON('/index/index/ajax_mail_list');
        $.when(req).done(function (res) {
            if (!res || res.code !== 1) {
                return;
            }
            var payload = res.data || res;
            renderList(payload.list || [], payload.unread_count || 0);
        });
    }

    window.MailListUi = {
        renderList: renderList,
        loadAjaxList: loadAjaxList
    };

    $(function () {
        // 从详情页返回时刷新已读状态
        window.addEventListener('pageshow', function (e) {
            if (e.persisted && window.H5_CONFIG && H5_CONFIG.staticPages) {
                loadAjaxList();
            }
        });
        document.addEventListener('visibilitychange', function () {
            if (document.visibilityState === 'visible' && window.H5_CONFIG && H5_CONFIG.staticPages && $('#mailUiAjaxLoad').length) {
                loadAjaxList();
            }
        });
        // 静态站由页面在 requireAuth 之后主动调用 loadAjaxList，避免抢跑
        if (window.H5_CONFIG && H5_CONFIG.staticPages) {
            return;
        }
        var $list = $('#mailUiList');
        if ($list.length && $list.find('.mail-ui-card').length) {
            return;
        }
        loadAjaxList();
    });
})();
