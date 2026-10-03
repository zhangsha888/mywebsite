(function (window, $) {
    'use strict';

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function renderProducts(list) {
        if (!list || !list.length) {
            $('#jijinProductList').html('<div class="jijin-empty">暂无理财产品，请联系管理员在后台添加</div>');
            return;
        }
        var html = '';
        list.forEach(function (vo) {
            html += '<div class="jijin-log-item" style="display:flex;align-items:center;justify-content:space-between;">' +
                '<div><div style="font-weight:600;">' + esc(vo.days) + '天 · ' + esc(vo.rates) + '%</div>' +
                '<div style="font-size:13px;color:#888;margin-top:4px;">起投 ' + esc(vo.min) + ' 元</div></div>' +
                '<a href="' + H5.pageUrl('jijin_buy.html?pid=' + vo.pid) + '" class="jijin-action-btn in" style="padding:8px 16px;text-decoration:none;">转入</a></div>';
        });
        $('#jijinProductList').html(html);
    }

    window.H5PageJijinbao = {
        init: function () {
            H5App.bootPage({
                requireAuth: true,
                onReady: function () {
                    return H5.apiRequest('GET', '/index/h5api/jijinbao_data').then(function (res) {
                        if (!res || res.code !== 1) {
                            var msg = (res && (res.msg || res.data)) ? (res.msg || res.data) : '加载失败';
                            layer.msg(msg);
                            if (res && res.code === -1) {
                                setTimeout(function () { history.back(); }, 1000);
                            }
                            return;
                        }
                        var d = res.data || {};
                        $('#jijinBalance').text(d.usermoney || '0.00');
                        $('#jijinBalanceSub').text('可提现 ' + (d.withdrawable || '0.00') + ' · 理财冻结 ' + (d.freeze || '0.00'));
                        if (d.days_text) {
                            $('#jijinDaysText').text('定期利息宝为固定周期产品，期限分为 ' + d.days_text + ' 天。').show();
                        }
                        renderProducts(d.list || []);
                    }).fail(function () {
                        layer.msg('网络错误');
                        $('#jijinProductList').html('<div class="jijin-empty">网络错误，请稍后重试</div>');
                    });
                }
            });
        }
    };
})(window, window.jQuery);
