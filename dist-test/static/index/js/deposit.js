(function () {
    var currentChannel = 'bank';

    function copyText(text) {
        if (!text || text === '-') {
            layer.msg('暂无可复制内容');
            return;
        }
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(function () {
                layer.msg('复制成功');
            }).catch(function () {
                fallbackCopy(text);
            });
        } else {
            fallbackCopy(text);
        }
    }

    function fallbackCopy(text) {
        var ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        try {
            document.execCommand('copy');
            layer.msg('复制成功');
        } catch (e) {
            layer.msg('复制失败，请手动复制');
        }
        document.body.removeChild(ta);
    }

    function switchChannel(channel) {
        currentChannel = channel;
        $('#depositChannel').val(channel);
        $('.deposit-channel-btn').removeClass('active');
        $('.deposit-channel-btn[data-channel="' + channel + '"]').addClass('active');
        $('.deposit-panel').removeClass('active');
        $('#panel-' + channel).addClass('active');
        if (channel === 'usdt') {
            $('#amountPrefix').text('$');
            $('#depositAmount').attr('placeholder', '请输入 USDT 数量');
        } else {
            $('#amountPrefix').text('¥');
            $('#depositAmount').attr('placeholder', '请输入人民币金额');
        }
    }

    function submitDeposit() {
        var money = $('#depositAmount').val();
        var truename = $.trim($('#depositName').val());
        var channel = $('#depositChannel').val() || currentChannel;

        if (!money) {
            layer.msg('请输入入金金额');
            return;
        }
        if (!truename) {
            layer.msg('请输入存款姓名');
            return;
        }
        money = parseFloat(money);
        if (isNaN(money) || money <= 0) {
            layer.msg('请输入正确的金额');
            return;
        }
        if (money < 50) {
            layer.msg('最小入金50元起');
            return;
        }
        if (money > 1000000) {
            layer.msg('最大入金1000000元');
            return;
        }

        var $btn = $('#depositSubmit');
        $btn.prop('disabled', true).text('提交中...');

        $.ajax({
            url: (window.H5 && H5.apiUrl) ? H5.apiUrl('/index/h5api/paysubmit') : '/index/h5api/paysubmit',
            type: 'POST',
            data: {
                price: money,
                truename: truename,
                channel: channel
            },
            headers: (window.H5 && H5.authHeaders) ? H5.authHeaders() : {},
            dataType: 'json',
            success: function (json) {
                $btn.prop('disabled', false).text('提交入款申请');
                if (json && (json.status === true || json.status === 1 || json.code === 1)) {
                    layer.msg(json.msg || json.data || '提交成功，请等待审核');
                    setTimeout(function () {
                        var url = (window.H5 && H5.pageUrl) ? H5.pageUrl('deposit_record.html') : '/deposit_record.html';
                        location.href = url;
                    }, 600);
                } else {
                    layer.msg((json && (json.msg || json.data)) ? (json.msg || json.data) : '提交失败');
                }
            },
            error: function (xhr) {
                $btn.prop('disabled', false).text('提交入款申请');
                var msg = '网络错误，请重试';
                if (xhr && xhr.responseJSON) {
                    msg = xhr.responseJSON.msg || xhr.responseJSON.data || msg;
                }
                layer.msg(msg);
            }
        });
    }

    function readCopyText(el) {
        var $el = $(el);
        var t = $el.attr('data-copy');
        if (t === undefined || t === null || t === '') {
            t = $el.data('copy');
        }
        if (!t) {
            t = $el.text();
        }
        return String(t || '').trim();
    }

    $(function () {
        $('.deposit-channel-btn').on('click', function () {
            switchChannel($(this).data('channel'));
        });

        $('.deposit-copy-btn').on('click', function () {
            var id = $(this).data('copy-target');
            copyText(readCopyText('#' + id));
        });

        $('.copy-target').on('click', function () {
            copyText(readCopyText(this));
        });

        $('#depositSubmit').on('click', submitDeposit);
    });
})();
