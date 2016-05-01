// Whenever the size of the screen changes we have to make sure
// that the canvas fills the entire screen
$(window).on('resize', function() {
  $('#world').width($(window).width())
  $('#world').height($(window).width())
})

function Card(id, unique) {
  this.id = id
  this.unique = unique;

  this.card_draw = null;
  this.card_type = '';

  this.default_hp = 0;
  this.default_dmg = 0;
  this.default_mana = 0;

  this.life = 0;
  this.dmg = 0;
  this.mana = 0;
  this.name = '';
  this.type = '';
  this.img_path = ''; // Path to the img file

  // Card position on the canvas field
  this.x = 0;
  this.y = 0;
}

var token = localStorage.getItem('hearth-server-token');

function CardContainer(o) {
  this.card_list = [];
  this.selected_card = null;
  this.o = o; // card-container element

  this.x = o.position().left;
  this.y = o.position().top;
}
CardContainer.prototype.add_card = function(card, img_addr) {
  this.card_list.push(card);

  var card_id = 'card' + card.id;

  this.o.append("<div class='card' id='" + card_id + "'></div>");
  $('#' + card_id).css('background-image', 'url(' + img_addr + ')');

  card.card_draw = new CardDraw(document.getElementById(card_id), {
    sensibility: 6, //sensibility to the mouse velocity
    rotateLimit: 60, //card rotate limite
    speed: 6, //card rotation speed
    scaling: true
  }, this.x, this.y, this.on_selection.bind(this), this.on_selection_end.bind(this));
  $('#' + card_id).mouseover(this.on_hover).mouseleave(this.position_cards.bind(this));

  this.position_cards();
}
CardContainer.prototype.set_card_img = function(card, img_addr) {
  for (var i = 0; i < this.card_list.length; i++) {
    if (this.card_list[i] == card) {
      var card_id = 'card' + card.id;
      $('#' + card_id).css('background-image', 'url(' + img_addr + ')');
      return;
    }
  }
  return;
}
CardContainer.prototype.make_card_first = function(c) {
  this.o.append(c); // make c to be first img element
}

// 여기서 this 는 hover 된 img element 를 가리킨다.
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
  console.log('Offset :: ', this.selected_card.offsetTop, ' and ', this.selected_card.offsetLeft + this.selected_card.parentElement.offsetLeft)

  hearth_client.field_ctx.strokeStyle = 'white';
  hearth_client.field_ctx.clearRect(0, 0, 1000, 50);
  // hearth_client.field_ctx.strokeText('Offset :: ' + this.selected_card.offsetTop +' and ' + this.selected_card.offsetLeft, 0, 50);

  if (-200 > this.selected_card.offsetTop && this.selected_card.offsetTop > -600) {
    hearth_client.play_card(this.selected_card.id, hearth_client.where_to_put(this.selected_card.offsetLeft + this.selected_card.parentElement.offsetLeft));
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

      var loc_x = loc_center - Math.floor(this.card_list.length / 2) * 100 + i * 100;
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
  // Remove a particular card
CardContainer.prototype.remove_card_at = function(at) {
  var id = this.card_list[at].id;
  $('#card' + id).remove();

  this.card_list.splice(at, 1);
}
var my_hand = new CardContainer($('#player-card-container'))
var enemy_hand = new CardContainer($('#enemy-card-container'))

var init = (function() {});

window.onload = init;

function HearthImageDB() {
  this.img_list = []; // { unique, img }
}

HearthImageDB.prototype.get_image = function(c, on_load, on_done) {
  for (var j = 0; j < this.img_list.length; j++) {
    if (this.img_list[j].unique == c.unique) {
      on_load(this.img_list[j].img);
      if (on_done) on_done();
      return;
    }
  }

  var img = new Image();
  img.src = c.img_path;
  console.log('Image Path :: ', c.img_path)

  img.onload = function() {
    hearth_img_db.add_image(c.unique, img);
    on_load(img);

    if (on_done) on_done();
  };
};
HearthImageDB.prototype.async_get_image = function(c) {
  for (var j = 0; j < this.img_list.length; j++) {
    if (this.img_list[j].unique == c.unique) {
      return this.img_list[j].img;
    }
  }
  throw Error('[async-get_image] ', c.name, ' does not exist');
};
HearthImageDB.prototype.add_image = function(unique, img) {
  this.img_list.push({
    unique: unique,
    img: img
  });
  console.log(unique, ' image is added');
};
HearthImageDB.prototype.has_image = function(unique) {
  for (var j = 0; j < this.img_list.length; j++) {
    if (this.img_list[j].unique == unique) {
      return true;
    }
  }
  return false;
};
var hearth_img_db = new HearthImageDB();

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

  this.enemy_num_card = 0;

  this.my_field = [];
  this.enemy_field = [];

  this.my_hero = null;
  this.enemy_hero = null;

  this.current_mana = 1;
  this.total_mana = 1;

  // Receiving hearth-event
  this.socket.on('hearth-event', function(h) {
    return function(data) {
      if (data.event) {
        console.log('Received', data.event, ' Event!');
        if (data.event_type == 'play_card') {

        }
        if (data.event_type == 'summon') {

        }
      }

      // 핸드에 카드를 받게 되면 계속해서 DOM Element 를 새로 생성하게 된다.
      var recv_my_hand = [];
      var recv_my_field = [];
      var recv_enemy_field = [];

      for (var i = 0; i < data.card_info.length; i++) {
        if (data.card_info[i].owner == 'me' && data.card_info[i].where == 'hand') {
          recv_my_hand.push(data.card_info[i]);
        }
        else if (data.card_info[i].owner == 'me' && data.card_info[i].where == 'field') {
          recv_my_field.push(data.card_info[i]);
        }
        else if (data.card_info[i].owner == 'enemy' && data.card_info[i].where == 'field') {
          recv_enemy_field.push(data.card_info[i]);
        }
      }

      console.log('[Received hand]', recv_my_hand);
      console.log('[Received field]', recv_my_field);
      console.log('[Received enemy field]', recv_enemy_field);

      var my_hand_len = recv_my_hand.length;
      my_hand.card_list = [];
      h.my_field = [];
      h.enemy_field = [];

      // Remove entire cards
      $('#player-card-container').empty();

      function change_to_recv_data(src, dest) {
        for (var i = 0; i < src.length; i++) {
          var card = new Card(src[i].id, src[i].unique);

          card.type = src[i].type;
          card.life = src[i].life;
          card.mana = src[i].mana;
          card.dmg = src[i].dmg;
          card.name = src[i].name;
          card.img_path = src[i].img_path

          if (!dest.add_card) dest.push(card);
          else {
            dest.add_card(card, '');
            dest.set_card_img(card, card.img_path);
          }
        }
      }

      change_to_recv_data(recv_my_hand, my_hand);
      change_to_recv_data(recv_my_field, h.my_field);
      change_to_recv_data(recv_enemy_field, h.enemy_field);

      h.my_hero = data.me;
      h.enemy_hero = data.enemy;

      h.draw_field();
      if (data.event) h.log(data.event.event_type)
    };
  }(this));

  this.socket.on('hearth-play-card', function(h) {
    return function(data) {
      if (data.result) {
        var card_id = data.id;
        for (var i = 0; i < my_hand.card_list.length; i++) {
          if (my_hand.card_list[i].id == card_id) {
            var c = my_hand.card_list[i];
            my_hand.remove_card_at(i);

            if (c.type == 'minion') {
              // Insert card to the field
              h.my_field.splice(data.at, 0, c);
            }

            // Deduct the cost
            h.current_mana -= data.cost;

            // Now redraw the field
            h.draw_field();
          }
        }
      }
      else {
        console.log('Failed on playing card#', data.id);
      }
    }
  }(this));
  this.socket.on('choose-starting-cards', function(h) {
    return function(data) {
      var card_list = data.cards;
      for (var i = 0; i < card_list.length; i++) {
        console.log(card_list[i]);
      }
      h.choose_remove_card(card_list);
    };
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
      var done = h.choose_card_list.length;
      h.show_card_list_done(h.choose_card_list, function() {
        done--;
        if (done == 0) {
          if (this.did_game_begin) {
            h.world_ctx.clearRect(0, 0, h.world_canvas.width, h.world_canvas.height);
          }
        }
      });

      h.show_card_list(h.choose_card_list);
    };
  }(this));

  this.socket.on('choose-one', function(h) {
    return function(data) {
      var card_list = data.list;
      h.choose_card_list = card_list;

      console.log('Choose ONE :: ', card_list)
      h.show_card_list(card_list);
      
      // Enable clicking the 'world' canvas
      $('#world').css('pointer-events', 'auto');
      $('#battlefield').css('pointer-events', 'none');

      document.getElementById('world').onclick = function f(e) {
        h.world_ctx.fillStyle = 'red';
        h.world_ctx.fillRect(e.offsetX, e.offsetY, 10, 10);

        for (var i = 0; i < card_list.length; i++) {
          if (e.offsetX >= card_list[i].x && e.offsetX <= card_list[i].x + card_list[i].w) {
            if (e.offsetY >= card_list[i].y && e.offsetY <= card_list[i].y + card_list[i].h) {
              h.socket.emit('select-done', {
                id : i
              });
              
              // Clear canvas!
              h.world_ctx.clearRect(0, 0, h.world_canvas.width, h.world_canvas.height);
              $('#world').css('pointer-events', 'none');
              $('#battlefield').css('pointer-events', 'auto');
              
              document.getElementById('world').removeEventListener('click', f);
            }
          }
        }
      }
    }

  }(this));

  this.socket.on('select-one', function(h) {
    return function(data) {
      var list = data.list;
      console.log('Select one received list ', list);

      h.choose_card_list = list;

      h.need_to_select = true;
      h.draw_field();
    };
  }(this));

  this.did_game_begin = false;
  this.socket.on('begin-match', function(h) {
    return function(data) {
      console.log('[Begin Match Received]');
      this.did_game_begin = true;
      h.world_ctx.clearRect(0, 0, h.world_canvas.width, h.world_canvas.height);
    };
  }(this));

  this.world_canvas = document.getElementById('world');
  this.world_ctx = document.getElementById('world').getContext('2d');
  this.world_ctx.canvas.width = window.innerWidth;
  this.world_ctx.canvas.height = window.innerHeight;

  this.field_canvas = document.getElementById('battlefield');
  this.field_ctx = this.field_canvas.getContext('2d');

  this.field_ctx.canvas.width = window.innerWidth;
  this.field_ctx.canvas.height = window.innerHeight;

  this.init_field_click();
  this.field_selected = null; // If something is selected, then store the id of that card

  this.choose_card_list = [];
  this.need_to_select = false;

  this.my_field_card_y = 500;
  this.enemy_field_card_y = 300;
  this.turn_end_btn_y = 400;
  this.my_hero_y = 700;
  this.enemy_hero_y = 30;
  this.my_field_center = window.innerWidth / 2;
}
HearthClient.prototype.init = function() {};
HearthClient.prototype.play_card = function(card_id, at) {
  var id = parseInt(card_id.substr(4));

  console.log('put card ', at);
  this.socket.emit('hearth-user-play-card', {
    id: id,
    at: at
  });
};
HearthClient.prototype.combat = function(from_card_id, to_card_id) {
  this.socket.emit('hearth-combat', {
    from_id: from_card_id,
    to_id: to_card_id
  });
}

function is_in_the_list(arr, id) {
  for (var i = 0; i < arr.length; i++) {
    if (arr[i] == id) return true;
  }
  return false;
}

HearthClient.prototype.draw_field = function() {
  this.field_ctx.clearRect(0, 0, 2000, 2000);

  this.field_ctx.save();

  // Turn end button
  if (this.need_to_select) {
    this.world_ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'; // Transparent black
    this.world_ctx.fillRect(0, 0, 2000, 2000);
  }
  else {
    this.world_ctx.clearRect(0, 0, 2000, 2000);
  }

  this.field_ctx.fillStyle = 'yellow';
  this.field_ctx.fillRect(1400, this.turn_end_btn_y, 150, 50);

  var num_field = this.my_field.length;

  for (var i = 0; i < this.my_field.length; i++) {
    this.field_ctx.save();

    this.field_ctx.beginPath();
    this.field_ctx.ellipse(this.my_field_center + 200 * (i - Math.floor(num_field / 2)), this.my_field_card_y, 50, 80, 0, 0, 2 * Math.PI, 0);
    this.field_ctx.closePath();

    // We should clip the image of minion to look like an actual minion
    this.field_ctx.clip();

    // Set card position on the canvas
    this.my_field[i].x = this.my_field_center + 200 * (i - Math.floor(num_field / 2));
    this.my_field[i].y = this.my_field_card_y;

    if (hearth_img_db.has_image(this.my_field[i].unique)) {
      this.field_ctx.drawImage(hearth_img_db.async_get_image(this.my_field[i]), this.my_field_center + 200 * (i - Math.floor(num_field / 2)) - 80, this.my_field_card_y - 80, 160, 238);
    }
    else {
      hearth_img_db.get_image(this.my_field[i], function() {
        hearth_client.draw_field();
      });
    }

    if (this.need_to_select && !is_in_the_list(this.choose_card_list, this.my_field[i].id)) {
      this.field_ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.field_ctx.fillRect(this.my_field_center + 200 * (i - Math.floor(num_field / 2)) - 80, this.my_field_card_y - 80, 160, 238);
    }
    this.field_ctx.restore();

    // Show life and dmg of the minions here
    this.field_ctx.strokeStyle = 'yellow';
    this.field_ctx.strokeText(this.my_field[i].dmg, this.my_field_center + 200 * (i - Math.floor(num_field / 2)) - 60, this.my_field_card_y + 100);
    this.field_ctx.strokeStyle = 'red'
    this.field_ctx.strokeText(this.my_field[i].life, this.my_field_center + 200 * (i - Math.floor(num_field / 2)) + 60, this.my_field_card_y + 100);
  }

  var ene_num_field = this.enemy_field.length;
  for (var i = 0; i < ene_num_field; i++) {
    this.field_ctx.save();

    this.field_ctx.beginPath();
    this.field_ctx.ellipse(this.my_field_center + 200 * (i - Math.floor(ene_num_field / 2)), this.enemy_field_card_y, 50, 80, 0, 0, 2 * Math.PI, 0);
    this.field_ctx.closePath();

    // We should clip the image of minion to look like an actual minion
    this.field_ctx.clip();

    // Set card position on the canvas
    this.enemy_field[i].x = this.my_field_center + 200 * (i - Math.floor(ene_num_field / 2));
    this.enemy_field[i].y = this.enemy_field_card_y;

    if (hearth_img_db.has_image(this.enemy_field[i].unique)) {
      this.field_ctx.drawImage(hearth_img_db.async_get_image(this.enemy_field[i]), this.my_field_center + 200 * (i - Math.floor(ene_num_field / 2)) - 80, this.enemy_field_card_y - 80, 160, 238);
    }
    else {
      hearth_img_db.get_image(this.enemy_field[i], function() {
        hearth_client.draw_field();
      });
    }

    if (this.need_to_select && !is_in_the_list(this.choose_card_list, this.enemy_field[i].id)) {
      this.field_ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      this.field_ctx.fillRect(500 + 200 * (i - Math.floor(ene_num_field / 2)) - 80, this.enemy_field_card_y - 80, 160, 238);
    }
    this.field_ctx.restore();

    // Show life and dmg of the minions here
    this.field_ctx.strokeStyle = 'yellow';
    this.field_ctx.strokeText(this.enemy_field[i].dmg, this.my_field_center + 200 * (i - Math.floor(ene_num_field / 2)) - 60, this.enemy_field_card_y + 100);
    this.field_ctx.strokeStyle = 'red'
    this.field_ctx.strokeText(this.enemy_field[i].life, this.my_field_center + 200 * (i - Math.floor(ene_num_field / 2)) + 60, this.enemy_field_card_y + 100);
  }
};
HearthClient.prototype.show_card_list = function(card_list) {
  for (var i = 0; i < card_list.length; i++) {
    hearth_img_db.get_image(card_list[i], function(img_pos, h, i) {
      return function f(img) {
        h.world_ctx.drawImage(img, img_pos.x, img_pos.y);
        h.choose_card_list[i].img = img;
        h.choose_card_list[i].x = img_pos.x;
        h.choose_card_list[i].y = img_pos.y;
        h.choose_card_list[i].w = img.width;
        h.choose_card_list[i].h = img.height;
      };
    }({
      x: i * 300 + 400,
      y: 200
    }, this, i));
  }
};
// card_list is an array of card names
HearthClient.prototype.show_card_list_done = function(card_list, on_done) {
  for (var i = 0; i < card_list.length; i++) {
    hearth_img_db.get_image(card_list[i], function(img_pos, h, i) {
      return function f(img) {
        h.world_ctx.drawImage(img, img_pos.x, img_pos.y);
        h.choose_card_list[i].img = img;
        h.choose_card_list[i].x = img_pos.x;
        h.choose_card_list[i].y = img_pos.y;
        h.choose_card_list[i].w = img.width;
        h.choose_card_list[i].h = img.height;
      };
    }({
      x: i * 300 + 400,
      y: 200
    }, this, i), on_done);
  }
};
HearthClient.prototype.where_to_put = function(x) {
  var prev_x = 0;
  console.log('where :: ', x);
  for (var i = 0; i < hearth_client.my_field.length; i++) {
    console.log('my field cards #', i, ' : ', hearth_client.my_field[i].x)
  }

  for (var i = 0; i < hearth_client.my_field.length; i++) {
    if (x >= prev_x && x < hearth_client.my_field[i].x) {
      return i;
    }
    else prev_x = hearth_client.my_field[i].x;
  }
  return hearth_client.my_field.length + 1;
};
HearthClient.prototype.init_field_click = function() {
  function is_in_rect(e, x, y, w, h) {
    if (e.offsetX >= x && e.offsetX <= x + w && e.offsetY >= y && e.offsetY <= y + h) return true;
    return false;
  }

  this.field_canvas.onclick = function(e) {
    hearth_client.field_ctx.fillStyle = 'red';
    hearth_client.field_ctx.fillRect(e.offsetX, e.offsetY, 10, 10);

    // If some minion on field is selected
    for (var i = 0; i < hearth_client.my_field.length; i++) {
      hearth_client.field_ctx.strokeStyle = 'white';
      hearth_client.field_ctx.strokeRect(hearth_client.my_field[i].x - 50, hearth_client.my_field[i].y - 80, 100, 160);

      if (is_in_rect(e, hearth_client.my_field[i].x - 50, hearth_client.my_field[i].y - 80, 100, 160)) {
        console.log('Minion #', hearth_client.my_field[i].id, ' is selected!');
        if (hearth_client.need_to_select) {
          hearth_client.socket.emit('select-done', {
            id: hearth_client.my_field[i].id
          });
          hearth_client.need_to_select = false;
          hearth_client.choose_card_list = [];
          return;
        }

        if (hearth_client.field_selected) {
          hearth_client.combat(hearth_client.field_selected.id, hearth_client.my_field[i].id);
          hearth_client.field_selected = null;
          return;
        }
        hearth_client.field_selected = hearth_client.my_field[i];

        return;
      }
    }

    for (var i = 0; i < hearth_client.enemy_field.length; i++) {
      hearth_client.field_ctx.strokeStyle = 'white';
      hearth_client.field_ctx.strokeRect(hearth_client.enemy_field[i].x - 50, hearth_client.enemy_field[i].y - 80, 100, 160);

      if (is_in_rect(e, hearth_client.enemy_field[i].x - 50, hearth_client.enemy_field[i].y - 80, 100, 160)) {
        console.log('Minion #', hearth_client.enemy_field[i].name, ' is selected!');

        if (hearth_client.need_to_select) {
          hearth_client.socket.emit('select-done', {
            id: hearth_client.enemy_field[i].id
          });
          hearth_client.need_to_select = false;
          return;
        }

        if (hearth_client.field_selected) {
          console.log('Minion #', hearth_client.field_selected.name, ' vs ', hearth_client.enemy_field[i].name)
          hearth_client.combat(hearth_client.field_selected.id, hearth_client.enemy_field[i].id);
          hearth_client.field_selected = null;
          return;
        }

        hearth_client.field_selected = hearth_client.enemy_field[i].id;

        return;
      }
    }

    if (is_in_rect(e, 1400, hearth_client.turn_end_btn_y, 150, 50)) {
      console.log('Turn ended!');

      // Notify the server that the client has ended its turn
      hearth_client.socket.emit('hearth-end-turn', {});
    }

    // My Hero
    hearth_client.field_ctx.strokeStyle = 'white';
    hearth_client.field_ctx.strokeRect(hearth_client.my_field_center - 100, hearth_client.my_hero_y, 200, 150);
    hearth_client.field_ctx.strokeRect(hearth_client.my_field_center - 100, hearth_client.enemy_hero_y, 200, 150);

    if (is_in_rect(e, hearth_client.my_field_center - 100, hearth_client.my_hero_y, 200, 150)) {
      if (hearth_client.need_to_select) {
        hearth_client.socket.emit('select-done', {
          id: 'me'
        });
        hearth_client.need_to_select = false;
        return;
      }
      if (hearth_client.field_selected) {
        if (hearth_client.field_selected.name) console.log('Minion #', hearth_client.field_selected.name, ' vs Me')
        else console.log('Minion #', hearth_client.field_selected, ' vs Me');

        if (hearth_client.field_selected.id) {
          hearth_client.combat(hearth_client.field_selected.id, 'me');
        }
        else {
          hearth_client.combat(hearth_client.field_selected, 'me');
        }

        hearth_client.field_selected = null;
        return;
      }

      hearth_client.field_selected = 'me';
      return;
    }
    // Enemy hero
    else if (is_in_rect(e, hearth_client.my_field_center - 100, hearth_client.enemy_hero_y, 200, 150)) {
      if (hearth_client.need_to_select) {
        hearth_client.socket.emit('select-done', {
          id: 'enemy'
        });
        hearth_client.need_to_select = false;
        return;
      }
      if (hearth_client.field_selected) {
        if (hearth_client.field_selected.id) console.log('Minion #', hearth_client.field_selected.id, ' vs Enemy Hero')
        else console.log('Minion #', hearth_client.field_selected, ' vs Enemy Hero')

        if (hearth_client.field_selected.id) {
          hearth_client.combat(hearth_client.field_selected.id, 'enemy');
        }
        else {
          hearth_client.combat(hearth_client.field_selected, 'enemy');
        }
        hearth_client.field_selected = null;
        return;
      }
      hearth_client.field_selected = 'enemy';
      return
    }

    // Hero Power
    hearth_client.field_ctx.strokeStyle = 'white';
    hearth_client.field_ctx.strokeRect(hearth_client.my_field_center + 300, hearth_client.my_hero_y, 50, 50);
    if (is_in_rect(e, hearth_client.my_field_center + 300, hearth_client.my_hero_y, 50, 50)) {
      hearth_client.socket.emit('hero_power');
    }

    if (hearth_client.need_to_select) {
      hearth_client.socket.emit('select-done', {
        id: null
      });
      hearth_client.need_to_select = false;
      hearth_client.draw_field();
    }

    // If none is clicked after some minion is clicked
    if (hearth_client.field_selected) {
      hearth_client.field_selected = null;
    }
  }
};
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

  document.getElementById('world').onclick = function f(e) {
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
            hearth_client.world_ctx.drawImage(hearth_img_db.async_get_image(card_list[i]), card_list[i].x, card_list[i].y);
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
          if (!card_list[i].selected) hearth_client.world_ctx.drawImage(card_list[i].img, card_list[i].x, card_list[i].y);
        }
        
        document.getElementById('world').removeEventListener('click', f);

        $('#world').css('pointer-events', 'none');
        $('#battlefield').css('pointer-events', 'auto');
      }
    }
  }
}
HearthClient.prototype.log = function(e) {
  var log = '';
  if (e) log += '[' + e + '] ';

  this.world_ctx.clearRect(0, 0, 2000, 300);
  this.world_ctx.strokeStyle = 'white';

  log += ' [Me] : ' + this.my_hero.life + '(' + this.my_hero.armor + ') / ' + this.my_hero.mana + ' [Enemy] ' + this.enemy_hero.life + '(' + this.enemy_hero.armor + ') / ' + this.enemy_hero.mana;

  log += 'My Hand :: ';
  for (var i = 0; i < my_hand.card_list.length; i++) {
    log += '[' + my_hand.card_list[i].id + ' , ' + my_hand.card_list[i].name + '/' + my_hand.card_list[i].mana + '/' + my_hand.card_list[i].dmg + '/' + my_hand.card_list[i].life + '] ';
  }

  this.world_ctx.strokeText(log, 0, 200);

  log = 'My Field :: ';

  for (var i = 0; i < hearth_client.my_field.length; i++) {
    log += '[' + hearth_client.my_field[i].id + ' , ' + hearth_client.my_field[i].name + '/' + hearth_client.my_field[i].mana + '/' + hearth_client.my_field[i].dmg + '/' + hearth_client.my_field[i].life + '] ';
  }
  log += ' Enemy Field :: ';
  for (var i = 0; i < hearth_client.enemy_field.length; i++) {
    log += '[' + hearth_client.enemy_field[i].id + ' , ' + hearth_client.enemy_field[i].name + '/' + hearth_client.enemy_field[i].mana + '/' + hearth_client.enemy_field[i].dmg + '/' + hearth_client.enemy_field[i].life + '] ';
  }

  this.world_ctx.strokeText(log, 0, 250);
}
var hearth_client = new HearthClient();
