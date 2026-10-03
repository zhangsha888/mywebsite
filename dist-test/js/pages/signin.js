(function (window, $) {
    'use strict';

    function renderPlan(plan, streak) {
        var html = '';
        (plan || []).forEach(function (amount, idx) {
            var day = idx + 1;
            html += '<div class="plan-item' + (day === streak ? ' active' : '') + '">' +
                '<span class="d">第' + day + '天</span><span class="m">+' + amount + '</span></div>';
        });
        $('#signinPlanList').html(html);
    }

    function setSignedState() {
        var $btn = $('#signinBtn');
        $btn.addClass('disabled').prop('disabled', true).text('今日已签到');
    }

    window.H5PageSignin = {
        init: function () {
            H5App.bootPage({
                requireAuth: true,
                onReady: function () {
                    return H5.apiRequest('GET', '/index/h5api/signin_data').then(function (res) {
                        if (!res || res.code !== 1) {
                            return;
                        }
                        var d = res.data || {};
                        $('#signinStreak').text(d.streak || 1);
                        $('#signinReward').text(d.today_reward || 0);
                        $('#signinBalance').text(d.usermoney || 0);
                        renderPlan(d.plan || [], d.streak || 1);
                        if (d.signed) {
                            setSignedState();
                        }
                    });
                }
            });

            $('#signinBtn').on('click', function () {
                var $btn = $(this);
                if ($btn.prop('disabled')) {
                    return;
                }
                $btn.prop('disabled', true).text('签到中...');
                H5.apiRequest('POST', '/index/h5api/do_signin', { t: Date.now() }).then(function (res) {
                    if (!res || res.code !== 1) {
                        $btn.prop('disabled', false).text('立即签到');
                        layer.msg((res && res.msg) ? res.msg : '签到失败');
                        return;
                    }
                    if (typeof res.streak !== 'undefined') {
                        $('#signinStreak').text(res.streak);
                    }
                    if (typeof res.balance !== 'undefined') {
                        $('#signinBalance').text(res.balance);
                    }
                    setSignedState();
                    layer.msg('签到成功 +' + res.reward);
                }).fail(function () {
                    $btn.prop('disabled', false).text('立即签到');
                    layer.msg('网络错误');
                });
            });
        }
    };
})(window, window.jQuery);
