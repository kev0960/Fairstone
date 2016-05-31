var express = require('express');
var app = express();
var cookie_parser = require('cookie-parser');
var body_parser = require('body-parser');
var session = require('express-session');
var http = require('http').Server(app);
var io = require('socket.io').listen(http);
var jwt = require('jsonwebtoken');
var flash = require('connect-flash');
var crypto = require('crypto');
var r = require('rethinkdb');

const hearth_secret = 'hearth-server-secret';

const hearth_game = require('./engine.js');
const card_db = require('./card_api.js');
const card_manager = require('./card_db/all_cards');

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
      }
      else {
        req.decoded = '';
      }
      next();
    });
  }
  else {
    req.decoded = '';
    next();
  }
});

app.get('/', function(req, res) {
  console.log('Decoded :: ' + req.decoded);

  var token = req.flash('signed_token');

  var id = req.decoded;
  console.log('Token :: ' + token);

  res.sendFile('/public/index.html', {
    root: __dirname
  });
});

app.post('/info', function(req, res) {
  var token = req.body.token;
  jwt.verify(token, hearth_secret, function(err, decoded) {
    if (err) {
      res.send(JSON.stringify({
        id: ''
      }))
    }
    else {
      user_manager.get_user(decoded.id, (user) => {
        res.send(JSON.stringify({
          id: user.id,
          mmr: user.mmr
        }));
      });
    }
  });
})
app.get('/info', function(req, res) {
  res.sendFile('/public/info.html', {
    root: __dirname
  });
});
app.get('/info/:id', function(req, res) {

});

app.post('/auth', function(req, res) {
  var token = req.body.token;
  console.log('token :: ', token);
  jwt.verify(token, hearth_secret, function(err, decoded) {
    if (err) {
      res.send(JSON.stringify({
        id: ''
      }));
    }
    else res.send(JSON.stringify({
      id: decoded.id
    }));
  });
});

app.get('/login', function(req, res) {
  res.sendFile('/public/login.html', {
    root: __dirname
  });
});
app.get('/signup', function(req, res) {
  res.sendFile('/public/signup.html', {
    root: __dirname
  });
});
app.post('/login', function(req, res) {
  var id = req.body.user_id;
  var password = req.body.password;

  user_manager.chk_user(id, password, function(result) {
    var token = '';
    if (result == 1) {
      token = jwt.sign({
        id: id
      }, hearth_secret, {
        expiresIn: '1d'
      });
    }
    res.send(JSON.stringify({
      'token': token,
      'user_id': id
    }));
  });
});
app.post('/signup', function(req, res) {
  var id = req.body.user_id;
  var password = req.body.password;
  var nickname = req.body.nickname;

  user_manager.chk_user(id, password, function(result) {
    if (result == 100) { // user is not registered
      console.log('id :: ', id);

      r.table('user').insert([{
        id: id,
        password: password,
        nickname: nickname,
        mmr: 1000,
        deck_list: []
      }]).run(r_con, function(err, res) {
        console.log("result :: ", res, " error :: ", err);
      });

      res.send(JSON.stringify({
        'result': 'success'
      }));
    }
    else {
      res.send(JSON.stringify({
        'result': 'failed'
      }));
    }
  });
});
app.post('/match', function(req, res) {
  var token = req.body.token;
  var req_deck_id = req.body.deck_id;

  jwt.verify(token, hearth_secret, function(req_deck_id) {
    return function(err, decoded) {
      if (err) {
        res.send(JSON.stringify({
          id: ''
        }));
      }
      else {
        user_manager.get_user(decoded.id, (user) => {
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
          }
          else {
            var deck_names = [];
            for (var i = 0; i < deck_list.length; i++) {
              deck_names.push({
                name: deck_list[i].name,
                job: deck_list[i].job
              });
            }
            console.log('deck names :: ' + JSON.stringify({
              id: user.id,
              deck_list: deck_names
            }));
            res.send(JSON.stringify({
              id: user.id,
              deck_list: deck_names
            }));
          }
        });
      }
    };
  }(req_deck_id));
});
app.get('/deckbuild', function(req, res) {
  res.sendFile('/public/deckbuild.html', {
    root: __dirname
  });
});
app.post('/deckbuild/:job/:id', function(req, res) {
  var job = req.params.job;
  var id = req.params.id;
  var token = req.body.token;


  card_db.init_implemented(card_manager.implemented_card_list());
  jwt.verify(token, hearth_secret, function(job, id) {
    return function(err, decoded) {
      if (err) {
        res.send(JSON.stringify({
          src: ''
        }));
      }
      else {
        var list = card_db.get_implemented_list();
        var num = 0;
        for (var i = 0; i < list.length; i++) {
          if (list[i].job == job.toLowerCase() && !list[i].is_token) {
            if (num == id) {
              console.log('SEND ::', list[i].name);
              res.send(JSON.stringify({
                img_url: list[i].img
              }));
              return;
            }
            num++;
          }
        }
      }
    };
  }(job, id));

});
app.get('/match', function(req, res) {
  res.sendFile('/public/match.html', {
    root: __dirname
  });
});

// 유저가 match room 에 GET 요청을 보내면 그 즉시, 이 위치에 대한
// socket listener 를 등록한다.
app.get('/match/:id', function(req, res) {
  var match_token = req.params.id;

  console.log('MATCH TOKEN :: ' + match_token);

  if (match_maker.is_valid_match(match_token)) {
    io.of('/match/' + match_maker.get_full_token(match_token)).removeAllListeners('connection');

    io.of('/match/' + match_maker.get_full_token(match_token)).on('connection', function(socket) {
      // To prevent adding identical socket event listeners to be added into same player-info event
      // from the user client browser's RELOAD
      socket.removeAllListeners('player-info');

      socket.on('player-info', function(socket, match_maker) {
        return function(data) {
          var m = match_maker.get_match(data.match_token);

          // Possible duplicated connection!
          if (m.p1_join && m.p2_join) return;

          console.log('Get ID :: ', data.user_id);
          if (data.user_id == m.m1.id) {
            m.p1_join = true;
            m.p1_socket = socket;
          }
          else if (data.user_id == m.m2.id) {
            m.p2_join = true;
            m.p2_socket = socket;
          }

          if (m.p1_join && m.p2_join) {
            match_maker.start_match(m);
          }
        };
      }(socket, match_maker));
    });

    res.sendFile('/public/hearth.html', {
      root: __dirname
    });
  }
  else res.redirect('/');
});

var server_port = process.env.PORT || 80;
http.listen(server_port, function() {
  console.log('app is listening on port ' + server_port);
});

io.of('/match').on('connection', function(socket) {
  console.log('user is connected!');
  socket.on('send-token', function(data) {
    var token = data.token;
    console.log('client sent :::' + token);

    // verify the sent token and if it is valid, then add it to the connected client list
    jwt.verify(token, hearth_secret, function(token, socket) {
      return function(err, decoded) {
        if (err) {
          console.log(err);
          return;
        }
        match_maker.add_client(decoded.id, socket);
      };
    }(token, socket));
  });
  socket.on('disconnect', function(data) {
    match_maker.delete_client(socket);
  });
  socket.on('find-match', function(data) {
    console.log('token : ', data.token);
    // Start the match finding QUEUE
    jwt.verify(data.token, hearth_secret, function(err, decoded) {
      if (err) throw err;

      console.log('match queue added');
      match_maker.find_match(decoded.id, 0);
    });
  });
});

var r_con = null;

function UserManager() {
  r.connect({
    host: 'localhost',
    port: 28015
  }, function(err, conn) {
    if (err) throw err;
    r_con = conn;
    r.dbCreate('fairstone').run(r_con, function() {
      r_con.use('fairstone');

      r.tableCreate('user').run(r_con, function() {
        r.table('user').insert([{
          id: "a",
          password: "a",
          nickname: "Jaebum the Legendary Hearthstone Player",
          mmr: 1000,
          deck_list: [{
            name: '법사 덱',
            job: 'mage',
            cards: ['Fireball', 2, 'Kobold Geomancer', 2, 'Bluegill Warrior', 2, 'Mortal Coil', 2, 'Abusive Sergeant', 2, 'Hellfire', 2, 'Tinkmaster Overspark', 2,
              'Murloc Tidehunter', 2, 'Ironfur Grizzly', 2, 'Succubus', 2, 'Sunfury Protector', 2, 'Coldlight Oracle', 2, 'Questing Adventurer', 2
            ]
          }],
          match: []
        }, {
          id: "Jaebum",
          password: "a",
          nickname: "Jaebum the Legendary Hearthstone Player",
          mmr: 1000,
          deck_list: [{
            name: '냥꾼 덱',
            job: 'hunter',
            cards: ['Emperor Thaurissan', 2, 'Elven Archer', 2, 'Murloc Raider', 2, 'Magma Rager', 2, 'Leper Gnome', 2, 'Ysera', 2, 'Big Game Hunter', 2,
              'Raid Leader', 2, 'Shattered Sun Cleric', 2, 'Chillwind Yeti', 2, 'Knife Juggler', 2, 'Alarm-o-Bot', 2, 'Mind Control Tech', 2, 'Doomhammer', 2
            ]
          }],
          match: []
        }], {
          conflict: 'error' // Do not insert if same thing already exists
        }).run(r_con, function(err, result) {
          if (err) throw err;
          console.log(JSON.stringify(result, null, 2));
        });
      });
    });
  });
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
};
UserManager.prototype.chk_user = function(user_id, password, after) {
  r.table('user').get(user_id).run(r_con, function(err, result) {
    if (err) {
      console.log(err);
      return;
    }

    console.log(result);
    if (!result) {
      after(100); // Error code :: user is not registered
      return;
    }

    if (result.password == password) {
      after(1);
    }
    else {
      after(101); // Error code :: user password is not matched
    }
  });
};
UserManager.prototype.get_user = function(user_id, after) {
  r.table('user').get(user_id).run(r_con, function(err, result) {
    if (err) {
      console.log(err);
      return;
    }

    console.log(result);
    if (after) after(result);
  });
};
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
};
MatchMaker.prototype.is_connected = function(user_id, soc) {
  for (var i = 0; i < this.client_list.length; i++) {
    if (this.client_list[i].id === user_id) {
      if (this.client_list[i].soc !== soc) return false;
      return true;
    }
  }
  return false;
};
MatchMaker.prototype.get_socket = function(user_id) {
  for (var i = 0; i < this.client_list.length; i++) {
    if (this.client_list[i].id === user_id) {
      return this.client_list[i].soc;
    }
  }
  return null;
};
MatchMaker.prototype.delete_client = function(soc) {
  for (var i = 0; i < this.client_list.length; i++) {
    if (this.client_list[i].soc == soc) {
      this.remove_from_match_queue(this.client_list[i].id);
      this.client_list.splice(i, 1);
      return;
    }
  }
};

// If the match is found, then it will broadcast the message
MatchMaker.prototype.find_match = function(user_id, choice) {
  function find_match(user) {
    console.log(user.id + ' is added to QUEUE with Deck choice ', choice);
    this.match_queue.push({
      id: user.id,
      when: Date.now(),
      mmr: user.mmr,
      deck: user.deck_list[choice]
    });
  }
  user_manager.get_user(user_id, find_match.bind(this));
};
MatchMaker.prototype.remove_from_match_queue = function(id) {
  for (var i = 0; i < this.match_queue.length; i++) {
    if (this.match_queue[i].id === id) {
      this.match_queue.splice(i, 1);
      return;
    }
  }
  return;
};
MatchMaker.prototype.match_found = function(m1, m2) {
  console.log('match is found!! ' + m1.id + ' vs ' + m2.id);

  var match_token = this.generate_match_token();

  var socket1 = this.get_socket(m1.id);
  var socket2 = this.get_socket(m2.id);

  if (socket1 && socket2) {
    console.log('EMIT');
    socket1.emit('match-found', {
      opponent: m1.id,
      token: match_token
    });
    socket2.emit('match-found', {
      opponent: m2.id,
      token: match_token
    });

    this.found_match.push({
      m1: m1,
      m2: m2,
      match_token: match_token,
      p1_join: false,
      p2_join: false,
      p1_socket: socket1,
      p2_socket: socket2,
      game: null
    });
  }

};

function chk_in_range(first, second) {
  if (first.mmr - (Date.now() - first.when) / 1000 < second.mmr + (Date.now() - second.when) / 1000) return true;
  return false;
}
MatchMaker.prototype.matching_queue = function() {
  var called_time = Date.now();
  //console.log('chking.. queue length ', this.match_queue.length);
  for (var i = 0; i < this.match_queue.length; i++) {
    for (var j = i + 1; j < this.match_queue.length; j++) {
      if (this.match_queue[i].id == this.match_queue[j].id) continue;

      if (this.match_queue[i].mmr > this.match_queue[j].mmr) {
        if (chk_in_range(this.match_queue[i], this.match_queue[j])) {
          this.match_found(this.match_queue[i], this.match_queue[j]);
          this.match_queue.splice(j, 1);
          this.match_queue.splice(i, 1);
          i -= 2;
          break;
        }
      }
      else {
        if (chk_in_range(this.match_queue[j], this.match_queue[i])) {
          this.match_found(this.match_queue[i], this.match_queue[j]);
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
};
MatchMaker.prototype.generate_match_token = function() {
  return crypto.randomBytes(64).toString('hex');
};

// TODO
MatchMaker.prototype.is_valid_match = function(match_token) {
  // match_id is the first 32 characters of match-token
  for (var i = 0; i < this.found_match.length; i++) {
    if (match_token == this.found_match[i].match_token.substr(0, 32)) {
      return true;
    }
  }
  return false;
};
MatchMaker.prototype.get_full_token = function(match_token) {
  // match_id is the first 32 characters of match-token
  for (var i = 0; i < this.found_match.length; i++) {
    if (match_token == this.found_match[i].match_token.substr(0, 32)) {
      return this.found_match[i].match_token;
    }
  }
  return -1;
};
// m :: name of the match
MatchMaker.prototype.start_match = function(m) {
  console.log('match started!!');
  m.game = hearth_game.start_match(m.p1_socket, m.p2_socket, {
    id: m.m1.id,
    deck: m.m1.deck,
    mmr: m.m1.mmr
  }, {
    id: m.m2.id,
    deck: m.m2.deck,
    mmr: m.m2.mmr
  }, this.after_match);
};
MatchMaker.prototype.after_match = function(result, p1, p2) {
  var p1_result, p2_result;
  console.log('GAME IS OVER :: ', result)
  if (result == 0) {
    p1_result = 'win';
    p2_result = 'lose';
  }
  else if (result == 1) {
    p1_result = 'lose';
    p2_result = 'win';
  }
  else if (result == 2) {
    p1_result = 'draw';
    p2_result = 'draw';
  }

  r.table('user').get(p1.id).update({
    match: r.row('match').append({
      my_job: p1.deck.job,
      enemy_job: p2.deck.job,
      my_deck: p1.deck,
      enemy_deck: p2.deck,
      my_mmr: p1.mmr,
      enemy_mmr: p2.mmr,
      enemy_id: p2.id,
      result: p1_result
    })
  }).run(r_con, function(err, result) {
    console.log(result);
  });

  r.table('user').get(p2.id).update({
    match: r.row('match').append({
      my_job: p2.deck.job,
      enemy_job: p1.deck.job,
      my_deck: p2.deck,
      enemy_deck: p1.deck,
      my_mmr: p2.mmr,
      enemy_mmr: p1.mmr,
      enemy_id: p1.id,
      result: p2_result
    })
  }).run(r_con, function(err, result) {
    console.log(result);
  });
}
MatchMaker.prototype.get_match = function(match_token) {
  for (var i = 0; i < this.found_match.length; i++) {
    if (this.found_match[i].match_token == match_token) return this.found_match[i];
  }
  return null;
};

// Keep searching for the available game!
var match_maker = new MatchMaker();
setTimeout(match_maker.matching_queue.bind(match_maker), 1000);


/*

For Debugging

*/

var hearth_api = require('./card_api');
var stdin = process.openStdin();
stdin.addListener('data', function(d) {
  var input = d.toString().trim();

  var args = input.split(' ');
  if (args[0] == 'db') hearth_api.get_db();
});
