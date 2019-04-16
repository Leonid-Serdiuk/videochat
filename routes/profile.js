var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    if(!req.user)
        res.redirect('/login');
    console.log(req.user);
    res.render('profile', {"user":req.user});
});

router.post('/', function(req, res, next) {
    if(!req.user)
        res.redirect('/login');
    req.user[req.body.name] = req.body.value;
    req.user.save(function (err, user, affected) {
        if(err)
            return next(err);
        if(affected) {
            res.send({success: true});
        }
    });
});

module.exports = router;