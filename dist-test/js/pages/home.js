(function (window, $) {
    'use strict';

    var FALLBACK_IMG = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2244%22 height=%2244%22%3E%3Crect fill=%22%23e8ecf0%22 width=%2244%22 height=%2244%22 rx=%228%22/%3E%3C/svg%3E';
    var SPARK = '0,22 20,18 40,20 60,12 80,14 100,8';
    var SPARK_DOWN = '0,8 20,14 40,12 60,20 80,18 100,22';
    var swiperInst = null;

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function media(path) {
        if (window.H5 && H5.mediaUrl) {
            return H5.mediaUrl(path);
        }
        return path || '';
    }

    function destroyBanner() {
        if (swiperInst) {
            try {
                if (typeof swiperInst.destroy === 'function') {
                    swiperInst.destroy(true, true);
                }
            } catch (e) {}
            swiperInst = null;
        }
    }

    function initBannerSwiper() {
        if (typeof Swiper === 'undefined') {
            return;
        }
        destroyBanner();
        var $slides = $('#homeBanner .swiper-slide');
        var count = $slides.length;
        if (!count) {
            return;
        }
        // 等 DOM 写入后再初始化，避免高度/loop 异常
        requestAnimationFrame(function () {
            destroyBanner();
            swiperInst = new Swiper('#homeBanner', {
                loop: count > 1,
                autoplay: count > 1 ? {
                    delay: 3500,
                    disableOnInteraction: false
                } : false,
                pagination: {
                    el: '#homeBanner .swiper-pagination',
                    clickable: true
                },
                observer: true,
                observeParents: true,
                watchOverflow: true,
                speed: 500
            });
            // 图片加载后再 update，避免空白高度
            $('#homeBanner img').each(function () {
                var img = this;
                if (img.complete) {
                    return;
                }
                $(img).one('load error', function () {
                    if (swiperInst && typeof swiperInst.update === 'function') {
                        try { swiperInst.update(); } catch (e) {}
                    }
                });
            });
        });
    }

    function renderSlides(slides) {
        var html = '';
        var seen = {};
        (slides || []).forEach(function (s) {
            if (!s || !s.img) {
                return;
            }
            var img = media(String(s.img).replace(/\\/g, '/'));
            if (!img || seen[img]) {
                return;
            }
            seen[img] = 1;
            html += '<div class="swiper-slide">' +
                '<img src="' + esc(img) + '" alt="" ' +
                'onerror="this.onerror=null;this.src=\'' + esc(media('/public/jpg/banner.jpg')) + '\';this.style.background=\'#dceef8\'">' +
                '</div>';
        });
        if (!html) {
            html = '<div class="swiper-slide"><img src="' + esc(media('/public/jpg/banner.jpg')) + '" alt="" ' +
                'onerror="this.parentElement.style.background=\'#dceef8\';this.style.display=\'none\'"></div>';
        }
        $('#homeBanner .swiper-wrapper').html(html);
        initBannerSwiper();
    }

    function renderProducts(pro) {
        var recHtml = '';
        var listHtml = '';
        var list = pro || [];
        if (!list.length) {
            $('.home-ui-recommend-scroll').html('<div class="home-ui-empty" style="padding:20px;color:#999;text-align:center;">暂无推荐产品</div>');
            $('.home-ui-pro-list').html('<div class="home-ui-empty" style="padding:24px;color:#999;text-align:center;">暂无产品</div>');
            return;
        }
        list.forEach(function (vo, idx) {
            var isDown = vo.is_rise === 2 || vo.is_up === 0 || (typeof vo.pct !== 'undefined' && parseFloat(vo.pct) < 0);
            var pct = typeof vo.pct !== 'undefined' ? parseFloat(vo.pct) : 0;
            if (isNaN(pct)) pct = 0;
            var pctStr = (pct >= 0 ? '+' : '') + pct.toFixed(2) + '%';
            var goodsUrl = H5.pageUrl('goods.html?pid=' + vo.pid);
            var stroke = isDown ? '#ff4d4f' : '#52c41a';
            var sparkPts = isDown ? SPARK_DOWN : SPARK;
            if (idx < 6) {
                recHtml += '<a href="javascript:;" class="home-ui-rec-card t_con_home_ul" data-url="' + goodsUrl + '">' +
                    '<div class="name">' + esc(vo.ptitle) + '</div>' +
                    '<div class="code">' + esc(vo.showcode || vo.procode || '') + '</div>' +
                    '<div class="home-ui-rec-chart"><svg viewBox="0 0 100 30" preserveAspectRatio="none">' +
                    '<polyline fill="none" stroke="' + stroke + '" stroke-width="2" points="' + sparkPts + '"/></svg></div>' +
                    '<div class="home-ui-rec-bottom">' +
                    '<span class="home-ui-rec-price ' + (isDown ? 'down' : '') + '" id="rec_p_' + vo.pid + '">' + esc(vo.Price) + '</span>' +
                    '<span class="home-ui-rec-badge ' + (isDown ? 'down' : '') + '" id="rec_ch_' + vo.pid + '">' + pctStr + '</span>' +
                    '</div></a>';
            }
            var dealing = parseInt(vo.is_deal, 10) === 1;
            var statusCls = dealing ? (isDown ? 'pct-down' : '') : 'status-closed';
            var statusTxt = dealing ? '交易中' : '休市';
            var thumb = media(vo.img || '/public/jpg/logo.png');
            listHtml += '<ul class="t_con_home_ul" data-url="' + goodsUrl + '">' +
                '<li class="pro-main"><img src="' + esc(thumb) + '" alt="" onerror="this.src=\'' + FALLBACK_IMG + '\'">' +
                '<div class="pro-info">' +
                '<span class="ptitle">' + esc(vo.ptitle) + '</span><span class="pcode">' + esc(vo.showcode || '') + '</span></div></li>' +
                '<li class="pro-price-wrap"><span class="' + (isDown ? 'price-down' : '') + '" id="p_' + vo.pid + '">' + esc(vo.Price) + '</span></li>' +
                '<li class="pro-change"><span class="t_status ' + statusCls + '" id="pd_' + vo.pid + '" data-deal="' + (dealing ? '1' : '0') + '">' + statusTxt + '</span></li><li></li></ul>';
        });
        $('.home-ui-recommend-scroll').html(recHtml);
        $('.home-ui-pro-list').html(listHtml);
    }

    function applyConf(conf) {
        if (!conf) return;
        if (window.H5 && typeof H5.saveBrand === 'function') {
            H5.saveBrand(conf);
        }
        if (conf.web_name) {
            $('.home-ui-brand-text h1').text(conf.web_name);
            document.title = conf.web_name;
            $('.home-ui-brand-text p').hide();
        }
        if (conf.web_logo) {
            var $img = $('.home-ui-brand img');
            var src = media(conf.web_logo);
            $img.off('error.brandlogo load.brandlogo')
                .on('load.brandlogo', function () { $(this).show(); })
                .on('error.brandlogo', function () { $(this).hide(); })
                .attr('src', src);
        } else if (conf.web_name) {
            $('.home-ui-brand img').hide();
        }
        if (conf.zxkf) {
            $('.home-ui-kf-card').attr('onclick', "window.open('" + String(conf.zxkf).replace(/'/g, "\\'") + "','_blank')");
        }
    }

    function applyHomeQuotes(list) {
        if (!list || !window.H5Quotes) {
            return;
        }
        $.each(list, function (pid, v) {
            if (!v) {
                return;
            }
            var pct = typeof v.pct !== 'undefined' ? parseFloat(v.pct) : 0;
            if (isNaN(pct)) pct = 0;
            var isDown = (typeof v.isup !== 'undefined' ? parseInt(v.isup, 10) === 0 : pct < 0);
            var $p = $('#p_' + pid);
            var $rec = $('#rec_p_' + pid);
            var $badge = $('#rec_ch_' + pid);
            var $status = $('#pd_' + pid);
            var price = v.Price;

            if ($p.length) {
                if (H5Quotes.priceChanged($p.text(), price)) {
                    $p.text(price);
                    H5Quotes.restartFlash($p);
                }
                $p.toggleClass('price-down', isDown);
            }
            if ($rec.length) {
                if (H5Quotes.priceChanged($rec.text(), price)) {
                    $rec.text(price);
                    H5Quotes.restartFlash($rec);
                }
                $rec.toggleClass('down', isDown);
            }
            if ($badge.length) {
                $badge.text(H5Quotes.formatPct(pct)).toggleClass('down', isDown);
            }
            if ($status.length) {
                var dealing = typeof v.is_deal !== 'undefined' ? parseInt(v.is_deal, 10) === 1 : $status.attr('data-deal') === '1';
                $status.attr('data-deal', dealing ? '1' : '0');
                if (dealing) {
                    $status.text('交易中').removeClass('status-closed').toggleClass('pct-down', isDown);
                } else {
                    $status.text('休市').removeClass('pct-down').addClass('status-closed');
                }
            }
            var $spark = $rec.closest('.home-ui-rec-card').find('.home-ui-rec-chart polyline');
            if ($spark.length) {
                $spark.attr('stroke', isDown ? '#ff4d4f' : '#52c41a');
            }
        });
    }

    var quotePoller = null;
    function startHomeQuotes() {
        if (quotePoller && quotePoller.stop) {
            quotePoller.stop();
        }
        if (!window.H5Quotes) {
            return;
        }
        quotePoller = H5Quotes.poll(applyHomeQuotes, { intervalMs: 1000 });
    }

    function closeHomeAnnouncePopup() {
        $('#homeAnnouncePopup').remove();
        $('body').removeClass('home-announce-open');
    }

    function showHomeAnnouncePopup(announce) {
        if (!announce) {
            return;
        }
        var body = String(announce.body || announce.summary || '').trim();
        if (!body) {
            return;
        }
        var title = String(announce.title || '平台公告').trim() || '平台公告';
        var key = 'h5_home_gg_' + String(body).length + '_' + String(body).slice(0, 40);
        try {
            if (sessionStorage.getItem(key) === '1') {
                return;
            }
        } catch (e) {}

        closeHomeAnnouncePopup();
        var html =
            '<div class="home-announce-mask" id="homeAnnouncePopup">' +
            '<div class="home-announce-dialog" role="dialog" aria-modal="true">' +
            '<div class="home-announce-title">' + esc(title) + '</div>' +
            '<div class="home-announce-body">' + esc(body).replace(/\n/g, '<br>') + '</div>' +
            '<button type="button" class="home-announce-ok" id="homeAnnounceOk">知道了</button>' +
            '</div></div>';
        $('body').addClass('home-announce-open').append(html);
        $('#homeAnnounceOk').on('click', function () {
            try {
                sessionStorage.setItem(key, '1');
            } catch (e2) {}
            closeHomeAnnouncePopup();
        });
        $('#homeAnnouncePopup').on('click', function (e) {
            if (e.target === this) {
                $('#homeAnnounceOk').trigger('click');
            }
        });
    }

    function maybeShowHomeAnnounce(d) {
        var conf = (d && d.conf) || {};
        var popupOn = conf.webgg_home_popup === 1 || conf.webgg_home_popup === '1' || conf.webgg_home_popup === true;
        if (!popupOn) {
            return;
        }
        if (d.home_announce_popup) {
            showHomeAnnouncePopup(d.home_announce_popup);
            return;
        }
        var text = String(conf.webgg || '').trim();
        if (text) {
            showHomeAnnouncePopup({ title: '平台公告', body: text, summary: text });
        }
    }

    window.H5PageHome = {
        init: function () {
            var homeRefreshing = false;
            var homeLastRefresh = 0;

            function refreshHomeBadgeAndConf() {
                var now = Date.now();
                if (homeRefreshing || now - homeLastRefresh < 800) {
                    return;
                }
                if (!window.H5 || typeof H5.getToken !== 'function' || !H5.getToken()) {
                    return;
                }
                homeRefreshing = true;
                homeLastRefresh = now;
                H5.apiRequest('GET', '/index/h5api/home_data', { _t: now }, { cache: false })
                    .then(function (res) {
                        if (!res || res.code !== 1) {
                            return;
                        }
                        var d = res.data || {};
                        if (d.conf) {
                            applyConf(d.conf);
                        }
                        var badge = document.getElementById('homeMsgBadge');
                        if (badge) {
                            var n = parseInt(d.msg_unread_count, 10) || 0;
                            badge.textContent = n > 99 ? '99+' : String(n);
                            badge.classList.toggle('has-unread', n > 0);
                        }
                    })
                    .always(function () {
                        homeRefreshing = false;
                    });
            }

            $(document).off('click.homePro', '.t_con_home_ul').on('click.homePro', '.t_con_home_ul', function () {
                var url = $(this).data('url');
                if (url) {
                    window.location.href = url;
                }
            });
            window.addEventListener('pageshow', function (e) {
                if (e.persisted) {
                    refreshHomeBadgeAndConf();
                }
            });
            document.addEventListener('visibilitychange', function () {
                if (document.visibilityState === 'visible') {
                    refreshHomeBadgeAndConf();
                }
            });
            H5App.bootPage({ requireAuth: true, tab: 'home', onReady: function () {
                $('.home-ui-pro-list').html('<div style="padding:24px;color:#999;text-align:center;">加载中...</div>');
                return H5.apiRequest('GET', '/index/h5api/home_data', { _t: Date.now() }, { cache: false }).then(function (res) {
                    if (!res || res.code !== 1) {
                        $('.home-ui-pro-list').html('<div style="padding:24px;color:#999;text-align:center;">加载失败，请下拉刷新</div>');
                        return;
                    }
                    var d = res.data || {};
                    applyConf(d.conf);
                    renderSlides(d.slide);
                    renderProducts(d.pro);
                    var badge = document.getElementById('homeMsgBadge');
                    if (badge) {
                        var n = parseInt(d.msg_unread_count, 10) || 0;
                        badge.textContent = n > 99 ? '99+' : String(n);
                        badge.classList.toggle('has-unread', n > 0);
                    }
                    homeLastRefresh = Date.now();
                    startHomeQuotes();
                    maybeShowHomeAnnounce(d);
                }).fail(function () {
                    $('.home-ui-pro-list').html('<div style="padding:24px;color:#999;text-align:center;">网络错误</div>');
                });
            }});
        }
    };
})(window, window.jQuery);
