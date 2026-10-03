(function (window, $) {
    'use strict';

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function renderBank(b, zxkf) {
        if (!b || !b.id) {
            return '<h2 class="deposit-card-title">银行卡</h2><div class="deposit-tip">尚未绑定银行卡</div>' +
                '<a href="' + H5.pageUrl('add_bank.html') + '" class="withdraw-bind-link" style="display:block;margin-top:10px;">绑定银行卡</a>';
        }
        var extra = '<p class="deposit-card-sub" style="margin-top:10px;">修改银行卡请联系在线客服</p>';
        if (zxkf) {
            extra += '<a href="javascript:;" class="withdraw-bind-link bank-kf-link" style="display:block;margin-top:8px;">联系客服</a>';
        }
        return '<h2 class="deposit-card-title">银行卡</h2>' +
            '<div class="withdraw-account-plain">' +
            '<div class="deposit-account-row"><span class="label">持卡人</span><span class="val">' + esc(b.accntnm) + '</span></div>' +
            '<div class="deposit-account-row"><span class="label">开户银行</span><span class="val">' + esc(b.content) + '</span></div>' +
            '<div class="deposit-account-row"><span class="label">开户分行</span><span class="val">' + esc(b.address || '—') + '</span></div>' +
            '<div class="deposit-account-row"><span class="label">卡号</span><span class="val">' + esc(b.accntno) + '</span></div></div>' +
            extra;
    }

    function renderUsdt(u) {
        if (!u || !u.id) {
            return '<h2 class="deposit-card-title">USDT 钱包</h2><div class="deposit-tip">尚未绑定 USDT 地址</div>' +
                '<a href="' + H5.pageUrl('add_usdt.html') + '" class="withdraw-bind-link" style="display:block;margin-top:10px;">绑定 USDT 地址</a>';
        }
        return '<h2 class="deposit-card-title">USDT 钱包</h2>' +
            '<div class="withdraw-account-plain">' +
            '<div class="deposit-account-row"><span class="label">链类型</span><span class="val">' + esc(u.address) + '</span></div>' +
            '<div class="deposit-account-row"><span class="label">姓名</span><span class="val">' + esc(u.accntnm) + '</span></div>' +
            '<div class="deposit-account-row"><span class="label">钱包地址</span><span class="val">' + esc(u.accntno) + '</span></div></div>' +
            '<p class="deposit-card-sub" style="margin-top:10px;">修改地址请联系在线客服</p>';
    }

    $(function () {
        H5.installAjaxHook();
        if (!H5.requireAuth()) {
            return;
        }
        H5.apiRequest('GET', '/index/h5api/bankcard_data').then(function (res) {
            if (!res || res.code !== 1 || !res.data) {
                $('#bankCardSection,#usdtCardSection').html('<div class="deposit-tip">加载失败，请稍后重试</div>');
                return;
            }
            var zxkf = res.data.zxkf || '';
            $('#bankCardSection').html(renderBank(res.data.bankinfo, zxkf));
            $('#usdtCardSection').html(renderUsdt(res.data.usdtinfo));
            if (zxkf) {
                $(document).off('click.bankKf').on('click.bankKf', '.bank-kf-link', function () {
                    window.open(zxkf, '_blank');
                });
            }
        }).fail(function () {
            $('#bankCardSection,#usdtCardSection').html('<div class="deposit-tip">网络异常，请稍后重试</div>');
        });
    });
})(window, window.jQuery);
