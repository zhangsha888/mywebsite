(function (window, $) {
    'use strict';

    function esc(s) {
        return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function resolveType() {
        if (window.FUND_RECORD_TYPE) {
            return String(window.FUND_RECORD_TYPE);
        }
        try {
            var q = new URLSearchParams(window.location.search || '').get('type');
            if (q === 'deposit' || q === 'withdraw' || q === 'all') {
                return q;
            }
        } catch (e) {}
        return 'all';
    }

    function showEmpty(msg) {
        $('#fundRecordList').empty();
        $('#fundRecordEmpty').show().find('p').text(msg || '暂无记录');
    }

    function renderList(list) {
        var $list = $('#fundRecordList');
        var $empty = $('#fundRecordEmpty');
        if (!list || !list.length) {
            showEmpty('暂无记录');
            return;
        }
        $empty.hide();
        var html = '';
        list.forEach(function (vo) {
            html += '<article class="fund-record-card">' +
                '<div class="fund-record-card-head">' +
                '<span class="fund-record-type ' + esc(vo.type_class) + '">' + esc(vo.type_text) +
                (vo.channel_text ? '<span class="fund-record-channel">' + esc(vo.channel_text) + '</span>' : '') + '</span>' +
                '<span class="fund-record-status ' + esc(vo.status_class) + '">' + esc(vo.status_text) + '</span></div>' +
                '<div class="fund-record-row"><span>金额</span><span class="fund-record-amount ' + esc(vo.amount_class) + '">' + esc(vo.amount_display) + '</span></div>' +
                '<div class="fund-record-row"><span>时间</span><span class="val">' + esc(vo.utime) + '</span></div>' +
                (vo.tips ? '<div class="fund-record-row"><span>方式</span><span class="val">' + esc(vo.tips) + '</span></div>' : '') +
                (vo.remarks ? '<div class="fund-record-row"><span>备注</span><span class="val">' + esc(vo.remarks) + '</span></div>' : '') +
                '</article>';
        });
        $list.html(html);
    }

    $(function () {
        H5.installAjaxHook();
        if (!H5.requireAuth()) return;

        var type = resolveType();
        showEmpty('加载中...');

        H5.apiRequest('GET', '/index/h5api/fund_records', { type: type }).then(function (res) {
            if (!res || res.code !== 1 || !res.data) {
                var errMsg = '加载失败';
                if (res) {
                    if (res.msg) {
                        errMsg = String(res.msg);
                    } else if (typeof res.data === 'string' && res.data) {
                        errMsg = res.data;
                    }
                }
                showEmpty(errMsg);
                return;
            }
            if (res.data.page_title) {
                var title = res.data.page_title;
                var $h1 = $('#fundPageTitle');
                if ($h1.length) {
                    $h1.text(title);
                } else {
                    $('.deposit-ui-header h1').first().text(title);
                }
                document.title = title;
            }
            renderList(res.data.list || []);
        }).fail(function () {
            showEmpty('网络错误，请稍后重试');
        });
    });
})(window, window.jQuery);
