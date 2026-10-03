(function (window, $) {
    'use strict';

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function renderList(list) {
        if (!list || !list.length) {
            $('#inquiryRoot').html(
                '<div class="form-ui-empty"><p>暂无平仓记录</p>' +
                '<p style="font-size:12px;margin-top:8px;color:#bbb;">平仓后的订单将显示在这里</p></div>'
            );
            return;
        }
        var html = '<div class="inquiry-table-head"><span>商品名称</span><span>金额</span><span>方向</span><span>盈亏</span></div><div class="inquiry-list">';
        list.forEach(function (vo) {
            var dirCls = vo.ostyle === 0 ? 'up' : 'down';
            html += '<div class="inquiry-row">' +
                '<span class="name">' + esc(vo.name) + '</span>' +
                '<span class="money">￥' + esc(vo.money) + '</span>' +
                '<span class="dir ' + dirCls + '">' + esc(vo.fx) + '</span>' +
                '<span class="pnl ' + esc(vo.pnl_class || 'flat') + '">' + esc(vo.yk_text) + '</span></div>';
        });
        html += '</div>';
        $('#inquiryRoot').html(html);
    }

    window.H5PageInquiries = {
        init: function () {
            H5App.bootPage({
                requireAuth: true,
                onReady: function () {
                    return H5.apiRequest('GET', '/index/h5api/inquiries_data').then(function (res) {
                        if (!res || res.code !== 1) {
                            $('#inquiryRoot').html('<div class="form-ui-empty"><p>加载失败</p></div>');
                            return;
                        }
                        renderList((res.data && res.data.list) ? res.data.list : []);
                    });
                }
            });
        }
    };
})(window, window.jQuery);
