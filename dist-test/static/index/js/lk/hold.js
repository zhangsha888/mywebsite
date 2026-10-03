/**
 * 持仓&历史明细
 */
function h5ApiPath(path) {
    return (window.H5 && typeof window.H5.apiUrl === 'function') ? window.H5.apiUrl(path) : path;
}

function h5AjaxHeaders() {
    return (window.H5 && typeof window.H5.authHeaders === 'function') ? window.H5.authHeaders() : {};
}

function uiT(s) {
    return (window.UII18n && typeof window.UII18n.t === 'function') ? window.UII18n.t(s) : s;
}

function decodeBase64Text(str) {
    if (!str || typeof str !== 'string') {
        return str;
    }
    var t = str.trim();
    if (t.charAt(0) === '{' || t.charAt(0) === '[') {
        return t;
    }
    try {
        if (typeof Base64 !== 'undefined' && Base64 && typeof Base64.decode === 'function') {
            return Base64.decode(t);
        }
    } catch (e) {
        return null;
    }
    return null;
}

function parseOrderListResponse(resdata) {
    if (resdata === null || resdata === undefined || resdata === '') {
        return null;
    }
    try {
        if (typeof resdata === 'object') {
            return resdata;
        }
        var raw = decodeBase64Text(resdata);
        if (raw === null || raw === '') {
            return null;
        }
        return jQuery.parseJSON(raw);
    } catch (e) {
        return null;
    }
}

var resorderlist = {};
var proprice = {};
var page = 1;
var ispage = 1;
var is_ajax_list = 0;
var timer_get_price = '';
var timer_orderlist = '';
var listionhajax = '';
var historyListLoading = false;

function historyListEl() {
    return $('.trade_history_list .slider-right .uls');
}

function extractHistoryList(parsed) {
    if (!parsed) {
        return [];
    }
    if (Array.isArray(parsed)) {
        return parsed;
    }
    if (parsed.data && Array.isArray(parsed.data)) {
        return parsed.data;
    }
    return [];
}

function buildHistoryCardHtml(v) {
    var ostyle_name = v.ostyle == 0 ? uiT('买涨') : uiT('买跌');
    var dirClass = v.ostyle == 0 ? 'buy-up' : 'buy-down';
    var closeprice = 0;
    if (v.is_win == 1 || v.is_win == 2) {
        closeprice = +v.ploss;
    }
    var pnl = orderFormatPnl(closeprice);
    var duration = orderDuration(v.endprofit);
    var html = '';
    html += '<li class="order-card order-card--closed" onclick="get_hold_order(' + v.oid + ')">';
    html += '<div class="order-card-head">';
    html += '<div class="order-card-title"><span class="name">' + (v.ptitle || '') + '</span>';
    if (duration) {
        html += '<span class="duration">' + duration + '</span>';
    }
    html += '</div>';
    html += '<span class="order-card-dir ' + dirClass + '">' + ostyle_name + '</span>';
    html += '</div>';
    html += '<div class="order-card-sn"><span class="label">' + uiT('订单编号') + '</span><span class="val">' + orderSn(v) + '</span></div>';
    html += '<div class="order-card-grid">';
    html += '<div class="order-card-col">';
    html += orderField(uiT('金额'), '<span class="val strong">' + (v.fee != null ? v.fee : '--') + '</span>');
    html += orderField(uiT('购买价'), '<span class="val">' + orderFormatPrice(v.buyprice) + '</span>');
    html += orderField(uiT('持仓时间'), '<span class="val muted">' + (v.buytime ? getLocalTime(v.buytime) : '--') + '</span>');
    html += '</div><div class="order-card-col">';
    html += orderField(uiT('盈亏'), pnl.html);
    html += orderField(uiT('成交价'), '<span class="val">' + orderFormatPrice(v.sellprice) + '</span>');
    html += orderField(uiT('平仓时间'), '<span class="val muted">' + (v.selltime ? getLocalTime(v.selltime) : '--') + '</span>');
    html += '</div></div></li>';
    return html;
}

function clearHistoryPlaceholder() {
    historyListEl().find('.order-empty').remove();
}

function renderHistoryList(res_list, replace) {
    var $list = historyListEl();
    if (!$list.length) {
        return;
    }

    var hasCards = $list.find('.order-card').length > 0;
    var shouldReplace = replace || !hasCards;

    if (!res_list || !res_list.length) {
        if (shouldReplace) {
            clearHistoryPlaceholder();
            $list.html('<li class="order-empty">' + uiT('暂无平仓记录') + '</li>');
        }
        return;
    }

    var html = '';
    var i;
    for (i = 0; i < res_list.length; i++) {
        try {
            html += buildHistoryCardHtml(res_list[i]);
        } catch (e) {
            /* 单条异常不影响整页 */
        }
    }
    if (!html) {
        clearHistoryPlaceholder();
        $list.html('<li class="order-empty">暂无平仓记录</li>');
        return;
    }

    clearHistoryPlaceholder();
    if (shouldReplace) {
        $list.html(html);
    } else {
        $list.append(html);
    }
}

// 持仓列表由 H5PageHold.init 鉴权后再拉，避免未登录时抢跑
var _sell_time = 0;
var _ftime = 0;
var html_type = 0;

// 手动平仓最低时间(分钟)
var _manual_ready_time = 0;

function orderFormatPrice(n) {
    if (n === undefined || n === null || n === '') {
        return '--';
    }
    var num = parseFloat(n);
    if (isNaN(num)) {
        return n;
    }
    if (Math.abs(num) >= 1000) {
        return num.toFixed(2);
    }
    return num.toFixed(4);
}

function orderFormatPnl(val) {
    var n = parseFloat(val);
    if (isNaN(n)) {
        return { html: '<span class="val pnl">--</span>', cls: '' };
    }
    var cls = n >= 0 ? 'up' : 'down';
    return {
        html: '<span class="val pnl ' + cls + '">' + n.toFixed(2) + '</span>',
        cls: cls
    };
}

function orderDuration(sec) {
    if (!sec && sec !== 0) {
        return '';
    }
    return sec + 'S';
}

function orderSn(v) {
    return v.orderno || ('NO' + v.oid);
}

function orderField(label, valueHtml) {
    return '<div class="order-card-field"><span class="label">' + label + '</span>' + valueHtml + '</div>';
}

/**
 * 订单列表
 * @author lukui  2017-07-01
 * @return {[type]} [description]
 */
function hold_order_list() {
    var url = h5ApiPath("/index/order/ajaxorder_list");

    if (timer_get_price) {
        clearInterval(timer_get_price);
        timer_get_price = '';
    }
    if (timer_orderlist) {
        clearInterval(timer_orderlist);
        timer_orderlist = '';
    }

    $.ajax({
        url: url,
        type: 'GET',
        dataType: 'text',
        timeout: 20000,
        cache: false,
        headers: h5AjaxHeaders()
    }).done(function (resdata) {
        var parsed = parseOrderListResponse(resdata);
        resorderlist = (parsed && Array.isArray(parsed)) ? parsed : [];
        if (resorderlist.length >= 1) {
            _ftime = resorderlist[0]['time'];
            _manual_ready_time = resorderlist[0]['manual_ready_time'];
            get_price();
            timer_get_price = setInterval(get_price, 2000);
            timer_orderlist = setInterval(show_order_list, 1000);
            show_order_list();
        } else {
            var timestamp = Date.parse(new Date());
            _ftime = timestamp / 1000;
            _manual_ready_time = 0;
            $('.trade_history_list .slider-left ul').html('<li class="order-empty">暂无持仓订单</li>');
        }
    }).fail(function () {
        resorderlist = [];
        $('.trade_history_list .slider-left ul').html('<li class="order-empty">加载失败，请稍后重试</li>');
    });
}


function get_price() {
    var url = h5ApiPath("/index/order/get_price");
    $.ajax({
        url: url,
        type: 'GET',
        dataType: 'text',
        timeout: 15000,
        cache: false,
        headers: h5AjaxHeaders()
    }).done(function (resdata) {
        if (!resdata) {
            proprice = {};
            return;
        }
        try {
            var raw = decodeBase64Text(resdata);
            proprice = raw ? jQuery.parseJSON(raw) : {};
        } catch (e) {
            proprice = {};
        }
    }).fail(function () {
        /* 价轮询失败时沿用上次价格 */
    });
}
/**
 * 订单列表
 * @return {[type]} [description]
 */
function show_order_list() {
    var html = '';

    if (!resorderlist || resorderlist.length === 0) {
        $('.trade_history_list .slider-left ul').html('<li class="order-empty">暂无持仓订单</li>');
        return false;
    }

    _ftime++;
    // 倒序删除，避免 splice 打乱下标
    for (var i = resorderlist.length - 1; i >= 0; i--) {
        if (resorderlist[i] && resorderlist[i].mode === 'manual' && resorderlist[i].manual_ready) {
            resorderlist.splice(i, 1);
        }
    }

    if (!resorderlist.length) {
        $('.trade_history_list .slider-left ul').html('<li class="order-empty">暂无持仓订单</li>');
        return false;
    }

    resorderlist.forEach(function (v) {
        var _end_time = v.selltime - _ftime;
        var expired = (v.mode === 'time' || !v.mode) && _end_time < 0;
        var baifenbi = v.endprofit ? (_end_time / v.endprofit) * 100 : 0;
        if (baifenbi < 0) {
            baifenbi = 0;
        }
        if (baifenbi > 100) {
            baifenbi = 100;
        }
        var newprice = proprice[v.pid];

        var manual_ready_time = _manual_ready_time > 0 ? _manual_ready_time * 60 - (_ftime - v.buytime) : 0;

        // 未结算(ostaus=0)的到期单必须继续显示在持仓中，不能因倒计时结束而丢单
        var hasLivePrice = newprice !== undefined && newprice !== '' && !isNaN(parseFloat(newprice));
        var chaprice = hasLivePrice ? (parseFloat(newprice) - parseFloat(v.buyprice)) : 0;
        var profitRate = parseFloat(v.endloss);
        var lossRate = parseFloat(v.lossrate);
        if (isNaN(profitRate) || profitRate < 0) {
            profitRate = 0;
        }
        if (isNaN(lossRate) || lossRate < 0) {
            lossRate = profitRate;
        }
        var closeprice = 0;
        var closeprice_class = '';
        var ostyle_name = v.ostyle == 0 ? uiT('买涨') : uiT('买跌');
        var dirClass = v.ostyle == 0 ? 'buy-up' : 'buy-down';

        if (!hasLivePrice) {
            closeprice = 0;
        } else if (v.ostyle == 0) {
            if (chaprice > 0) {
                closeprice = (v.fee * profitRate) / 100;
                closeprice_class = 'in_money';
            } else if (chaprice < 0) {
                closeprice = -(v.fee * lossRate) / 100;
                closeprice_class = 'out_money';
            } else {
                closeprice = 0;
            }
        } else {
            if (chaprice < 0) {
                closeprice = (v.fee * profitRate) / 100;
                closeprice_class = 'in_money';
            } else if (chaprice > 0) {
                closeprice = -(v.fee * lossRate) / 100;
                closeprice_class = 'out_money';
            } else {
                closeprice = 0;
            }
        }

        var pnl = hasLivePrice ? orderFormatPnl(closeprice) : { html: '<span class="val pnl muted">--</span>', cls: '' };
        var duration = orderDuration(v.endprofit);
        var nowPriceHtml = v.mode === 'manual'
            ? '<span class="val muted">手动平仓</span>'
            : '<span class="val">' + orderFormatPrice(newprice) + '</span>';
        var remainHtml = v.mode === 'manual'
            ? '<span class="val muted">--</span>'
            : (expired
                ? '<span class="val order-status-pending">' + uiT('待结算') + '</span>'
                : '<span class="val muted">' + formatSeconds2(_end_time) + '</span>');

        html += '<li class="order-card order-card--open' + (expired ? ' is-pending-settle' : '') + '" data-oid="' + v.oid + '">';
        html += '<div class="order-card-head">';
        html += '<div class="order-card-title"><span class="name">' + v.ptitle + '</span>';
        if (duration) {
            html += '<span class="duration">' + duration + '</span>';
        }
        if (expired) {
            html += '<span class="order-pending-tag">' + uiT('待结算') + '</span>';
        }
        html += '</div>';
        html += '<span class="order-card-dir ' + dirClass + '">' + ostyle_name + '</span>';
        html += '</div>';
        html += '<div class="order-card-sn"><span class="label">' + uiT('订单编号') + '</span><span class="val">' + orderSn(v) + '</span></div>';
        html += '<div class="order-card-grid">';
        html += '<div class="order-card-col">';
        html += orderField('金额', '<span class="val strong">' + v.fee + '</span>');
        html += orderField('购买价', '<span class="val">' + orderFormatPrice(v.buyprice) + '</span>');
        html += orderField('持仓时间', '<span class="val muted">' + getLocalTime(v.buytime) + '</span>');
        html += '</div><div class="order-card-col">';
        html += orderField('浮动盈亏', pnl.html);
        html += orderField('现价', nowPriceHtml);
        html += orderField(expired ? '状态' : '剩余时间', remainHtml);
        html += '</div></div>';

        if (v.mode === 'manual') {
            html += '<div class="order-card-actions">';
            if (manual_ready_time > 0) {
                html += '<button type="button" class="order-btn-close" disabled="disabled">' +
                    Math.ceil(manual_ready_time) + 's</button>';
            } else {
                html += '<button type="button" class="order-btn-close" onclick="event.stopPropagation();manual_over(' + v.oid + ')">平仓</button>';
            }
            html += '</div>';
        } else {
            html += '<div class="order-card-progress' + (expired ? ' is-done' : '') + '"><span class="move_width" style="width:' + baifenbi + '%"></span></div>';
        }
        html += '</li>';
    });

    $('.trade_history_list .slider-left ul').html(html);
}

/**
 * 切换按钮
 * @param  {[type]} type [description]
 * @return {[type]}      [description]
 */
function change_category(type) {
    var $wrap = $('.trade_history_list.order-list-wrap');

    if (type == 0) {
        page = 1;
        ispage = 1;
        $wrap.removeClass('is-history');
        if (listionhajax) {
            clearInterval(listionhajax);
            listionhajax = '';
        }
        hold_order_list();
        $('.trade_history_list .slider-right .uls').html('');
        $('.left-table').addClass('active');
        $('.right-table').removeClass('active');
        return;
    }

    if (type == 1) {
        $wrap.addClass('is-history');
        clearInterval(timer_get_price);
        clearInterval(timer_orderlist);
        $('.left-table').removeClass('active');
        $('.right-table').addClass('active');
        page = 1;
        ispage = 1;
        html_type = 0;
        is_ajax_list = 0;
        historyListLoading = false;
        historyListEl().html('<li class="order-empty">加载中...</li>');
        orderedlist();
        if (listionhajax) {
            clearInterval(listionhajax);
            listionhajax = '';
        }
        bindOrderListScroll();
    }
}

$(function () {
    bindOrderListScroll();
});



function orderedlist() {
    if (ispage != 1) {
        return;
    }
    setolist(page === 1);
}



function setolist(replace) {
    var url = h5ApiPath('/index/order/orderlist?page=' + page);
    var currentPage = page;

    if (is_ajax_list === 1 || historyListLoading) {
        return;
    }
    is_ajax_list = 1;
    historyListLoading = true;

    $.ajax({
        url: url,
        type: 'GET',
        dataType: 'text',
        timeout: 20000,
        cache: false,
        headers: h5AjaxHeaders()
    }).done(function (resdata) {
        var parsed = parseOrderListResponse(resdata);
        var res_list = extractHistoryList(parsed);

        if (!parsed) {
            if (replace) {
                historyListEl().html('<li class="order-empty">加载失败，请稍后重试</li>');
            }
            return;
        }

        if (parsed.last_page && currentPage >= parsed.last_page) {
            ispage = 0;
        }
        if (parsed.code === 0 && parsed.msg) {
            historyListEl().html('<li class="order-empty">' + parsed.msg + '</li>');
            return;
        }

        renderHistoryList(res_list, currentPage === 1 || replace);

        page = currentPage + 1;
    }).fail(function () {
        if (replace) {
            historyListEl().html('<li class="order-empty">网络异常，请稍后重试</li>');
        }
    }).always(function () {
        is_ajax_list = 0;
        historyListLoading = false;
    });
}





    /**
     * 监听高度
     * @author lukui  2017-07-05
     * @return {[type]} [description]
     */
    function getOrderScrollHost() {
        return $('.order-list-scroll-host');
    }

    function maybeLoadMoreHistory() {
        if (!$('.trade_history_list.order-list-wrap').hasClass('is-history')) {
            return;
        }
        if (ispage !== 1 || is_ajax_list === 1 || historyListLoading) {
            return;
        }
        var $host = getOrderScrollHost();
        if ($host.length) {
            var el = $host[0];
            if (el.scrollHeight - el.scrollTop - el.clientHeight > 120) {
                return;
            }
        } else {
            var scrollBottom = $(document).height() - $(window).height() - $(window).scrollTop();
            if (scrollBottom > 120) {
                return;
            }
        }
        setolist(false);
    }

    function bindOrderListScroll() {
        if (!$('.order-ui-body').length) {
            return;
        }
        var $host = getOrderScrollHost();
        $host.off('scroll.orderHistory').on('scroll.orderHistory', function () {
            maybeLoadMoreHistory();
        });
        $(window).off('scroll.orderHistory').on('scroll.orderHistory', function () {
            maybeLoadMoreHistory();
        });
    }




    function get_hold_order(oid) {
        var url = h5ApiPath("/index/order/get_hold_order/oid/" + oid);
        $.ajax({
            url: url,
            type: 'GET',
            dataType: 'text',
            timeout: 15000,
            cache: false
        }).done(function (data) {
            var parsed;
            try {
                var raw = decodeBase64Text(data);
                parsed = raw ? jQuery.parseJSON(raw) : null;
            } catch (e) {
                parsed = null;
            }
            if (!parsed || !parsed.oid) {
                if (window.layer) {
                    layer.msg(uiT('订单详情加载失败'));
                }
                return;
            }

            $('.order-modal-content .ptitle').html(parsed.ptitle || '');
            $('.order-modal-content .buyprice').html(parsed.buyprice);
            $('.order-modal-content .sellprice').html(parsed.sellprice);
            $('.order-modal-content .ploss').html(parsed.ploss);
            $('.order-modal-content .buytime').html(getLocalTime(parsed.buytime));
            $('.order-modal-content .selltime').html(getLocalTime(parsed.selltime));
            if (parsed.ploss < 0) {
                $('.order-modal-content .ploss').addClass('fall').removeClass('rise');
            } else {
                $('.order-modal-content .ploss').removeClass('fall').addClass('rise');
            }
            $('.modal-backdrop').removeClass('ng-hide').addClass('active').prop('hidden', false);
            $('.tab-nav').hide();
        }).fail(function () {
            if (window.layer) {
                layer.msg(uiT('网络异常，请稍后重试'));
            }
        });
    }

    function close_order_modal() {
        $('.modal-backdrop').addClass('ng-hide').removeClass('active').prop('hidden', true);
    }
    
// 手动平仓单平仓
function manual_over(id) {
    id = parseInt(id, 10);
    if (!id) {
        return;
    }
    var load = null;
    if (window.layer) {
        load = layer.msg(uiT('加载中'), {
            icon: 16,
            shade: 0.8,
            time: 0
        });
    }

    for (var i = resorderlist.length - 1; i >= 0; i--) {
        if (parseInt(resorderlist[i].oid, 10) === id) {
            resorderlist[i].manual_ready = 1;
            resorderlist.splice(i, 1);
        }
    }
    show_order_list();

    var url = h5ApiPath("/index/order/orderManual");
    $.ajax({
        url: url,
        type: 'POST',
        data: { id: id },
        dataType: 'text',
        timeout: 20000
    }).done(function (res) {
        var ok = (res === 'Success' || res === '"Success"' || (res && String(res).indexOf('Success') >= 0));
        if (window.layer) {
            layer.msg(ok ? uiT('平仓申请已提交') : (uiT('平仓失败，请重试')));
        }
        if (!ok) {
            hold_order_list();
        }
    }).fail(function () {
        if (window.layer) {
            layer.msg(uiT('网络异常，请稍后重试'));
        }
        hold_order_list();
    }).always(function () {
        if (window.layer && load != null) {
            layer.close(load);
        }
    });
}

