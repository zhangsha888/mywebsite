(function (window, $) {
    'use strict';

    function tip(msg) {
        if (window.layer && layer.msg) {
            layer.msg(msg);
        } else {
            window.alert(msg);
        }
    }

    $(function () {
        H5.installAjaxHook();
        if (!H5.requireAuth()) {
            return;
        }

        H5.apiRequest('GET', '/index/h5api/bankcard_data').then(function (res) {
            if (res && res.code === 1 && res.data && res.data.bankinfo && res.data.bankinfo.id) {
                tip('已绑定银行卡，修改请联系客服');
                setTimeout(function () {
                    window.location.href = H5.pageUrl('bankcard.html');
                }, 800);
            }
        });

        $('#bankForm').on('submit', function (e) {
            e.preventDefault();
            var $form = $(this);
            var $btn = $form.find('button[type=submit]');
            var accntnm = $.trim($form.find('[name=accntnm]').val());
            var accntno = $.trim($form.find('[name=accntno]').val()).replace(/\s+/g, '');
            var content = $.trim($form.find('[name=content]').val());
            var address = $.trim($form.find('[name=address]').val());

            if (!accntnm) { tip('请输入姓名'); return; }
            if (!accntno) { tip('请输入卡号'); return; }
            if (!/^\d{10,30}$/.test(accntno)) { tip('请输入正确的银行卡号'); return; }
            if (!content) { tip('请输入开户银行'); return; }
            if (!address) { tip('请输入开户分行'); return; }

            $btn.prop('disabled', true).text('提交中...');
            $.ajax({
                url: H5.apiUrl('/index/h5api/bind_bank'),
                type: 'POST',
                headers: H5.authHeaders(),
                data: {
                    accntnm: accntnm,
                    accntno: accntno,
                    content: content,
                    address: address
                },
                dataType: 'json',
                timeout: 20000
            }).done(function (res) {
                var ok = res && (res.code == 1 || res.type == 1);
                tip((res && (res.msg || res.data)) || (ok ? '绑定成功' : '绑定失败'));
                if (ok) {
                    setTimeout(function () {
                        window.location.href = H5.pageUrl('bankcard.html');
                    }, 600);
                }
            }).fail(function (xhr) {
                var msg = '绑定失败';
                if (xhr && xhr.responseJSON) {
                    msg = xhr.responseJSON.msg || xhr.responseJSON.data || msg;
                } else if (xhr && xhr.responseText) {
                    try {
                        var j = JSON.parse(xhr.responseText);
                        msg = j.msg || j.data || msg;
                    } catch (err) {}
                }
                tip(msg);
            }).always(function () {
                $btn.prop('disabled', false).text('确认绑定');
            });
        });
    });
})(window, window.jQuery);
