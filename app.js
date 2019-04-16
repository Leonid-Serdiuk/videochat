var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var config = require('config');
var mongoose = require('libs/mongoose');
var HttpError = require("error").HttpError;

var app = express();

// view engine setup
app.engine('ejs', require('ejs-locals'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
if(app.get('env') == 'development') {
    app.use(logger('dev'));
}
else {
    app.use(logger('default'));
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

var sessionStore = require('libs/sessionStore');
app.use(session({
    secret: config.get("session:secret"),
    key: config.get("session:key"),
    cookie: config.get("session:cookie"),
    resave: false,
    saveUninitialized: true,
    store: sessionStore
}));

app.use(express.static(path.join(__dirname, 'public')));

app.use(require('middleware/loadUser'));

// Http Error Handler method
app.use(require('middleware/sendHttpError'));


require('./routes')(app);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new HttpError(404, 'Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  if(typeof err == 'number') {
      err = new HttpError(err);
  }

  if(err instanceof HttpError)
  {
      console.log("send error");
      res.sendHttpError(err);
  } else {
      // set locals, only providing error in development
      res.locals.message = err.message;
      if(req.app.get('env') === 'development') {
          res.locals.error = err;

          // render the error page
          res.status(err.status || 500);
          res.render('error');
      } else {
          err = new HttpError(500);
          res.sendHttpError(err);
      }
  }
});

module.exports = app;
