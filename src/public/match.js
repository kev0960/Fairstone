function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

var socket = io.connect();

// Hi Server!
socket.emit('send-token', {token : readCookie('hearth-server-token')});

socket.on('token-not-valid', function(data) {
  // return to Home page
});
socket.on('match-found', function(data) {
  $('match-found').text("Match is found!!");
});
$('begin_match').click(function() {
  socket.emit('find-match', {token : readCookie('hearth-server-token')})
})
