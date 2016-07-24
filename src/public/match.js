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
          str += '<button class="list-group-item deck-name">' + deck_list[i].name + ' [' + deck_list[i].job + ']</button>';
        }
        $('#deck-list').html(str);
      }
      else {
        // Not a valid token!!
        // redirect to Home
        $(location).attr('href', '/');
      }
    });

    var selected_deck = 0;

    $('#begin_match').click(function() {
      socket.emit('find-match', {
        token: token,
        deck_id: selected_deck // Index of selected deck
      });
      
      $('#match-found').text('You are added to the Matchmaking queue');
    });
    $('#deck-list').on('click', '.deck-name', function() {
      var index = $(this).prevAll().length;
      selected_deck = index;

      $.ajax({
        url: '/match',
        data: {
          'token': token,
          'deck_id': selected_deck
        },
        type: 'POST'
      }).success(function(data) {
        var d = JSON.parse(data);
        if (d.id) {
          var deck_info = d.selected_deck;
          var str = '';
          for (var i = 0; i < deck_info.cards.length / 2; i++) {
            str += '<button class="list-group-item deck-card">' + deck_info.cards[2 * i] + '<span class="num-card">&times;' + deck_info.cards[2 * i + 1] + '</span></button>'
          }
          $('#deck-cards').html(str);
        }
        else {
          // Not a valid token!!
          // redirect to Home
          $(location).attr('href', '/');
        }
      });

      var all_decks = $('.deck-name');
      for (var i = 0; i < all_decks.length; i++) {
        if(i != selected_deck) {
          $(all_decks[i]).css('background-color', 'transparent');
        } else {
          $(all_decks[i]).css('background-color', 'rgba(222, 194, 97, 0.48)');
        }
      }
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
