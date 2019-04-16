var express = require('express');
var router = express.Router();
var Room = require('models/room').Room;
var HttpError = require('error').HttpError;
/*
* User goes to chick chat
* If without params
* Generate rooms id, write id to database.
* db row now {roomId:423423423,users_online:0, max_online:2, status:"created", created_sid: sid}
* redirect user to room
* Check token in url: if room does not exists in db -> show 404
* Else if exists check status if status == created && created_sir == this user sid -> connect user to room, update users_online +1 show room with share options
* db row now {roomId:423423423,users_online:1, max_online:2, status:"opened", created_sid: sid}
* If user left change users_online -1;
* If other user comes and set users_online + 1 if now users online > 1 make call and set status active
* */

/* GET quick chat page page. */
router.get('/', function(req, res, next) {
    var room  = new Room({"status":"created"});
    room.save(function (err, room, affected) {
        if(err) {
            return next(new HttpError(500, err.message));
        }
        if(room) {
            //res.render('quick_chat');
            res.redirect('/quick-chat/r/' + room.id);
        }
    });

});

router.get('/r/:id', function(req, res, next) {
    var io = req.app.get('io');
    console.log(io);
    io.roomId = req.params.id;
    req.app.set('io', io);
    res.render('quick_chat');
});

module.exports = router;
