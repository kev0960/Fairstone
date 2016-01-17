var app = require('express')()
var http = require('http').Server(app)
var io = require('socket.io')(http)

const hearth_game = require('./engine.js')

app.get('/', function(req, res) {
  res.sendFile('public/index.html', {root : __dirname})
})
http.listen(80, function() {
  console.log('app is listening on port 80')
})
io.on('connection', function(socket) {
  console.log('a user is connected');
})

function MatchMaker() {
  // current list of connected clients
  this.client_list = [];

  
}
