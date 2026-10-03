



var selltime = 0;
option = null;
var order_data = {};
var timer = '';
var resorderlist = {};
var timer_orderlist= '';
var _sell_time = 0;
var _ftime = 0;

function h5ApiPath(path) {
    return (window.H5 && typeof window.H5.apiUrl === 'function') ? window.H5.apiUrl(path) : path;
}

function h5AjaxHeaders() {
    return (window.H5 && typeof window.H5.authHeaders === 'function') ? window.H5.authHeaders() : {};
}



function goodsPriceEl() {
    return $('#goods-live-price');
}

function getdata(pid) {
    var url = h5ApiPath("/index/goods/ajaxpro/pid/" + pid);
    $.ajax({
        url: url,
        type: "GET",
        headers: h5AjaxHeaders(),
        dataType: "json",
        cache: false,
        success: function (data) {
        if (!data || typeof data.Price === 'undefined') {
            return;
        }
        var $price = goodsPriceEl();
        var old_price = $price.length ? $price.text() : String(newprice);
        var newNum = parseFloat(data.Price);
        var openNum = parseFloat(data.Open);
        if (isNaN(newNum)) {
            return;
        }

        newprice = newNum;
        $price.text(newprice);
        $('.col-nowprice').html(newprice);
        $('.newprice').html(newprice);

        if (data.High !== undefined && data.High !== '') {
            $('#goods-high').text(data.High);
        }
        if (data.Low !== undefined && data.Low !== '') {
            $('#goods-low').text(data.Low);
        }

        var chgBase = !isNaN(openNum) && openNum > 0 ? openNum : parseFloat(old_price);
        if (!isNaN(chgBase)) {
            var chg = Math.round((newNum - chgBase) * 100) / 100;
            var pct = chgBase ? (Math.round(chg / chgBase * 10000) / 100) : 0;
            var isUp = chg >= 0;
            var cls = isUp ? 'rise' : 'fall';
            $price.removeClass('rise fall').addClass(cls);
            $('#goods-change-wrap').removeClass('rise fall').addClass(cls);
            $('#goods-chg-val').text((isUp ? '+' : '') + chg);
            $('#goods-chg-pct').text((isUp ? '▲' : '▼') + Math.abs(pct) + '%');
            $('#goods-chg-stat').text(chg);
            $('#goods-pct-stat').text(pct + '%');
        }

        if (typeof syncKlineWithPrice === 'function') {
            syncKlineWithPrice(newNum);
        }
        },
        error: function () {}
    });
}

function setCountdownDisplay(sec) {
    var n = parseInt(sec, 10);
    if (isNaN(n) || n < 0) {
        n = 0;
    }
    $('.pay_order_sen').text(n).css({
        display: 'inline-block',
        visibility: 'visible',
        opacity: 1
    });
    $('.goods-countdown-num').css({
        display: 'flex',
        visibility: 'visible',
        opacity: 1
    });
}

function resetOrderStatePanel() {
    var $panel = $('.order-state-panel');
    $panel.removeClass('open').css({ display: 'none', visibility: 'hidden' });
    $panel.find('.paysuccess').addClass('ng-hide').removeClass('success').hide();
    $panel.find('.wait, .manual_wait, .order_fail, .ordersuccess').addClass('ng-hide');
    $panel.find('.ordersuccess').removeClass('success');
    $panel.find('.button_row').hide();
    setCountdownDisplay(0);
}

function initGoodsOrderUi() {
    if (!$('.goods-chart-body').length) {
        return;
    }
    $('.pro_mengban').removeClass('glass_mask').css({ display: '', visibility: '' });
    $('.order_mengban').removeClass('glass_mask').css({ display: '', visibility: '' });
    $('body').removeClass('order-state-open order-panel-open');
    $('.goods-order-overlays').removeAttr('data-force-show').attr('hidden', 'hidden').attr('aria-hidden', 'true')
        .css({ display: '', visibility: '', pointerEvents: '' });
    resetOrderStatePanel();
    $('.order-confirm-panel').removeClass('open').css({ display: '', visibility: '', opacity: '', zIndex: '' });
    $('.history-panel').removeClass('is-visible').hide().attr('ng-include', '1');
    if (typeof autoHeight === 'function') {
        autoHeight();
    }
}

function parseMoney(val) {
    var n = parseFloat(val);
    return isNaN(n) ? 0 : n;
}

/** 订单金额展示：整数不带 .00，避免底部收益行挤偏 */
function formatOrderMoney(val) {
    var n = parseFloat(val);
    if (isNaN(n) || Math.abs(n) < 0.001) {
        return '0';
    }
    if (Math.abs(n - Math.round(n)) < 0.001) {
        return String(Math.round(n));
    }
    return String(n.toFixed(2)).replace(/\.?0+$/, '');
}

function updateExpectedProfit() {
    var profit = ((order_shouyi * 0.01 * order_price) * 10 + order_price * 10) / 10;
    $('#yuqi').html(formatOrderMoney(profit));
}

function updateOrderSubmitState() {
    var price = parseMoney(order_price);
    var balance = parseMoney(my_money);
    var minP = parseMoney(order_min_price);
    var maxP = parseMoney(order_max_price);
    var $btn = $('.btn_confirm .button, .goods-order-submit-btn');

    $('.no-min, .no-max, .no-money').addClass('ng-hide');

    if (price < minP) {
        $('.no-min').removeClass('ng-hide');
        $btn.prop('disabled', true).addClass('disabled');
        return;
    }
    if (price > maxP) {
        $('.no-max').removeClass('ng-hide');
        $btn.prop('disabled', true).addClass('disabled');
        return;
    }
    if (balance < price) {
        $('.no-money').removeClass('ng-hide');
        $btn.prop('disabled', true).addClass('disabled');
        return;
    }
    $btn.prop('disabled', false).removeClass('disabled');
}

function selectFirstPeriodWidget() {
    var $first = $('.period-widget').first();
    if ($first.length) {
        $first.trigger('click');
    }
}

$(document).off('click.goodsMode', '.mode-box').on('click.goodsMode', '.mode-box', function () {
    $('.mode-box').removeClass('active');
    $(this).addClass('active');

    game_mode = $(this).attr('data-mode');
    if (game_mode == 'manual') {
        $('.period-widget').removeClass('active');
        order_sen = 0;
        order_shouyi = manual_shouyi;
        order_kuishun = manual_kuishun;
        updateExpectedProfit();
        updateOrderSubmitState();

        $('.order-confirm-panel').addClass('is-manual-mode').css({ height: '', maxHeight: '' });
        $('.period').addClass('ng-hide');
    } else {
        $('.order-confirm-panel').removeClass('is-manual-mode').css({ height: '', maxHeight: '' });
        $('.period').removeClass('ng-hide');

        order_sen = -1;
        order_shouyi = 0;
        order_kuishun = 0;
        $('#yuqi').html('0');
        updateOrderSubmitState();
        selectFirstPeriodWidget();
    }
});

$(document).off('click.goodsPeriod', '.period-widget').on('click.goodsPeriod', '.period-widget', function () {
    if (game_mode == 'manual') {
        layer.msg('手动平仓玩法无需选择时间！');
        return false;
    }

    $('.period-widget').removeClass('active');
    $(this).addClass('active');
    order_sen = parseInt($(this).attr('data-sen'), 10) || 0;
    order_shouyi = $(this).attr('data-shouyi');
    order_kuishun = $(this).attr('data-kuishun');
    updateExpectedProfit();
    updateOrderSubmitState();
});

$(document).off('click.goodsAmount', '.amount-box').on('click.goodsAmount', '.amount-box', function () {
    var price = parseMoney($(this).attr('data-price'));
    if (!price) {
        return;
    }

    $('.amount-box').removeClass('active');
    $('.other-amount').removeClass('active');
    $(this).addClass('active');
    order_price = price;
    $('#money').html(' ￥' + formatOrderMoney(order_price));
    updateExpectedProfit();
    updateOrderSubmitState();
});

$(document).off('click.goodsOtherAmt', '.other-amount').on('click.goodsOtherAmt', '.other-amount', function () {
    $('.amount-box').removeClass('active');
    $(this).addClass('active');
});

$(document).off('input.goodsAmt propertychange.goodsAmt', '.other-amount input')
    .on('input.goodsAmt propertychange.goodsAmt', '.other-amount input', function () {
        var inputdata = parseMoney($(this).val());
        order_price = inputdata;
        $('#money').html(' ￥' + formatOrderMoney(order_price));
        updateOrderSubmitState();
        updateExpectedProfit();
    });

function toggle_order_confirm_panel(type) {

  if(type == 'lookup'){
    var typename = '买涨';
    order_type = 0;
    
    $('.order_type').removeClass('fall');
    $('.order_type').addClass('rise');
  }else{
    var typename = '买跌';
    order_type = 1;

    $('.order_type').addClass('fall');
    $('.order_type').removeClass('rise');
  }

  $('.order_type').html(typename);
  var productName = ($('#goods-product-name').text() || '').trim();
  if (!productName) {
    productName = ($('.header-item.goodstitle').text() || '').trim();
  }
  if (productName) {
    $('.order-product-name').text(productName);
  }

  // 先标记 body，再打开弹层，避免 sweep 把 hidden 写回去
  $('body').addClass('order-panel-open').removeClass('order-state-open');
  var $ov = $('.goods-order-overlays');
  $ov.removeAttr('hidden').attr('data-force-show', '1').attr('aria-hidden', 'false')
    .css({ display: 'block', visibility: 'visible', pointerEvents: 'auto' });
  $('.pro_mengban').addClass('glass_mask').css({ display: 'block', visibility: 'visible' });
  $('.order-confirm-panel').addClass('open').css({
    display: 'flex',
    visibility: 'visible',
    opacity: 1,
    zIndex: 10002
  });
  if (typeof updateOrderSubmitState === 'function') {
    updateOrderSubmitState();
  }
  if (typeof window.__goodsOrderPanelRunFix === 'function') {
    setTimeout(window.__goodsOrderPanelRunFix, 0);
  }
}

/**
 * 下单
 * @author lukui  2017-06-30
 * @return {[type]} [description]
 */
function addorder(){
    if(game_mode == 'time' && order_sen < 0) {
        layer.msg('请选择持仓时间');
        return;
    }

    var price = parseMoney(order_price);
    var balance = parseMoney(my_money);

    if(price > balance){
        updateOrderSubmitState();
        layer.msg('资金不足，请先充值');
        return;
    }
    if(price < order_min_price){
        layer.msg('最小下注金额为'+order_min_price);
        return;
    }
    if(price > order_max_price){
        layer.msg('最大下注金额为'+order_max_price);
        return;
    }
    
    var postdata = {
        mode: game_mode,
        order_type: order_type,
        order_pid: order_pid,
        order_price: price,
        order_sen: order_sen,
        order_shouyi: order_shouyi,
        order_kuishun: order_kuishun,
        newprice: newprice
    };
    var posturl = h5ApiPath("/index/order/addorder");
    
    toggle_order_close_panel()

    resetOrderStatePanel();
    showOrderStatePanel();
    $('.order-state-panel .wait').removeClass('ng-hide');
    $.ajax({
        url: posturl,
        type: 'POST',
        data: postdata,
        dataType: 'json',
        headers: h5AjaxHeaders(),
        success: function (resdata) {
        if (!resdata) {
            err_info('下单失败，请重试');
            return;
        }
        if(resdata.type == 1){
            
            // 如果是手动平仓模式
            if(game_mode == 'manual'){
                $('.order-state-panel .wait').addClass('ng-hide');
                $('.order-state-panel .manual_wait').removeClass('ng-hide');
                return ;
            } else {
                $('.order-state-panel .wait').removeClass('ng-hide');
                $('.order-state-panel .manual_wait').addClass('ng-hide');
            }

            try {
                if (typeof resdata.data === 'string') {
                    resdata.data = jQuery.parseJSON(Base64.decode(resdata.data));
                }
            } catch (e) {
                err_info('下单成功但解析失败，请到持仓查看');
                return;
            }

            //下方提示
            if(resdata.data.ostyle == 0){
                $('.pay_order_type').html('买涨');
                $('.pay_order_type').addClass('rise');
                $('.pay_order_type').removeClass('fall');
            }else{
                $('.pay_order_type').html('买跌');
                $('.pay_order_type').addClass('fall');
                $('.pay_order_type').removeClass('rise');
            }
            //$('.order-state-panel').hide();
            $('.order-state-panel .wait').addClass('ng-hide');

            $('.pay_order_price').html(formatOrderMoney(resdata.data.fee));
            $('.pay_order_buypricee').html(formatOrderMoney(resdata.data.buyprice));

            $('.order-state-panel .paysuccess').removeClass('ng-hide').addClass('success').show();
            $('.order-state-panel .button_row').removeClass('ng-hide').show();
            //余额
            $('.pay_mymoney').html(resdata.data.commission);
            my_money = resdata.data.commission;
            //转盘倒计时
            
            
            selltime = resdata.data.selltime;
            order_data = resdata.data;
            _sell_time = order_data.selltime - order_data.buytime;
            if (isNaN(_sell_time) || _sell_time <= 0) {
                _sell_time = parseInt(order_data.endprofit, 10) || parseInt(order_sen, 10) || 60;
            }
            setCountdownDisplay(_sell_time);
            $('.img_circle_right').attr('style', '-webkit-animation: run ' + _sell_time + 's linear;');
            $('.img_circle_lift').attr('style', '-webkit-animation: runaway ' + _sell_time + 's linear;');
            timer = setInterval("endtimes()", 1000);
        }else{
            err_info(resdata.data || resdata.msg || '下单失败');
        }
        
        },
        error: function (xhr) {
            var msg = '网络错误，请重试';
            if (xhr && xhr.responseJSON) {
                msg = xhr.responseJSON.data || xhr.responseJSON.msg || msg;
            } else if (xhr && xhr.responseText) {
                try {
                    var j = JSON.parse(xhr.responseText);
                    msg = j.data || j.msg || msg;
                } catch (e) {
                    if (xhr.status === 500) {
                        msg = '下单接口异常，请确认已上传最新 Order.php';
                    } else if (xhr.status === 401) {
                        msg = '登录已失效，请重新登录';
                    }
                }
            }
            err_info(msg);
        }
    });
}


//转盘倒计时
function endtimes() {
    
    var timestamp = Date.parse(new Date());
    timestamp = timestamp / 1000;
    _sell_time--;
    setCountdownDisplay(_sell_time);

    var old_price = $('.data-price').html();
    
    var yuce_case = 0;
    if(order_data.buyprice*10 < newprice*10){
        $('.data-price').removeClass('fall');
        $('.data-price').addClass('rise');
        

        

        if(order_data.ostyle == 0){     //买涨
            yuce_case = '+'+(order_data.fee*order_data.endloss/100);
            $('.yuce').removeClass('fall');
            $('.yuce').addClass('rise');
        }else{
            // yuce_case = order_data.fee*-1;
            yuce_case = '-'+(order_data.fee*order_data.lossrate/100);
            $('.yuce').removeClass('rise');
            $('.yuce').addClass('fall');
        }

    }else if(order_data.buyprice*10 > newprice*10){
        $('.data-price').addClass('fall');
        $('.data-price').removeClass('rise');



        if(order_data.ostyle == 0){     //买涨
            yuce_case = '-'+(order_data.fee*order_data.lossrate/100);
            $('.yuce').removeClass('rise');
            $('.yuce').addClass('fall');
        }else{
            yuce_case = '+'+(order_data.fee*order_data.endloss/100);
            $('.yuce').removeClass('fall');
            $('.yuce').addClass('rise');
        }
    }else{
        yuce_case = order_data.fee;
    }
    $('.yuce').html('$'+yuce_case);

    if(_sell_time <= 0){ 
        $('.order-state-panel .paysuccess').addClass('ng-hide');
        $('.order-state-panel .paysuccess').removeClass('success');
        $('.order-state-panel .wait').removeClass('ng-hide');
        //请求检测订单
        //get_this_order();
        clearInterval(timer)
        //停止ajax
        clearTimeout(ccout);
        //go order
        goorder();
     }


}

function goorder() {
    
    var posturl = h5ApiPath('/index/order/goorder');
    var postdata = 'price='+newprice+"&oid="+order_data.oid+"&order_rand="+order_data.order_rand;

    $.post(posturl,postdata,function(res){
        console.log(res);
        if(res == 1 || res == 3){
            get_this_order();
        }else if(res == 2){
            setTimeout('goorder()',100);
        }else{
			get_this_order();
		}
        
    });
}


function get_this_order() {
    var tourl = h5ApiPath("/index/order/get_this_order/oid/"+order_data.oid);
    $.get(tourl,function(resdata){
        if(resdata){
            resdata = jQuery.parseJSON(Base64.decode(resdata));
            console.log(resdata);
			$('.order-state-panel .wait').addClass('ng-hide');
            $('.ordersuccess').removeClass('ng-hide');
            $('.ordersuccess').addClass('success');
            

            if(resdata.is_win == 1){
                $('.result_profit').addClass('rise')
                $('.result_profit').removeClass('fall')
                 //var _ploss = (resdata.ploss*10+resdata.fee*10)/10;
				var _ploss = (resdata.ploss*10)/10;				   
                $('.result_profit').html('$'+_ploss);

                $('.endprice').addClass('rise')
                $('.endprice').removeClass('fall')
            }else if(resdata.is_win == 2){
                $('.result_profit').addClass('fall')
                $('.result_profit').removeClass('rise')
                $('.result_profit').html('$'+resdata.ploss);
                $('.endprice').addClass('fall')
                $('.endprice').removeClass('rise')
            }else{
                $('.result_profit').removeClass('rise')
                $('.result_profit').removeClass('fall')
                $('.result_profit').html('$'+resdata.ploss);
                $('.endprice').removeClass('rise')
                $('.endprice').removeClass('fall')

            }
            $('.endprice').html('$'+resdata.sellprice);
            ccout=setTimeout("getonedata()",1000);
            
        }else{
            // $('.ordersuccess').addClass('ng-hide');
            // $('.ordersuccess').removeClass('success');
            // err_info('获取失败，请在订单列表查看');
            get_this_order();
        }
    });
}
/**
 * 继续下单
 * @author lukui  2017-06-30
 * @return {[type]} [description]
 */
function continue_order() {
    
    close_order();
    if(order_type == 0){
        var _type = 'lookup';
    }else{
        var _type = 'lookdown';
    }
    toggle_order_confirm_panel(_type);
}

/**
 * 关闭窗口
 * @author lukui  2017-06-30
 * @return {[type]} [description]
 */
function getHoldPageUrl() {
    if (window.H5 && H5.pageUrl) {
        return H5.pageUrl('hold.html');
    }
    var href = $('.goods-trade-hold').attr('href');
    if (href && href !== '#' && href.indexOf('javascript') !== 0) {
        return href;
    }
    return '/hold.html';
}

function jump_chicang() {
    close_order();
    window.location.href = getHoldPageUrl();
}

function showOrderStatePanel() {
    var productName = ($('#goods-product-name').text() || '').trim();
    if (!productName) {
        productName = ($('.header-item.goodstitle').text() || '').trim();
    }
    if (productName) {
        $('.order-state-product-name').text(productName);
    }
    $('body').addClass('order-state-open').removeClass('order-panel-open');
    $('.goods-order-overlays').removeAttr('hidden').attr('data-force-show', '1').attr('aria-hidden', 'false')
        .css({ display: 'block', visibility: 'visible', pointerEvents: 'auto' });
    $('.order_mengban').addClass('glass_mask').css({ display: 'block', visibility: 'visible' });
    $('.order-state-panel').addClass('open').css({ display: 'flex', flexDirection: 'column', visibility: 'visible' });
    $('.order-state-panel .button_row').removeClass('ng-hide').show();
}

function close_order() {
    clearInterval(timer);
    $('body').removeClass('order-state-open order-panel-open');
    $('.order_mengban').removeClass('glass_mask').css({ display: '', visibility: '' });
    $('.pro_mengban').removeClass('glass_mask').css({ display: '', visibility: '' });
    resetOrderStatePanel();
    $('.goods-order-overlays')
        .removeAttr('data-force-show')
        .attr('hidden', 'hidden')
        .attr('aria-hidden', 'true')
        .css({ display: '', visibility: '', pointerEvents: '' });
}

/**
 * 持仓明细
 */
function toggle_history_order_panel() {
    var type =  $('.history-panel').attr('ng-include');
    if(type == 1){
      var ajaxorderurl = h5ApiPath("/index/order/ajaxorder/pid/"+order_pid);
      $.get(ajaxorderurl,function(resdata){

        resdata = jQuery.parseJSON(Base64.decode(resdata));

        resorderlist = resdata;
        
        if(resorderlist.length >= 1){
            _ftime = resorderlist[0]['time'];
        }else{
            var timestamp = Date.parse(new Date());
            _ftime = timestamp/1000;
        }

        timer_orderlist = setInterval("show_order_list()",1000);
        $('.history-panel').addClass('is-visible').show().attr('ng-include',0);
      })

    }else{
      $('.history-panel').removeClass('is-visible').hide().attr('ng-include',1);
      clearInterval(timer_orderlist)
    }
}
/**
 * 订单列表
 * @return {[type]} [description]
 */
function show_order_list() {
    var  html = '';
    
    if(resorderlist.length == 0){
        $('.trade_history_list ul').html(' ');
        return false;
    }
    
_ftime++;
    $.each(resorderlist,function(k,v){
        
        console.log(_ftime);
        var timestamp = Date.parse(new Date());
        var  _end_time = (v.selltime - _ftime);
        var baifenbi = (_end_time/v.endprofit)*100;
        console.log(_ftime);
        if(_end_time >0){
            
            var chaprice = newprice-v.buyprice;
            var closeprice = 0;
            var closeprice_class = '';
            if(v.ostyle == 0){
                var ostyle_class = "buytop";
                var ostyle_class2 = 'in_money';
                var ostyle_name = "买涨";
                if(chaprice >0){
                    closeprice = '+'+(order_data.fee*order_data.endloss/100);
                    closeprice_class = 'in_money';
                }else if(chaprice <0){
                    closeprice = '-'+(order_data.fee*order_data.lossrate/100);
                    closeprice_class = 'out_money';
                }else{
                    closeprice = v.fee;
                    closeprice_class = '';
                }
            }else{
                var ostyle_class = "buydown";
                var ostyle_name = "买跌";
                var ostyle_class2 = 'out_money';

                if(chaprice <0){
                    closeprice = '+'+(order_data.fee*order_data.endloss/100);
                    closeprice_class = 'in_money';
                }else if(chaprice >0){
                    closeprice = '-'+(order_data.fee*order_data.lossrate/100);
                    closeprice_class = 'out_money';
                }else{
                    closeprice = v.fee;
                    closeprice_class = '';
                }

            }

            html += '<li ng-repeat="o in trade_order_list" class="">\
                        <section>\
                            <p style="margin: 0">\
                                <span class="ng-binding">'+v.ptitle+'</span>\
                                <span class="ng-binding '+ostyle_class2+'"><i class="'+ostyle_class+'"></i>'+ostyle_name+'（$'+v.fee+'）</span>\
                            </p>\
                            <p style="margin: 0" class="ng-binding">\
                                '+v.buyprice+'-<span  class="ng-binding '+closeprice_class+'">'+newprice+'</span>\
                            </p>\
                            <p style="margin: 0" class="ng-binding">'+getLocalTime(v.buytime)+'</p>\
                        </section><section>\
                            <p style="margin: 0px;" class="ng-binding '+closeprice_class+'">'+closeprice+'</p>\
                            <p style="margin: 0" class="ng-binding">'+formatSeconds2(_end_time)+'</p>\
                        </section>\
                        <article class="">\
                        <span class="move_width" style="width: '+baifenbi+'%; transition-duration: 1s;">\
                        </span>\
                        <i>\
                            <em></em>\
                        </i>\
                        </article>\
                    </li>';
            
            $('.trade_history_list ul').html(html);
        
        }else{

            resorderlist.splice(k,1);
        }
    })

}

/**
 * 订单错误提示
 * @param  {[type]} data 错误信息
 * @return {[type]}      [description]
 */
function err_info(data) {
    showOrderStatePanel();
    $('.order-state-panel .paysuccess').addClass('ng-hide');
    $('.order-state-panel .paysuccess').removeClass('success');
    $('.order-state-panel .ordersuccess').addClass('ng-hide');
    $('.order-state-panel .ordersuccess').removeClass('success');
    
    $('.order-state-panel .wait').addClass('ng-hide');
    $('.fail-info').html(data);
    $('.order_fail').removeClass('ng-hide');
}

function bindGoodsTradeButtons() {
    if (!$('.goods-chart-body').length) {
        return;
    }
    $(document).off('click.goodsTrade', '.goods-trade-up, .goods-trade-down');
    $(document).on('click.goodsTrade', '.goods-trade-up, .goods-trade-down', function (e) {
        e.preventDefault();
        e.stopPropagation();
        var action = $(this).attr('data-trade-action');
        if (action === 'lookup' || action === 'lookdown') {
            toggle_order_confirm_panel(action);
        }
    });
}

function bindGoodsHoldButtons() {
    if (!$('.goods-chart-body').length) {
        return;
    }
    $(document).off('click.goodsHold', '.goods-btn-hold, .order-state-panel .button');
    $(document).on('click.goodsHold', '.goods-btn-hold, .order-state-panel .button', function (e) {
        e.preventDefault();
        e.stopPropagation();
        jump_chicang();
    });
}

$(function () {
    initGoodsOrderUi();
    bindGoodsTradeButtons();
    bindGoodsHoldButtons();
    if ($('.mode-box.active').length) {
        $('.mode-box.active').first().trigger('click');
    } else {
        $('.mode-box').first().trigger('click');
    }
    if (typeof selectFirstPeriodWidget === 'function') {
        selectFirstPeriodWidget();
    }
    if ($('.amount-box').length) {
        $('.amount-box').first().trigger('click');
    }
    updateOrderSubmitState();
});

window.jump_chicang = jump_chicang;
window.close_order = close_order;
window.toggle_order_confirm_panel = toggle_order_confirm_panel;
window.addorder = addorder;
window.selectFirstPeriodWidget = selectFirstPeriodWidget;