var express = require('express')
var app = express()
var cookie_parser = require('cookie-parser')
var body_parser = require('body-parser');
var session = require('express-session')
var http = require('http').Server(app)
var io = require('socket.io')(http)
var uuid = require('node-uuid');
var path = require('path');
var jwt = require('jsonwebtoken');
var flash = require('connect-flash')

const hearth_secret = 'hearth-server-secret';

//const hearth_game = require('./engine.js')

app.set('view engine', 'jade');
app.set('views', path.join(__dirname, '/views'));

app.use(body_parser.urlencoded({ extended: false }));
app.use(body_parser.json());
app.use(cookie_parser());

// settings for using flash
app.use(session({cookie : {maxAge : 60000}, secret : hearth_secret}));
app.use(flash());

// Check whether the user has the authentication
// If it has oned, then set requet.decoded
app.use(function(req, res, next) {
  var token = req.body.token || req.query.token || req.headers['x-access-token'];

  if(token) {
    jwt.verify(token, hearth_secret, function(err, decoded) {
      if(!err) {
        req.decoded = decoded;
      } else {
        req.decoded = '';
      }
    })
  }
  else { req.decoded = ''; }
  next();
});

app.get('/', function(req, res) {
  console.log(req.decoded);

  var token = req.flash('signed_token');
  res.render('index.jade', { 'token' : token })

  console.log('Connected!')
});

app.get('/info', function(req, res) {
  var data = req.cookies.hearth_auth;
  if(data && user_manager.chk_user_session(data.user_id, data.session_key)) {
    res.render('info.jade', {user_id : data.user_id})
  }
  else res.redirect('/')
});

app.post('/login', function(req, res) {
  var id = req.body.user_id;
  var password = req.body.password;

  console.log('post :: id : ' + id + ' / password : ' + password);

  if(user_manager.chk_user(id, password)) {
    var token = jwt.sign({id : id, password : password}, hearth_secret, {expiresInMinutes : 1440});

    req.flash('signed_token', token);
    res.redirect('/')
  } else {
    res.redirect('/')
  }
});

app.get('/match', function (req, res) {
});

var server_port = process.env.PORT || 80
http.listen(server_port, function() {
  console.log('app is listening on port ' + server_port)
})
io.on('connection', function(socket) {
  match_maker.add_client(socket);
  socket.on('disconnect', function() {
    match_maker.delete_client(socket)
  });

});

function UserManager() {
  this.user_list = [{id : 'a', password : 'a'}];
}
UserManager.prototype.add_user = function(user_id, password) {
  for(var i = 0; i < this.user_list.length; i ++) {
    if(this.user_list[i].id == user_id) {
      return {result : false, reason : 'Id is already taken'};
    }
  }
  this.user_list.push({id : user_id, password : password});
  return {result : true};
}
UserManager.prototype.chk_user = function(user_id, password) {
  for(var i = 0; i < this.user_list.length; i ++) {
    if(this.user_list[i].id == user_id) {
      if(this.user_list[i].password == password) return {result : true};
      return {result : false, reason : 'password is not matched'};
    }
  }
  return {result : false, reason : 'not registered user'};
}
UserManager.prototype.set_user_session = function(user_id) {
  for(var i = 0; i < this.user_list.length; i ++) {
    if(this.user_list[i].name == user_id) {
      this.user_list[i].session_key = uuid.v4();
      return this.user_list[i].session_key;
    }
  }
  return null;
}
UserManager.prototype.chk_user_session = function(user_id, key) {
  for(var i = 0; i < this.user_list.length; i ++) {
    if(this.user_list[i].name == user_id) {
      if(this.user_list[i].session_key == key) return true;
      return false;
    }
  }
  return false;
}
var user_manager = new UserManager();

function MatchMaker() {
  // current list of connected clients
  this.client_list = [];
}
MatchMaker.prototype.add_client = function(soc) {
  this.client_list.push(soc);
  console.log('client Connected! - ' + soc.id);
}
MatchMaker.prototype.delete_client = function(soc) {
  var idx = this.client_list.indexOf(soc);
  if(idx != -1) {
    this.client_list.splice(idx, 1);
  }
}
var match_maker = new MatchMaker();
