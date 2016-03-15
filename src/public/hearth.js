// Whenever the size of the screen changes we have to make sure
// that the canvas fills the entire screen
$(window).on('resize', function() {
  $('#world').width($(window).width())
  $('#world').height($(window).width())
})

function Card(id) {
  this.id = id
  this.card_draw = null;
  this.card_type = '';

  this.default_hp = 0;
  this.default_dmg = 0;
  this.default_mana = 0;

  this.hp = 0;
  this.dmg = 0;
  this.mana = 0;
}

var token = localStorage.getItem('hearth-server-token')

function CardContainer(o) {
  this.card_list = [];
  this.selected_card = null;
  this.o = o; // card-container element

  this.x = o.position().left;
  this.y = o.position().top;
}
CardContainer.prototype.add_card = function(card) {
  this.card_list.push(card);

  var card_id = 'card' + card.id;
  this.o.append("<div class='card' id='" + card_id + "'></div>");

  card.card_draw = new CardDraw(document.getElementById(card_id), {
    sensibility: 6, //sensibility to the mouse velocity
    rotateLimit: 60, //card rotate limite
    speed: 6, //card rotation speed
    scaling: true
  }, this.x, this.y, this.on_selection.bind(this), this.on_selection_end.bind(this));
  $('#' + card_id).mouseover(this.on_hover).mouseleave(this.position_cards.bind(this));

  this.position_cards();
}
CardContainer.prototype.make_card_first = function(c) {
  this.o.append(c); // make c to be first div element
}
CardContainer.prototype.on_hover = function() {
  $(this).css({
    '-webkit-transform': 'rotate(' + 0 + 'deg)',
    '-moz-transform': 'rotate(' + 0 + 'deg)',
    '-ms-transform': 'rotate(' + 0 + 'deg)',
    'transform': 'rotate(' + 0 + 'deg)'
  });
  $(this).css('transform', 'scale(1.5)')
  my_hand.make_card_first($(this))
}
CardContainer.prototype.on_selection = function(selected) {
  this.selected_card = selected;

  return true;
}
CardContainer.prototype.on_selection_end = function(selected) {
  // if card is dropped on my field
  if (-250 < this.selected_card.offsetTop && this.selected_card.offsetTop < -400) {
    hearth_client.play_card($(this.selected_card.id));
  }

  // When things are good
  // TODO do something

  // When things goes wrong
  // card goes back to the hand
  this.position_cards();
}
CardContainer.prototype.position_cards = function() {
  // Set rotation
  var loc_center = $(window).width() / 2 - this.x;
  for (var i = 0; i < this.card_list.length; i++) {
    var card_id = '#card' + this.card_list[i].id;
    var deg = -30 + (60 / (this.card_list.length)) * i;

    var loc_x = loc_center - (this.card_list.length / 2) * 100 + i * 100;
    $(card_id).css({
      '-webkit-transform': 'rotate(' + deg + 'deg)',
      '-moz-transform': 'rotate(' + deg + 'deg)',
      '-ms-transform': 'rotate(' + deg + 'deg)',
      'transform': 'rotate(' + deg + 'deg)'
    })
    $(card_id).css('left', loc_x)
    $(card_id).css('top', 0)

    this.card_list[i].card_draw.mouse.x = this.x + loc_x;
    this.card_list[i].card_draw.mouse.y = this.y;
    this.o.append($(card_id))
  }
}
var my_hand = new CardContainer($('#player-card-container'))
var enemy_hand = new CardContainer($('#enemy-card-container'))

var init = (function() {
  my_hand.add_card(new Card(1));
  my_hand.add_card(new Card(2));
  my_hand.add_card(new Card(3));
  my_hand.add_card(new Card(4));
  my_hand.add_card(new Card(5));
  my_hand.add_card(new Card(6));
});

window.onload = init;

function HearthClient() {
  this.match_token = localStorage.getItem('hearth-match-token');
  this.user_id = localStorage.getItem('hearth-user-id');

  // Create a connection between client and match server (tell them that I JOINED!!)
  this.socket = io.connect('/match/' + this.match_token);

  // Send my Inforamation through socket
  // 나중에 생성된 webtoken 을 보내서 인증받는 방식으로 바꿔야함
  this.socket.emit('player-info', {
    match_token: this.match_token,
    user_id: this.user_id
  });

  console.log('[Match] Received player info ', this.user_id);

  this.success = null;
  this.fail = null;

  // Receiving hearht-event
  this.socket.on('hearth-event', function(data) {
    console.log('Received' + data + ' Event!');
    if (data.event_type == 'play_card') {

    }
    if (data.event_type == 'summon') {}
  });

  this.socket.on('choose-starting-cards', function(h) {
    return function(data) {
      var card_list = data.cards;
      for (var i = 0; i < card_list.length; i++) {
        console.log(card_list[i]);
      }
      h.choose_remove_card(card_list);
    }
  }(this));

  this.socket.on('new-starting-cards', function(h) {
    return function(data) {
      var card_list = data.cards;
      var j = 0;
      
      console.log('new starting cards :: ', card_list);
      for (var i = 0; i < h.choose_card_list.length; i++) {
        if (h.choose_card_list[i].selected) {
          h.choose_card_list[i] = card_list[j++];
        }
      }
      h.show_card_list(h.choose_card_list);
    };
  }(this));

  this.socket.on('begin-match', function(h) {
    h.world_ctx.clearRect(0, 0, h.world_canvas.width, h.world_canvas.height);
  }(this));
  
  this.world_canvas = document.getElementById('world');
  this.world_ctx = document.getElementById('world').getContext('2d');
  this.world_ctx.canvas.width = window.innerWidth;
  this.world_ctx.canvas.height = window.innerHeight;

  this.choose_card_list = [];
}
HearthClient.prototype.init = function() {}
HearthClient.prototype.play_card = function(card_selector, success) {
  var card_id = card_selector.selector;
  var id = parseInt(card_id.substr(4));

  this.socket.emit('hearth-user-play-card', {
    token: token,
    card_id: id
  });
}

HearthClient.prototype.show_card_list = function(card_list) {
    for (var i = 0; i < card_list.length; i++) {
      hearth_client.get_card_image(card_list[i].name, function(img_pos, h, i) {
        return function f(img_addr) {
          var img = new Image();
          img.src = img_addr;
          img.onload = function() {
            h.world_ctx.drawImage(img, img_pos.x, img_pos.y);

            h.choose_card_list[i].img = img;
            h.choose_card_list[i].x = img_pos.x;
            h.choose_card_list[i].y = img_pos.y;
            h.choose_card_list[i].w = img.width;
            h.choose_card_list[i].h = img.height;
          }
        };
      }({
        x: i * 300 + 400,
        y: 200
      }, this, i));
    }
  }
  // card_list is an array of card names
HearthClient.prototype.choose_remove_card = function(card_list) {
  this.choose_card_list = card_list;
  this.show_card_list(card_list);

  var btn_x = 800,
    btn_y = 650;

  // Adding button 
  hearth_client.fillStyle = 'yellow';
  hearth_client.world_ctx.fillRect(btn_x, btn_y, 200, 50);

  hearth_client.fillStyle = 'black';
  hearth_client.world_ctx.fillText("Done!", btn_x + 50, btn_y);

  // Enable clicking the 'world' canvas 
  $('#world').css('pointer-events', 'auto');
  $('#battlefield').css('pointer-events', 'none');

  document.getElementById('world').onclick = function(e) {
    hearth_client.world_ctx.fillStyle = 'red';
    hearth_client.world_ctx.fillRect(e.offsetX, e.offsetY, 10, 10);

    for (var i = 0; i < card_list.length; i++) {
      if (e.offsetX >= card_list[i].x && e.offsetX <= card_list[i].x + card_list[i].w) {
        if (e.offsetY >= card_list[i].y && e.offsetY <= card_list[i].y + card_list[i].h) {
          if (!card_list[i].selected) {
            card_list[i].selected = true;

            hearth_client.world_ctx.strokeStyle = 'red';
            hearth_client.world_ctx.beginPath();
            hearth_client.world_ctx.moveTo(card_list[i].x + 60, card_list[i].y + 100);
            hearth_client.world_ctx.lineTo(card_list[i].x + card_list[i].w - 50, card_list[i].y + card_list[i].h - 50);

            hearth_client.world_ctx.moveTo(card_list[i].x + 60, card_list[i].y + +card_list[i].h - 50);
            hearth_client.world_ctx.lineTo(card_list[i].x + card_list[i].w - 50, card_list[i].y + 100);
            hearth_client.world_ctx.stroke();
          }
          else {
            hearth_client.world_ctx.drawImage(card_list[i].img, card_list[i].x, card_list[i].y);
            card_list[i].selected = false;
          }
        }
      }
    }

    if (e.offsetX >= btn_x && e.offsetX <= btn_x + 200) {
      if (e.offsetY >= btn_y && e.offsetY <= btn_y + 50) {
        console.log('Selection Done!!');
        var removed_ones = [];
        for (var i = 0; i < card_list.length; i++) {
          if (card_list[i].selected) removed_ones.push(i);
        }

        hearth_client.socket.emit('remove-some-cards', {
          removed: removed_ones
        });

        // Clear canvas!
        hearth_client.world_ctx.clearRect(0, 0, hearth_client.world_canvas.width, hearth_client.world_canvas.height);
        for (var i = 0; i < card_list.length; i++) {
          if (!card_list[i].selected) hearth_client.world_ctx.drawImage(card_list[i].img, card_list[i].x, card_list[i].y)
        }

        $('#world').css('pointer-events', 'none');
        $('#battlefield').css('pointer-events', 'auto');
      }
    }
  }
}

// Get card image (Card name must be english)
HearthClient.prototype.get_card_image = function(card_name, f) {
  $.ajax({
    type: "GET",
    headers: {
      'X-Mashape-Key': 'nPCuh0xMwxmshf9ZGfRS2p3lF7Jip1pJbjYjsn67kOlM4TTr7j'
    },
    url: "https://omgvamp-hearthstone-v1.p.mashape.com/cards/search/" + window.encodeURI(card_name),
    success: function(response) {
      f(response[0].img)
    }
  });
}
var hearth_client = new HearthClient();
