(function (window, $) {
    'use strict';

    function esc(s) {
        return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function goMine() {
        location.href = H5.pageUrl('mine.html');
    }

    function renderPassed() {
        return '' +
            '<div class="sm-pass-panel">' +
            '<div class="sm-pass-icon" aria-hidden="true">✓</div>' +
            '<div class="sm-pass-title">审核通过</div>' +
            '<p class="sm-pass-desc">实名认证已完成</p>' +
            '</div>';
    }

    function renderOther(list) {
        var otype = list.otype;
        var badge = '';
        if (otype == 2) {
            badge = '<span class="sm-status-badge fail">审核未通过</span>';
        } else {
            badge = '<span class="sm-status-badge pending">审核中，请耐心等待</span>';
        }
        var html = badge +
            '<div class="sm-info-row"><span class="label">姓名</span><span class="val">' + esc(list.uname) + '</span></div>' +
            '<div class="sm-info-row"><span class="label">身份证号</span><span class="val">' + esc(list.idcard) + '</span></div>';
        if (list.phone) {
            html += '<div class="sm-info-row"><span class="label">手机号</span><span class="val">' + esc(list.phone) + '</span></div>';
        }
        if (list.time) {
            html += '<div class="sm-info-row"><span class="label">提交时间</span><span class="val">' + esc(new Date(list.time * 1000).toLocaleString()) + '</span></div>';
        }
        return html;
    }

    $(function () {
        H5.installAjaxHook();
        if (!H5.requireAuth()) return;
        $('#smBackBtn').on('click', goMine);
        H5.apiRequest('GET', '/index/h5api/sm_status').then(function (res) {
            if (!res || res.code !== 1) {
                $('#smStatusCard').html('<p style="text-align:center;color:#8c8c8c;">加载失败，请返回重试</p>');
                return;
            }
            var list = res.data && res.data.list;
            if (!list) {
                location.replace(H5.pageUrl('add_sm.html'));
                return;
            }
            if (parseInt(list.otype, 10) === 1) {
                $('#smStatusCard').addClass('sm-ui-card--pass').html(renderPassed());
            } else {
                $('#smStatusCard').removeClass('sm-ui-card--pass').html(renderOther(list));
            }
        }).fail(function () {
            $('#smStatusCard').html('<p style="text-align:center;color:#8c8c8c;">网络错误，请返回重试</p>');
        });
    });
})(window, window.jQuery);
