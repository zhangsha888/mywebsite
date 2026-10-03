(function (window, $) {
    'use strict';

    function errText(res, fallback) {
        if (!res) {
            return fallback || '登录失败';
        }
        if (typeof res.data === 'string' && res.data) {
            return res.data;
        }
        if (res.msg) {
            return res.msg;
        }
        return fallback || '登录失败';
    }

    function applyBrand(conf) {
        if (!conf) {
            return;
        }
        if (window.H5 && typeof H5.saveBrand === 'function') {
            H5.saveBrand(conf);
        }
        var name = conf.web_name || '';
        if (name) {
            $('.login-brand h1').text(name);
            document.title = name;
            $('.login-brand .en').hide();
        }
        var src = conf.web_logo && window.H5 && H5.mediaUrl ? H5.mediaUrl(conf.web_logo) : (conf.web_logo || '');
        if (window.H5 && typeof H5.applyBrandLogo === 'function') {
            H5.applyBrandLogo(document.querySelector('.login-logo-wrap'), src, name);
        }
    }

    window.H5PageLogin = {
        init: function () {
            H5.installAjaxHook();

            $('.login-footer-links a[href="/register.html"]').attr('href', H5.pageUrl('register.html'));

            function openCustomerService(url) {
                if (!url) {
                    alert('客服地址未配置，请联系管理员');
                    return;
                }
                var href = String(url);
                if (href.charAt(0) === '/' && window.H5 && typeof H5.apiUrl === 'function') {
                    href = H5.apiUrl(href);
                }
                window.open(href, '_blank');
            }

            $(document).on('click', '#loginForgotPwd', function (e) {
                e.preventDefault();
                var kf = $(this).attr('data-kf') || '';
                if (!kf && window.H5App && typeof H5App.getSiteConfig === 'function') {
                    var sc = H5App.getSiteConfig();
                    if (sc && sc.zxkf) {
                        kf = sc.zxkf;
                    }
                }
                openCustomerService(kf);
            });

            $(document).on('click', '#pwdToggle', function (e) {
                e.preventDefault();
                var $pwd = $('#pwd');
                if ($pwd.attr('type') === 'password') {
                    $pwd.attr('type', 'text');
                    $(this).text('隐藏');
                } else {
                    $pwd.attr('type', 'password');
                    $(this).text('显示');
                }
            });

            H5App.loadSiteConfig().then(function (conf) {
                if (conf && conf.skip_gate) {
                    H5.setGateToken('skip');
                } else if (!H5.getGateToken()) {
                    window.location.href = H5.pageUrl('gate.html');
                    return;
                }
                if (H5.getToken()) {
                    window.location.href = H5.pageUrl('home.html');
                    return;
                }
                applyBrand(conf);
                if (conf && conf.zxkf) {
                    $('#loginForgotPwd').attr('data-kf', String(conf.zxkf));
                }
            }).fail(function () {
                // API 不可用时仍显示登录页，避免 gate <-> login 死循环
            });

            $('#loginForm').on('submit', function (e) {
                e.preventDefault();
                var username = $.trim($('#username').val());
                var pwd = $('#pwd').val();
                if (!username || !pwd) {
                    alert('请输入账号和密码');
                    return;
                }
                var $btn = $('#loginSubmit');
                $btn.prop('disabled', true).text('登录中...');
                H5.apiRequest('POST', '/index/h5api/login', {
                    username: username,
                    pwd: pwd,
                    gate_token: H5.getGateToken()
                }, { skipAuthRedirect: true }).then(function (res) {
                    $btn.prop('disabled', false).text('登录');
                    if (res && res.code === 1 && res.data && res.data.auth) {
                        H5.setAuth(res.data.auth, res.data.gate_token || H5.getGateToken());
                        window.location.href = H5.pageUrl('home.html');
                    } else {
                        alert(errText(res, '登录失败'));
                        if (res && res.code === -2) {
                            H5.setGateToken('');
                            window.location.href = H5.pageUrl('gate.html');
                        }
                    }
                }).fail(function (xhr) {
                    $btn.prop('disabled', false).text('登录');
                    var msg = '网络错误，请重试';
                    if (xhr && xhr.responseJSON) {
                        msg = errText(xhr.responseJSON, msg);
                    } else if (xhr && xhr.responseText) {
                        try {
                            msg = errText(JSON.parse(xhr.responseText), msg);
                        } catch (err) {}
                    }
                    alert(msg);
                });
            });
        }
    };
})(window, window.jQuery);
