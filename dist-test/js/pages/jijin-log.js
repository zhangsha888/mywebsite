(function (window, $) {
    'use strict';

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function renderLog(list) {
        if (!list || !list.length) {
            $('#jijinLogList').html('<div class="jijin-empty">暂无投资记录</div>');
            return;
        }
        var html = '';
        list.forEach(function (vo) {
            html += '<div class="jijin-log-item" style="flex-direction:column;align-items:flex-start;">' +
                '<div class="row-top"><span class="tag">' + esc(vo.state_text) + '</span>' +
                '<span class="amount plus">+' + esc(vo.interest) + ' 元</span></div>' +
                '<div class="row-sub">本金 ' + esc(vo.money) + ' 元 · ' + esc(vo.days) + ' 天 · 编号 ' + esc(vo.id) + '</div>' +
                '<div class="row-sub">投资 ' + esc(vo.time_str) + ' · 到期 ' + esc(vo.totime_str) + '</div></div>';
        });
        $('#jijinLogList').html(html);
    }

    window.H5PageJijinLog = {
        init: function () {
            H5App.bootPage({
                requireAuth: true,
                onReady: function () {
                    return H5.apiRequest('GET', '/index/h5api/jijinbao_log').then(function (res) {
                        if (!res || res.code !== 1) {
                            $('#jijinLogList').html('<div class="jijin-empty">加载失败</div>');
                            return;
                        }
                        renderLog((res.data && res.data.list) ? res.data.list : []);
                    });
                }
            });
        }
    };
})(window, window.jQuery);
