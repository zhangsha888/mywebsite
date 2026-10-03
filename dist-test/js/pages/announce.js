(function (window, $) {
    'use strict';
    function esc(s) {
        return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    $(function () {
        H5.installAjaxHook();
        if (!H5.requireAuth()) return;
        H5.apiRequest('GET', '/index/h5api/announce_list').then(function (res) {
            if (!res || res.code !== 1) return;
            var list = res.data.notices || [];
            if (!list.length) {
                $('#announceEmpty').show();
                return;
            }
            var html = '';
            list.forEach(function (vo) {
                var detail = vo.detail_url || ('announce_detail.html?id=' + (vo.id || 0));
                if (window.H5 && H5.pageUrl) {
                    detail = H5.pageUrl(detail.replace(/^\//, ''));
                }
                html += '<a href="' + detail + '" class="mail-ui-card">' +
                    '<div class="mail-ui-card-top"><div class="mail-ui-title">' + esc(vo.title) + '</div><span class="mail-ui-status read">公告</span></div>' +
                    '<p class="mail-ui-summary">' + esc(vo.summary) + '</p>' +
                    '<div class="mail-ui-meta"><span>发布日期</span><span class="time">' + esc(vo.date) + '</span></div></a>';
            });
            $('#announceList').html(html);
        });
    });
})(window, window.jQuery);
