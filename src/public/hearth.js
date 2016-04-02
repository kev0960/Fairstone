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

  this.life = 0;
  this.dmg = 0;
  this.mana = 0;
  this.name = '';
  
  // Card position on the canvas field
  this.x = 0;
  this.y = 0;
}

var token = localStorage.getItem('hearth-server-token')

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
  console.log('Offset :: ', this.selected_card.offsetTop)
  if (-200 > this.selected_card.offsetTop && this.selected_card.offsetTop > -600) {
    hearth_client.play_card(this.selected_card.id, 0);
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
  this.img_list = []; // { card_name, img }
}

// 보여고자 하는 카드들을 리스트를 받아 이미지 정보가 얻어지면 그 img 에 대해 on_load
// 함수를 호출한다. 모든 img 들이 load 되었으면 on_done 함수를 호출한다 (optional)
HearthImageDB.prototype.get_image_arr = function(card_name_arr, on_load, on_done) {
  var num_finish = {
    num: card_name_arr.length
  };

  for (var i = 0; i < card_name_arr.length; i++) {
    for (var j = 0; j < this.img_list.length; j++) {
      if (this.img_list[j].card_name == card_name_arr[i]) {
        on_load(this.img_list[j].img);
        card_name_arr.splice(i, 1);

        i--;
        num_finish.num--;

        break;
      }
    }
  }

  for (var i = 0; i < card_name_arr.length; i++) {
    hearth_client.get_card_image(card_name_arr[i], function(card_name, num_finish, on_load, on_done) {
      return function(img_addr) {
        var img = new Image;
        img.src = img_addr;

        img.onload = function() {
          on_load(img)
          hearth_img_db.add_image(card_name, img);

          num_finish.num--;
        };

        if (num_finish.num == 0) {
          if (on_done) on_done();
        }
      };
    }(card_name_arr[i], num_finish, on_load, on_done));
  }
}
HearthImageDB.prototype.get_image = function(card_name, on_load) {
  for (var j = 0; j < this.img_list.length; j++) {
    if (this.img_list[j].card_name == card_name) {
      on_load(this.img_list[j].img);
      return;
    }
  }

  hearth_client.get_card_image(card_name, function(card_name, on_load) {
    return function(img_addr) {
      var img = new Image;
      img.src = img_addr;

      img.onload = function() {
        on_load(img)

        hearth_img_db.add_image(card_name, img);
      };
    };
  }(card_name, on_load));
}
HearthImageDB.prototype.get_image_addr = function(card_name, on_load) {
  for (var j = 0; j < this.img_list.length; j++) {
    if (this.img_list[j].card_name == card_name) {
      on_load(this.img_list[j].img.src);
      return;
    }
  }

  hearth_client.get_card_image(card_name, function(card_name, on_load) {
    return function(img_addr) {
      var img = new Image;
      img.src = img_addr;

      img.onload = function() {
        on_load(img.src)

        hearth_img_db.add_image(card_name, img);
      };
    };
  }(card_name, on_load));
}
HearthImageDB.prototype.async_get_image = function(card_name) {
  for (var j = 0; j < this.img_list.length; j++) {
    if (this.img_list[j].card_name == card_name) {
      return this.img_list[j].img;
    }
  }
  throw Error('[async-get_image] ', card_name, ' does not exist');
}
HearthImageDB.prototype.add_image = function(card_name, img) {
  this.img_list.push({
    card_name: card_name,
    img: img
  });
}

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
  
  this.current_mana = 1;
  this.total_mana = 1;

  // Receiving hearth-event
  this.socket.on('hearth-event', function(data) {
    console.log('Received' + data.event + ' Event!');
    if (data.event_type == 'play_card') {

    }
    if (data.event_type == 'summon') {

    }

    // 항상 Card DOM Element 를 생성하는 것이 아니라, 카드가 추가 
    // 될 때에만 선택적으로 Element 를 생성한다. 그 외의 경우에는 그냥
    // 필드의 Element 정보를 바꾸기만 하면 된다.
    var recv_my_hand = [];

    for (var i = 0; i < data.card_info.length; i++) {
      if (data.card_info[i].owner == 'me' && data.card_info[i].where == 'hand') {
        recv_my_hand.push(data.card_info[i]);
      }
    }

    console.log('[Received hand]', recv_my_hand);

    var my_hand_len = recv_my_hand.length;
    my_hand.card_list = [];
    
    // Remove entire cards 
    $('#player-card-container').empty();

    for (var i = 0; i < my_hand_len; i++) {
      hearth_img_db.get_image_addr(recv_my_hand[i].name, function(c) {
        return function(img_addr) {
          var card = new Card(c.id);
          my_hand.add_card(card, img_addr);

          card.life = c.life;
          card.mana = c.mana;
          card.dmg = c.dmg;
          card.name = c.name;
        };
      }(recv_my_hand[i]))
    }
  });

  this.socket.on('hearth-play-card', function(h) {
    return function(data) {
      if(data.result) {
        var card_id = data.id;
        for(var i = 0; i < my_hand.card_list.length; i ++) {
          if(my_hand.card_list[i].id == card_id) {
            var c = my_hand.card_list[i];
            my_hand.remove_card_at(i);
            
            // Insert card to the field
            h.my_field.splice (data.at, 0, c);
            
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
  
  // Turn end button
  this.field_ctx.fillStyle = 'yellow'
  this.field_ctx.fillRect(1200, 200, 150, 50)

  this.init_field_click();
  
  this.choose_card_list = [];
}
HearthClient.prototype.init = function() {}
HearthClient.prototype.play_card = function(card_id, at) {
  var id = parseInt(card_id.substr(4));

  this.socket.emit('hearth-user-play-card', {
    id : id,
    at : at
  });
}
HearthClient.prototype.draw_field = function() {
  this.field_ctx.save();
  
  var num_field = this.my_field.length;
  
  for(var i = 0; i < num_field; i ++) {
    this.field_ctx.save();
    
    this.field_ctx.beginPath();
    this.field_ctx.ellipse(500 - 100 * (i -  Math.floor(num_field / 2)), 250, 50, 80, 0, 0, 2 * Math.PI, 0);
    this.field_ctx.closePath();
    
    // We should clip the image of minion to look like an actual minion
    this.field_ctx.clip();
    
    // Set card position on the canvas 
    this.my_field[i].x = 500 - 100 * (i -  Math.floor(num_field / 2));
    this.my_field[i].y = 250;
    
    this.field_ctx.drawImage(hearth_img_db.async_get_image(this.my_field[i].name), 500 - 100 * (i -  Math.floor(num_field / 2)) - 80, 170, 160, 238);
    this.field_ctx.restore();
  }
}
HearthClient.prototype.show_card_list = function(card_list) {
    for (var i = 0; i < card_list.length; i++) {
      hearth_img_db.get_image(card_list[i].name, function(img_pos, h, i) {
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
  }
  // card_list is an array of card names
HearthClient.prototype.show_card_list_done = function(card_list, on_done) {
  for (var i = 0; i < card_list.length; i++) {
    hearth_img_db.get_image(card_list[i].name, function(img_pos, h, i) {
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
HearthClient.prototype.init_field_click = function() {
  this.field_canvas.onclick = function(e) {
    hearth_client.field_ctx.fillStyle = 'red';
    hearth_client.field_ctx.fillRect(e.offsetX, e.offsetY, 10, 10);
    
    // If some minion on field is selected
    for(var i = 0; i < hearth_client.my_field.card_list; i ++) {
      if(e.offsetX >= hearth_client.my_field.card_list[i].x && e.offsetX <= hearth_client.my_field.card_list[i].x + 100) {
        if(e.offsetY >= hearth_client.my_field.card_list[i].y && e.offsetY <= hearth_client.my_field.card_list[i].y + 160) {
          console.log('Minion #', hearth_client.my_field.card_list[i].id, ' is selected!');
          
          // TODO do something
          break;
        }
      }
    }
    
    if(e.offsetX >= 800 && e.offsetX <= 950 && e.offsetY >= 200 && e.offsetY <= 250) {
      console.log('Turn ended!');
      
      // Notify the server that the client has ended its turn
      hearth_client.socket.emit('hearth-end-turn', {}); 
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
            hearth_client.world_ctx.drawImage(hearth_img_db.async_get_image(card_list[i].name), card_list[i].x, card_list[i].y);
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
      for(var i = 0; i < response.length; i ++) {
        if(response[i].type != 'Hero') {
          f(response[i].img); break;
        }
      }
    }
  });
}
var hearth_client = new HearthClient();
