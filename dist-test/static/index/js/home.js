(function () {
    function getBase64Codec() {
        if (typeof Base64 === 'undefined') {
            return null;
        }
        if (typeof Base64.decode === 'function') {
            return Base64;
        }
        try {
            return new Base64();
        } catch (e) {
            return null;
        }
    }

    var Base64Codec = getBase64Codec();

    function initBanner() {
        var el = document.getElementById('homeBanner');
        if (!el || typeof Swiper === 'undefined') {
            return;
        }
        var slideCount = el.querySelectorAll('.swiper-slide').length;
        if (slideCount < 1) {
            return;
        }
        new Swiper('#homeBanner', {
            loop: slideCount > 1,
            autoplay: slideCount > 1 ? {
                delay: 3500,
                disableOnInteraction: false
            } : false,
            pagination: {
                el: '#homeBanner .swiper-pagination',
                clickable: true
            },
            speed: 500
        });
    }

    function flashPrice($el) {
        $el.addClass('price-flash');
        setTimeout(function () {
            $el.removeClass('price-flash');
        }, 500);
    }

    function applyPriceStyle($el, isup, pct) {
        var isDown = isup === 0;
        if (typeof pct !== 'undefined' && pct !== null && !isNaN(parseFloat(pct))) {
            isDown = parseFloat(pct) < 0;
        }
        if (isDown) {
            $el.addClass('price-down down');
        } else {
            $el.removeClass('price-down down');
        }
    }

    function formatPct(pct) {
        var n = parseFloat(pct);
        if (isNaN(n)) {
            n = 0;
        }
        return (n >= 0 ? '+' : '') + n.toFixed(2) + '%';
    }

    function updateBadgeEl($el, pct, isup) {
        if (!$el.length) {
            return;
        }
        $el.text(formatPct(pct));
        applyPriceStyle($el, isup, pct);
    }

    function updatePriceEl($el, price, isup) {
        if (!$el.length) {
            return;
        }
        var oldVal = parseFloat(String($el.text()).replace(/,/g, ''));
        var newVal = parseFloat(String(price).replace(/,/g, ''));
        if ($el.text() !== String(price)) {
            $el.text(price);
            if (!isNaN(oldVal) && !isNaN(newVal) && oldVal !== newVal) {
                flashPrice($el);
            }
        }
        applyPriceStyle($el, isup, undefined);
    }

    function applyQuotesList(list) {
        if (!list) {
            return;
        }
        $.each(list, function (pid, v) {
            var pct = typeof v.pct !== 'undefined' ? v.pct : 0;
            var isup = typeof v.isup !== 'undefined' ? v.isup : (parseFloat(pct) >= 0 ? 1 : 0);
            updatePriceEl($('#p_' + pid), v.Price, isup);
            updatePriceEl($('#rec_p_' + pid), v.Price, isup);
            updateBadgeEl($('#rec_ch_' + pid), pct, isup);

            var $status = $('#pd_' + pid);
            if ($status.length) {
                var dealing = typeof v.is_deal !== 'undefined' ? parseInt(v.is_deal, 10) === 1 : $status.attr('data-deal') === '1';
                $status.attr('data-deal', dealing ? '1' : '0');
                if (dealing) {
                    var down = isup === 0 || parseFloat(pct) < 0;
                    $status.text('交易中').removeClass('status-closed pct-down').toggleClass('pct-down', down);
                } else {
                    $status.text('休市').removeClass('pct-down').addClass('status-closed');
                }
            }

            var $spark = $('#rec_p_' + pid).closest('.home-ui-rec-card').find('.home-ui-rec-chart polyline');
            if ($spark.length) {
                var down = isup === 0 || parseFloat(pct) < 0;
                $spark.attr('stroke', down ? '#ff4d4f' : '#52c41a');
            }
        });
    }

    function ajaxHomePro() {
        if (typeof jQuery === 'undefined') {
            return;
        }
        if (window.H5 && H5.apiUrl) {
            $.getJSON(H5.apiUrl('/index/h5api/pro_quotes'), function (res) {
                if (!res || res.code !== 1) {
                    return;
                }
                applyQuotesList(res.data || {});
            });
            return;
        }
        if (!Base64Codec) {
            return;
        }
        $.get('/index/index/ajaxindexpro', function (data) {
            if (!data) {
                return;
            }
            var list;
            try {
                list = jQuery.parseJSON(Base64Codec.decode(data));
            } catch (e) {
                return;
            }
            applyQuotesList(list);
        });
    }

    function bindProductNav() {
        $(document).on('click', '.t_con_home_ul', function () {
            var url = $(this).data('url');
            if (url) {
                window.location.href = url;
            }
        });
    }

    function refreshHomeMsgBadge() {
        var el = document.getElementById('homeMsgBadge');
        if (!el) {
            return;
        }
        if (window.H5 && H5.apiRequest) {
            H5.apiRequest('GET', '/index/h5api/mail_unread').then(function (res) {
                if (!res || res.code !== 1) {
                    return;
                }
                var payload = res.data || res;
                var n = parseInt(payload.count, 10);
                if (isNaN(n) || n < 0) {
                    n = 0;
                }
                el.textContent = n > 99 ? '99+' : String(n);
                el.classList.toggle('has-unread', n > 0);
            });
            return;
        }
        $.getJSON('/index/index/ajax_mail_unread', function (res) {
            var n = parseInt(res.count, 10);
            if (isNaN(n) || n < 0) {
                n = 0;
            }
            el.textContent = n > 99 ? '99+' : String(n);
            if (n > 0) {
                el.classList.add('has-unread');
            } else {
                el.classList.remove('has-unread');
            }
        });
    }

    $(function () {
        initBanner();
        bindProductNav();
        ajaxHomePro();
        setInterval(ajaxHomePro, 500);
    });

    window.addEventListener('pageshow', refreshHomeMsgBadge);
})();
