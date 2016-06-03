var token = localStorage.getItem('hearth-server-token');

// If the user does not have access-token then goes back to login page
if (!token) {
  // redirect to Home
  $(location).attr('href', '/');
}
else {
  $(document).ready(function() {
    $.ajax({
      url: '/match',
      data: {
        'token': token
      },
      type: 'POST'
    }).success(function(data) {
      var d = JSON.parse(data);
      if (d.id) {
        var deck_list = d.deck_list;
        var str = '';
        for (var i = 0; i < deck_list.length; i++) {
          str += '<button class="list-group-item deck-name">' + deck_list[i].name + ' job : ' + deck_list[i].job + '</button>'
        }
        $('#deck-list').html(str)
      }
      else {
        // Not a valid token!!
        // redirect to Home
        $(location).attr('href', '/');
      }
    });

    $('#begin_match').click(function() {
      socket.emit('find-match', {
        token: token
      })
    });
    $('#deck-list').on('click', '.deck-name', function() {
      var index = $(this).prevAll().length;

      $.ajax({
        url: '/match',
        data: {
          'token': token,
          'deck_id': index
        },
        type: 'POST'
      }).success(function(data) {
        var d = JSON.parse(data);
        if (d.id) {
          var deck_info = d.selected_deck;
          var str = '';
          for (var i = 0; i < deck_info.cards.length / 2; i++) {
            str += '<button class="list-group-item deck-card">' + deck_info.cards[2 * i] + '&times;' + deck_info.cards[2 * i + 1] + '</button>'
          }
          $('#deck-cards').html(str);
        }
        else {
          // Not a valid token!!
          // redirect to Home
          $(location).attr('href', '/');
        }
      });
    })
  });
}

var socket = io.connect('/match');

// Hi Server!
socket.emit('send-token', {
  token: token
});

socket.on('token-not-valid', function(data) {
  // return to Home page
});
socket.on('match-found', function(data) {
  $('#match-found').text("Match is found!!");
  console.log('match is found!')

  // Save it to the match token
  localStorage.setItem('hearth-match-token', data.token);

  // Redirect the player to the matching room
  $(location).attr('href', '/match/' + data.token.substr(0, 32));
});
