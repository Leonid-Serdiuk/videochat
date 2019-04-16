(function () {
    $(document).on('click', '.edit-field', function () {
        var elem = $(this).parents('tr').find('.editable');
        var text = elem.text();
        if(elem.hasClass('editable-textarea')) {
            var editable = $('<textarea>', {text: text, class: "form-control", rows: "5", name: elem.attr('data-name')});
            elem.html(editable);
        } else {
            var editable = $('<input />', {value: text, class: "form-control", name: elem.attr('data-name')});
            elem.html(editable);
        }
        $(this).removeClass('edit-field').addClass('send-field').find('i').removeClass('glyphicon-edit').addClass('glyphicon-ok');
        editable.focus();
        var tmpStr = editable.val();
        editable.val('');
        editable.val(tmpStr);
    });
})();

(function () {
    $(document).on('click', '.send-field', function () {
        var the_elem = $(this);
        var elem = $(this).parents('tr').find('.editable');
        var value = elem.find('.form-control').val();
        var name = elem.find('.form-control').attr('name');
        var data = {name: name, value:value};
        $.ajax({
            url: "/profile",
            method: "POST",
            dataType: "JSON",
            data:data,
            error: function (err) {
                console.log(err);
            },
            success: function (data) {
                if(data.success === true) {
                    elem.html(value);
                    the_elem.removeClass('send-field').addClass('edit-field').find('i').removeClass('glyphicon-ok').addClass('glyphicon-edit');
                }
            }
        });
    });
})();