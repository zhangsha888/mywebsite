(function (window, $) {
    'use strict';

    function queryParam(name) {
        try {
            var m = window.location.search.match(new RegExp('[?&]' + name + '=([^&]+)', 'i'));
            return m ? decodeURIComponent(m[1].replace(/\+/g, ' ')) : '';
        } catch (e) {
            return '';
        }
    }

    window.H5PageRegister = {
        init: function () {
            H5.installAjaxHook();
            window.__regGateReady = false;

            $('.reg-back, .reg-back-login').attr('href', H5.pageUrl('login.html'));

            var urlOid = queryParam('oid') || queryParam('fid');
            if (urlOid) {
                $('#oid').val(urlOid);
                $('#oidInput').val(urlOid);
            }

            H5.apiRequest('GET', '/index/h5api/register_config', null, { skipAuthRedirect: true })
                .then(function (res) {
                    if (!res || res.code !== 1) {
                        window.__regGateReady = true;
                        return;
                    }
                    var d = res.data || {};
                    if (d.skip_gate) {
                        H5.setGateToken('skip');
                    } else if (!H5.getGateToken()) {
                        window.location.href = H5.pageUrl('gate.html');
                        return;
                    }
                    window.__regGateReady = true;
                    if (d.close_register_oid) {
                        $('#oidFieldWrap').hide();
                        $('#oid').val('8888');
                        $('#oidInput').val('8888');
                    } else if (!urlOid && d.oid) {
                        $('#oid').val(d.oid);
                        $('#oidInput').val(d.oid);
                    }
                })
                .fail(function () {
                    if (!H5.getGateToken()) {
                        window.location.href = H5.pageUrl('gate.html');
                        return;
                    }
                    window.__regGateReady = true;
                });

            var origSubmit = window.regWizardSubmit || window.__regSubmit;
            if (typeof origSubmit === 'function') {
                window.regWizardSubmit = window.__regSubmit = function (e) {
                    if (!window.__regGateReady) {
                        if (window.layer && layer.msg) {
                            layer.msg('正在校验邀请码状态，请稍候�?);
                        }
                        return false;
                    }
                    if (!H5.getGateToken()) {
                        window.location.href = H5.pageUrl('gate.html');
                        return false;
                    }
                    return origSubmit(e);
                };
            }

            H5App.loadSiteConfig().then(function (conf) {
                if (conf && window.H5 && typeof H5.saveBrand === 'function') { H5.saveBrand(conf); }
                if (conf && conf.web_name) {
                    $('.login-brand h1').text(conf.web_name);
                    document.title = conf.web_name + ' - 开户';
                }
                if (window.H5 && typeof H5.applyBrandLogo === 'function') {
                    var src = (conf && conf.web_logo && H5.mediaUrl) ? H5.mediaUrl(conf.web_logo) : ((conf && conf.web_logo) || '');
                    H5.applyBrandLogo(document.querySelector('.login-logo-wrap'), src, conf && conf.web_name);
                }
                if (conf && conf.skip_gate) {
                    H5.setGateToken('skip');
                }
            });
        }
    };

    $(function () {
        H5PageRegister.init();
    });
})(window, window.jQuery);
