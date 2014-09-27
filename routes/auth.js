var config = require('../config/config');
var jwt = require('jwt-simple');
var db = require('../config/mongo_database.js');
var moment = require('moment');

exports.login = function(req, res, next)
{
  var email = req.body.email || '';
	var password = req.body.password || '';
	if (email === '' || password === '') return res.send(400);

  db.Users.findOne({ email: req.body.email }, function(err, user) {
      if (!user) {
        return res.status(401).send({ message: 'Wrong email' });
      }
      user.comparePassword(password, function(err, isMatch) {
        if (!isMatch) {
          return res.status(401).send({ message: 'Wrong password' });
        }
        var tokenPayload = {
          user: { name: user.name, id: user._id },
          iat: moment().valueOf(),
          exp: moment().add(12, 'months').valueOf()
        };
        res.send({ token: jwt.encode(tokenPayload, config.TOKEN_SECRET) });
      });
  });
};

exports.signup = function(req, res, next)
{
  var email = req.body.email || '';
	var password = req.body.password || '';
	if (email === '' || password === '') return res.send(400);
	var name = req.body.name || email; 
	
  var user = new db.Users();
  user.name = name;
  user.email = email;
  user.password = password;
  user.save(function(err) {
    if (err) return next(err);
    res.send(200);
  });
};

exports.ensureAuthenticated = function(req, res, next)
{
  if (!req.headers.authorization) {
    return res.status(401).send({ message: 'Please make sure your request has an Authorization header' });
  }

  var token = req.headers.authorization.split(' ')[1];
  try {
    var payload = jwt.decode(token, config.TOKEN_SECRET);
    if (payload.exp <= Date.now()) {
      return res.status(401).send({ message: 'Token has expired' });
    }
    req.user = payload.user;
    next();
  } catch (err) {
    return res.send(500, 'Error parsing token');
  }
};