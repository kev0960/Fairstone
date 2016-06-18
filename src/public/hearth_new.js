function HearthResource() {
  this.img_list = [];
}

// Register Image when ready 
// dup 이 활성화 되있다면 이미 존재하는 이미지 이기 때문에 list 에 추가하지 않는다.
HearthResource.prototype.reg_img = function(unique, src, dup, call_back) {
  var img = new Image();
  img.src = src;

  img.onload = function(that) {
    return function() {
      if (!dup) {
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

function HearthCard(unique, id, owner, name, mana, health, dmg, img_src, state, where) {
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

  // UI Related
  this.bitmap = null;
  this.real_img = false;
  this.offset = 0;

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

function Hearthstone() {
  this.match_token = localStorage.getItem('hearth-match-token');
  this.socket = io.connect('/match/' + this.match_token);

  $.ajax({
    url: '/match',
    data: {
      'token': this.match_token
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
    }
  }(this.socket, this.match_token));

  // List of the cards
  this.cards = new Deck();
  this.center_cards = new Deck();

  this.stage = new createjs.Stage(document.getElementById('field'));
  this.stage.enableMouseOver(20);

  this.my_field_cont = new createjs.Container();
  this.my_hand_cont = new createjs.Container();
  this.enemy_field_cont = new createjs.Container();
  this.enemy_hand_cont = new createjs.Container();
  this.center_cont = new createjs.Container();

  this.stage.addChild(this.my_field_cont);
  this.stage.addChild(this.my_hand_cont);
  this.stage.addChild(this.enemy_field_cont);
  this.stage.addChild(this.enemy_hand_cont);
  this.stage.addChild(this.center_cont);

  // Screen Info 
  this.my_hand_y = 300;
  this.enemy_hand_y = 100;

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
      }
    }
  }(this));

  // Initialize UI
  this.stage.addEventListener('pressmove', function(h) {
    return function(e) {
      if (h.selected_card) {
        h.selected_card.bitmap.x = e.stageX - h.selected_card.sel_x;
        h.selected_card.bitmap.y = e.stageY - h.selected_card.sel_y;

        h.stage.update();
      }
    }
  }(this));
}
Hearthstone.prototype.draw_field = function() {
  for (var i = 0; i < this.cards.num_card(); i++) {
    if (this.card_list.owner == 'me') {
      var img = hearth_resource.get_img(this.card_list[i].unique, this.card_list[i].img_src).img;
      if (img) {
        this.card_list[i].bitmap = new createjs.Bitmap(img);

      }
    }
    else {

    }
  }
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

  var mine = 0,
    enemy = 0;

  for (var i = 0; i < this.cards.num_card(); i++) {
    var c = this.cards.card_list[i];
    var deg = 0;
    var img = hearth_resource.get_img(c.unique, c.img_src, function(h) {
      return function() {
        h.draw_hand();
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
        img.img.crossOrigin = 'Anonymous'
        c.bitmap = new createjs.Bitmap(img.img);
        c.real_img = true;
        new_bitmap = true;
      }
      else {
        return; // if it is not first time registering the image, then we don't have to do process below
      }
    }
    else {
      if (!c.real_img && !c.bitmap) {
        // Replace image with white blank
        c.bitmap = new createjs.Shape();
        c.bitmap.graphics.beginFill('blue').drawEllipse(50, 50, 100, 150)
        new_bitmap = true;
      }
      else return; // when the blank image is already registered
    }

    // Rotate a image a bit. 
    if (c.owner == 'me') {
      c.bitmap.rotation = -30 + (60 / num_my_card) * mine;
      c.bitmap.x = 400 - Math.floor(num_my_card / 2) * 100 + mine * 100;
      c.bitmap.y = this.my_hand_y;
      c.offset = mine;
      mine++;
    }
    else {
      c.bitmap.rotation = -30 + (60 / num_enemy_card) * enemy;
      c.bitmap.x = 400 - Math.floor(num_enemy_card / 2) * 100 + enemy * 100;
      c.bitmap.y = this.enemy_hand_y;
      c.offset = enemy;
      enemy++;
    }

    c.prev_rot = c.bitmap.rotation;
    c.bitmap.addEventListener('mouseover', function(c, h) {
      return function(e) {
        if (h.current_hover) {
          // If two cards overlaps, select the one that has higher offset
          if (h.current_hover.offset < c.offset) {
            // Revert previously hovered card to a orignal state
            h.current_hover.bitmap.rotation = h.current_hover.prev_rot;
            h.current_hover.bitmap.scaleX = 1;
            h.current_hover.bitmap.scaleY = 1;

            h.current_hover = c;
            h.stage.update();
          }
          else return;
        }
        else {
          h.current_hover = c;
        }
        c.prev_rot = c.bitmap.rotation;
        c.bitmap.rotation = 0;

        c.bitmap.scaleX = 1.5;
        c.bitmap.scaleY = 1.5;

        h.stage.update();
      }
    }(c, this));

    c.bitmap.addEventListener('mouseout', function(c, h) {
      return function(e) {
        if (h.current_hover == c) {
          h.current_hover = null;
        }

        c.bitmap.rotation = c.prev_rot;
        c.bitmap.scaleX = 1;
        c.bitmap.scaleY = 1;

        h.stage.update();
      }
    }(c, this));

    c.bitmap.addEventListener('mousedown', function(c, h) {
      return function(e) {
        // Click is only available for a current hovering object
        if (h.current_hover && h.current_hover == c) {
          h.selected_card = c;
          h.selected_card.sel_x = e.stageX - h.selected_card.bitmap.x;
          h.selected_card.sel_y = e.stageY - h.selected_card.bitmap.y;
        }
      };
    }(c, this));

    if (c.owner == 'me') this.my_hand_cont.addChild(c.bitmap);
    else if (c.owner == 'enemy') this.enemy_hand_cont.addChild(c.bitmap);
  }
  this.stage.update();
};

Hearthstone.prototype.test = function() {
  var c1 = new HearthCard('ooze', 1, 'me', 'Ooze', 2, 3, 2, '/acidic swamp ooze.jpg', [], 'hand');
  var c2 = new HearthCard('some', 2, 'me', 'some', 2, 3, 2, '/card-image/original/CS2_221.png', [], 'hand');

  hearth_resource.reg_img('ooze', '/acidic swamp ooze.jpg');
  hearth_resource.reg_img('some', '/card-image/original/CS2_221.png');
  this.center_cards.add_card(c1);
  this.center_cards.add_card(c2);
  c1.offset = 0;
  c2.offset = 1;
  this.is_selecting_center = true;
  this.mulligun();

  this.stage.update();
};

// Mulligun (choosing the cards to start)
// 카드들의 offset 꼭 설정할것!!
Hearthstone.prototype.mulligun = function() {
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
          if (c.owner == 'me') {
            var res = this.center_cont.removeChild(c.bitmap);
            console.log(res)
          }
          else if (c.owner == 'enemy') this.center_cont.removeChild(c.bitmap);
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
        for (var i = 0; i < h.remove_candidate.length; i++) {
          if (h.remove_candidate[i] == c.offset) {
            // Off 
            h.center_cont.removeChild(c.added_images[0]);
            h.remove_candidate.splice(i, 1);
            h.stage.update();
            return;
          }
        }
        h.remove_candidate.push(c.offset);
        var text = new createjs.Text('X', '150px Arial', 'black');
        c.added_images = [];
        c.added_images.push(text);

        text.x = c.bitmap.x + 25;
        text.y = c.bitmap.y + 26;
        h.center_cont.addChild(text);
        h.stage.update();
      }
    }(c, this));

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
      }
    }(c, this));
  }
};

var hearthstone = new Hearthstone();
hearthstone.test();

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