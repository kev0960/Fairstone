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
var flash = require('connect-flash');
var crypto = require('crypto');

const hearth_secret = 'hearth-server-secret';

const hearth_game = require('./engine.js')

app.use(express.static(__dirname + '/public'));

app.use(body_parser.urlencoded({
  extended: false
}));
app.use(body_parser.json());
app.use(cookie_parser());

// settings for using flash
app.use(session({
  cookie: {
    maxAge: 60000
  },
  secret: hearth_secret
}));
app.use(flash());

// Check whether the user has the authentication
// If it has oned, then set requet.decoded
app.use(function(req, res, next) {
  //console.log('cookie :: ' + req.cookies)
  var token = req.body.token || req.query.token || req.headers['x-access-token'] || req.cookies["hearth-server-token"];
  if (token) {
    jwt.verify(token, hearth_secret, function(err, decoded) {
      if (!err) {
        req.decoded = decoded.id;
      } else {
        req.decoded = '';
      }
      next();
    })
  } else {
    req.decoded = '';
    next();
  }
});

app.get('/', function(req, res) {
  console.log('Decoded :: ' + req.decoded);

  var token = req.flash('signed_token');

  var id = req.decoded;
  console.log('Token :: ' + token);

  res.sendFile('/public/index.html', { root: __dirname });
});

app.post('/info', function(req, res) {
  var token = req.body.token;
  jwt.verify(token, hearth_secret, function(err, decoded) {
    if (err) {
      res.send(JSON.stringify({
        id: ''
      }))
    } else {
      var user = user_manager.get_user(decoded.id);
      res.send(JSON.stringify({
        id: user.id,
        mmr: user.mmr
      }))
    }
  });
})
app.get('/info', function(req, res) {
  res.sendFile('/public/info.html', { root: __dirname });
});
app.get('/info/:id', function(req, res) {

});

app.post('/auth', function(req, res) {
  var token = req.body.token;
  console.log('token :: ', token)
  jwt.verify(token, hearth_secret, function(err, decoded) {
    if (err) {
      res.send(JSON.stringify({
        id: ''
      }))
    } else res.send(JSON.stringify({
      id: decoded.id
    }))
  });
})

app.get('/login', function(req, res) {
  res.sendFile('/public/login.html', { root: __dirname });
})
app.post('/login', function(req, res) {
  var id = req.body.user_id;
  var password = req.body.password;

  var token = '';
  if (user_manager.chk_user(id, password).result) {
    token = jwt.sign({
      id: id
    }, hearth_secret, {
      expiresInMinutes: 1440
    });
  }
  res.send(JSON.stringify({
    'token': token,
    'user_id' : id
  }));
});

app.post('/match', function(req, res) {
  var token = req.body.token;
  var req_deck_id = req.body.deck_id;

  jwt.verify(token, hearth_secret, function(req_deck_id) {
    return function(err, decoded) {
      if (err) {
        res.send(JSON.stringify({
          id: ''
        }))
      } else {
        var user = user_manager.get_user(decoded.id);
        var deck_list = user.deck_list;
        if (req_deck_id) {
          var selected;
          if (req_deck_id >= 0 && req_deck_id < deck_list.length) {
            selected = deck_list[req_deck_id];
          }
          res.send(JSON.stringify({
            id: user.id,
            selected_deck: selected
          }));
        } else {
          var deck_names = []
          for (var i = 0; i < deck_list.length; i++) {
            deck_names.push({
              name: deck_list[i].name,
              job: deck_list[i].job
            })
          }
          console.log('deck names :: ' + JSON.stringify({
            id: user.id,
            deck_list: deck_names
          }))
          res.send(JSON.stringify({
            id: user.id,
            deck_list: deck_names
          }))
        }
      }
    };
  }(req_deck_id));
})
app.get('/match', function(req, res) {
  res.sendFile('/public/match.html', { root: __dirname });
});

// 유저가 match room 에 GET 요청을 보내면 그 즉시, 이 위치에 대한
// socket listener 를 등록한다.
app.get('/match/:id', function(req, res) {
  var match_token = req.params.id;

  console.log('MATCH TOKEN :: ' + match_token);

  if (match_maker.is_valid_match(match_token)) {
    io.of('/match/' + match_maker.get_full_token(match_token)).on('connection', function(socket) {

      socket.on('player-info', function(socket, match_maker) {
        return function(data) {
          var m = match_maker.get_match(data.match_token);

          // Possible duplicated connection!
          if(m.p1_join && m.p2_join) return;

          if (data.user_id == m.p1) {
            m.p1_join = true;
            m.p1_socket = socket;
          } else if (data.user_id == m.p2) {
            m.p2_join = true;
            m.p2_socket = socket;
          }

          if(m.p1_join && m.p2_join) {
              match_maker.start_match(m);
          }
        };
      }(socket, match_maker));
    });

    res.sendFile('/public/hearth.html', { root: __dirname });
  } else res.redirect('/')
});

app.post('/match/start-match', function(req, res) {
  var user_id = req.decoded;
  if (user_id) {
    match_maker.find_match(user_id);
  }
})

var server_port = process.env.PORT || 80
http.listen(server_port, function() {
  console.log('app is listening on port ' + server_port)
})

io.of('/match').on('connection', function(socket) {
  console.log('user is connected!');
  socket.on('send-token', function(data) {
    var token = data.token;
    console.log('client sent :::' + token);

    // verify the sent token and if it is valid, then add it to the connected client list
    jwt.verify(token, hearth_secret, function(token, socket) {
      return function(err, decoded) {
        match_maker.add_client(decoded.id, socket);
      }
    }(token, socket));
  })
  socket.on('disconnect', function(data) {
    match_maker.delete_client(socket)
  });
  socket.on('find-match', function(data) {
    console.log('token : ', data.token)
      // Start the match finding QUEUE
    jwt.verify(data.token, hearth_secret, function(err, decoded) {
      console.log('match queue added')
      match_maker.find_match(decoded.id);
    });
  });
});

function UserManager() {
  this.user_list = [{
    id: 'a',
    password: 'a',
    mmr: 1000,
    deck_list: [{
      name: '법사 덱',
      job: 'mage',
      cards: ['Fireball', 2, 'War Golem', 2, 'Magma Rager', 2, 'Murloc Raider', 2]
    }]
  }, {
    id: 'Jaebum',
    password: 'test',
    mmr: 1000,
    deck_list: [{
      name: '전사 덱',
      job: 'warrior',
      cards: ['Emperor Thaurissan', 2, 'War Golem', 2, 'Murloc Raider', 2, 'Magma Rager', 2]
    }]
  }];
}
UserManager.prototype.add_user = function(user_id, password) {
  for (var i = 0; i < this.user_list.length; i++) {
    if (this.user_list[i].id === user_id) {
      return {
        result: false,
        reason: 'Id is already taken'
      };
    }
  }
  this.user_list.push({
    id: user_id,
    password: password
  });
  return {
    result: true
  };
}
UserManager.prototype.chk_user = function(user_id, password) {
  for (var i = 0; i < this.user_list.length; i++) {
    if (this.user_list[i].id === user_id) {
      if (this.user_list[i].password === password) return {
        result: true
      };
      return {
        result: false,
        reason: 'password is not matched'
      };
    }
  }
  return {
    result: false,
    reason: 'not registered user'
  };
}
UserManager.prototype.get_user = function(user_id) {
  for (var i = 0; i < this.user_list.length; i++) {
    if (this.user_list[i].id === user_id) {
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
  for (var i = 0; i < this.client_list.length; i++) {
    if (this.client_list[i].id === user_id) {
      this.client_list[i].soc = soc;
      return;
    }
  }
  this.client_list.push({
    id: user_id,
    soc: soc
  });
}
MatchMaker.prototype.is_connected = function(user_id, soc) {
  for (var i = 0; i < this.client_list.length; i++) {
    if (this.client_list[i].id === user_id) {
      if (this.client_list[i].soc !== soc) return false;
      return true;
    }
  }
  return false;
}
MatchMaker.prototype.get_socket = function(user_id) {
  for (var i = 0; i < this.client_list.length; i++) {
    if (this.client_list[i].id === user_id) {
      return this.client_list[i].soc;
    }
  }
  return null;
}
MatchMaker.prototype.delete_client = function(soc) {
  for (var i = 0; i < this.client_list.length; i++) {
    if (this.client_list[i].soc == soc) {
      this.remove_from_match_queue(this.client_list[i].id);
      this.client_list.splice(i, 1);
      return;
    }
  }
}

function max(a, b) {
  return a > b ? a : b;
}

function min(a, b) {
  return a > b ? b : a;
}

// If the match is found, then it will broadcast the message
MatchMaker.prototype.find_match = function(user_id) {
  var user = user_manager.get_user(user_id);
  if (user) {
    console.log(user_id + ' is added to QUEUE')
    this.match_queue.push({
      id: user_id,
      when: Date.now(),
      mmr: user.mmr,
      deck: user.deck
    });
  }
}
MatchMaker.prototype.remove_from_match_queue = function(id) {
  for (var i = 0; i < this.match_queue.length; i++) {
    if (this.match_queue[i].id === id) {
      this.match_queue.splice(i, 1);
      return
    }
  }
  return;
}
MatchMaker.prototype.match_found = function(user1, user2) {
  console.log('match is found!! ' + user1 + ' vs ' + user2);

  var match_token = this.generate_match_token();

  var socket1 = this.get_socket(user1);
  var socket2 = this.get_socket(user2);

  if (socket1 && socket2) {
    console.log('EMIT');
    socket1.emit('match-found', {
      opponent: user2,
      token: match_token
    });
    socket2.emit('match-found', {
      opponent: user1,
      token: match_token
    });

    this.found_match.push({
      p1: user1,
      p2: user2,
      match_token: match_token,
      p1_join: false,
      p2_join: false,
      p1_socket: socket1,
      p2_socket: socket2,
      game: null
    });
  }

}

function chk_in_range(first, second) {
  if (first.mmr - (Date.now() - first.when) / 1000 < second.mmr + (Date.now() - second.when) / 1000) return true;
  return false;
}
MatchMaker.prototype.matching_queue = function() {
  var called_time = Date.now();
  //console.log('chking.. queue length ', this.match_queue.length);
  for (var i = 0; i < this.match_queue.length; i++) {
    for (var j = i + 1; j < this.match_queue.length; j++) {
      if (this.match_queue[i].mmr > this.match_queue[j].mmr) {
        if (chk_in_range(this.match_queue[i], this.match_queue[j])) {
          this.match_found(this.match_queue[i].id, this.match_queue[j].id);
          this.match_queue.splice(j, 1);
          this.match_queue.splice(i, 1);
          i -= 2;
          break;
        }
      } else {
        if (chk_in_range(this.match_queue[j], this.match_queue[i])) {
          this.match_found(this.match_queue[i].id, this.match_queue[j].id);
          this.match_queue.splice(j, 1);
          this.match_queue.splice(i, 1);
          i -= 2;
          break;
        }
      }
    }
  }

  var next_chk = 1000 - (Date.now() - called_time);
  if (next_chk < 0) next_chk = 0;
  setTimeout(this.matching_queue.bind(this), next_chk);
}
MatchMaker.prototype.generate_match_token = function() {
  return crypto.randomBytes(64).toString('hex');
}
MatchMaker.prototype.begin_match = function(match_id) {
    hearth_game.start_match()
  }
  // TODO
MatchMaker.prototype.is_valid_match = function(match_token) {
  // match_id is the first 32 characters of match-token
  for (var i = 0; i < this.found_match.length; i++) {
    if (match_token == this.found_match[i].match_token.substr(0, 32)) {
      return true;
    }
  }
  return false;
}
MatchMaker.prototype.get_full_token = function(match_token) {
  // match_id is the first 32 characters of match-token
  for (var i = 0; i < this.found_match.length; i++) {
    if (match_token == this.found_match[i].match_token.substr(0, 32)) {
      return this.found_match[i].match_token;
    }
  }
  return -1
}
// m :: name of the match
MatchMaker.prototype.start_match = function(m) {
  m.game = hearth_game.start_match(m.p1_socket, m.p2_socket, user_manager.get_user(m.p1), user_manager.get_user(m.p2));
}
MatchMaker.prototype.get_match = function(match_token) {
  for (var i = 0; i < this.found_match.length; i++) {
    if (this.found_match[i].match_token == match_token) return this.found_match[i];
  }
  return null;
}

// Keep searching for the available game!
var match_maker = new MatchMaker();
setTimeout(match_maker.matching_queue.bind(match_maker), 1000);
