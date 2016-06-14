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
HearthResource.prototype.get_img = function(unique, callback) {
  for (var i = 0; i < img_list.length; i++) {
    if (img_list[i].unique == unique) return img_list[i];
  }

  // If not found
  this.reg_image(unique, src, true, callback);
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
      'token': token
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
  var card_list = new Deck();
  this.stage = new createjs.Stage(document.getElementById('field'));

  this.my_field_cont = new createjs.Container();
  this.my_hand_cont = new createjs.Container();
  this.enemy_field_cont = new createjs.Container();
  this.enemy_hand_cont = new createjs.Container();

  // Screen Info 
  this.my_hand_y = 1000;
  this.enemy_hand_y = 100;

  // UI
  this.selected_card = null;
  this.current_hover = null;

}
Hearthstone.prototype.init = function() {
  this.socket.on('hearth-event', function(h) {
    return function(data) {
      if (data.event) {

      }

      h.card_list = []; // Change the entire card list with newly received ones

      for (var i = 0; i < data.card_info.length; i++) {
        var c = data.card_info[i];
        h.card_list.add_card(new HearthCard(
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
        h.selected_card.bitmap.x = e.stageX;
        h.selected_card.bitmap.y = e.stageY;
      }
    }
  }(this));
}
Hearthstone.prototype.draw_field = function() {
  for (var i = 0; i < this.card_list.length; i++) {
    if (this.card_list.owner == 'me') {
      var img = hearth_resource.get_img(this.card_list[i].unique, this.card_list[i].img_src);
      if (img) {
        this.card_list[i].bitmap = new createjs.Bitmap(img);

      }
    } else {

    }
  }
}

Hearthstone.prototype.draw_hand = function() {
    var num_my_card = 0;
    var num_enemy_card = 0;
    for (var i = 0; i < this.card_list.num_card(); i++) {
      if (this.card_list[i].where == 'hand') {
        if (this.card_list[i].owner == 'me') {
          num_my_card++;
        } else {
          num_enemy_card++;
        }
      }
    }

    var mine = 0,
      enemy = 0;

    for (var i = 0; i < this.card_list.num_card(); i++) {
      var c = this.card_list[i];
      var deg = 0;
      var img = hearth_resource.get_img(c.unique, c.img_src, function(h) {
        return function() {
          h.draw_hand();
        }
      }(this));

      // Choose Image to display. 
      var new_bitmap = false;
      if (img) {
        if (!this.card_list[i].real_img) {
          this.card_list[i].bitmap = new createjs.Bitmap(img);
          this.card_list[i].real_img = true;
          new_bitmap = true;
        }
      } else {
        // Replace image with white blank
        this.card_list[i].bitmap = new createjs.Bitmap(new createjs.Graphics().f('#000').drawRect(0, 0, 150, 200));
        new_bitmap = true;
      }

      // Rotate a image a bit. 
      if (c.owner == 'me') {
        this.card_list[i].bitmap.rotation = -30 + (60 / num_my_card) * mine;
        this.card_list[i].bitmap.x = 400 - Math.floor(num_my_card / 2) * 100 + mine * 100;
        this.card_list[i].bitmap.y = this.my_hand_y;
        this.card_list[i].offset = mine;
        mine++;
      } else {
        this.card_list[i].bitmap.rotation = -30 + (60 / num_enemy_card) * enemy;
        this.card_list[i].bitmap.x = 400 - Math.floor(num_enemy_card / 2) * 100 + enemy * 100;
        this.card_list[i].bitmap.y = this.enemy_hand_y;
        this.card_list[i].offset = enemy;
        enemy++;
      }

      this.card_list[i].prev_rot = this.card_list[i].bitmap.rotation;

      this.card_list[i].bitmap.addEventListener('mouseover', function(c, h) {
        return function(e) {
          if (h.current_hover) {
            // If two cards overlaps, select the one that has higher offset
            if (h.current_hover.offset < c.offset) {
              // Revert previously hovered card to a orignal state
              h.current_hover.bitmap.rotation = h.current_hover.prev_rot;
              h.current_hover.bitmap.scaleX = 1;
              h.current_hover.bitmap.scaleY = 1;

              h.current_hover = c;
            } else return;
          } else {
            h.current_hover = c;
          }
          c.prev_rot = c.bitmap.rotation;
          c.bitmap.rotation = 0;

          c.bitmap.scaleX = 1.5;
          c.bitmap.scaleY = 1.5;
        }
      }(this.card_list[i], this));

      this.card_list[i].bitmap.addEventListener('mouseout', function(c, h) {
        return function(e) {
          if (h.current_hover == c) {
            h.current_hover = null;
          }

          c.bitmap.rotation = c.prev_rot;
          c.bitmap.scaleX = 1;
          c.bitmap.scaleY = 1;
        }
      }(this.card_list[i], this));

      this.card_list[i].bitmap.addEventListener('mousedown', function(c, h) {
        // Click is only available for a current hovering object
        if (h.current_hover && h.current_hover == c) {
          h.selected_card = c;
        }
      }(this.card_list[i], this));

      this.stage.addChild(this.card_list[i].bitmap);
    }
  }
  // Mulligun (choosing the cards to start)
Hearthstone.prototype.mulligun = function(cards) {

}


var stage = new createjs.Stage(document.getElementById('field'));

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