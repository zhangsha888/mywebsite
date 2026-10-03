(function (window, $) {
    'use strict';

    window.H5PageHold = {
        init: function () {
            H5App.bootPage({
                requireAuth: true,
                tab: 'hold',
                onReady: function () {
                    return H5.apiRequest('GET', '/index/h5api/hold_config').then(function (res) {
                        if (res && res.code === 1 && res.data && res.data.web_poundage != null && res.data.web_poundage !== '') {
                            $('#holdWebPoundage').text(res.data.web_poundage);
                        }
                    }).always(function () {
                        if (typeof change_category === 'function') {
                            change_category(0);
                        }
                    });
                }
            });
        }
    };
})(window, window.jQuery);
