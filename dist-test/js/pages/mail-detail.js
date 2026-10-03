(function (window, $) {
    'use strict';
    $(function () {
        H5.installAjaxHook();
        if (!H5.requireAuth()) return;
        var m = /[?&]id=(\d+)/.exec(location.search);
        var id = m ? m[1] : '';
        if (!id) {
            $('#mailBody').text('消息不存在');
            return;
        }
        H5.apiRequest('GET', '/index/h5api/mail_detail?id=' + id).then(function (res) {
            if (!res || res.code !== 1) {
                $('#mailBody').text('加载失败');
                return;
            }
            var msg = res.data;
            $('#mailTitle').text(msg.title || '消息详情');
            $('#mailBody').html(msg.content || msg.summary || '');
            $('#mailTime').text(msg.time_str || '');
        });
    });
})(window, window.jQuery);
