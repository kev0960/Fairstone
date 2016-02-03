var token = localStorage.getItem('hearth-server-token');

// If the user does not have access-token then goes back to login page
if(!token) {
  // redirect to Home
  $(location).attr('href', '/');
}
else {
  $(document).ready(function() {
    $.ajax({
      url : '/match',
      data  : {
        'token' : token
      },
      type : 'POST'
    }).success (function (data) {
      var d = JSON.parse(data);
      if(d.id) {
        $('#user_id').text(d.id);
        var deck_list = d.deck_list;
        var str = '';
        for(var i = 0; i < deck_list.length; i ++) {
          str += '<div>' + deck_list[i].name + ' job : ' + deck_list[i].job + '</div>'
        }
        $('#my-deck-list').html(str)
      } else {
        // Not a valid token!!
        // redirect to Home
        $(location).attr('href', '/');
      }
    });
  });
}

var socket = io.connect();

// Hi Server!
socket.emit('send-token', {token : token});

socket.on('token-not-valid', function(data) {
  // return to Home page
});
socket.on('match-found', function(data) {
  $('#match-found').text("Match is found!!");
  console.log('match is found!')
});
$('#begin_match').click(function() {
  socket.emit('find-match', {token : readCookie('hearth-server-token')})
});
$('#my-deck-list').click(function() {
  var index = $('#my-deck-list').index(this);
  $.ajax({
    url : '/match',
    data  : {
      'token' : token,
      'deck_id' : index
    },
    type : 'POST'
  }).success (function (data) {
    var d = JSON.parse(data);
    if(d.id) {
      $('#user_id').text(d.id);
      var deck_info = d.selected_deck;
      var str = '';
      for(var i = 0; i < deck_info.cards.length / 2; i ++) {
        str += '<div>' + deck_info.cards[2 * i];
        var num = parseInt(deck_info.cards[2 * i + 1]);
        if(num > 1) str += ' x ' + num;
        str += '</div>'
      }
      $('#my-deck-card-info').html(str);
    } else {
      // Not a valid token!!
      // redirect to Home
      $(location).attr('href', '/');
    }
  });
})
