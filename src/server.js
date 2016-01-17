var express = require('express')
var app = express()
var cookie_parser = require('cookie-parser')
var body_parser = require('body-parser')
var http = require('http').Server(app)
var io = require('socket.io')(http)
var uuid = require('node-uuid');

const hearth_game = require('./engine.js')

app.use(body_parser.urlencoded({ extended: false }));
app.use(body_parser.json());
app.use(cookie_parser());

app.get('/', function(req, res) {
  res.sendFile('public/index.html', {root : __dirname})
})
app.get('/match', function(req, res) {
  var data = req.cookies.hearth_auth;
  if(data && user_manager.chk_user_session(data.user_id, data.session_key)) {
    res.send('match!')
  }
  res.send('fail')
})
app.post('/login', function(req, res) {
  var user_id = req.body.user_id;
  var password = req.body.password;

  if(user_id == 'kev0960' && password == 'kev0960') {
    res.cookie('hearth_auth', {session_key : user_manager.set_user_session(user_id), user_id : user_id})
    res.redirect('/match');
  }

})
http.listen(80, function() {
  console.log('app is listening on port 80')
})
io.on('connection', function(socket) {
  match_maker.add_client(socket);
  socket.on('disconnect', function() {
    match_maker.delete_client(socket)
  });

})

function UserManager() {
  this.user_list = [{name : 'kev0960'}];
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
