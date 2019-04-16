$('#regiter-link').click(function (e) {
    e.preventDefault();
    $('#login_form').hide()
    $('#regiter_form').show();
});

$('#login-link').click(function (e) {
    e.preventDefault();
    $('#regiter_form').hide()
    $('#login_form').show();
});

$('#login_form, #regiter_form').on('submit', function () {

    var form = $(this);

    sendRequest(form.attr("action"), form.serialize(), "POST", function (jqXHR) {
        jqXHR.statusCode( {
            200: function () {
                data = JSON.parse(jqXHR.responseText);
                if (data.status == "error") {
                    $('.error-block').text(data.message).show();
                    $('#regiter-link').click();
                } else if (data.status = "success") {
                    form.html("Welcome!");
                    window.location.href = '/';
                }
            },
            403: function () {
                console.log(jqXHR.responseText);
                var error = JSON.parse(jqXHR.responseText);
                $('.error-block').text(error.message).show();
            },
            404: function () {
                $('.error-block').text("Woops, something wrong! Try again letter.").show();
            }
        });
    });

    return false;
});

function sendRequest(url, data, method, callback) {
    $.ajax({
        url: url,
        method: method,
        data: data,
        complete: function (jqXHR) {
            callback(jqXHR);
        }
    });
};

// Init tooltips
$(function () {
    $('[data-toggle="tooltip"]').tooltip({trigger:'hover'})
})
