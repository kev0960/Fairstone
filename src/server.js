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

const hearth_game = require('./engine.js')

app.set('view engine', 'jade');
app.set('views', path.join(__dirname, '/views'));

app.use(express.static(__dirname + '/public'));

app.use(body_parser.urlencoded({ extended: false }));
app.use(body_parser.json());
app.use(cookie_parser());

// settings for using flash
app.use(session({cookie : {maxAge : 60000}, secret : hearth_secret}));
app.use(flash());

// Check whether the user has the authentication
// If it has oned, then set requet.decoded
app.use(function(req, res, next) {
  //console.log('cookie :: ' + req.cookies)
  var token = req.body.token || req.query.token || req.headers['x-access-token'] || req.cookies["hearth-server-token"];
  console.log('TOKEN RECEIVED ' + token)
  if(token) {
    jwt.verify(token, hearth_secret, function(err, decoded) {
      console.log('decoded ID : ' + decoded.id)
      if(!err) {
        req.decoded = decoded.id;
      } else {
        req.decoded = '';
      }
      next();
    })
  }
  else { req.decoded = ''; next();}
});

app.get('/', function(req, res) {
  console.log('Decoded :: ' + req.decoded);

  var token = req.flash('signed_token');

  var id = req.decoded;
  console.log('Token :: ' +  token);

  res.render('index.jade', { 'token' : token})
});

app.get('/info', function(req, res) {
  var id = req.decoded;
  if(id) {
    res.render('info.jade', {user_id : id});
  }
  else {
    res.redirect('/');
  }
});

app.post('/login', function(req, res) {
  var id = req.body.user_id;
  var password = req.body.password;

  console.log('post :: id : ' + id + ' / password : ' + password);

  if(user_manager.chk_user(id, password).result) {
    var token = jwt.sign({id : id}, hearth_secret, {expiresInMinutes : 1440});

    req.flash('signed_token', token);
    res.redirect('/')
  } else {
    res.redirect('/')
  }
});

app.get('/match', function (req, res) {
  if(req.decoded) {
    res.render('match.jade', {user_id : req.decoded});
  }
  else res.redirect('/')
});
app.get('/match/:id', function (req, res, next) {

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
  this.user_list = [{id : 'a', password : 'a', mmr : 1000},
                    {id : 'Jaebum', password : 'test', mmr : 1000}];
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
var user_manager = new UserManager();

function MatchMaker() {
  // current list of connected clients
  this.client_list = [];

  // prioritized match queue
  this.match_queue = [];
}
MatchMaker.prototype.add_client = function(user_id, soc) {
  console.log('client Connected! - ' + soc.id);
  for(var i = 0; i < this.client_list; i ++) {
    if(this.client_list[i].id == user_id) {
       this.client_list[i].soc = soc;
       return;
     }
  }
  this.client_list.push({id : user_id, soc : soc});
}
MatchMaker.prototype.delete_client = function(user_id, soc) {
  for(var i = 0; i < this.client_list; i ++) {
    if(this.client_list[i].id == user_id) {
       this.client_list[i].splice(i, 1); return;
     }
  }
}

// If the match is found, then it will broadcast the message
MatchMaker.prototype.find_match = function(user_id) {
  
}
var match_maker = new MatchMaker();
