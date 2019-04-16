var crypto = require("crypto");
var util = require('util');

var mongoose = require("libs/mongoose");
var Schema = mongoose.Schema;

var schema = new Schema({
    email: {
        type: String,
        unique: true,
        required: true
    },
    name: {
        type: String,
        required:true
    },
    about: {
        type: String
    },
    hashedPassword: {
        type: String,
        required: true
    },
    salt: {
        type: String,
        required: true
    },
    created: {
        type: Date,
        default: Date.now
    }
});

schema.methods.encryptPassword = function (password) {
    return crypto.createHmac('sha1', this.salt).update(password).digest('hex');
};

schema.virtual('password')
      .set(function (password) {
          this._plainPassword = password;
          this.salt = Math.random() + '';
          this.hashedPassword = this.encryptPassword(password);
      })
      .get(function () {
          return this._plainPassword;
      });

schema.methods.checkPassword = function (password) {
    return this.encryptPassword(password) === this.hashedPassword;
};

schema.statics.authorize = function(email, password, callback) {
    var User = this;

    User.findOne({email: email}, function (err, user) {
        if(err) return callback(err);
        if(user) {
            if(user.checkPassword(password)) {
                callback(null, user);
            } else {
                callback(new AuthError("Password is not correct"));
            }
        } else {
            callback(null, null);
        }
    });
};

function AuthError(message) {
    Error.apply(this, arguments);
    Error.captureStackTrace(this, AuthError);

    this.message = message;
}

util.inherits(AuthError, Error);

AuthError.prototype.name = 'AuthError';

exports.AuthError = AuthError;
exports.User = mongoose.model('User', schema);