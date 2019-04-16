var express = require('express');
var router = express.Router();
var User = require('models/user').User;
var HttpError = require('error').HttpError;
var AuthError = require('models/user').AuthError;

/* GET home page. */
router.get('/', function(req, res, next) {
    if(req.user)
        res.redirect('/profile');
    res.render('login', { title: 'Login - SkyOrbis' });
});

router.post('/', function(req, res, next) {
    var email = req.body.email;
    var password = req.body.password;

    User.authorize(email, password, function (err, user) {
        if(err)  {
            if(err instanceof AuthError)
            {
                return next(new HttpError(403, err.message));
            }
            return next(err);
        }
        if(user) {
            req.session.user = user._id;
            res.send({status:"success"});
        } else {
            res.send({status : "error", message : "User not found. Please, register first."});
        }
    });

});

module.exports = router;
