var express = require('express')
var app = express()
var cookie_parser = require('cookie-parser')
var body_parser = require('body-parser');
var session = require('express-session')
var http = require('http').Server(app)
var io = require('socket.io').listen(http)
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
app.get('/info/:id', function (req, res) {

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

io.of('/match').on('connection', function (socket) {

})
app.post('/match/start-match', function (req, res) {
  var user_id = req.decoded;
  if(user_id) {
    match_maker.find_match(user_id);
  }
})

var server_port = process.env.PORT || 80
http.listen(server_port, function() {
  console.log('app is listening on port ' + server_port)
})

io.on('connection', function(socket) {
  console.log('user is connected!');
  socket.on('send-token', function(data) {
    var token = data.token; console.log('client sent :::' + token);

    // verify the sent token and if it is valid, then add it to the connected client list
    jwt.verify(token, hearth_secret, function(token, socket) { return function(err, decoded) {
      match_maker.add_client(decoded.id, socket);
    } } (token, socket));
  })
  socket.on('disconnect', function(data) {
    match_maker.delete_client(socket)
  });
  socket.on('find-match', function(data) {
    // Start the match finding QUEUE
    jwt.verify(data.token, hearth_secret, function(err, decoded) {
      match_maker.find_match(decoded.id);
    });
  });
});

function UserManager() {
  this.user_list = [{id : 'a', password : 'a', mmr : 1000},
                    {id : 'Jaebum', password : 'test', mmr : 1000}];
}
UserManager.prototype.add_user = function(user_id, password) {
  for(var i = 0; i < this.user_list.length; i ++) {
    if(this.user_list[i].id === user_id) {
      return {result : false, reason : 'Id is already taken'};
    }
  }
  this.user_list.push({id : user_id, password : password});
  return {result : true};
}
UserManager.prototype.chk_user = function(user_id, password) {
  for(var i = 0; i < this.user_list.length; i ++) {
    if(this.user_list[i].id === user_id) {
      if(this.user_list[i].password === password) return {result : true};
      return {result : false, reason : 'password is not matched'};
    }
  }
  return {result : false, reason : 'not registered user'};
}
UserManager.prototype.get_user = function(user_id) {
  for(var i = 0; i < this.user_list.length; i ++) {
    if(this.user_list[i].id === user_id) {
      return this.user_list[i];
    }
  }
  return null;
}
var user_manager = new UserManager();

function MatchMaker() {
  // current list of connected clients
  this.client_list = [];

  // prioritized match queue
  this.match_queue = [];

  // Found matches
  this.found_match = [];
}
MatchMaker.prototype.add_client = function(user_id, soc) {
  console.log('client Connected! - ' + user_id);
  for(var i = 0; i < this.client_list; i ++) {
    if(this.client_list[i].id === user_id) {
       this.client_list[i].soc = soc;
       return;
     }
  }
  this.client_list.push({id : user_id, soc : soc});
}
MatchMaker.prototype.is_connected = function (user_id, soc) {
  for(var i = 0; i < this.client_list; i ++) {
    if(this.client_list[i].id === user_id) {
       if(this.client_list[i].soc !== soc) return false;
       return true;
     }
  }
  return false;
}
MatchMaker.prototype.get_socket = function (user_id) {
  for(var i = 0; i < this.client_list; i ++) {
    if(this.client_list[i].id === user_id) {
       return this.client_list[i].soc;
     }
  }
  return null;
}
MatchMaker.prototype.delete_client = function(soc) {
  for(var i = 0; i < this.client_list; i ++) {
    if(this.client_list[i].soc == soc) {
       this.remove_from_match_queue(this.clint_list[i].id);
       this.client_list[i].splice(i, 1); return;
     }
  }
}
function max(a , b) { return a > b ? a : b; }
function min(a , b) { return a > b ? b : a; }

// If the match is found, then it will broadcast the message
MatchMaker.prototype.find_match = function(user_id) {
  var user = user_manager.get_user(user_id);
  if(user) {
    console.log(user_id + ' is added to QUEUE')
    this.match_queue.push({id : user_id, when : Date.now(), mmr : user.mmr});
  }
}
MatchMaker.prototype.remove_from_match_queue = function (id) {
  for(var i = 0; i < this.match_queue.length; i ++) {
    if(this.match_queue[i].id === id) { this.match_queue.splice(i, 1); return }
  }
  return ;
}
MatchMaker.prototype.match_found = function (user1, user2) {
  console.log('match is found!!')
  this.found_match.push({p1 : user1, p2 : user2});
  var socket1 = this.get_socket(user1);
  var socket2 = this.get_socket(user2);

  if(socket1 && socket2) {

    socket1.emit('match-found', {with : user2});
    socket2.emit('match-found', {with : user1});
  }

}
MatchMaker.prototype.matching_queue = function() {
  var called_time = Date.now();
  console.log('chking.. queue length ', this.match_queue.length);
  for(var i = 0; i < this.match_queue.length; i ++) {
    for(var j = i + 1; j < this.match_queue.length; j ++) {
      if(this.match_queue[i].mmr > this.match_queue[j].mmr) {
        if(this.match_queue[i].mmr - (Date.now() - this.match_queue[i].when) / 1000 < this.match_queue[j].mmr + (Date.now() - this.match_queue[j].when) / 1000) {
          this.match_found(this.match_queue[i].id, this.match_queue[j].id);
          this.match_queue.splice(j , 1);
          this.match_queue.splice(i , 1);
          i -= 2;
          break;
        }
      }
      else {
        if(this.match_queue[j].mmr - (Date.now() - this.match_queue[j].when) / 1000 < this.match_queue[i].mmr + (Date.now() - this.match_queue[i].when) / 1000) {
          this.match_found(this.match_queue[i].id, this.match_queue[j].id);
          this.match_queue.splice(j , 1);
          this.match_queue.splice(i , 1);
          i -= 2;
          break;
        }
      }
    }
  }

  var next_chk = 1000 - (Date.now() - called_time);
  if(next_chk < 0) next_chk  = 0;
  setTimeout(this.matching_queue.bind(this), next_chk);
}
var match_maker = new MatchMaker();
setTimeout(match_maker.matching_queue.bind(match_maker), 1000);
