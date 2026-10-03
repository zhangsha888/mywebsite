(function () {
    function uploadIdcard(file, done) {
        var fd = new FormData();
        fd.append('file', file);
        $.ajax({
            url: (window.H5 && H5.apiUrl) ? H5.apiUrl('/index/h5api/upload_idcard') : '/index/h5api/upload_idcard',
            type: 'POST',
            data: fd,
            processData: false,
            contentType: false,
            headers: (window.H5 && H5.authHeaders) ? H5.authHeaders() : {},
            dataType: 'json',
            success: function (res) {
                if (res && res.status) {
                    done(null, res.url, res.path || res.url);
                } else {
                    done((res && res.msg) ? res.msg : '上传失败');
                }
            },
            error: function () {
                done('网络错误');
            }
        });
    }

    function bindUpload(inputId, boxId, previewId, hiddenId) {
        $('#' + inputId).on('change', function () {
            var file = this.files && this.files[0];
            if (!file) return;
            if (file.size > 5 * 1024 * 1024) {
                layer.msg('图片不能超过5MB');
                this.value = '';
                return;
            }
            var load = layer.load(1);
            uploadIdcard(file, function (err, url, path) {
                layer.close(load);
                if (err) {
                    layer.msg(err);
                    return;
                }
                $('#' + hiddenId).val(path || url);
                var preview = url;
                if (window.H5 && H5.mediaUrl) {
                    preview = H5.mediaUrl(url);
                }
                $('#' + previewId).attr('src', preview);
                $('#' + boxId).addClass('has-img');
            });
        });
    }

    bindUpload('fileFront', 'boxFront', 'previewFront', 'idcardFront');
    bindUpload('fileBack', 'boxBack', 'previewBack', 'idcardBack');

    $('#smSubmit').on('click', function () {
        var uname = $.trim($('#smUname').val());
        var idcard = $.trim($('#smIdcard').val());
        var phone = $.trim($('#smPhone').val());
        if (!uname) {
            layer.msg('请输入姓名');
            return;
        }
        if (!idcard) {
            layer.msg('请输入身份证号码');
            return;
        }
        if (idcard.length < 15) {
            layer.msg('请输入正确的身份证号码');
            return;
        }
        var $btn = $('#smSubmit');
        $btn.prop('disabled', true).text('提交中...');
        $.ajax({
            url: (window.H5 && H5.apiUrl) ? H5.apiUrl('/index/h5api/submit_sm') : '/index/h5api/submit_sm',
            type: 'POST',
            data: {
                uname: uname,
                idcard: idcard,
                phone: phone,
                idcard_front: $('#idcardFront').val(),
                idcard_back: $('#idcardBack').val()
            },
            headers: (window.H5 && H5.authHeaders) ? H5.authHeaders() : {},
            dataType: 'json',
            success: function (res) {
            $btn.prop('disabled', false).text('提交认证');
            var ok = res && (res.type == 1 || res.code == 1);
            var msg = (res && (res.msg || res.data)) ? (res.msg || res.data) : '';
            layer.msg(msg || (ok ? '提交成功' : '提交失败'));
            if (ok) {
                setTimeout(function () {
                    var url = (window.H5 && H5.pageUrl) ? H5.pageUrl('sm_status.html') : '/sm_status.html';
                    location.replace(url);
                }, 800);
            }
            },
            error: function () {
                $btn.prop('disabled', false).text('提交认证');
                layer.msg('网络错误');
            }
        });
    });
})();
