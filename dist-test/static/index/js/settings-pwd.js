/**
 * 设置页：登录密码 / 支付密码修改
 */
$(function () {
    'use strict';

    function tip(msg) {
        if (window.layer && layer.msg) {
            layer.msg(msg);
        } else {
            window.alert(msg);
        }
    }

    function apiPath(path) {
        return (window.H5 && typeof H5.apiUrl === 'function') ? H5.apiUrl(path) : path;
    }

    function authHeaders() {
        return (window.H5 && typeof H5.authHeaders === 'function') ? H5.authHeaders() : {};
    }

    function submitPwd(payload, $btn, clearSel, okFallback) {
        var prev = $btn.text();
        $btn.prop('disabled', true).text('提交中...');
        $.ajax({
            url: apiPath('/index/h5api/change_pwd'),
            type: 'POST',
            headers: authHeaders(),
            data: payload,
            dataType: 'json',
            timeout: 20000
        }).done(function (res) {
            if (res && res.code === 1) {
                var tipMsg = res.msg;
                if (!tipMsg && typeof res.data === 'string') {
                    tipMsg = res.data;
                }
                tip(tipMsg || okFallback);
                $(clearSel).val('');
            } else {
                var errMsg = (res && res.msg) ? res.msg : '';
                if (!errMsg && res && typeof res.data === 'string') {
                    errMsg = res.data;
                }
                tip(errMsg || '修改失败');
            }
        }).fail(function (xhr) {
            var msg = '网络异常，请稍后重试';
            if (xhr && xhr.responseJSON) {
                msg = xhr.responseJSON.msg || xhr.responseJSON.data || msg;
            } else if (xhr && xhr.responseText) {
                try {
                    var j = JSON.parse(xhr.responseText);
                    msg = j.msg || j.data || msg;
                } catch (e) {}
            }
            tip(msg);
        }).always(function () {
            $btn.prop('disabled', false).text(prev);
        });
    }

    $('#btnLoginPwd').on('click', function () {
        var newpwd = $.trim($('#newpwd').val());
        var surepwd = $.trim($('#surepwd').val());
        var oldpwd = $.trim($('#oldpwd').val());

        if (!oldpwd) { tip('请输入旧登录密码'); return; }
        if (!newpwd) { tip('请输入新登录密码'); return; }
        if (newpwd.length < 6) { tip('新登录密码至少6位'); return; }
        if (!surepwd) { tip('请确认新密码'); return; }
        if (newpwd !== surepwd) { tip('两次输入密码不一致'); return; }

        submitPwd({
            oldpwd: oldpwd,
            newpwd: newpwd,
            surepwd: surepwd,
            newtxpwd: '',
            oldtxpwd: ''
        }, $(this), '#oldpwd,#newpwd,#surepwd', '登录密码修改成功');
    });

    $('#btnPayPwd').on('click', function () {
        var newtxpwd = $.trim($('#newtxpwd').val());
        var suretxpwd = $.trim($('#suretxpwd').val());
        var oldtxpwd = $.trim($('#oldtxpwd').val());

        if (!oldtxpwd) { tip('请输入旧支付密码'); return; }
        if (!newtxpwd) { tip('请输入新支付密码'); return; }
        if (newtxpwd.length < 6) { tip('新支付密码至少6位'); return; }
        if (!suretxpwd) { tip('请确认支付密码'); return; }
        if (newtxpwd !== suretxpwd) { tip('两次输入密码不一致'); return; }

        submitPwd({
            oldtxpwd: oldtxpwd,
            newtxpwd: newtxpwd,
            suretxpwd: suretxpwd,
            newpwd: '',
            oldpwd: ''
        }, $(this), '#oldtxpwd,#newtxpwd,#suretxpwd', '支付密码修改成功');
    });
});
