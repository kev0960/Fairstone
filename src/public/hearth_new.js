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
  console.log('Reg image source :: ', src);
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
    }
  }(this);
}
HearthResource.prototype.get_img = function(unique, src, callback) {
  for (var i = 0; i < this.img_list.length; i++) {
    if (this.img_list[i].unique == unique) return this.img_list[i];
  }

  // If not found
  this.reg_img(unique, src, true, callback);
}

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
}
Deck.prototype.num_card = function() {
  return this.card_list.length;
}

function DisplayCard(c) {
  this.c = c; // Refering card

  this.bitmap = null;
  this.load_img_name = ''; // Name of the image to load

  this.real_img = false;
  this.offset = 0;

  // Check whether event handler is registered
  this.eh_registered = false;
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
        console.log('emit done, match-token :: ', match_token, ' user_id : ', d.id)
      }
    }
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
  this.my_hand_y = 550;
  this.enemy_hand_y = 100;

  this.my_field_cont.y = 400;
  this.my_hand_cont.y = this.my_hand_y;

  this.enemy_field_cont.y = 200;
  this.enemy_hand_cont.x = 0;

  // UI
  this.selected_card = null;
  this.current_hover = null;
  this.is_selecting_center = false;

  // Mulligun
  this.remove_candidate = [];

  this.init();
}
Hearthstone.prototype.init = function() {
  this.socket.on('hearth-event', function(h) {
    return function(data) {
      if (data.event) {

      }

      h.cards.card_list = []; // Change the entire card list with newly received ones

      for (var i = 0; i < data.card_info.length; i++) {
        var c = data.card_info[i];
        h.cards.add_card(new HearthCard(
          c.unique,
          c.id,
          c.owner,
          c.name,
          c.mana,
          c.health,
          c.dmg,
          c.img_path,
          c.state,
          c.where
        ));

        hearth_resource.reg_img(c.unique, c.img_path);
      }

      h.draw_hand();
      h.draw_field();
    }
  }(this));

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
          c.health,
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
          h.center_cont.removeChild(h.center_cards.card_list[h.remove_candidate[i]].added_images[0]);
          h.center_cont.removeChild(h.center_cards.card_list[h.remove_candidate[i]].bitmap);
        }
      });

      h.is_selecting_center = true;
      h.mulligun();
    }
  }(this));

  this.socket.on('new-starting-cards', function(h) {
    return function(data) {
      console.log('New Starting Cards :: ', data)
      for (var i = 0; i < h.remove_candidate.length; i++) {
        var c = data.cards[i];
        h.center_cards.card_list[h.remove_candidate[i]] = new HearthCard(
          c.unique,
          c.id,
          c.owner,
          c.name,
          c.mana,
          c.health,
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
    }
  }(this));

  this.socket.on('begin-match', function(h) {
    return function(data) {
      console.log('Game has started!');
      h.is_selecting_center = false;

      // When the game is started remove all of the mulligun cards
      for (var i = 0; i < h.center_cards.num_card(); i++) {
        var res = h.center_cont.removeChild(h.center_cards.card_list[i].bitmap);
        console.log("removed? : ", res);
        h.center_cards.card_list[i].bitmap.removeAllEventListeners();
      }

      h.stage.update();
    }
  }(this));

  // Initialize UI
  this.stage.addEventListener('pressmove', function(h) {
    return function(e) {
      if (h.selected_card && h.selected_card.where == 'hand') {
        h.selected_card.display.bitmap.x = e.stageX - h.selected_card.sel_x;
        h.selected_card.display.bitmap.y = e.stageY - h.selected_card.sel_y;

        h.stage.update();
      }
    }
  }(this));

  this.stage.addEventListener('pressup', function(h) {
    return function(e) {
      if (h.selected_card && h.selected_card.where == 'hand') {
        console.log('Card Dropped AT :: ', e.stageY);
        h.draw_hand();
        // TODO : Change to a field
        if (e.stageY <= 100) {
          h.socket.emit('hearth-user-play-card', {
            id: h.selected_card.id,
            at: 0
          });
        }
      }
    }
  }(this));
};
Hearthstone.prototype.draw_field = function() {
  var num_my_card = 0;
  var num_enemy_card = 0;
  for (var i = 0; i < this.cards.num_card(); i++) {
    if (this.cards.card_list[i].where == 'field') {
      if (this.cards.card_list[i].owner == 'me') {
        this.cards.card_list[i].offset = num_my_card;
        num_my_card++;
      }
      else {
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
      }
    }(this));

    var display = null;
    var new_display = false;

    // Check whether there are available slot for DisplayCard
    if (c.owner == 'me') {
      if (this.my_fields.length <= mine) {
        this.my_fields.push(new DisplayCard(c));
        new_display = true;
      }
      else {
        this.my_fields[mine].c = c;
      }
      display = this.my_fields[mine];
    }
    else if (c.owner == 'enemy') {
      if (this.enemy_fields.length <= enemy) {
        this.enemy_fields.push(new DisplayCard(c));
        new_display = true;
      }
      else {
        this.enemy_fields[enemy].c = c;
      }
      display = this.enemy_fields[enemy];
    }

    c.display = display;

    if (img) {
      // 처음으로 이미지를 등록하는 순간 
      if (!display.real_img || (display.load_img_name != c.unique)) {
        display.bitmap.removeAllEventListeners();

        if (c.owner == 'me') {
          var res = this.my_field_cont.removeChild(display.bitmap);
        }
        else if (c.owner == 'enemy') this.enemy_field_cont.removeChild(display.bitmap);

        display.bitmap = new createjs.Bitmap(img.img);
        display.real_img = true;
        display.load_img_name = c.unique;
        display.eh_registered = false;

        var mask = new createjs.Shape(new createjs.Graphics().f("#000").drawEllipse(0, 0, 170, 230));
        display.bitmap.mask = mask;

        if (c.owner == 'me') {
          this.my_field_cont.addChild(display.bitmap);
        }
        else if (c.owner == 'enemy') this.enemy_field_cont.addChild(display.bitmap);
      }
      else {
        continue; // if it is not first time registering the image, then we don't have to do process below
      }
    }
    else {
      if (!display.real_img && !display.bitmap) {
        // Replace image with white blank
        display.bitmap = new createjs.Shape();
        display.bitmap.graphics.beginFill('blue').drawEllipse(0, 0, 150, 200)

        if (c.owner == 'me') this.my_field_cont.addChild(display.bitmap);
        else if (c.owner == 'enemy') this.enemy_field_cont.addChild(display.bitmap);
      }
      // when the image is changed but changed image is not found
      // We first erase the previous image and replace with the blank image
      else if (display.load_img_name != c.unique) {
        display.bitmap.removeAllEventListeners();
        display.eh_registered = false;
        display.real_img = false;

        if (c.owner == 'me') {
          this.my_field_cont.removeChild(display.bitmap);
        }
        else if (c.owner == 'enemy') this.enemy_field_cont.removeChild(display.bitmap);

        // Replace image with white blank
        display.bitmap = new createjs.Shape();
        display.bitmap.graphics.beginFill('blue').drawEllipse(0, 0, 160, 210)

        if (c.owner == 'me') this.my_field_cont.addChild(display.bitmap);
        else if (c.owner == 'enemy') this.enemy_field_cont.addChild(display.bitmap);
      }
      else continue; // when the blank image is already registered
    }

    // If Event handlers are already registered
    if (display.eh_registered) return;
    if (display.real_img) display.eh_registered = true;

    if (c.owner == 'me') {
      display.bitmap.x = 400 - Math.floor(num_my_card / 2) * 150 + mine * 300;
      display.offset = mine;

      if (display.bitmap.mask) {
        display.bitmap.mask.x = 400 - Math.floor(num_my_card / 2) * 150 + mine * 300 + 68;
        display.bitmap.mask.y = 58;
      }
    }
    else {
      display.bitmap.x = 400 - Math.floor(num_enemy_card / 2) * 100 + enemy * 300;
      display.offset = enemy;

      if (display.bitmap.mask) {
        display.bitmap.mask.x = 400 - Math.floor(num_my_card / 2) * 150 + enemy * 300 + 50;
      }
    }

    display.bitmap.addEventListener('mouseover', function(c, h) {
      return function(e) {
        // When hovers on the field minion, shows the card info
        h.current_hover = c;

        h.stage.update();
      }
    }(c, this));

    display.bitmap.addEventListener('mouseout', function(c, h) {
      return function(e) {
        if (h.current_hover == c) {
          h.current_hover = null;
        }

        h.stage.update();
      }
    }(c, this));
    display.bitmap.addEventListener('mousedown', function(c, h) {
      return function(e) {
        h.selected_card = c;
        console.log('Selected :: ', c);
      };
    }(c, this));
  }
  this.stage.update();
}
Hearthstone.prototype.draw_hand = function() {
  var num_my_card = 0;
  var num_enemy_card = 0;
  for (var i = 0; i < this.cards.num_card(); i++) {
    if (this.cards.card_list[i].where == 'hand') {
      if (this.cards.card_list[i].owner == 'me') {
        num_my_card++;
      }
      else {
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
      }
    }(this));

    var display = null;
    var new_display = false;

    // Check whether there are available slot for DisplayCard
    if (c.owner == 'me') {
      if (this.my_hands.length <= mine) {
        this.my_hands.push(new DisplayCard(c));
        new_display = true;
      }
      else {
        this.my_hands[mine].c = c;
      }
      display = this.my_hands[mine];
    }
    else if (c.owner == 'enemy') {
      if (this.enemy_hands.length <= enemy) {
        this.enemy_hands.push(new DisplayCard(c));
        new_display = true;
      }
      else {
        this.enemy_hands[enemy].c = c;
      }
      display = this.enemy_hands[enemy];
    }

    c.display = display;

    console.log('Display : ', display, ' card? ', c);

    if (img) {
      // 처음으로 이미지를 등록하는 순간 
      if (!display.real_img || (display.load_img_name != c.unique)) {
        if (display.bitmap) display.bitmap.removeAllEventListeners();

        if (c.owner == 'me') {
          var res = this.my_hand_cont.removeChild(display.bitmap);
        }
        else if (c.owner == 'enemy') this.enemy_hand_cont.removeChild(display.bitmap);

        display.bitmap = new createjs.Bitmap(img.img);
        display.bitmap.scaleX = 0.7;
        display.bitmap.scaleY = 0.7;

        display.real_img = true;
        display.load_img_name = c.unique;
        display.eh_registered = false;

        if (c.owner == 'me') this.my_hand_cont.addChild(display.bitmap);
        else if (c.owner == 'enemy') this.enemy_hand_cont.addChild(display.bitmap);
      }
      else {
        continue; // if it is not first time registering the image, then we don't have to do process below
      }
    }
    else {
      if (!display.real_img && !display.bitmap) {
        // Replace image with white blank
        display.bitmap = new createjs.Shape();
        display.bitmap.graphics.beginFill('blue').drawEllipse(50, 50, 100, 150)

        if (c.owner == 'me') this.my_hand_cont.addChild(display.bitmap);
        else if (c.owner == 'enemy') this.enemy_hand_cont.addChild(display.bitmap);
      }
      // when the image is changed but changed image is not found
      // We first erase the previous image and replace with the blank image
      else if (display.load_img_name != c.unique) {
        display.bitmap.removeAllEventListeners();
        display.eh_registered = false;
        display.real_img = false;

        if (c.owner == 'me') {
          var res = this.my_hand_cont.removeChild(display.bitmap);
        }
        else if (c.owner == 'enemy') this.enemy_hand_cont.removeChild(display.bitmap);

        // Replace image with white blank
        display.bitmap = new createjs.Shape();
        display.bitmap.graphics.beginFill('blue').drawEllipse(50, 50, 100, 150)

        if (c.owner == 'me') this.my_hand_cont.addChild(display.bitmap);
        else if (c.owner == 'enemy') this.enemy_hand_cont.addChild(display.bitmap);
      }
      else continue; // when the blank image is already registered
    }

    // If Event handlers are already registered
    if (display.eh_registered) return;
    if (display.real_img) display.eh_registered = true;

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
              h.my_hand_cont.setChildIndex(h.my_hands[h.current_hover.offset + 1], h.current_hover.display.offset + 1);
            }

            h.current_hover = c;

            // move hovered card into the front
            h.my_hand_cont.setChildIndex(h.current_hover.display.bitmap, h.current_hover.display.offset + 1);

            if (h.current_hover.offset + 1 < h.my_hands.length) {
              h.my_hand_cont.setChildIndex(h.my_hands[h.current_hover.display.offset + 1], h.current_hover.display.offset);
            }
            h.stage.update();
          }
          else return;
        }
        else {
          h.current_hover = c;
        }
        c.prev_rot = c.display.bitmap.rotation;
        c.display.bitmap.rotation = 0;

        c.display.bitmap.scaleX = 1;
        c.display.bitmap.scaleY = 1;

        // move hovered card into the front
        h.my_hand_cont.setChildIndex(h.current_hover.display.bitmap, h.current_hover.offset + 1);

        if (h.current_hover.offset + 1 < h.my_hands.length) {
          h.my_hand_cont.setChildIndex(h.my_hands[h.current_hover.display.offset + 1], h.current_hover.display.offset);
        }


        console.log('Index :: ', h.current_hover.offset, h.my_hand_cont.getChildIndex(h.current_hover.display.bitmap));
        if (h.current_hover.offset == -1) {
          console.error('something is wrong', h.current_hover);
        }
        h.stage.update();
      }
    }(c, this));

    display.bitmap.addEventListener('mouseout', function(c, h) {
      return function(e) {
        if (h.current_hover == c) {
          // unhover hovered card
          h.my_hand_cont.setChildIndex(h.current_hover.display.bitmap, h.current_hover.offset);

          if (h.current_hover.offset + 1 < h.my_hands.length) {
            h.my_hand_cont.setChildIndex(h.my_hands[h.current_hover.offset + 1], h.current_hover.offset + 1);
          }
          h.current_hover = null;
        }

        c.display.bitmap.rotation = c.prev_rot;
        c.display.bitmap.scaleX = 0.7;
        c.display.bitmap.scaleY = 0.7;
        h.stage.update();
      }
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
    var c = this.cards.card_list[i];
    var display = c.display;

    if (c.owner == 'me') mine++;
    else if (c.owner == 'enemy') enemy++;

    // Rotate a image a bit. 
    if (c.owner == 'me') {
      var deg = display.bitmap.rotation = -30 + (60 / (num_my_card - 1)) * mine;

      display.bitmap.x = 700 - Math.floor(num_my_card / 2) * 200 + mine * 200;
      display.bitmap.y = 0;

      var x = 0;
      var y = 0;
      if (display.bitmap.image) {
        x = display.bitmap.image.width * 0.7
        y = display.bitmap.image.height * 0.7
      }

      deg = 2 * Math.PI * deg / 360;
      display.bitmap.x += (y * Math.sin(deg) + x * (1 - Math.cos(deg))) / 2;
      display.bitmap.y = -(y * (Math.cos(deg) - 1) + x * Math.sin(deg)) / 2;

      console.log('X :: ', display.bitmap.x, ' Y : ', display.bitmap.y);
      console.log('x, y, deg, mine', x, y, display.bitmap.rotation, mine);

      c.offset = mine;
      display.offset = mine;
    }
    else {
      display.bitmap.rotation = -30 + (60 / num_enemy_card) * enemy;
      if (num_enemy_card % 2 == 0 && enemy == num_enemy_card / 2) display.bitmap.rotation += (60 / num_enemy_card);

      display.bitmap.x = 700 - Math.floor(num_enemy_card / 2) * 300 + enemy * 300;

      c.offset = enemy;
      display.offset = enemy;
    }
  }
  
  for(var i = num_my_card; i < this.my_hands.length; i ++) {
    this.my_hand_cont.removeChild(this.my_hands[i].bitmap);
    i --;
  }
  
  this.stage.update();
};

Hearthstone.prototype.test = function() {
  var c1 = new HearthCard('ooze', 1, 'me', 'Ooze', 2, 3, 2, '/acidic swamp ooze.jpg', [], 'field');
  var c2 = new HearthCard('some', 2, 'me', 'some', 2, 3, 2, '/card-image/original/CS2_221.png', [], 'field');

  hearth_resource.reg_img('ooze', '/acidic swamp ooze.jpg');
  hearth_resource.reg_img('some', '/card-image/original/CS2_221.png');
  this.cards.add_card(c1);
  this.cards.add_card(c2);
  c1.offset = 0;
  c2.offset = 1;
  this.draw_field();

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
      }
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
      }
      else {
        continue; // if it is not first time registering the image, then we don't have to do process below
      }
    }
    else {
      if (!c.real_img && !c.bitmap) {
        // Replace image with white blank
        c.bitmap = new createjs.Shape();
        c.bitmap.graphics.beginFill('blue').drawRect(0, 0, 100, 150)
        new_bitmap = true;
      }
      else continue; // when the blank image is already registered
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
    }

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
// 발견 혹은 선택 혹은 게임 시작 시에 화면 정 가운데 카드들 보여주는거
Hearthstone.prototype.show_cards = function() {
  if (!this.is_selecting_center) return;

  for (var i = 0; i < this.center_cards.num_card(); i++) {
    var img = hearth_resource.get_img(c.unique, c.img_src, function(h) {
      return function() {
        h.show_cards();
      }
    }(this));

    // Choose Image to display. 
    var new_bitmap = false;
    if (img) {
      if (!c.real_img) {
        // Remove dummy image
        if (c.bitmap) {
          c.bitmap.removeAllEventListeners();
          if (c.owner == 'me') {
            var res = this.my_hand_cont.removeChild(c.bitmap);
          }
          else if (c.owner == 'enemy') this.enemy_hand_cont.removeChild(c.bitmap);
        }

        c.bitmap = new createjs.Bitmap(img.img);
        c.real_img = true;
        new_bitmap = true;
      }
      else {
        continue; // if it is not first time registering the image, then we don't have to do process below
      }
    }
    else {
      if (!c.real_img && !c.bitmap) {
        // Replace image with white blank
        c.bitmap = new createjs.Shape();
        c.bitmap.graphics.beginFill('blue').drawRect(0, 0, 100, 150)
        new_bitmap = true;
      }
      else continue; // when the blank image is already registered
    }

    c.bitmap.addEventListener('mousedown', function(c, h) {
      return function(e) {
        // Click is only available for a current hovering object
        h.is_selecting_center = false;
        h.socket.emit('select-done', {
          id: c.id
        });
        h.center_cards.card_list = []; // Remove center cards
        h.center_cont.removeAllChildren();
        h.stage.update();
      }
    }(c, this));
  }
};

var hearthstone = new Hearthstone();
//hearthstone.test();

//var stage = new createjs.Stage(document.getElementById('field'));

/*
var img = new Image();
img.onload = function() {
  var container = new createjs.Container();

  var bitmap = new createjs.Bitmap(img);
  bitmap.regX = bitmap.regY = 0;
  bitmap.y = bitmap.x = 0;

  var maskShape = new createjs.Shape(new createjs.Graphics().f("#000").drawEllipse(0, 0, 150, 200));
  bitmap.mask = maskShape;

  container.addChild(bitmap);

  stage.addChild(container);

  var shape = new createjs.Shape(new createjs.Graphics().drawEllipse(0, 0, 150, 200));
  //shape.addEventListener('click', function() { alert('hi')});

  bitmap.addEventListener('pressmove', function() {
    console.log('hi!')
  })

  stage.enableMouseOver(20);
  stage.update();
};
img.src = 'acidic swamp ooze.jpg';
*/