(function () {
    var form = $('#room form');
    var ul = $('#room ul.text-chat-messages');
    var input = form.find('input');

    if(form.length == 0)
        return;

    var socket = io.connect('', {
        reconnectionDelay: 1,
        reconnectionAttempts: 10
    });

    var configuration = {
        iceServers :[
            { urls:'stun:stun1.l.google.com:19302'}
        ]
    };
    var RTCPeerConnection = webkitRTCPeerConnection || mozRTCPeerConnection || RTCPeerConnection;
    var pc;
    var remoteStream;
    var audioTrack;
    var videoTrack;

    // Set local track statuses
    var localTracksStatus = {'microphone':{'disabled':false}, 'videocamera':{'disabled':false}};
    var remoteTracksStatus;

    socket
        .on('connect', function () {
            printStatus("Connected");
            form.submit(sendMessage);
            input.prop('disabled', false);
            start();
        })
        .on('message', function (name, text) {
            printMessage(name + ': ' + text);
        })
        .on('join', function (name) {
            printStatus(name + " joined to chat");
            start();
        })
        .on('leave', function (name) {
            printStatus(name + " left chat");
            $('.remote-video').hide();
            $('#shareSection').show();
        })
        .on('logout', function () {
            window.location.href = '/';
        })
        .on('disconnect', function () {
            printStatus("Connection lost");
            form.off('submit', sendMessage);
            input.prop('disabled', true);
        })
        .on('reconnect_failed', function () {
            alert('We loose connection! Frever!');
        });

    function start() {
        // Cteate RPC object
        pc = new RTCPeerConnection(configuration);

        // Send candistates once they are created
        pc.onicecandidate = function (evt) {
            console.log('candidates creation');
            socket.emit('rtc_candidate', JSON.stringify({ "candidate": evt.candidate }));
        };

        // let the 'negotiationneeded' event trigger offer generation
        pc.onnegotiationneeded = function () {
            console.log('offer creation');
            pc.createOffer(localDescCreated, logError);
        }

        // once remote stream arrives, show it in the remote video element
        pc.onaddstream = function (evt) {
            remoteStream = evt.stream;

            audioTrack = remoteStream.getAudioTracks();
            videoTrack = remoteStream.getVideoTracks();
            console.log(remoteTracksStatus);
            if(remoteTracksStatus != undefined) {
                console.log(remoteTracksStatus);
                swichAudioTrack(remoteTracksStatus.microphone);
                swichVideoTrack(remoteTracksStatus.videocamera);
            }

            // Check user disabled video or audio
            console.log('remote video');

            var remote_video = document.querySelector('#remoteVideo');
            remote_video.srcObject = evt.stream;

            $('#shareSection').hide();
            $('.remote-video').show();
        };

        getUserMedia();

        function localDescCreated(desc) {

            pc.setLocalDescription(desc, function () {
                socket.emit('rtc_description', JSON.stringify({
                    'sdp': pc.localDescription,
                    'tracks':localTracksStatus
                }));
            }, logError);
        }

        socket.on('rtc_description', function (data) {
            var message = JSON.parse(data);

            if(message.tracks != undefined) {
                remoteTracksStatus = message.tracks;
            }
            pc.setRemoteDescription(new RTCSessionDescription(message.sdp), function () {
                // if we received an offer, we need to answer
                if (pc.remoteDescription.type == 'offer')
                    pc.createAnswer(localDescCreated, logError);
            }, logError);
        });

        socket.on('rtc_candidate', function (data) {
            var message = JSON.parse(data);
            if(message.candidate)
                pc.addIceCandidate(new RTCIceCandidate(message.candidate));
        });

        socket.on('microphone mute', function (state) {
            swichAudioTrack(state);
        });

        socket.on('videocamera mute', function (state) {
            swichVideoTrack(state);
        });

        function swichAudioTrack(state) {
            if(state.disabled) {
                if (audioTrack.length > 0) {
                    remoteStream.removeTrack(audioTrack[0]);
                    $('.remote-video .audio-muted').css('display','block');
                }
            } else {
                if (audioTrack.length > 0) {
                    remoteStream.addTrack(audioTrack[0]);
                    $('.remote-video .audio-muted').hide();
                }
            }
        }

        function swichVideoTrack(state) {
            var remote_video = document.querySelector('#remoteVideo');
            if(state.disabled) {
                if (videoTrack.length > 0) {
                    remoteStream.removeTrack(videoTrack[0]);
                    $(remote_video).hide();
                }
            } else {
                if (audioTrack.length > 0) {
                    remoteStream.addTrack(videoTrack[0]);
                    $(remote_video).show();
                }
            }
        }

        function logError(error) {
            console.log(error.name + ': ' + error.message);
        }
    }

    var onErrorGetMedia = function(e) {
        console.error('Error get media!', e);
    };

    var onGetMedia = function(stream) {
        console.log(stream);
        var local_video = document.querySelector('#localVideo');
        local_video.srcObject = stream;

        local_video.onloadedmetadata = function(e) {
            pc.addStream(stream);
        };

    }

    function getUserMedia () {

        navigator.getUserMedia =
            navigator.webkitGetUserMedia ||
            navigator.mozGetUserMedia || navigator.getUserMedia;

        // Not showing vendor prefixes.
        navigator.mediaDevices.getUserMedia({video:true, audio:true}).then(onGetMedia).catch(onErrorGetMedia);
    };

    $('#disable_videocamera, #disable_microphone').off('click').click(function (e) {

        var elem = $(this);
        var event_part_name = elem.attr('id').replace('disable_', '');
        e.preventDefault();
        // check current state and sen new
        var disabled = elem.hasClass('disabled') ? false : true;
        // send new state
        socket.emit(event_part_name + ' mute', {disabled: disabled}, function (state) {
            console.log('cb');
            elem.toggleClass('disabled');
            localTracksStatus[event_part_name] = state;
        });
        return false;
    });

    $('.conv_tool').click(function (e) {
        e.preventDefault();

        var target = $(this).attr('data-target');

        $(target).toggle('fast');
        $(this).toggleClass('disabled');

        return false;
    });


    $('#copy_to_clipboard').click(function (e) {
        e.preventDefault();
        copy();
        alert_message('The Link Copied To Clipboard');
        return false;
    });


    /**** Help functions ****/
    function sendMessage() {
        var text = input.val();
        console.log(text);
        socket.emit('message', text, function () {
            printMessage('me: ' + text);
        });

        input.val('');
        return false;
    }

    function printMessage(text) {
        console.log(text);
        $('<li>', {text: text, class: "chat-message"}).appendTo(ul);
        var el = ul.find('li:last');
        ul.scrollTop(el.height() * (el.index() + 1));
    }

    function printStatus(text) {
        $('<li>', {text: text, class: "system-message"}).appendTo(ul);
        var el = ul.find('li:last');
        ul.scrollTop(el.height() * (el.index() + 1));
    }

    function alert_message(text, type) {
        type = type != undefined ? type : '';
        var elem = $('#alert_message');
        elem.text(text);
        elem.addClass(type);
        elem.show().animate({left:0}, 500);
        setTimeout(function () {
            elem.animate({left:-200}, 500,function () {
                $(this).hide();
            });
        }, 2000);
    }

    function copy() {
        var copyText = $("#hidden_text_input");
        copyText.val(window.location.href);
        console.log();
        copyText[0].select();
        document.execCommand("copy");
    }
    /**** .Help functions ****/

})();

(function () {



})();

(function () {

    $( ".self-video" ).draggable({containment: "#main", scroll: false });
    $( ".text-chat" ).draggable({handle: ".text-chat-header", containment: "#main", axis: "x", scroll: false });

})();