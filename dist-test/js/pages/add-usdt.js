(function (window, $) {
    'use strict';
    function esc(s) {
        return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    function renderBound(info, zxkf) {
        return '<div class="app-tip-card"><div class="app-tip-icon">₮</div><h2 class="app-tip-title">已绑定 USDT 地址</h2>' +
            '<div class="app-tip-info">' +
            '<div class="app-tip-row"><span class="label">链类型</span><span class="val">' + esc(info.address) + '</span></div>' +
            '<div class="app-tip-row"><span class="label">姓名</span><span class="val">' + esc(info.accntnm) + '</span></div>' +
            '<div class="app-tip-row"><span class="label">钱包地址</span><span class="val">' + esc(info.accntno_mask || info.accntno) + '</span></div></div>' +
            '<div class="app-tip-actions"><a href="' + H5.pageUrl('bankcard.html') + '" class="app-tip-btn">查看出款账户</a></div></div>';
    }
    function renderForm() {
        return '<div class="deposit-card"><p class="deposit-card-sub">请填写 USDT 收款地址</p>' +
            '<form id="usdtForm">' +
            '<div class="deposit-form-group"><label>姓名</label><input type="text" name="accntnm" class="deposit-input-simple" required></div>' +
            '<div class="deposit-form-group"><label>链类型</label><input type="text" name="address" class="deposit-input-simple" value="TRC20" required></div>' +
            '<div class="deposit-form-group"><label>USDT 钱包地址</label><input type="text" name="accntno" class="deposit-input-simple" required></div>' +
            '<button type="submit" class="deposit-submit">确认绑定</button></form></div>';
    }
    $(function () {
        H5.installAjaxHook();
        if (!H5.requireAuth()) return;
        H5.apiRequest('GET', '/index/h5api/usdt_bind_data').then(function (res) {
            if (!res || res.code !== 1) return;
            if (res.data.bound) {
                $('#usdtBindRoot').html(renderBound(res.data.usdt_info, res.data.zxkf));
            } else {
                $('#usdtBindRoot').html(renderForm());
                $('#usdtForm').on('submit', function (e) {
                    e.preventDefault();
                    var $btn = $(this).find('button[type=submit]');
                    $btn.prop('disabled', true);
                    $.ajax({
                        url: H5.apiUrl('/index/h5api/bind_usdt'),
                        type: 'POST',
                        headers: H5.authHeaders(),
                        data: $(this).serialize(),
                        dataType: 'json'
                    }).done(function (res) {
                        $btn.prop('disabled', false);
                        var ok = res && (res.code == 1 || res.type == 1);
                        var msg = (res && (res.msg || res.data)) ? (res.msg || res.data) : (ok ? '绑定成功' : '绑定失败');
                        layer.msg(msg);
                        if (ok) {
                            setTimeout(function () { location.href = H5.pageUrl('bankcard.html'); }, 600);
                        }
                    }).fail(function (xhr) {
                        $btn.prop('disabled', false);
                        var msg = '绑定失败';
                        if (xhr.responseJSON && xhr.responseJSON.msg) msg = xhr.responseJSON.msg;
                        else if (xhr.responseJSON && xhr.responseJSON.data) msg = xhr.responseJSON.data;
                        layer.msg(msg);
                    });
                });
            }
        });
    });
})(window, window.jQuery);
