var express = require('express');
var router = express.Router();


router.post('/', function(req, res, next) {
    var sid = req.session.id;
    var io = req.app.get('io');

    req.session.destroy(function (err) {
        require('socket').ReloadSession(sid, io);
        if(err) return next(err);
    });
    res.redirect('/');
});

module.exports = router;