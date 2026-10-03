(function () {
    var currentChannel = 'bank';

    function getCfg() {
        return window.WITHDRAW_CONFIG || { regPar: 0, bankId: 0, usdtId: 0 };
    }

    function switchChannel(channel) {
        currentChannel = channel;
        $('#withdrawChannel').val(channel);
        $('.deposit-channel-btn').removeClass('active');
        $('.deposit-channel-btn[data-channel="' + channel + '"]').addClass('active');
        $('.deposit-panel').removeClass('active');
        $('#panel-' + channel).addClass('active');
    }

    function updateFee() {
        var cfg = getCfg();
        if (!cfg.regPar) {
            $('#feeHint').hide();
            return;
        }
        var amount = parseFloat($('#withdrawAmount').val()) || 0;
        var fee = amount * cfg.regPar / 100;
        var receive = amount - fee;
        if (receive < 0) {
            receive = 0;
        }
        $('#feeRate').text(cfg.regPar);
        $('#feeAmount').text(fee.toFixed(2));
        if ($('#receiveAmount').length) {
            $('#receiveAmount').text(receive.toFixed(2));
        }
        $('#feeHint').show();
    }

    function submitWithdraw() {
        var cfg = getCfg();
        var price = $('#withdrawAmount').val();
        var txpwd = $.trim($('#withdrawPwd').val());
        var channel = $('#withdrawChannel').val() || currentChannel;
        var bankid = channel === 'usdt' ? cfg.usdtId : cfg.bankId;

        if (!price) {
            layer.msg('请输入出金金额');
            return;
        }
        if (!txpwd) {
            layer.msg('请输入提现密码');
            return;
        }
        if (!bankid) {
            layer.msg(channel === 'usdt' ? '请先绑定 USDT 地址' : '请先绑定银行卡');
            return;
        }

        var $btn = $('#withdrawSubmit');
        $btn.prop('disabled', true).text('提交中...');

        $.ajax({
            url: (window.H5 && H5.apiUrl) ? H5.apiUrl('/index/h5api/withdraw') : '/index/h5api/withdraw',
            type: 'POST',
            headers: (window.H5 && H5.authHeaders) ? H5.authHeaders() : {},
            data: {
                price: price,
                txpwd: txpwd,
                channel: channel,
                bankid: bankid,
                bankcardno: '1'
            },
            dataType: 'json'
        }).done(function (res) {
            $btn.prop('disabled', false).text('确认提交');
            var ok = res && (res.type == 1 || res.code == 1);
            var msg = '';
            if (res) {
                if (res.msg) {
                    msg = res.msg;
                } else if (typeof res.data === 'string') {
                    msg = res.data;
                } else if (ok) {
                    msg = '提交成功';
                } else {
                    msg = '提交失败';
                }
            } else {
                msg = '提交失败';
            }
            layer.msg(msg);
            if (ok) {
                setTimeout(function () {
                    var url = (window.H5 && H5.pageUrl) ? H5.pageUrl('withdraw_record.html') : '/withdraw_record.html';
                    location.href = url;
                }, 800);
            }
        }).fail(function (xhr) {
            $btn.prop('disabled', false).text('确认提交');
            var msg = '网络错误，请重试';
            if (xhr && xhr.responseJSON) {
                msg = xhr.responseJSON.msg || xhr.responseJSON.data || msg;
            }
            layer.msg(msg);
        });
    }

    $(function () {
        $('.deposit-channel-btn').on('click', function () {
            switchChannel($(this).data('channel'));
        });
        $('#withdrawAmount').on('input blur', updateFee);
        $('#withdrawSubmit').on('click', submitWithdraw);
        window.H5WithdrawUi = { updateFee: updateFee, getCfg: getCfg };
    });
})();
