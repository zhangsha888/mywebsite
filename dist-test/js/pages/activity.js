(function (window, $) {
    'use strict';

    window.H5PageActivity = {
        init: function () {
            H5.installAjaxHook();
            H5App.loadSiteConfig().then(function (conf) {
                var img = (conf && conf.activity_image) ? conf.activity_image : '/public/jpg/gz.jpg';
                if (window.H5 && H5.mediaUrl) {
                    img = H5.mediaUrl(img);
                }
                $('#activityImageWrap').html(
                    '<img src="' + img + '" alt="活动中心" onerror="this.style.display=\'none\';this.parentNode.innerHTML=\'<div class=rules-ui-loading>图片加载失败</div>\'">'
                );
            });
        }
    };
})(window, window.jQuery);
