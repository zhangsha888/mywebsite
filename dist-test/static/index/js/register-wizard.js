/**
 * 注册两步向导
 */
(function (window, $) {
    'use strict';

    if (!$) {
        return;
    }

    function uiT(s) {
        return (window.UII18n && typeof window.UII18n.t === 'function') ? window.UII18n.t(s) : s;
    }

    var step = 1;
    var submitting = false;
    var $step1, $step2, $flowVal, $statusVal, $badge, $alert;

    function goStep(n) {
        step = n;
        $step1.toggleClass('active', n === 1);
        $step2.toggleClass('active', n === 2);
        $flowVal.text(uiT('步骤') + ' ' + n + ' / 2');
        $badge.text(n < 10 ? '0' + n : String(n));
        if (n === 1) {
            $('#regStatusLabel').text(uiT('资料状态'));
            $statusVal.text(uiT('待填写'));
        } else {
            $('#regStatusLabel').text(uiT('密码设置'));
            $statusVal.text(uiT('待完成'));
        }
        var $card = $('.reg-form-card');
        if ($card.length) {
            $card[0].scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function bindPwdToggle(btnId, inputId) {
        $(btnId).on('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            var $in = $(inputId);
            if ($in.attr('type') === 'password') {
                $in.attr('type', 'text');
                $(this).text(uiT('隐藏'));
            } else {
                $in.attr('type', 'password');
                $(this).text(uiT('显示'));
            }
        });
    }

    function isValidName(name) {
        var n = String(name || '').trim();
        return n.length >= 1 && n.length <= 30;
    }

    function syncOid() {
        if ($('#oidInput').length) {
            var oidVal = $.trim($('#oidInput').val());
            $('#oid').val(oidVal !== '' ? oidVal : '8888');
        } else if (!$('#oid').val()) {
            $('#oid').val('8888');
        }
    }

    function saveStep1Cache() {
        try {
            sessionStorage.setItem('reg_username', $.trim($('#username').val()));
            sessionStorage.setItem('reg_nickname', $.trim($('#nickname').val()));
        } catch (e) {}
    }

    function restoreStep1Cache() {
        try {
            if (!$.trim($('#username').val())) {
                $('#username').val(sessionStorage.getItem('reg_username') || '');
            }
            if (!$.trim($('#nickname').val())) {
                $('#nickname').val(sessionStorage.getItem('reg_nickname') || '');
            }
        } catch (e) {}
    }

    function clearFieldHints() {
        $('.reg-field-hint').addClass('is-hidden').removeClass('is-error').text('');
        $('.login-input-wrap').removeClass('has-error');
    }

    function setFieldHint(fieldId, msg) {
        var $hint = $('#hint-' + fieldId);
        var $wrap = $('#' + fieldId).closest('.login-input-wrap');
        if (!$hint.length) {
            return;
        }
        if (msg) {
            $hint.text(uiT(msg)).removeClass('is-hidden').addClass('is-error');
            $wrap.addClass('has-error');
        } else {
            $hint.addClass('is-hidden').removeClass('is-error').text('');
            $wrap.removeClass('has-error');
        }
    }

    function showAlert(msg, type) {
        if (!$alert.length) {
            return;
        }
        if (!msg) {
            $alert.addClass('is-hidden').removeClass('is-error is-success').text('');
            return;
        }
        $alert.text(uiT(msg)).removeClass('is-hidden is-error is-success')
            .addClass(type === 'success' ? 'is-success' : 'is-error');
    }

    function notify(msg, icon) {
        var text = uiT(msg);
        showAlert(text, icon === 1 ? 'success' : 'error');
        if (typeof layer !== 'undefined' && layer.msg) {
            layer.msg(text, { icon: icon || 0, time: 2500 });
        } else {
            window.alert(text);
        }
    }

    function validateStep1() {
        restoreStep1Cache();
        clearFieldHints();
        var ok = true;
        var nickname = $.trim($('#nickname').val());
        var username = $.trim($('#username').val());

        if (!isValidName(nickname)) {
            if (!nickname) {
                setFieldHint('nickname', '请输入姓名');
            } else {
                setFieldHint('nickname', '姓名长度为1-30个字符');
            }
            ok = false;
        }
        if (username.length < 4 || username.length > 16) {
            setFieldHint('username', '账号为4-16位英文或数字');
            ok = false;
        } else if (!/^[A-Za-z0-9]{4,16}$/.test(username)) {
            setFieldHint('username', '账号只能包含英文或数字');
            ok = false;
        }
        if (!ok) {
            notify('请填写账号与姓名（步骤1）', 2);
        } else {
            saveStep1Cache();
            showAlert('', '');
        }
        return ok;
    }

    function validateStep2() {
        clearFieldHints();
        var ok = true;
        var upwd = $('#upwd').val() || '';
        var upwd2 = $('#upwd2').val() || '';
        var txpwd = $('#txpwd').val() || '';
        var txpwd2 = $('#txpwd2').val() || '';

        if (upwd.length < 6) {
            setFieldHint('upwd', '登录密码至少6位');
            ok = false;
        }
        if (!upwd2) {
            setFieldHint('upwd2', '请再次输入登录密码');
            ok = false;
        } else if (upwd !== upwd2) {
            setFieldHint('upwd2', '两次登录密码不一致');
            ok = false;
        }
        if (txpwd.length < 6) {
            setFieldHint('txpwd', '交易密码至少6位');
            ok = false;
        }
        if (!txpwd2) {
            setFieldHint('txpwd2', '请再次输入交易密码');
            ok = false;
        } else if (txpwd !== txpwd2) {
            setFieldHint('txpwd2', '两次交易密码不一致');
            ok = false;
        }
        if (!ok) {
            notify('请按提示修正密码', 2);
        } else {
            showAlert('', '');
        }
        return ok;
    }

    function getRegisterUrl() {
        var u = window.REG_FORM_URL || '/index/login/register';
        if (u.indexOf('.html') !== -1) {
            u = u.replace(/\.html(\?.*)?$/i, '$1');
        }
        if (window.H5 && typeof window.H5.apiUrl === 'function') {
            return window.H5.apiUrl(u);
        }
        return u;
    }

    function parseJsonResponse(text) {
        if (!text) {
            return null;
        }
        try {
            return typeof text === 'object' ? text : JSON.parse(text);
        } catch (e) {
            return null;
        }
    }

    function submitRegister(e) {
        if (e && e.preventDefault) {
            e.preventDefault();
        }
        if (e && e.stopPropagation) {
            e.stopPropagation();
        }
        if (submitting) {
            return false;
        }

        var form = document.getElementById('formid');
        if (!form) {
            notify('页面异常，请刷新后重试', 2);
            return false;
        }

        showAlert('正在提交，请稍候...', 'success');

        if (!validateStep1()) {
            goStep(1);
            return false;
        }
        if (!validateStep2()) {
            goStep(2);
            return false;
        }

        syncOid();
        restoreStep1Cache();

        var formurl = getRegisterUrl();
        if (window.H5 && window.H5.cfg && !String((window.H5.cfg().apiBase || '')).match(/^https?:\/\//i)) {
            notify('接口未配置：请检查 config.js 的 apiBase', 2);
            return false;
        }
        var locurl = window.REG_LOC_URL || (window.H5 && H5.pageUrl ? H5.pageUrl('home.html') : '/home.html');
        var $btn = $('#btnRegSubmit');
        submitting = true;
        $btn.prop('disabled', true).text(uiT('提交中...'));

        var postData = $(form).serialize();
        if (window.H5 && typeof window.H5.getGateToken === 'function') {
            var gt = window.H5.getGateToken();
            if (gt) {
                postData += (postData ? '&' : '') + 'gate_token=' + encodeURIComponent(gt);
            }
        }

        $.ajax({
            url: formurl,
            type: 'POST',
            data: postData,
            headers: (window.H5 && window.H5.authHeaders) ? window.H5.authHeaders() : { 'X-H5-Client': '1' },
            dataType: 'text',
            timeout: 30000
        }).done(function (raw) {
            var res = parseJsonResponse(raw);
            if (!res) {
                submitting = false;
                $btn.prop('disabled', false).text(uiT('完成开户'));
                notify('服务器返回异常，请稍后重试', 2);
                return;
            }
            var ok = (res.type == 1 || res.code === 1);
            if (ok) {
                var tip = res.msg || res.data || '注册成功';
                notify(tip, 1);
                if (res.auth && window.H5 && typeof window.H5.setAuth === 'function') {
                    var gt = res.gate_token || (window.H5.getGateToken && window.H5.getGateToken());
                    window.H5.setAuth(res.auth, gt);
                }
                try {
                    sessionStorage.removeItem('reg_username');
                    sessionStorage.removeItem('reg_nickname');
                } catch (err) {}
                setTimeout(function () {
                    var needReview = res.need_review == 1 || !res.auth;
                    var url;
                    if (window.H5 && typeof window.H5.pageUrl === 'function') {
                        if (needReview) {
                            url = window.H5.pageUrl('login.html');
                        } else if (res.redirect && String(res.redirect).indexOf('.html') > 0) {
                            url = window.H5.pageUrl(String(res.redirect).replace(/^\//, ''));
                        } else {
                            url = window.H5.pageUrl('home.html');
                        }
                    } else {
                        url = needReview ? '/login.html' : (locurl || '/home.html');
                    }
                    window.location.href = url;
                }, 800);
                return;
            }
            submitting = false;
            $btn.prop('disabled', false).text(uiT('完成开户'));
            notify(res.msg || res.data || '注册失败', 2);
            if (res.code === -2 && window.H5) {
                window.H5.setGateToken('');
                window.location.href = window.H5.pageUrl('gate.html');
            }
        }).fail(function (xhr, textStatus) {
            submitting = false;
            $btn.prop('disabled', false).text(uiT('完成开户'));
            var msg = '网络错误，请稍后重试';
            var status = xhr && xhr.status ? xhr.status : 0;
            if (status === 405 || status === 404) {
                msg = '接口地址配置错误：请检查 config.js 的 apiBase 是否指向 PHP 服务器';
            } else if (textStatus === 'timeout') {
                msg = '请求超时，请检查网络后重试';
            } else if (status === 503) {
                msg = '服务暂不可用，请稍后重试或联系管理员';
            }
            if (xhr && xhr.responseText) {
                var errRes = parseJsonResponse(xhr.responseText);
                if (errRes && (errRes.msg || errRes.data)) {
                    msg = errRes.msg || errRes.data;
                } else if (xhr.responseText.indexOf('fields not exists') !== -1) {
                    msg = '系统配置异常，请联系管理员';
                } else if (xhr.responseText.indexOf('<!DOCTYPE') !== -1 || xhr.responseText.indexOf('<html') !== -1) {
                    msg = '接口地址配置错误：请检查 config.js 的 apiBase';
                }
            } else if (status === 0) {
                msg = '无法连接 API（' + formurl + '），请确认 config.js 与服务器 CORS 配置';
            }
            notify(msg, 2);
        });

        return false;
    }

    function initRegisterWizard() {
        $step1 = $('#regStep1');
        $step2 = $('#regStep2');
        $flowVal = $('#regFlowStep');
        $statusVal = $('#regStatusText');
        $badge = $('#regStepBadge');
        $alert = $('#regFormAlert');

        if (!$step1.length || !$step2.length) {
            return;
        }

        bindPwdToggle('#toggleUpwd', '#upwd');
        bindPwdToggle('#toggleUpwd2', '#upwd2');
        bindPwdToggle('#toggleTxpwd', '#txpwd');
        bindPwdToggle('#toggleTxpwd2', '#txpwd2');

        $('#username,#nickname').on('blur', function () {
            if (step === 1) {
                validateStep1();
            }
        });

        $('#btnRegNext').on('click', function (e) {
            e.preventDefault();
            if (!validateStep1()) {
                return;
            }
            goStep(2);
        });

        $('#btnRegSubmit').on('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            submitRegister(e);
        });

        $('#formid').on('submit', function (e) {
            e.preventDefault();
            submitRegister(e);
        });

        window.__regSubmit = submitRegister;
        window.regWizardSubmit = submitRegister;

        syncOid();
        restoreStep1Cache();
        goStep(1);
    }

    $(initRegisterWizard);

})(window, window.jQuery);
