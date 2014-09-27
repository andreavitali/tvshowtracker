var bcrypt = require('bcrypt');
var mongoose = require('mongoose');
var config = require('./config');

// Connection
mongoose.connect(config.MONGODB_URI, {}, function(err, res){
   if(err) {
       console.log("Connection to MongoDB refused");
       console.log(err);
   } 
   else {
       console.log("Connection to MongoDB successful");
   }
});

// User Schema
var nextEpToWatchSchema = new mongoose.Schema({
  show : {type:Number, ref:'shows'},
  season : Number,
  episode: Number,
  airDate: Date,
  status: Number 
}, {_id:false});

var userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    password: String,
    created: { type: Date, default: Date.now },
    lastUpdate: Date,
    followed: [nextEpToWatchSchema]
});

userSchema.pre('save', function(next) {
  var user = this;
  if (!user.isModified('password')) return next();
  bcrypt.genSalt(10, function(err, salt) {
    if (err) return next(err);
    bcrypt.hash(user.password, salt, function(err, hash) {
      if (err) return next(err);
      user.password = hash;
      next();
    });
  });
});

userSchema.methods.comparePassword = function(candidatePassword, cb) {
  bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
    if (err) return cb(err);
    cb(null, isMatch);
  });
};

// Show Schema
var showSchema = new mongoose.Schema({
  _id: { type: Number, required: true, unique: true },
  name: String,
  genres: [Number],
  status: String,
  posterPath: String
});

exports.Users = mongoose.model('users', userSchema);
exports.Shows = mongoose.model('shows', showSchema);