/** K线数据
 * @property categoryData 数组, 每个元素都是一个时间戳
 * @property values 数组，每个元素都是一个数组，元素内有四个值： 开市价，休市价，最高价，最低价
 * @type object
 */
var __kLineData = null;
var ctype = "k";        // 图形类型：k线图,l走势
var ccout;              // 定时更新

/** K 线浅色主题（涨绿跌红） */
var __chartTheme = {
    background: '#ffffff',
    splitLine: '#eef1f5',
    axisColor: '#999999',
    candleDown: '#ff4d4f',
    candleUp: '#52c41a',
    markLine: '#52c41a',
    macdPos: '#52c41a',
    macdNeg: '#ff4d4f'
};

function isGoodsChartPage() {
    return $('.goods-chart-body').length > 0;
}

function formatChartPrice(value) {
    var n = parseFloat(value);
    if (isNaN(n)) {
        return value;
    }
    if (isGoodsChartPage()) {
        var abs = Math.abs(n);
        if (abs >= 100) {
            if (Math.abs(n - Math.round(n)) < 0.001) {
                return String(Math.round(n));
            }
            if (abs >= 1000) {
                return String(n.toFixed(1)).replace(/\.0$/, '');
            }
            return String(n.toFixed(2)).replace(/\.?0+$/, '');
        }
        if (abs >= 1) {
            return String(n.toFixed(2)).replace(/\.?0+$/, '');
        }
        return String(n.toFixed(4)).replace(/\.?0+$/, '');
    }
    return n.toFixed(5);
}

/** 副图（MACD 等）Y 轴：缩短刻度，避免挤占右侧 */
function formatChartSubAxis(value) {
    var n = parseFloat(value);
    if (isNaN(n)) {
        return value;
    }
    if (!isGoodsChartPage()) {
        if (n > 0) {
            return '+' + n.toFixed(5);
        }
        if (n < 0) {
            return n.toFixed(5);
        }
        return '-' + n.toFixed(5);
    }
    var abs = Math.abs(n);
    var body;
    if (abs >= 1000) {
        body = String(Math.round(abs));
    } else if (abs >= 1) {
        body = abs % 1 < 0.05 ? String(Math.round(abs)) : String(abs.toFixed(1)).replace(/\.0$/, '');
    } else {
        body = String(abs.toFixed(2)).replace(/\.?0+$/, '');
    }
    if (n > 0) {
        return '+' + body;
    }
    if (n < 0) {
        return '-' + body;
    }
    return '0';
}

function getKlineGridInsets() {
    if (isGoodsChartPage()) {
        /* 左右对称，避免 K 线绘图区整体偏右 */
        return { left: '8%', right: '8%' };
    }
    return { left: '4%', right: '0%' };
}

$(function () {
    getonedata();
});


// 切换x轴时间， 即1M，5M ...
function change_chart_period(type) {
    $(".trade-chart-period").removeClass("active");
    $('.trade-chart-period[data-period="' + type + '"]').addClass("active");
    if (!$('.trade-chart-period.active').length) {
        $(".trade-chart-period").filter(function () {
            return $(this).text() === type;
        }).addClass("active");
    }
    getonedata(true);
}

//点击切换K线或走势
function change_chart_type(type) {
    if (type == "stock") {
        ctype = "k";
        $(".trade-chart-type.stock").addClass("active");
        $(".trade-chart-type.line").removeClass("active");
    } else {
        ctype = "l";
        $(".trade-chart-type.stock").removeClass("active");
        $(".trade-chart-type.line").addClass("active");
    }
    getonedata(true);
}

// 统计多日的平均值
function calculateMA(dayCount) {
    var result = [];
    for (var i = 0, len = __kLineData.values.length; i < len; i++) {
        if (i < dayCount) {
            result.push('-');
            continue;
        }
        var sum = 0;
        for (var j = 0; j < dayCount; j++) {
            sum += Number(__kLineData.values[i - j][1]);
        }
        result.push(sum / dayCount);
    }
    //alert(result)
    return result;
}

// 走势- 最低值
function kTl(KDS) {
    let K2line = [];
    for (let p = 0; p < KDS.length; p++) {
        K2line.push(KDS[p][3]);
        if (p == KDS.length - 1) {
            K2line[p] = KDS[p][1];
        }
    }
    return K2line;
}

// 生成平均值
build_diff_data = function (m_short, m_long, data) {
    var result = [];
    var pre_emashort = 0;
    var pre_emalong = 0;
    for (var i = 0, len = data.length; i < len; i++) {
        var ema_short = data[i][0];
        var ema_long = data[i][0];
        if (i != 0) {
            ema_short = (1.0 / m_short) * data[i][0] + (1 - 1.0 / m_short) * pre_emashort;
            ema_long = (1.0 / m_long) * data[i][0] + (1 - 1.0 / m_long) * pre_emalong;
        }
        pre_emashort = ema_short;
        pre_emalong = ema_long;
        var diff = ema_short - ema_long;
        result.push(diff);
    }
    return result;
}
build_dea_data = function (m, diff) {
    var result = [];
    var pre_ema_diff = 0;
    for (var i = 0, len = diff.length; i < len; i++) {
        var ema_diff = diff[i];
        if (i != 0) {
            ema_diff = (1.0 / m) * diff[i] + (1 - 1.0 / m) * pre_ema_diff;
        }
        pre_ema_diff = ema_diff;
        result.push(ema_diff);
    }
    return result;
}
build_macd_data = function (data, diff, dea) {
    var result = [];
    for (var i = 0, len = data.length; i < len; i++) {
        var macd = 2 * (diff[i] - dea[i]);
        result.push(macd);
    }
    return result;
}

/**
 * 用实时报价更新最后一根 K 线（仅视觉同步，不影响下单等逻辑）
 * @param {number|string} livePrice
 */
function syncKlineWithPrice(livePrice) {
    if (!__kLineData || !__kLineData.values || !__kLineData.values.length) {
        return;
    }
    var price = parseFloat(livePrice);
    if (isNaN(price)) {
        return;
    }
    var last = __kLineData.values.length - 1;
    var bar = __kLineData.values[last];
    bar[1] = price;
    bar[2] = Math.max(parseFloat(bar[2]) || price, price);
    bar[3] = Math.min(parseFloat(bar[3]) || price, price);
    refreshKlineLive(price);
}

/** 轻量刷新图表：只更新 K 线数据与现价虚线 */
function refreshKlineLive(now) {
    var canvasId = document.getElementById("ecKx");
    if (!canvasId) {
        return;
    }
    var canvas = echarts.getInstanceByDom(canvasId);
    if (!canvas || !__kLineData) {
        return;
    }
    var values = __kLineData.values;
    var price = parseFloat(now);
    if (isNaN(price)) {
        price = values[values.length - 1][1];
    }

    var lastBar = values[values.length - 1];
    var gh = document.getElementById('goods-high');
    var gl = document.getElementById('goods-low');
    if (gh) gh.innerText = lastBar[2];
    if (gl) gl.innerText = lastBar[3];
    var temp = $('.l_chartDataNavR ul li');
    if (temp.length >= 4) {
        temp[1].innerText = '最高：' + lastBar[2];
        temp[3].innerText = '最低：' + lastBar[3];
    }

    if (ctype === "k") {
        canvas.setOption({
            series: [
                {
                    name: 'stick',
                    data: values,
                    markLine: {
                        data: [{ yAxis: price }],
                        lineStyle: { normal: { color: __chartTheme.markLine, type: 'dashed' } },
                        label: { normal: { color: __chartTheme.markLine } }
                    }
                },
                { name: 'ma5', data: calculateMA(5) },
                { name: 'ma10', data: calculateMA(10) },
                { name: 'ma20', data: calculateMA(20) },
                { name: 'ma30', data: calculateMA(30) }
            ]
        });
    } else {
        canvas.setOption({
            series: [{
                name: '日K',
                data: kTl(values),
                markLine: {
                    data: [{ yAxis: price }],
                    lineStyle: { normal: { color: __chartTheme.markLine, type: 'dashed' } }
                }
            }]
        });
    }
}

// 刷新 渲染K线图
function gotoecharts() {
    // 图表文档对象ID， 图表对象。
    let canvasId, canvas;
    canvasId = document.getElementById("ecKx");
    canvas = echarts.getInstanceByDom(canvasId);
    if (canvas === undefined) canvas = echarts.init(canvasId);

    // 最后一个数据值, 即当前值
    let categoryData = __kLineData.categoryData, values = __kLineData.values;
    let value, state, open, now, close, highest, lowest, topdata;
    topdata = categoryData[categoryData.length - 1];
    value = values[values.length - 1];
    open = value[0];
    close = now = value[1];
    highest = value[2];
    lowest = value[3];
    state = close >= open ? "up" : "down";

    var gh = document.getElementById('goods-high');
    var gl = document.getElementById('goods-low');
    if (gh) gh.innerText = highest;
    if (gl) gl.innerText = lowest;
    let temp = $('.l_chartDataNavR ul li');
    if (temp.length >= 4) {
        temp[1].innerText = '最高：' + highest;
        temp[3].innerText = '最低：' + lowest;
    }

    // 计算平均值
    var diff = build_diff_data(12, 26, values);
    var dea = build_dea_data(9, diff);
    var macd = build_macd_data(values, diff, dea);

    // 解析数组并生成图表
    let canvasOption;
    if (ctype === "k") {
        // K线图
        /*
        canvasOption = {
            backgroundColor: 'rgb(25, 25, 26)',
            legend: {
                show: false,
            },
            tooltip: {
                show: false,
            },
            grid: [
                {
                    top: 5 + '%',
                    bottom: 30 + '%',
                    left: 4 + '%',
                    right: 0 + '%',
                    height: 55 + '%',
                    containLabel: true,
                },
                {
                    top: 75 + '%',
                    bottom: 0 + '%',
                    left: 2 + '%',
                    right: 0 + '%',
                    height: 25 + '%',
                    containLabel: true,
                },
            ],
            xAxis: [
                // todo axisLabel formatter? 即时间轴格式
                {
                    gridIndex: 0,
                    type: 'category',
                    data: categoryData,
                    axisLine: {
                        show: false,
                    },
                    axisTick: {
                        show: false,
                    }
                },
                {
                    gridIndex: 1,
                    type: 'category',
                    data: categoryData,
                    axisLine: {
                        show: false,
                    },
                    axisTick: {
                        show: false,
                    },
                    axisLabel: {
                        show: false,
                    },
                },
            ],
            yAxis: [
                {
                    gridIndex: 0,
                    position: "right",
                    scale: true,
                    axisLabel: {
                        textStyle: {color: 'rgb(100, 100, 100)'},
                        formatter: function (value, index) {
                            return value.toFixed(5);
                        }
                    },
                    axisLine: {
                        show: false,
                    },
                    axisTick: {
                        show: false,
                    },
                    splitLine: {
                        show: true,
                        lineStyle: {
                            color: 'rgb(35, 34, 38)',
                        }
                    }
                },
                {
                    gridIndex: 1,
                    position: "right",
                    scale: true,
                    axisLabel: {
                        textStyle: {color: 'rgb(100, 100, 100)'},
                        formatter: function (value, index) {
                            if (value >= 0) {
                                return "+" + value.toFixed(4);
                            }
                            return value.toFixed(4);
                        }
                    },
                    axisLine: {
                        show: false,
                    },
                    axisTick: {
                        show: false,
                    },
                    splitLine: {show: false}
                },
            ],
            dataZoom: [
                {
                    xAxisIndex: [0, 1],
                    type: 'inside'
                },
            ],
            series: [
                {
                    name: 'line',
                    type: 'line',
                    xAxisIndex: 0,
                    yAxisIndex: 0,
                    data: categoryData,
                    showSymbol: false,
                    lineStyle: {
                        normal: {
                            width: 1,
                            color: 'rgb(253, 209, 42)',
                        }
                    },
                    animationDuration: 0,
                    markPoint: {
                        symbol: "rect",
                        animation: false,
                        symbolSize: [60, 18],
                        symbolOffset: [-20, 0],
                        animationDuration: 0,
                        data: [
                            {
                                name: '最新价',
                                x: '100%',
                                yAxis: now,
                                value: now,
                                label: {
                                    normal: {
                                        show: true,
                                        position: [0, 1],
                                        textStyle: {
                                            color: "#FFFFFF",
                                        }
                                    }
                                },
                                formatter: function (value, index) {
                                    return value.toFixed(5);
                                },
                            }
                        ]
                    },
                    markLine: {
                        symbolSize: 0,
                        animationDuration: 0,
                        symbol: '',
                        label: {
                            normal: {
                                show: false,
                            }
                        },
                        lineStyle: {
                            normal: {
                                type: 'dashed',
                                width: 1,
                            },
                        },
                        data: [{yAxis: now},]
                    },
                },
                {
                    name: 'stick',
                    xAxisIndex: 0,
                    yAxisIndex: 0,
                    type: 'candlestick',
                    data: values,
                    animationDuration: 0,
                    itemStyle: {
                        normal: {
                            color: 'rgb(25, 25, 26)',
                            color0: 'rgb(19, 233, 236)',
                            borderColor: 'rgb(250, 46, 66)',
                            borderColor0: 'rgb(19, 233, 236)',
                            barGap: '100%',
                        }
                    }
                }
            ]
        };
         */
        var gridInset = getKlineGridInsets();
        canvasOption = {
            backgroundColor: __chartTheme.background,
            legend: {
                show: false,
            },
            tooltip: {
                show: false,
            },
            grid: [
                {
                    top: 5 + '%',
                    bottom: 30 + '%',
                    left: gridInset.left,
                    right: gridInset.right,
                    height: 55 + '%',
                    containLabel: true,
                },
                {
                    top: 75 + '%',
                    bottom: 0 + '%',
                    left: gridInset.left,
                    right: gridInset.right,
                    height: 25 + '%',
                    containLabel: true,
                },
            ],
            xAxis: [
                {
                    gridIndex: 0,
                    type: 'category',
                    data: categoryData,
                    axisLine: {
                        show: false,
                    },
                    axisTick: {
                        show: false,
                    },
                    axisLabel: {
                        textStyle: { color: __chartTheme.axisColor },
                        formatter: function (value, index) {
                            return getDateHM(value);
                        }
                    },
                },
                {
                    gridIndex: 1,
                    type: 'category',
                    data: categoryData,
                    axisLine: {
                        show: false,
                    },
                    axisTick: {
                        show: false,
                    },
                    axisLabel: {
                        show: false,
                    },
                },
            ],
            yAxis: [
                {
                    gridIndex: 0,
                    position: "right",
                    scale: true,
                    axisLabel: {
                        margin: isGoodsChartPage() ? 10 : 4,
                        textStyle: {color: __chartTheme.axisColor},
                        formatter: function (value, index) {
                            return formatChartPrice(value);
                        }
                    },
                    axisLine: {
                        show: false,
                    },
                    axisTick: {
                        show: false,
                    },
                    splitLine: {
                        show: true,
                        lineStyle: {
                            color: __chartTheme.splitLine,
                        }
                    }
                },
                {
                    gridIndex: 1,
                    position: "right",
                    scale: true,
                    axisLabel: {
                        margin: isGoodsChartPage() ? 8 : 4,
                        textStyle: {color: __chartTheme.axisColor},
                        formatter: function (value, index) {
                            return formatChartSubAxis(value);
                        }
                    },
                    axisLine: {
                        show: false,
                    },
                    axisTick: {
                        show: false,
                    },
                    splitLine: {show: false}
                },
            ],
            dataZoom: [
                {
                    xAxisIndex: [0, 1],
                    type: 'inside'
                },
            ],
            series: [
                {
                    name: 'stick',
                    xAxisIndex: 0,
                    yAxisIndex: 0,
                    type: 'candlestick',
                    data: values,
                    animationDuration: 0,
                    itemStyle: {
                        normal: {
                            color: __chartTheme.candleDown,
                            color0: __chartTheme.candleUp,
                            borderColor: __chartTheme.candleDown,
                            borderColor0: __chartTheme.candleUp,
                            barGap: '100%',
                        }
                    },
                    markLine: {
                        data: [
                            {yAxis: now}
                        ],
                        symbol: '',
                        lineStyle: {
                            normal: {
                                color: __chartTheme.markLine,
                                type: 'dashed',
                            }
                        },
                        label: {
                            normal: {
                                formatter: '{c}',
                                color: __chartTheme.markLine,
                                position: isGoodsChartPage() ? 'insideEndTop' : 'end'
                            }
                        },
                        animationDuration: 0
                    },
                },
                {
                    name: 'ma5',
                    type: 'line',
                    xAxisIndex: 0,
                    yAxisIndex: 0,
                    data: calculateMA(5),
                    smooth: true,
                    showSymbol: false,
                    animationDuration: 0,
                    lineStyle: {
                        normal: {
                            width: 1
                        }
                    }
                },
                {
                    name: 'ma10',
                    type: 'line',
                    xAxisIndex: 0,
                    yAxisIndex: 0,
                    data: calculateMA(10),
                    smooth: true,
                    showSymbol: false,
                    animationDuration: 0,
                    lineStyle: {
                        normal: {
                            width: 1,
                            color: '#86da2b'
                        }
                    }
                },
                {
                    name: 'ma20',
                    type: 'line',
                    xAxisIndex: 0,
                    yAxisIndex: 0,
                    data: calculateMA(20),
                    smooth: true,
                    showSymbol: false,
                    animationDuration: 0,
                    lineStyle: {
                        normal: {
                            width: 1,
                            color: '#ff5382'
                        }
                    }
                },
                {
                    name: 'ma30',
                    type: 'line',
                    xAxisIndex: 0,
                    yAxisIndex: 0,
                    data: calculateMA(30),
                    smooth: true,
                    showSymbol: false,
                    animationDuration: 0,
                    lineStyle: {
                        normal: {
                            width: 1,
                            color: '#3d8ef6'
                        }
                    }
                },
                {
                    name: 'diff',
                    type: 'line',
                    data: diff,
                    smooth: true,
                    showSymbol: false,
                    xAxisIndex: 1,
                    yAxisIndex: 1,
                    animationDuration: 0,
                    lineStyle: {
                        normal: {
                            width: 1,
                            color: '#00ffff'
                        }
                    }
                },
                {
                    name: 'dea',
                    type: 'line',
                    data: dea,
                    smooth: true,
                    showSymbol: false,
                    xAxisIndex: 1,
                    yAxisIndex: 1,
                    animationDuration: 0,
                    lineStyle: {
                        normal: {
                            width: 1,
                            color: '#fe337f'
                        }
                    }
                },
                {
                    name: 'macd',
                    type: 'bar',
                    xAxisIndex: 1,
                    yAxisIndex: 1,
                    animationDuration: 0,
                    itemStyle: {
                        normal: {
                            color: __chartTheme.macdPos,
                            borderColor: 'transparent',
                        }
                    },
                    data: macd,
                },
            ]
        };
    }
    else {
        // 走势图
        var lineGridRight = isGoodsChartPage() ? 44 : 70;
        var lineGridLeft = isGoodsChartPage() ? 8 : 20;
        canvasOption = {
            backgroundColor: __chartTheme.background,
            grid: [
                {
                    left: lineGridLeft,
                    right: lineGridRight,
                    top: '5%',
                    bottom: 180
                },
                {
                    left: lineGridLeft,
                    right: lineGridRight,
                    bottom: 60,
                    height: 60
                }
            ],
            xAxis: [
                {
                    type: 'category',
                    data: categoryData,
                    scale: true,
                    boundaryGap: true,
                    splitLine: {show: false},
                    axisTick: {show: false},
                    axisLine: {
                        show: false,
                        lineStyle: {
                            color: '#5f5f5f'
                        }
                    },
                    min: 'dataMin',
                    max: 'dataMax',
                },
                {
                    gridIndex: 1,
                    type: 'category',
                    data: categoryData,
                    scale: true,
                    boundaryGap: true,
                    axisTick: {show: false},
                    splitLine: {show: false},
                    axisLabel: {show: false},
                    min: 'dataMin',
                    max: 'dataMax',
                    show: false
                }
            ],
            yAxis: [
                {
                    type: 'value',
                    position: "right",
                    scale: true,
                    splitNumber: 5,
                    boundaryGap: false,
                    splitLine: {
                        show: true,
                        lineStyle: {
                            color: __chartTheme.splitLine
                        }
                    },
                    axisLine: {
                        show: false,
                        lineStyle: {
                            color: __chartTheme.axisColor
                        }
                    },
                    axisTick: {
                        show: false
                    },
                    axisLabel: {
                        show: true,
                        margin: isGoodsChartPage() ? 6 : 4,
                        textStyle: { color: __chartTheme.axisColor, fontSize: 11 },
                        formatter: function (value, index) {
                            return formatChartPrice(value);
                        }
                    },
                    max: 'dataMax',
                    min: 'dataMin'
                },
                {
                    gridIndex: 1,
                    position: "right",
                    scale: true,
                    splitNumber: 3,
                    boundaryGap: false,
                    splitLine: {show: false},
                    axisLine: {
                        show: false,
                        onZero: true,
                        lineStyle: {
                            color: __chartTheme.axisColor
                        }
                    },
                    axisTick: {
                        show: false
                    },
                    axisLabel: {
                        show: true,
                        margin: isGoodsChartPage() ? 4 : 2,
                        textStyle: { fontSize: 10 },
                        formatter: function (value, index) {
                            return formatChartSubAxis(value);
                        }
                    },
                    max: 'dataMax',
                    min: 'dataMin'
                }
            ],
            dataZoom: [
                {
                    type: 'inside',
                    xAxisIndex: [0, 1]
                }
            ],
            series: [
                {
                    name: '日K',
                    type: 'line',
                    data: kTl(values),
                    markLine: {
                        data: [
                            {yAxis: now}
                        ],
                        symbol: '',
                        lineStyle: {
                            normal: {
                                color: '#c23531',
                            }
                        },
                        label: {
                            normal: {
                                formatter: '{c}'
                            }
                        },
                        animationDuration: 0
                    },
                    smooth: false,
                    symbol: 'none',
                    sampling: 'average',
                    itemStyle: {
                        normal: {
                            color: 'rgb(255, 70, 131)'
                        }
                    },
                    lineStyle: {
                        normal: {
                            width: 2,
                            color: "#d2c01e"
                        }
                    },
                    areaStyle: {
                        normal: {
                            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
                                offset: 0,
                                color: '#474019'
                            }, {
                                offset: 1,
                                color: '#262922'
                            }])
                        }
                    },
                    animationDuration: 0
                }
            ]
        };
    }
    canvas.setOption(canvasOption);
    if (isGoodsChartPage()) {
        setTimeout(function () {
            canvas.resize();
        }, 80);
    }
}

// 获取产品时时数据
function getonedata(refresh) {
    refresh = !!refresh;
    autoHeight();
    clearTimeout(ccout);
    if (typeof order_pid === 'undefined' || !order_pid) {
        ccout = setTimeout(function () { getonedata(refresh); }, 500);
        return;
    }
    var klineUrl = (window.H5 && typeof window.H5.apiUrl === 'function')
        ? window.H5.apiUrl('/index/api/getprodata')
        : '/index/api/getprodata';
    $.ajax({
        url: klineUrl,
        type: "get",
        cache: false,
        dataType: "json",
        async: true,
        headers: (window.H5 && typeof window.H5.authHeaders === 'function') ? window.H5.authHeaders() : {},
        data: {
            "pid": order_pid
        },
        success: function (res) {
            var data;
            try {
                if (typeof res === 'string') {
                    data = jQuery.parseJSON(Base64.decode(res));
                } else if (res && typeof res === 'object' && typeof res.now !== 'undefined') {
                    data = res;
                } else if (res) {
                    data = jQuery.parseJSON(Base64.decode(String(res)));
                }
            } catch (e) {
                ccout = setTimeout(function () { getonedata(); }, 3000);
                return;
            }
            if (!data || typeof data.now === 'undefined') {
                ccout = setTimeout(function () { getonedata(); }, 3000);
                return;
            }

            if (__kLineData === null || refresh) {
                // 初始数据生成
                bulidInitData(data);
            }
            else {
                // 同步服务端报价；同一周期内只更新最后一根，跨周期再追加
                let open, close, highest, lowest, topdata;
                let kLineData = __kLineData;
                let lastIdx = kLineData.values.length - 1;
                let lastBar = kLineData.values[lastIdx];
                let intervalSec = getInterval();
                let lastTs = kLineData.categoryData[lastIdx];
                close = parseFloat(data.now);
                open = lastBar[0];
                highest = Math.max(close, open, parseFloat(data.highest));
                lowest = Math.min(close, open, parseFloat(data.lowest));

                if (data.topdata - lastTs >= intervalSec) {
                    topdata = lastTs + intervalSec;
                    kLineData.categoryData.push(topdata);
                    kLineData.values.push([lastBar[1], close, highest, lowest]);
                } else {
                    lastBar[1] = close;
                    lastBar[2] = highest;
                    lastBar[3] = lowest;
                }
            }

            // 渲染K线图
            gotoecharts();
            if (typeof newprice !== 'undefined' && newprice !== '') {
                syncKlineWithPrice(newprice);
            }

            // 定时刷新
            ccout = setTimeout("getonedata()", getInterval() * 1000);
        },
        error: function () {
            ccout = setTimeout("getonedata()", 3000);
        },
    });
}

// 通过首个产品数据生成模拟数据
function bulidInitData(data) {
    // 涨跌状态("up"|"down")，数据时间戳，开市价， 当前价， 休市价， 最高价， 最低价
    let state,
        topdata = (data.topdata || Math.floor(Date.now() / 1000)) - (data.topdata || Math.floor(Date.now() / 1000)) % 60,
        open = parseFloat(data.open),
        now = parseFloat(data.now),
        close = parseFloat(data.close),
        highest = parseFloat(data.highest),
        lowest = parseFloat(data.lowest);

    if (isNaN(now) || now <= 0) {
        now = parseFloat(typeof newprice !== 'undefined' ? newprice : 0) || 1;
    }
    if (isNaN(open) || open <= 0) {
        open = now;
    }
    if (isNaN(close) || close <= 0) {
        close = now;
    }
    if (isNaN(highest) || highest <= 0) {
        highest = Math.max(open, close, now);
    }
    if (isNaN(lowest) || lowest <= 0) {
        lowest = Math.min(open, close, now);
    }

    // 修正数据
    close = now;
    highest = Math.max(open, close, highest);
    lowest = Math.min(open, close, lowest);

    // 以当前数据作为参考值
    __kLineData = {
        categoryData: [topdata],
        values: [[open, close, highest, lowest]],
    };
    let categoryData = __kLineData.categoryData, values = __kLineData.values;

    // 生成60 - 1个数据
    for (let i = 1; i < 60; i++) {
        // 开市价，休市价，最高价，最低价，时间戳，x轴间隔(1M,5M..)，模拟数据的抖动率
        let open, close, highest, lowest, topdata, _interval, shake;
        _interval = getInterval();
        shake = 0.5 + _interval / 86400 * 0.5;

        topdata = categoryData[i - 1] - _interval;
        open = close = values[i - 1][0];    // 休市价等于一个数据的开市价
        open += (randomRangeInt(1, 2) === 2 ? -1 : 1) * open * 0.5 * (randomRangeInt(0, 10000) / 10000) * shake;
        highest = Math.max(close, open);
        lowest = Math.min(close, open);
        highest += highest * 0.15 * (randomRangeInt(0, 10000) / 10000) * shake;
        lowest -= lowest * 0.15 * (randomRangeInt(0, 10000) / 10000) * shake;

        categoryData.push(topdata);
        values.push([open, close, highest, lowest]);
    }

    // 反转数据
    categoryData.reverse();
    values.reverse();
}

// 获取用户所选择的时间轴距离， 单位秒
function getInterval(){
    // K线图x轴时间距离， 单位分钟， D表示一天
    let Vtype = $(".trade-chart-period.active").text(), interval;
    switch (Vtype) {
        case "1M":
            interval = "1";
            break;
        case "5M":
            interval = "5";
            break;
        case "15M":
            interval = "15";
            break;
        case "30M":
            interval = "30";
            break;
        case "1H":
            interval = "60";
            break;
        case "1D":
            interval = "1440";
            break;
        default:
            interval = "1";
            break;
    }
    return (parseInt(interval, 10) || 1) * 60;
}

// 自动高度
$(window).resize(function (e) {
    autoHeight();
});

// 高度调整
function autoHeight() {
    if ($(".goods-chart-body").length) {
        var avail = Math.floor($(window).height() * 0.32);
        var chartH = Math.min(280, Math.max(200, avail));
        $("#ecKx").height(chartH);
        $("#container").height(chartH);
        $(".goods-chart-area").css({ height: chartH + "px", minHeight: chartH, maxHeight: chartH });
        var chartDom = document.getElementById("ecKx");
        if (chartDom && typeof echarts !== "undefined") {
            var chartInst = echarts.getInstanceByDom(chartDom);
            if (chartInst) {
                chartInst.resize();
            }
        }
        return;
    }
    var headerbarH = $(".headerbar").height();
    var headerH = $("header").height();
    var NavH = $("nav").height();
    var tradebarH = $(".trade_bar").height();
    var ecBarH = $("#ecBar").height() || 0;
    var WinHss = $(window).height();
    $("footer").height(WinHss - headerbarH - headerH - NavH - tradebarH - ecBarH);
    $("#ecKx").height(WinHss - headerbarH - headerH - NavH - tradebarH - ecBarH);
}

// 获取一个整数随机数,从 n - m
function randomRangeInt(n, m) {
    if (n > m) [n, m] = [m, n];
    return Math.floor(Math.random() * (m - n + 1) + n);
}

//时间戳转成时：分：00形式   1700以来的秒数（非毫秒）
function getDateHM(tm) {
    let NWh = new Date(parseInt(tm) * 1000).getHours(tm);
    let NWm = new Date(parseInt(tm) * 1000).getMinutes(tm);
    if (NWh < 10) NWh = "0" + NWh;
    if (NWm < 10) NWm = "0" + NWm;
    return NWh + ":" + NWm;
}