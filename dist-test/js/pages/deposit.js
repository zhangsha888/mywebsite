(function (window, $) {
    'use strict';

    function setCopy($el, text) {
        var val = text || '';
        $el.text(val || '-');
        $el.attr('data-copy', val);
        $el.data('copy', val);
    }

    $(function () {
        H5.installAjaxHook();
        if (!H5.requireAuth()) return;
        H5.apiRequest('GET', '/index/h5api/deposit_data').then(function (res) {
            if (!res || res.code !== 1) {
                var msg = (res && (res.msg || res.data)) ? (res.msg || res.data) : '收款信息加载失败';
                if (window.layer) layer.msg(msg);
                return;
            }
            var bank = (res.data && res.data.bank) ? res.data.bank : {};
            var usdt = (res.data && res.data.usdt) ? res.data.usdt : {};
            $('#bank-bank').text(bank.bank || '-');
            $('#bank-address').text(bank.address || '-');
            setCopy($('#bank-card'), bank.card || '');
            setCopy($('#bank-name'), bank.name || '');
            $('#usdt-pay-name').text(usdt.pay_name || 'USDT充值');
            $('#usdt-bank').text(usdt.bank || '-');
            $('#usdt-address').text(usdt.address || '-');
            setCopy($('#usdt-card'), usdt.card || '');
        }).fail(function () {
            if (window.layer) layer.msg('网络错误，收款信息加载失败');
        });
    });
})(window, window.jQuery);
