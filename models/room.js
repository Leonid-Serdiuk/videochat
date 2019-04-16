var util = require('util');

var mongoose = require("libs/mongoose");
var Schema = mongoose.Schema;

var schema = new Schema({
    users_in: {
        type: Number,
        min:0,
        max:2,
        default: 0,
        required: true
    },
    status: {
        type: String,
        required: true
    }
});

exports.Room = mongoose.model('Room', schema);