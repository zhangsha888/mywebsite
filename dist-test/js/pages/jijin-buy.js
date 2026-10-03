(function (window, $) {
    'use strict';

    window.H5PageJijinBuy = {
        init: function () {
            var m = /[?&]pid=(\d+)/.exec(window.location.search);
            var pid = m ? m[1] : '';
            if (!pid) {
                window.location.href = H5.pageUrl('jijinbao.html');
                return;
            }

            var buyData = null;

            H5App.bootPage({
                requireAuth: true,
                onReady: function () {
                    return H5.apiRequest('GET', '/index/h5api/jijinbao_buy_data', { pid: pid }).then(function (res) {
                        if (!res || res.code !== 1 || !res.data || !res.data.item) {
                            layer.msg((res && (res.msg || res.data)) ? (res.msg || res.data) : '产品不存在');
                            setTimeout(function () { window.location.href = H5.pageUrl('jijinbao.html'); }, 800);
                            return;
                        }
                        buyData = res.data;
                        var item = buyData.item;
                        $('#buyUsermoney').text(buyData.usermoney || '0.00');
                        $('#buyDays').text(item.days + ' 天');
                        $('#buyRates').text(item.rates + ' %');
                        $('#buyMin').text(item.min + ' 元');
                        $('#buyExpire').text(buyData.expire_text || '-');
                        $('#buyMoney').attr('min', item.min).attr('placeholder', '起投 ' + item.min + ' 元，请输入整数');
                    });
                }
            });

            $('#buySubmit').on('click', function () {
                if (!buyData || !buyData.item) {
                    layer.msg('产品信息未加载完成');
                    return;
                }
                var item = buyData.item;
                var moneyRaw = $.trim($('#buyMoney').val());
                var money = parseInt(moneyRaw, 10);
                var usermoney = parseFloat(buyData.usermoney);
                var min = parseInt(item.min, 10);
                if (!moneyRaw || isNaN(money) || String(money) !== moneyRaw) {
                    layer.msg('投资金额必须为整数');
                    return;
                }
                if (money < min) {
                    layer.msg('投资金额不能小于起投金额 ' + min);
                    return;
                }
                if (money > usermoney) {
                    layer.msg('可用余额不足');
                    return;
                }
                var $btn = $(this);
                $btn.prop('disabled', true).text('提交中...');
                H5.apiRequest('POST', '/index/h5api/jjbrr', { pid: item.pid, money: money }).then(function (res) {
                    $btn.prop('disabled', false).text('确认转入');
                    var ok = res && Number(res.code) === 0;
                    layer.msg((res && res.msg) ? res.msg : (ok ? '投资成功' : '失败'));
                    if (ok) {
                        setTimeout(function () { window.location.href = H5.pageUrl('jijin_log.html'); }, 1200);
                    }
                }).fail(function (xhr) {
                    $btn.prop('disabled', false).text('确认转入');
                    var msg = '网络错误';
                    if (xhr && xhr.responseJSON) {
                        msg = xhr.responseJSON.msg || xhr.responseJSON.data || msg;
                    }
                    layer.msg(msg);
                });
            });
        }
    };
})(window, window.jQuery);
