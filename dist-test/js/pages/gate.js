(function (window, $) {
    'use strict';

    window.H5PageGate = {
        init: function () {
            H5.installAjaxHook();
            H5App.loadSiteConfig().then(function (conf) {
                if (conf && conf.skip_gate) {
                    H5.setGateToken('skip');
                    window.location.href = H5.pageUrl('login.html');
                    return;
                }
                if (H5.getGateToken()) {
                    window.location.href = H5.pageUrl('login.html');
                }
                if (conf && window.H5 && typeof H5.saveBrand === 'function') {
                    H5.saveBrand(conf);
                }
                if (conf && conf.web_name) {
                    $('.gate-brand-text h2').text(conf.web_name);
                    document.title = conf.web_name;
                    $('.gate-brand-text p').hide();
                }
                if (window.H5 && typeof H5.applyBrandLogo === 'function') {
                    var src = (conf && conf.web_logo && H5.mediaUrl) ? H5.mediaUrl(conf.web_logo) : ((conf && conf.web_logo) || '');
                    H5.applyBrandLogo(document.querySelector('.gate-brand .logo-circle'), src, conf && conf.web_name);
                }
            });

            $('#gateSubmit').on('click', submitGate);
            $('#gateCode').on('keydown', function (e) {
                if (e.keyCode === 13) submitGate();
            });

            function submitGate() {
                var passwd = $.trim($('#gateCode').val());
                if (!passwd) {
                    alert('请输入内部邀请码');
                    return;
                }
                var $btn = $('#gateSubmit');
                $btn.prop('disabled', true).text('验证中...');
                H5.apiRequest('POST', '/index/h5api/verify_gate', { passwd: passwd }, { skipAuthRedirect: true })
                    .then(function (res) {
                        $btn.prop('disabled', false).text('验证');
                        if (res && res.code === 1) {
                            H5.setGateToken(res.data.gate_token);
                            window.location.href = H5.pageUrl('login.html');
                        } else {
                            alert((res && res.data) || '邀请码错误');
                        }
                    })
                    .fail(function (xhr) {
                        $btn.prop('disabled', false).text('验证');
                        var msg = '网络错误，请重试';
                        if (xhr && xhr.responseJSON) {
                            msg = xhr.responseJSON.msg || xhr.responseJSON.data || msg;
                        } else if (xhr && xhr.responseText) {
                            try {
                                var j = JSON.parse(xhr.responseText);
                                msg = j.msg || j.data || msg;
                            } catch (e) {}
                        }
                        alert(msg);
                    });
            }
        }
    };
})(window, window.jQuery);
