var express = require('express');
var router = express.Router();
var User = require('models/user').User;
var HttpError = require('error').HttpError;


router.post('/', function(req, res, next) {
    var email = req.body.email;
    var password = req.body.password;
    var name = req.body.name;
    if(password != req.body.confirm_password) {
        return next(new HttpError(403, "Passwords do not match"));
    }
    User.findOne({email: email}, function (err, user) {
        if(err) return next(err);
        if(user) {
            return next(new HttpError(403, "User with this email address already exists."));
        } else {
            var user = new User({email: email, name: name, password: password});
            user.save(function (err) {
                if (err) return next(err);
            });
        }
    });
});

module.exports = router;
