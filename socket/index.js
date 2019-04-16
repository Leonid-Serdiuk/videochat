var config = require('config');
var User = require('models/user').User;
var cookie = require('cookie');
var async = require('async');
var sessionStore = require('libs/sessionStore');
var HttpError = require('error').HttpError;
var cookieParser = require('cookie-parser');

var log = require('../libs/log');


function loadSession(sid, callback) {
    sessionStore.load(sid, function (err, session) {
        if(arguments.length == 0) {
            return callback(null, null);
        } else {
            return callback(null, session);
        }
    });
}

function loadUser(session, callback) {
    User.findById(session.user, function (err, user) {
        if(err) return callback(err);

        if(!user) {
            return callback(null, null);
        }

        callback(null, user);
    })
}

exports.ReloadSession = function (sid, io) {
    var sockets = io.sockets.sockets;
    Object.keys(sockets).forEach(function(index) {
        if(sockets[index].client.request.session.id != sid)
            return;

        loadSession(sid, function (err, session) {
            if(err) {
                sockets[index].emit("error", "Server error");
                sockets[index].disconnect();
                return;
            }

            if(!session) {
                sockets[index].emit("logout");
                sockets[index].disconnect();
                return;
            }

            sockets[index].client.request.session = session;
        })

    });
};

exports.Connect = function (server) {

    var io = require('socket.io')(server);

    //io.origins(['localhost:*', '192.168.0.108:*, 10.0.0.36:*']);

    io.use(function(socket, next) {
        //next();
        var handshakeData = socket.request;
        handshakeData.roomId = io.roomId;
        async.waterfall([
            function (callback) {
                //parse cookies and call load session
                handshakeData.cookies = cookie.parse(handshakeData.headers.cookie || '');
                var sidCookie = handshakeData.cookies[config.get('session:key')];
                var sid = cookieParser.signedCookie(sidCookie, config.get('session:secret'));
                loadSession(sid, callback);
            },
            function (session, callback) {
                // after session loaded check session and load user
                if(!session) {
                    return callback(new HttpError(401, "No session"));
                }
                handshakeData.session = session;
                loadUser(session, callback);
            },
            function (user, callback) {
                // after user loaded call last callback
                if(!user) {
                    //return callback(new HttpError(403, "Anonymous session may not connect"));
                    user = new User({name:"Anonymous"})
                }
                handshakeData.user = user;
                callback(null);
            }
        ], function (err) {
            // Ooops error call
            if(err) next(err);
            else {
                //store changed reqest data to request data
                socket.request = handshakeData;
                next();
            }
        });

    });

    io.on('connection', function (socket) {

        var roomId = socket.request.roomId;
        socket.join(roomId);

        var name = (socket.request.user == undefined) ? 'user' : socket.request.user.get('name');

        socket.broadcast.to(roomId).emit('join', name);

        socket.on('message', function (text, cb) {
            socket.broadcast.to(roomId).emit('message', name, text);
            cb();
        });

        socket.on('microphone mute', function (state, cb) {
            socket.broadcast.to(roomId).emit('microphone mute', state);
            cb(state);
        });

        socket.on('videocamera mute', function (state, cb) {
            socket.broadcast.to(roomId).emit('videocamera mute', state);
            cb(state);
        });

        socket.on('rtc_candidate', function (data) {
            socket.to(roomId).emit('rtc_candidate', data);
        });

        socket.on('rtc_description', function (data) {
            socket.to(roomId).emit('rtc_description', data);
        });

        socket.on('disconnect', function () {
            socket.broadcast.to(roomId).emit('leave', name);
        });
    });

    return io;
};