(function (window, $) {
    'use strict';
    $(function () {
        H5.installAjaxHook();
        if (!H5.requireAuth()) return;
        var qs = window.location.search.replace(/^\?/, '');
        H5.apiRequest('GET', '/index/h5api/announce_detail?' + qs).then(function (res) {
            if (!res || res.code !== 1) {
                $('#annBody').text('加载失败');
                return;
            }
            var d = res.data;
            $('#annTitle').text(d.title || '公告详情');
            $('#annBody').html(d.body || d.content || '');
        });
    });
})(window, window.jQuery);
