(function (window, $) {
    'use strict';

    function esc(s) {
        return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function renderBankPanel(bank) {
        if (!bank || !bank.id) {
            $('#bankPanelBody').html('<div class="deposit-tip">您尚未绑定银行卡</div>' +
                '<a href="' + H5.pageUrl('add_bank.html') + '" class="withdraw-bind-link">去绑定银行卡</a>');
            return;
        }
        $('#bankPanelBody').html(
            '<div class="withdraw-account-plain">' +
            '<div class="deposit-account-row"><span class="label">持卡人</span><span class="val">' + esc(bank.accntnm) + '</span></div>' +
            '<div class="deposit-account-row"><span class="label">开户银行</span><span class="val">' + esc(bank.content) + '</span></div>' +
            '<div class="deposit-account-row"><span class="label">银行卡号</span><span class="val">' + esc(bank.accntno) + '</span></div></div>'
        );
    }

    function renderUsdtPanel(usdt) {
        if (!usdt || !usdt.id) {
            $('#usdtPanelBody').html('<div class="deposit-tip">您尚未绑定 USDT 地址</div>' +
                '<a href="' + H5.pageUrl('add_usdt.html') + '" class="withdraw-bind-link">去绑定 USDT 地址</a>');
            return;
        }
        $('#usdtPanelBody').html(
            '<div class="withdraw-account-plain">' +
            '<div class="deposit-account-row"><span class="label">链类型</span><span class="val">' + esc(usdt.address) + '</span></div>' +
            '<div class="deposit-account-row"><span class="label">姓名</span><span class="val">' + esc(usdt.accntnm) + '</span></div>' +
            '<div class="deposit-account-row"><span class="label">钱包地址</span><span class="val">' + esc(usdt.accntno) + '</span></div></div>'
        );
    }

    $(function () {
        H5.installAjaxHook();
        if (!H5.requireAuth()) return;
        H5.apiRequest('GET', '/index/h5api/withdraw_data').then(function (res) {
            if (!res || res.code !== 1) {
                var msg = (res && (res.msg || res.data)) ? (res.msg || res.data) : '加载失败';
                if (window.layer) layer.msg(msg);
                return;
            }
            var d = res.data || {};
            var conf = d.conf || {};
            var bank = d.bankinfo || {};
            var usdt = d.usdtinfo || {};
            $('#userBalance').text(d.usermoney);
            window.WITHDRAW_CONFIG = {
                regPar: parseFloat(conf.reg_par) || 0,
                bankId: parseInt(bank.id, 10) || 0,
                usdtId: parseInt(usdt.id, 10) || 0,
                cashMin: parseFloat(conf.cash_min) || 0,
                cashMax: parseFloat(conf.cash_max) || 0
            };
            if (window.WITHDRAW_CONFIG.regPar > 0) {
                $('#feeRate').text(window.WITHDRAW_CONFIG.regPar);
                $('#feeHint').show();
            }
            $('#withdrawTips').html(
                '1. 单笔限额：' + (conf.cash_min || '-') + ' - ' + (conf.cash_max || '-') + '<br>' +
                '2. 出金时间：' + (conf.role_ks || '-') + ' - ' + (conf.role_js || '-') + ' 点'
            );
            renderBankPanel(bank);
            renderUsdtPanel(usdt);
            if (window.H5WithdrawUi && typeof window.H5WithdrawUi.updateFee === 'function') {
                window.H5WithdrawUi.updateFee();
            }
        }).fail(function () {
            if (window.layer) layer.msg('网络错误');
        });
    });
})(window, window.jQuery);
