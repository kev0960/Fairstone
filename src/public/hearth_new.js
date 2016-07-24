function HearthResource() {
  this.img_list = [];
}

// Register Image when ready 
// dup 이 활성화 되있다면 이미 존재하는 이미지 이기 때문에 list 에 추가하지 않는다.
HearthResource.prototype.reg_img = function(unique, src, dup, call_back) {
  var img = new Image();
  // Convert source to server loading version
  var arr = src.split('/');
  src = '/card-image/' + arr[arr.length - 2] + '/' + arr[arr.length - 1];
  img.src = src;

  img.onload = function(that) {
    return function() {
      if (!dup) {
        // If it is already stored
        for (var i = 0; i < that.img_list.length; i++) {
          if (that.img_list[i].unique == unique) {
            if (call_back) call_back(unique, src, img);
            return;
          }
        }

        that.img_list.push({
          unique: unique,
          src: src,
          img: img
        });
      }
      if (call_back) call_back(unique, src, img);
    };
  }(this);
};
HearthResource.prototype.get_img = function(unique, src, callback) {
  for (var i = 0; i < this.img_list.length; i++) {
    if (this.img_list[i].unique == unique) return this.img_list[i];
  }

  // If not found
  this.reg_img(unique, src, true, callback);
};

var hearth_resource = new HearthResource();

function HearthCard(unique, id, owner, name, mana, health, dmg, img_src, state, where, offset) {
  this.unique = unique;
  this.id = id;
  this.name = name;
  this.owner = owner;

  this.health = health;
  this.dmg = dmg;
  this.mana = mana;
  this.img_src = img_src;
  this.state = state;
  this.where = where;

  // Location in the field
  this.x = 0;
  this.y = 0;

  /* 
  
  UI Related properties
  
  */

  // Only used for mulligun
  this.bitmap = null;
  this.real_img = false;
  this.offset = (offset != undefined ? offset : -1);

  this.display = null;

  // Location of the card where it is selected
  this.sel_x = 0;
  this.sel_y = 0;

  // Added shapes and texts
  this.added_images = [];
}

function Deck() {
  this.card_list = [];
}
Deck.prototype.add_card = function(c) {
  this.card_list.push(c);
};
Deck.prototype.num_card = function() {
  return this.card_list.length;
};

function DisplayCard(c) {
  this.c = c; // Referring card

  this.bitmap = null;
  this.load_img_name = ''; // Name of the image to load

  this.real_img = false;
  this.offset = 0;

  this.added_images = [];
}

function Hearthstone() {
  this.match_token = localStorage.getItem('hearth-match-token');
  this.socket = io.connect('/match/' + this.match_token);

  var server_token = localStorage.getItem('hearth-server-token');

  $.ajax({
    url: '/match',
    data: {
      'token': server_token
    },
    type: 'POST'
  }).success(function(socket, match_token) {
    return function(data) {
      var d = JSON.parse(data);
      if (d.id) {
        // Send my Inforamation through socket
        // 나중에 생성된 webtoken 을 보내서 인증받는 방식으로 바꿔야함
        socket.emit('player-info', {
          match_token: match_token,
          user_id: d.id
        });
      }
    };
  }(this.socket, this.match_token));

  // List of the cards
  this.cards = new Deck();
  this.center_cards = new Deck();

  this.stage = new createjs.Stage(document.getElementById('field'));
  this.stage.enableMouseOver(20);

  this.my_field_cont = new createjs.Container();
  this.my_fields = [];

  this.my_hand_cont = new createjs.Container();
  this.my_hands = [];

  this.enemy_field_cont = new createjs.Container();
  this.enemy_fields = [];

  this.enemy_hand_cont = new createjs.Container();
  this.enemy_hands = [];

  this.center_cont = new createjs.Container();

  this.stage.addChild(this.my_field_cont);
  this.stage.addChild(this.my_hand_cont);
  this.stage.addChild(this.enemy_field_cont);
  this.stage.addChild(this.enemy_hand_cont);
  this.stage.addChild(this.center_cont);

  // Screen Info
  this.screen_x = $(window).width();
  this.screen_y = $(window).height();

  this.my_hand_y = 700;
  this.enemy_hand_y = 100;

  this.my_field_cont.y = 370;
  this.my_hand_cont.y = this.my_hand_y;

  this.enemy_field_cont.y = 120;
  this.enemy_hand_cont.x = 0;

  // UI
  this.selected_card = null;
  this.current_hover = null;
  this.is_selecting_center = false;

  // Mulligun
  this.remove_candidate = [];

  // Select-available card lists
  this.selectable_lists = [];

  this.gray_scale = new createjs.ColorMatrixFilter([
    0.30, 0.30, 0.30, 0, 0, // red component
    0.30, 0.30, 0.30, 0, 0, // green component
    0.30, 0.30, 0.30, 0, 0, // blue component
    0, 0, 0, 1, 0 // alpha
  ]);

  // Need to select field card 
  this.need_to_select = false;

  this.init();
}
Hearthstone.prototype.init = function() {
  this.socket.on('hearth-event', function(h) {
    return function(data) {
      if (data.event) {
        console.log('Event :: ', data.event);
      }

      h.cards.card_list = []; // Change the entire card list with newly received ones

      console.log('Data is received!', data.card_info);

      for (var i = 0; i < data.card_info.length; i++) {
        var c = data.card_info[i];
        h.cards.add_card(new HearthCard(
          c.unique,
          c.id,
          c.owner,
          c.name,
          c.mana,
          c.life,
          c.dmg,
          c.img_path,
          c.state,
          c.where
        ));

        hearth_resource.reg_img(c.unique, c.img_path);
      }

      h.draw_hand();
      h.draw_field();
    };
  }(this));

  /*
      Registring Handler for Mulligun
  */
  this.socket.on('choose-starting-cards', function(h) {
    return function(data) {
      console.log('Received Data :: ', data.cards);
      for (var i = 0; i < data.cards.length; i++) {
        var c = data.cards[i];
        h.center_cards.add_card(new HearthCard(
          c.unique,
          c.id,
          c.owner,
          c.name,
          c.mana,
          c.life,
          c.dmg,
          c.img_path,
          c.state,
          c.where,
          i
        ));

        hearth_resource.reg_img(c.unique, c.img_path);
      }

      var button = new createjs.Shape();
      button.graphics.beginFill('blue').drawRect(0, 0, 150, 200);
      h.stage.addChild(button);

      button.addEventListener('click', function() {
        h.socket.emit('remove-some-cards', {
          removed: h.remove_candidate
        });
        h.stage.removeChild(button);
        button.removeAllEventListeners();

        for (var i = 0; i < h.remove_candidate.length; i++) {
          // Erasing X mark
          h.center_cont.removeChild(h.center_cards.card_list[h.remove_candidate[i]].added_images[0]);
          h.center_cont.removeChild(h.center_cards.card_list[h.remove_candidate[i]].bitmap);
        }
      });

      h.is_selecting_center = true;
      h.mulligun();
    };
  }(this));

  /*
    Registing for Choose one Event
  */

  this.socket.on('choose-one', function(h) {
    return function(data) {
      var card_list = data.list;

      h.center_cards.card_list = [];
      for (var i = 0; i < card_list.length; i++) {
        var c = card_list[i];
        h.center_cards.add_card(new HearthCard(
          c.unique,
          c.id,
          c.owner,
          c.name,
          c.mana,
          c.life,
          c.dmg,
          c.img_path,
          c.state,
          c.where,
          i
        ));

        hearth_resource.reg_img(c.unique, c.img_path);
      }

      h.is_selecting_center = true;
      h.show_cards();

      console.log('Choose one ::', card_list);
    };
  }(this));

  this.socket.on('select-one', function(h) {
    return function(data) {
      h.selectable_lists = data.list;
      h.need_to_select = true;

      h.draw_hand();
      h.draw_field();
    };
  }(this));

  /*

  Register Turn End Button 

  */
  var end_turn_btn = new createjs.Shape();
  end_turn_btn.graphics.beginFill('yellow').drawRect(1000, 100, 150, 50);
  this.stage.addChild(end_turn_btn);

  end_turn_btn.addEventListener('click', function(h) {
    return function() {
      // Notify the server that the client has ended its turn
      h.socket.emit('hearth-end-turn', {});
    };
  }(this));

  this.socket.on('new-starting-cards', function(h) {
    return function(data) {
      for (var i = 0; i < h.remove_candidate.length; i++) {
        var c = data.cards[i];
        h.center_cards.card_list[h.remove_candidate[i]] = new HearthCard(
          c.unique,
          c.id,
          c.owner,
          c.name,
          c.mana,
          c.life,
          c.dmg,
          c.img_path,
          c.state,
          c.where,
          h.remove_candidate[i]
        );

        hearth_resource.reg_img(c.unique, c.img_path);
      }

      h.remove_candidate = [];
      h.mulligun(true);
    };
  }(this));

  this.socket.on('begin-match', function(h) {
    return function(data) {
      console.log('Game has started!');
      h.is_selecting_center = false;

      // When the game is started remove all of the mulligun cards
      for (var i = 0; i < h.center_cards.num_card(); i++) {
        var res = h.center_cont.removeChild(h.center_cards.card_list[i].bitmap);
        h.center_cards.card_list[i].bitmap.removeAllEventListeners();
      }

      h.stage.update();
    };
  }(this));

  // Initialize UI
  this.stage.addEventListener('pressmove', function(h) {
    return function(e) {
      if (h.selected_card && h.selected_card.where === 'hand') {
        h.selected_card.display.bitmap.x = e.stageX - h.selected_card.sel_x;
        h.selected_card.display.bitmap.y = e.stageY - h.selected_card.sel_y;

        h.stage.update();
      }
    };
  }(this));

  this.stage.addEventListener('pressup', function(h) {
    return function(e) {
      if (h.selected_card && h.selected_card.where == 'hand') {
        console.log('Card Dropped AT :: ', e.stageY);
        h.draw_hand();
        // TODO : Change to a field
        if (e.stageY <= 150) {
          h.socket.emit('hearth-user-play-card', {
            id: h.selected_card.id,
            at: 0
          });
        }

        h.current_hover = null;
        h.selected_card = null;
      }
    };
  }(this));
};

/*
 * 
 * Draw Field
 *
 */
Hearthstone.prototype.is_selectable = function(c) {
  if (!this.need_to_select) return false;

  for (var i = 0; i < this.selectable_lists.length; i++) {
    if (this.selectable_lists[i] == c.id) return true;
  }
  return false;
};
Hearthstone.prototype.draw_field = function() {
  var num_my_card = 0;
  var num_enemy_card = 0;
  for (var i = 0; i < this.cards.num_card(); i++) {
    if (this.cards.card_list[i].where == 'field') {
      if (this.cards.card_list[i].owner == 'me') {
        this.cards.card_list[i].offset = num_my_card;
        num_my_card++;
      } else {
        this.cards.card_list[i].offset = num_enemy_card;
        num_enemy_card++;
      }
    }
  }

  var mine = -1,
    enemy = -1;

  for (var i = 0; i < this.cards.num_card(); i++) {
    if (this.cards.card_list[i].where != 'field') continue;

    var c = this.cards.card_list[i];
    if (c.owner == 'me') mine++;
    else if (c.owner == 'enemy') enemy++;

    var deg = 0;
    var img = hearth_resource.get_img(c.unique, c.img_src, function(h) {
      return function() {
        h.draw_field();
      };
    }(this));

    var display = null;
    var new_display = false;

    // Check whether there are available slot for DisplayCard
    if (c.owner == 'me') {
      if (this.my_fields.length <= mine) {
        this.my_fields.push(new DisplayCard(c));
        new_display = true;
      }
      this.my_fields[mine].c = c;
      display = this.my_fields[mine];
    } else if (c.owner == 'enemy') {
      if (this.enemy_fields.length <= enemy) {
        this.enemy_fields.push(new DisplayCard(c));
        new_display = true;
      }
      this.enemy_fields[enemy].c = c;
      display = this.enemy_fields[enemy];
    }

    c.display = display;

    if (img) {
      // 처음으로 이미지를 등록하는 순간 
      if (!display.real_img || (display.load_img_name != c.unique)) {
        if (display.bitmap) {
          display.bitmap.removeAllEventListeners();

          if (c.owner == 'me') {
            this.my_field_cont.removeChild(display.bitmap);
          } else if (c.owner == 'enemy') this.enemy_field_cont.removeChild(display.bitmap);
        }

        // Remove all of the added images (Life and Health)
        while (display.added_images.length) {
          this.stage.removeChild(display.added_images[0]);
          display.added_images.splice(0, 1);
        }

        display.bitmap = new createjs.Bitmap(img.img);
        display.real_img = true;
        display.load_img_name = c.unique;

        var mask = new createjs.Shape(new createjs.Graphics().f("#000").drawEllipse(0, 0, 170, 230));
        display.bitmap.mask = mask;

        if (c.owner == 'me') {
          this.my_field_cont.addChildAt(display.bitmap, mine);
        } else if (c.owner == 'enemy') this.enemy_field_cont.addChildAt(display.bitmap, enemy);
      }
    } else {
      if (!display.real_img && !display.bitmap) {
        // Replace image with white blank
        display.bitmap = new createjs.Shape();
        display.bitmap.graphics.beginFill('blue').drawEllipse(0, 0, 150, 200);

        if (c.owner == 'me') this.my_field_cont.addChildAt(display.bitmap, mine);
        else if (c.owner == 'enemy') this.enemy_field_cont.addChildAt(display.bitmap, enemy);
      }
      // when the image is changed but changed image is not found
      // We first erase the previous image and replace with the blank image
      else if (display.load_img_name != c.unique) {
        display.bitmap.removeAllEventListeners();
        display.real_img = false;

        if (c.owner == 'me') {
          this.my_field_cont.removeChild(display.bitmap);
        } else if (c.owner == 'enemy') this.enemy_field_cont.removeChild(display.bitmap);

        while (display.added_images.length) {
          this.stage.removeChild(display.added_images[0]);
          console.log(display, 'Removed :: ', display.added_images.length);
          display.added_images.splice(0, 1);
        }

        // Replace image with white blank
        display.bitmap = new createjs.Shape();
        display.bitmap.graphics.beginFill('blue').drawEllipse(0, 0, 160, 210);

        if (c.owner == 'me') this.my_field_cont.addChildAt(display.bitmap, mine);
        else if (c.owner == 'enemy') this.enemy_field_cont.addChildAt(display.bitmap, enemy);
      }
    }

    display.bitmap.removeAllEventListeners();
    display.bitmap.addEventListener('mouseover', function(c, h) {
      return function(e) {
        // When hovers on the field minion, shows the card info
        h.current_hover = c;

        h.stage.update();
      };
    }(c, this));

    display.bitmap.addEventListener('mouseout', function(c, h) {
      return function(e) {
        if (h.current_hover == c) {
          h.current_hover = null;
        }

        h.stage.update();
      };
    }(c, this));
    display.bitmap.addEventListener('mousedown', function(c, h) {
      return function(e) {
        console.log('Selected :: ', c);

        if (h.need_to_select) {
          h.socket.emit('select-done', {
            id: c.id
          });
          h.selected_card = null;
          h.need_to_select = false;
          h.selectable_lists = [];
          return;
        }

        // Cannot attack itself
        if (h.selected_card && h.selected_card != c) {
          h.socket.emit('hearth-combat', {
            from_id: h.selected_card.id,
            to_id: c.id
          });
          h.selected_card = null;
        } else h.selected_card = c;
      };
    }(c, this));
  }

  mine = -1, enemy = -1;
  
  for (var i = 0; i < this.cards.num_card(); i++) {
    if (this.cards.card_list[i].where != 'field') continue;

    var c = this.cards.card_list[i];
    var display = c.display;

    if (c.owner == 'me') mine++;
    else enemy++;

    if (c.owner == 'me') {
      display.bitmap.x = this.screen_x / 2 - 150 - Math.floor(num_my_card / 2) * 150 + mine * 300;
      display.offset = mine;

      if (display.bitmap.mask) {
        display.bitmap.mask.x = this.screen_x / 2 - 150 - Math.floor(num_my_card / 2) * 150 + mine * 300 + 68;
        display.bitmap.mask.y = 58;
      }
    } else {
      display.bitmap.x = this.screen_x / 2 - 150 - Math.floor(num_enemy_card / 2) * 150 + enemy * 300;
      display.offset = enemy;

      if (display.bitmap.mask) {
        display.bitmap.mask.x = this.screen_x / 2 - 150 - Math.floor(num_enemy_card / 2) * 150 + enemy * 300 + 68;
        display.bitmap.mask.y = 58;
      }
    }

    console.log('Added images :: ', display.added_images);
    // if text field for Health and Damage are empty, we should add it 
    if (display.added_images.length == 0) {
      display.added_images.push(new createjs.Text(c.dmg, "40px Arial", "yellow"));
      display.added_images.push(new createjs.Text(c.health, "40px Arial", "red"));

      this.stage.addChild(display.added_images[0]);
      this.stage.addChild(display.added_images[1]);
    }

    var offset_x = (c.owner == 'me' ? this.my_field_cont.x : this.enemy_field_cont.x);
    var offset_y = (c.owner == 'me' ? this.my_field_cont.y : this.enemy_field_cont.y);

    display.added_images[0].text = c.dmg;
    display.added_images[0].x = display.bitmap.x + offset_x + 50;
    display.added_images[0].y = display.bitmap.y + offset_y + 200;

    display.added_images[1].text = c.health;
    display.added_images[1].x = display.bitmap.x + offset_x + 200;
    display.added_images[1].y = display.bitmap.y + offset_y + 200;

    // Add a filter 
    if (!this.is_selectable(c) && this.need_to_select && display.real_img) {
      display.bitmap.filters = [this.gray_scale];

      // We must cache a bitmap in order to set a filter on it
      display.bitmap.cache(0, 0, display.bitmap.getBounds().width, display.bitmap.getBounds().height);
    } else if (display.real_img && display.bitmap.filters) {
      display.bitmap.filters = [];
      display.bitmap.updateCache();
    }
  }

  // Remove outnumbered cards
  while (this.my_fields.length > num_my_card) {
    while (this.my_fields[num_my_card].added_images.length) {
      this.stage.removeChild(this.my_fields[num_my_card].added_images[0]);
      this.my_fields[num_my_card].added_images.splice(0, 1);
    }

    this.my_field_cont.removeChild(this.my_fields[num_my_card].bitmap);
    this.my_fields.splice(num_my_card, 1);
  }

  while (this.enemy_fields.length > num_enemy_card) {
    while (this.enemy_fields[num_enemy_card].added_images.length) {
      this.stage.removeChild(this.enemy_fields[num_enemy_card].added_images[0]);
      this.enemy_fields[num_enemy_card].added_images.splice(0, 1);
    }

    this.enemy_field_cont.removeChild(this.enemy_fields[num_enemy_card].bitmap);
    this.enemy_fields.splice(num_enemy_card, 1);
  }
  this.stage.update();
};


/*
 * Draw Hand of the user
 * 
 */

Hearthstone.prototype.draw_hand = function() {
  var num_my_card = 0;
  var num_enemy_card = 0;
  for (var i = 0; i < this.cards.num_card(); i++) {
    if (this.cards.card_list[i].where == 'hand') {
      if (this.cards.card_list[i].owner == 'me') {
        num_my_card++;
      } else {
        num_enemy_card++;
      }
    }
  }

  var mine = -1,
    enemy = -1;

  for (var i = 0; i < this.cards.num_card(); i++) {
    if (this.cards.card_list[i].where != 'hand') continue;

    var c = this.cards.card_list[i];
    if (c.owner == 'me') mine++;
    else if (c.owner == 'enemy') enemy++;

    var deg = 0;
    var img = hearth_resource.get_img(c.unique, c.img_src, function(h) {
      return function() {
        h.draw_hand();
      };
    }(this));

    var display = null;
    var new_display = false;

    // Check whether there are available slot for DisplayCard
    if (c.owner == 'me') {
      if (this.my_hands.length <= mine) {
        this.my_hands.push(new DisplayCard(c));
        new_display = true;
      }
      this.my_hands[mine].c = c;
      display = this.my_hands[mine];
    } else if (c.owner == 'enemy') {
      if (this.enemy_hands.length <= enemy) {
        this.enemy_hands.push(new DisplayCard(c));
        new_display = true;
      }
      this.enemy_hands[enemy].c = c;
      display = this.enemy_hands[enemy];
    }

    c.display = display;

    if (img) {
      // 처음으로 이미지를 등록하는 순간 
      if (!display.real_img || (display.load_img_name != c.unique)) {
        if (display.bitmap) {
          display.bitmap.removeAllEventListeners();

          if (display.c.owner == 'me') {
            this.my_hand_cont.removeChild(display.bitmap);
          } else if (display.c.owner == 'enemy') this.enemy_hand_cont.removeChild(display.bitmap);
        }
        display.bitmap = new createjs.Bitmap(img.img);
        display.bitmap.scaleX = 0.7;
        display.bitmap.scaleY = 0.7;

        display.real_img = true;
        display.load_img_name = c.unique;

        if (c.owner == 'me') this.my_hand_cont.addChildAt(display.bitmap, mine);
        else if (c.owner == 'enemy') this.enemy_hand_cont.addChildAt(display.bitmap, enemy);
      }
    } else {
      if (!display.real_img && !display.bitmap) {
        // Replace image with white blank
        display.bitmap = new createjs.Shape();
        display.bitmap.graphics.beginFill('blue').drawEllipse(50, 50, 100, 150);

        if (c.owner == 'me') this.my_hand_cont.addChild(display.bitmap);
        else if (c.owner == 'enemy') this.enemy_hand_cont.addChild(display.bitmap);
      }
      // when the image is changed but changed image is not found
      // We first erase the previous image and replace with the blank image
      else if (display.load_img_name != c.unique) {
        display.bitmap.removeAllEventListeners();
        display.real_img = false;

        if (c.owner == 'me') {
          var res = this.my_hand_cont.removeChild(display.bitmap);
          console.log('is removed:: ? ', res, ' : ', display, ' vs ', c.unique, ' disp name ', display.load_img_name);
        } else if (c.owner == 'enemy') this.enemy_hand_cont.removeChild(display.bitmap);

        // Replace image with white blank
        display.bitmap = new createjs.Shape();
        display.bitmap.graphics.beginFill('blue').drawEllipse(50, 50, 100, 150);

        if (c.owner == 'me') this.my_hand_cont.addChild(display.bitmap);
        else if (c.owner == 'enemy') this.enemy_hand_cont.addChild(display.bitmap);
      }
    }

    // We always remove every event listeners and re-register it because
    // there is a possibility that the card - event handler relationship has changed.
    display.bitmap.removeAllEventListeners();

    c.prev_rot = display.bitmap.rotation;
    display.bitmap.addEventListener('mouseover', function(c, h) {
      return function(e) {
        if (h.current_hover) {
          // If two cards overlaps, select the one that has higher offset
          if (h.current_hover.offset < c.offset) {
            // Revert previously hovered card to a orignal state
            h.current_hover.display.bitmap.rotation = h.current_hover.prev_rot;
            h.current_hover.display.bitmap.scaleX = 1;
            h.current_hover.display.bitmap.scaleY = 1;

            // unhover hovered card
            h.my_hand_cont.setChildIndex(h.current_hover.display.bitmap, h.current_hover.offset);

            if (h.current_hover.offset + 1 < h.my_hands.length) {
              h.my_hand_cont.setChildIndex(h.my_hands[h.current_hover.offset + 1].bitmap, h.current_hover.display.offset + 1);
            }

            h.current_hover = c;

            // move hovered card into the front
            h.my_hand_cont.setChildIndex(h.current_hover.display.bitmap, h.current_hover.display.offset + 1);

            if (h.current_hover.offset + 1 < h.my_hands.length) {
              h.my_hand_cont.setChildIndex(h.my_hands[h.current_hover.display.offset + 1].bitmap, h.current_hover.display.offset);
            }
            h.stage.update();
          } else return;
        } else {
          h.current_hover = c;
        }
        c.prev_rot = c.display.bitmap.rotation;
        c.display.bitmap.rotation = 0;

        c.display.bitmap.scaleX = 1;
        c.display.bitmap.scaleY = 1;

        // move hovered card into the front
        h.my_hand_cont.setChildIndex(h.current_hover.display.bitmap, h.current_hover.offset + 1);

        if (h.current_hover.offset + 1 < h.my_hands.length) {
          h.my_hand_cont.setChildIndex(h.my_hands[h.current_hover.display.offset + 1].bitmap, h.current_hover.display.offset);
        }


        //  console.log('Index :: ', h.current_hover.offset, h.my_hand_cont.getChildIndex(h.current_hover.display.bitmap));
        if (h.current_hover.offset == -1) {
          console.error('something is wrong', h.current_hover);
        }
        h.stage.update();
      };
    }(c, this));

    display.bitmap.addEventListener('mouseout', function(c, h) {
      return function(e) {
        if (h.current_hover == c) {
          // unhover hovered card
          h.my_hand_cont.setChildIndex(h.current_hover.display.bitmap, h.current_hover.offset);

          if (h.current_hover.offset + 1 < h.my_hands.length) {
            h.my_hand_cont.setChildIndex(h.my_hands[h.current_hover.offset + 1].bitmap, h.current_hover.offset + 1);
          }
          h.current_hover = null;
        }

        c.display.bitmap.rotation = c.prev_rot;
        c.display.bitmap.scaleX = 0.7;
        c.display.bitmap.scaleY = 0.7;
        h.stage.update();
      };
    }(c, this));

    display.bitmap.addEventListener('mousedown', function(c, h) {
      return function(e) {
        // Click is only available for a current hovering object
        if (h.current_hover && h.current_hover == c) {
          h.selected_card = c;
          h.selected_card.sel_x = e.stageX - h.selected_card.display.bitmap.x;
          h.selected_card.sel_y = e.stageY - h.selected_card.display.bitmap.y;
        }
      };
    }(c, this));
  }

  mine = -1;
  enemy = -1;

  console.log('Processed :: ', this.cards.num_card());
  for (var i = 0; i < this.cards.num_card(); i++) {
    if (this.cards.card_list[i].where != 'hand') continue;
    var c = this.cards.card_list[i];
    var display = c.display;

    if (c.owner == 'me') mine++;
    else if (c.owner == 'enemy') enemy++;

    // Rotate a image a bit. 
    if (c.owner == 'me') {
      display.bitmap.rotation = 0;
      if (num_my_card >= 2) display.bitmap.rotation = -30 + (60 / (num_my_card - 1)) * mine;

      display.bitmap.x = this.screen_x / 2 - Math.floor(num_my_card / 2) * 200 + mine * 200;
      display.bitmap.y = 0;

      var x = 0;
      var y = 0;

      if (display.bitmap.image) {
        x = display.bitmap.image.width * 0.7;
        y = display.bitmap.image.height * 0.7;
      }

      var deg = display.bitmap.rotation;
      c.prev_rot = deg;


      deg = 2 * Math.PI * deg / 360;
      display.bitmap.x += (y * Math.sin(deg) + x * (1 - Math.cos(deg))) / 2;
      display.bitmap.y = -(y * (Math.cos(deg) - 1) + x * Math.sin(deg)) / 2;

      c.offset = mine;
      display.offset = mine;

      //this.my_hand_cont.setChildIndex(display.bitmap, )
      /*
            console.log('Num My Card :: ', num_my_card, 'Deg :: ', display.bitmap.rotation);
            console.log('Cards :: ', this.cards.card_list);
            console.log('My Hands :: ', this.my_hands);
            console.log('Hand Container :: ', this.my_hand_cont.children);
            console.log('location :: x ', display.bitmap.x, ' y :: ', display.bitmap.y);
            */
    } else {
      display.bitmap.rotation = -30 + (60 / num_enemy_card) * enemy;
      if (num_enemy_card % 2 == 0 && enemy == num_enemy_card / 2) display.bitmap.rotation += (60 / num_enemy_card);

      display.bitmap.x = 700 - Math.floor(num_enemy_card / 2) * 300 + enemy * 300;

      c.offset = enemy;
      display.offset = enemy;
    }
  }

  for (var i = num_my_card; i < this.my_hands.length; i++) {
    var res = this.my_hand_cont.removeChild(this.my_hands[i].bitmap);
    this.my_hands.splice(i, 1);
    // console.log('Removed :: ', res);
    i--;
  }

  var chk = false;
  for (var i = 0; i < this.my_hands.length; i++) {
    if (this.my_hands[i].bitmap != this.my_hand_cont.children[i]) {
      //   console.log('NOT EQUAL :: ', i, ' :: ', this.my_hands[i].bitmap, this.my_hand_cont.children[i]);
    }
  }

  console.log('------------------------------------');

  this.stage.update();
};
Hearthstone.prototype.begin_match = function() {

};
// Mulligun (choosing the cards to start)
// 카드들의 offset 꼭 설정할것!!
Hearthstone.prototype.mulligun = function(no_card_remove) {
  if (!this.is_selecting_center) return;

  for (var i = 0; i < this.center_cards.num_card(); i++) {
    var c = this.center_cards.card_list[i];
    var img = hearth_resource.get_img(c.unique, c.img_src, function(h) {
      return function() {
        h.mulligun();
      };
    }(this));

    // Choose Image to display. 
    var new_bitmap = false;
    if (img) {
      if (!c.real_img) {
        // Remove dummy image
        if (c.bitmap) {
          c.bitmap.removeAllEventListeners();
          this.center_cont.removeChild(c.bitmap);
        }
        c.bitmap = new createjs.Bitmap(img.img);
        c.real_img = true;
        new_bitmap = true;
      } else {
        continue; // if it is not first time registering the image, then we don't have to do process below
      }
    } else {
      if (!c.real_img && !c.bitmap) {
        // Replace image with white blank
        c.bitmap = new createjs.Shape();
        c.bitmap.graphics.beginFill('blue').drawRect(0, 0, 100, 150);
        new_bitmap = true;
      } else continue; // when the blank image is already registered
    }

    var on_mouse_down = function(c) {
      for (var i = 0; i < this.remove_candidate.length; i++) {
        if (this.remove_candidate[i] == c.offset) {
          // Off 
          c.added_images[0].removeAllEventListeners();
          this.center_cont.removeChild(c.added_images[0]);
          this.remove_candidate.splice(i, 1);
          this.stage.update();
          return;
        }
      }
      this.remove_candidate.push(c.offset);
      var text = new createjs.Text('X', '250px Arial', 'red');
      text.addEventListener('mousedown', on_mouse_down.bind(this, c));

      c.added_images = [];
      c.added_images.push(text);

      text.x = c.bitmap.x + c.bitmap.getBounds().width / 2 - text.getBounds().width / 2;
      text.y = c.bitmap.y + c.bitmap.getBounds().height / 2 - text.getBounds().height / 2;
      this.center_cont.addChild(text);
      this.stage.update();
    };

    if (!no_card_remove) {
      c.bitmap.addEventListener('mousedown', function(c, h) {
        return on_mouse_down.bind(h, c);
      }(c, this));
    }

    c.bitmap.x = 100 + 400 * i;
    c.bitmap.y = 100;
    this.center_cont.addChild(c.bitmap);

  }
  this.stage.update();
};
// 발견 혹은 선택 시에 화면 정 가운데 카드들 보여주는거
Hearthstone.prototype.show_cards = function() {
  if (!this.is_selecting_center) return;

  console.log("Show cards :: ", this.center_cards.card_list);

  for (var i = 0; i < this.center_cards.num_card(); i++) {
    var c = this.center_cards.card_list[i];
    var img = hearth_resource.get_img(c.unique, c.img_src, function(h) {
      return function() {
        h.show_cards();
      };
    }(this));

    // Choose Image to display. 
    var new_bitmap = false;
    if (img) {
      if (!c.real_img) {
        // Remove dummy image
        if (c.bitmap) {
          c.bitmap.removeAllEventListeners();
          this.center_cont.removeChild(c.bitmap);
        }

        c.bitmap = new createjs.Bitmap(img.img);
        c.real_img = true;
        new_bitmap = true;
      } else {
        continue; // if it is not first time registering the image, then we don't have to do process below`
      }
    } else {
      if (!c.real_img && !c.bitmap) {
        // Replace image with white blank
        c.bitmap = new createjs.Shape();
        c.bitmap.graphics.beginFill('blue').drawRect(0, 0, 100, 150);
        new_bitmap = true;
      } else continue; // when the blank image is already registered
    }

    c.bitmap.addEventListener('mousedown', function(c, h, i) {
      return function(e) {
        // Click is only available for a current hovering object
        h.is_selecting_center = false;
        h.socket.emit('select-done', {
          id: i
        });
        h.center_cards.card_list = []; // Remove center cards
        h.center_cont.removeAllChildren();
        h.stage.update();
      };
    }(c, this, i));

    c.bitmap.x = 100 + 400 * i;
    c.bitmap.y = 100;
    this.center_cont.addChild(c.bitmap);
  }

  this.stage.update();
};

var hearthstone = new Hearthstone();

// Whenever the window resizes, we should adjust the size of the canvas too
$(window).on('resize', function() {
  $('#field').width($(window).width());
  $('#field').height($(window).height());
});