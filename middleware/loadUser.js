var User = require('models/user').User;

module.exports = function (req, res, next) {
    console.log('here');
  if(!req.session.user) return next();

  User.findById(req.session.user, function (err, user) {
      console.log(arguments);
      if(err) return next(err);


      req.user = res.locals.user = user;
      next();
  })
};