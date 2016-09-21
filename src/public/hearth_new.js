function HearthResource() {
  this.img_list = [];
}

// Register Image when ready 
// dup 이 활성화 되있다면 이미 존재하는 이미지 이기 때문에 list 에 추가하지 않는다.
HearthResource.prototype.reg_img = function (unique, src, dup, call_back) {
  var img = new Image();
  // Convert source to server loading version
  var arr = src.split('/');
  src = '/card-image/' + arr[arr.length - 2] + '/' + arr[arr.length - 1];
  img.src = src;

  img.onload = function (that) {
    return function () {
      var found = false;
      for (var i = 0; i < that.img_list.length; i++) {
        if (that.img_list[i].unique == unique) {
          found = true;
          break;
        }
      }

      if (!found) {
        that.img_list.push({
          unique: unique,
          src: src,
          img: img
        });
      }
      if (call_back) call_back(unique, src, img);
    };
  } (this);
};
HearthResource.prototype.get_img = function (unique, src, callback) {
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
  this.state = (state ? state : []);
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

HearthCard.prototype.chk_state = function (state) {
  for (var i = 0; i < this.state.length; i++) {
    if (this.state[i] == state) return true;
  }
  return false;
};

function Deck() {
  this.card_list = [];
}
Deck.prototype.add_card = function (c) {
  this.card_list.push(c);
};
Deck.prototype.num_card = function () {
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
  }).success(function (socket, match_token) {
    return function (data) {
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
  } (this.socket, this.match_token));

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
  this.screen_x = window.innerWidth;
  this.screen_y = window.innerHeight;

  var field_canvas = document.getElementById("field");

  field_canvas.width = this.screen_x;
  field_canvas.height = this.screen_y;

  this.field_img = new createjs.Bitmap('/assets/images/field.png');
  this.field_img.scaleX = this.screen_x / 1920;
  this.field_img.scaleY = this.screen_y / 1040;
  this.field_img.x = 0;
  this.field_img.y = 0;

  this.stage.addChildAt(this.field_img);

  field_canvas.getContext("2d").width = this.screen_x;
  field_canvas.getContext("2d").height = this.screen_y;

  this.my_hand_y = this.screen_y * 0.85;
  this.enemy_hand_y = this.screen_y * 0.1;

  this.my_field_cont.y = this.screen_y * 0.45;
  this.my_hand_cont.y = this.my_hand_y;

  this.enemy_field_cont.y = this.screen_y * 0.25;
  this.enemy_hand_cont.x = 0;

  this.card_distance = 15;

  this.my_hero_y = this.screen_y / 1040 * 705;
  this.enemy_hero_y = this.screen_y / 1040 * 98;

  // Hero Info
  this.my_job = "";
  this.enemy_job = "";

  this.my_hero_id = -1;
  this.enemy_hero_id = -1;

  this.my_job_img = null;
  this.enemy_job_img = null;
  this.hero_img_scale = this.screen_y / 1560;

  this.my_hero_power = null;
  this.my_hero_power_name = null;

  this.enemy_hero_power = null;
  this.enemy_hero_power_name = null;

  this.my_hero_power_cost = null;
  this.enemy_hero_power_cost = null;

  this.my_hero_power_exhausted = null;
  this.enemy_hero_power_exhausted = null;

  this.my_hero_power_template = null;
  this.enemy_hero_power_template = null;

  // Hero Atk Img 
  this.my_hero_atk_img = new createjs.Bitmap('/assets/images/hero_attack.png');
  this.enemy_hero_atk_img = new createjs.Bitmap('/assets/images/hero_attack.png');

  // size of the hero image = 280. 
  this.my_hero_atk_img.x = this.screen_x / 2 - 140 * this.hero_img_scale;
  this.my_hero_atk_img.y = this.my_hero_y;
  this.enemy_hero_atk_img.x = this.screen_x / 2 - 140 * this.hero_img_scale;
  this.enemy_hero_atk_img.y = this.enemy_hero_y;

  this.my_hero_atk_img.scaleX = this.hero_img_scale;
  this.my_hero_atk_img.scaleY = this.hero_img_scale;

  this.enemy_hero_atk_img.scaleX = this.hero_img_scale;
  this.enemy_hero_atk_img.scaleY = this.hero_img_scale;

  this.stage.addChild(this.my_hero_atk_img);
  this.stage.addChild(this.enemy_hero_atk_img);

  this.my_hero_atk_img.visible = false;
  this.enemy_hero_atk_img.visible = false;

  // Hero Armor
  this.my_hero_armor_img = new createjs.Bitmap('/assets/images/hero_armor.png');
  this.enemy_hero_armor_img = new createjs.Bitmap('/assets/images/hero_armor.png');

  this.my_hero_armor_img.x = this.screen_x / 2 - 140 * this.hero_img_scale;
  this.my_hero_armor_img.y = this.my_hero_y;
  this.enemy_hero_armor_img.x = this.screen_x / 2 - 140 * this.hero_img_scale;
  this.enemy_hero_armor_img.y = this.enemy_hero_y;

  this.my_hero_armor_img.scaleX = this.hero_img_scale;
  this.my_hero_armor_img.scaleY = this.hero_img_scale;

  this.enemy_hero_armor_img.scaleX = this.hero_img_scale;
  this.enemy_hero_armor_img.scaleY = this.hero_img_scale;

  this.stage.addChild(this.my_hero_armor_img);
  this.stage.addChild(this.enemy_hero_armor_img);

  this.my_hero_armor_img.visible = false;
  this.enemy_hero_armor_img.visible = false;

  this.my_hero_armor = new createjs.Text("", "25px Arial", "white");
  this.enemy_hero_armor = new createjs.Text("", "25px Arial", "white");

  this.stage.addChild(this.my_hero_armor);
  this.stage.addChild(this.enemy_hero_armor);

  this.my_hero_armor.y = this.my_hero_y + 280 * (this.hero_img_scale - 0.3);
  this.my_hero_armor.x = this.screen_x / 2 + 140 * (this.hero_img_scale - 0.25);

  this.enemy_hero_armor.y = this.enemy_hero_y + 280 * (this.hero_img_scale - 0.3);
  this.enemy_hero_armor.x = this.screen_x / 2 + 140 * (this.hero_img_scale - 0.25);

  this.my_hero_armor.visible = false;
  this.enemy_hero_armor.visible = false;

  // Hero Atk 
  this.my_hero_atk = null;
  this.enemy_hero_atk = null;

  // Hero Life
  this.my_hero_life = null;
  this.enemy_hero_life = null;

  // User Mana
  this.my_hero_mana = 0;
  this.my_hero_mana_img = [];

  this.enemy_hero_mana = 0;
  this.enemy_hero_mana_img = [];

  // Hero Weapon
  this.my_hero_weapon_template = null;
  this.my_hero_weapon = null;
  this.my_hero_weapon_id = null;
  this.my_hero_weapon_life = null;

  this.enemy_hero_weapon_template = null;
  this.enemy_hero_weapon = null;
  this.enemy_hero_weapon_id = null;
  this.enemy_hero_weapon_life = null;

  // Turn End button img
  this.my_turn_img = null;
  this.enemy_turn_img = null;
  this.end_turn_txt = null;

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

  // Secrets
  this.my_secret_list = [];
  this.enemy_secret_list = [];

  // Received sockets 
  this.received_data_list = [];
  this.stop_processing_received_data = false;
  this.enemy_play_card = null;
  this.enemy_play_card_text = null;

  this.init();
}
Hearthstone.prototype.process_received_data = function (data) {
  this.cards.card_list = []; // Change the entire card list with newly received ones
  console.log('Data is received!', data.card_info);

  for (var i = 0; i < data.card_info.length; i++) {
    var c = data.card_info[i];
    this.cards.add_card(new HearthCard(
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

  this.my_hero_id = data.me.id;
  this.enemy_hero_id = data.enemy.id;

  if (data.my_hero_dmg.weapon_id != 'none') {
    this.my_hero_weapon_template.visible = true;
    this.my_hero_weapon_life.visible = true;
    this.my_hero_weapon_life.text = data.my_hero_dmg.weapon_life;

    hearth_resource.reg_img(data.my_hero_dmg.weapon_unique, data.my_hero_dmg.weapon_img);
    this.draw_weapon(new HearthCard(
      data.my_hero_dmg.weapon_unique,
      data.my_hero_dmg.weapon_id,
      'me',
      '',
      '',
      '',
      '',
      data.my_hero_dmg.weapon_img,
      '',
      ''));

  } else {
    this.my_hero_weapon_template.visible = false;
    this.my_hero_weapon_life.visible = false;
    if (this.my_hero_weapon) {
      this.stage.removeChild(this.my_hero_weapon.bitmap);
    }
  }

  if (data.enemy_hero_dmg.weapon_id != 'none') {
    this.enemy_hero_weapon_template.visible = true;
    this.enemy_hero_weapon_life.visible = true;
    this.enemy_hero_weapon_life.text = data.enemy_hero_dmg.weapon_life;

    hearth_resource.reg_img(data.enemy_hero_dmg.weapon_unique, data.enemy_hero_dmg.weapon_img);
    this.draw_weapon(new HearthCard(
      data.enemy_hero_dmg.weapon_unique,
      data.enemy_hero_dmg.weapon_id,
      'enemy',
      '',
      '',
      '',
      '',
      data.enemy_hero_dmg.weapon_img,
      '',
      ''));
  } else {
    this.enemy_hero_weapon_template.visible = false;
    this.enemy_hero_weapon_life.visible = false;
    if (this.enemy_hero_weapon) {
      this.stage.removeChild(this.enemy_hero_weapon.bitmap);
    }
  }

  // Get Hero Power
  function get_hero_power_name(name) {
    switch (name) {
      case "Armor Up!":
        return "armor up!.png";
      case "Fireblast":
        return "fireblast.png";
      case "Shapeshift":
        return "shapeshift.png";
      case "Life Tap":
        return "life tap.png";
      case "Totemic Call":
        return "totemic call.png";
      case "Dagger Mastery":
        return "dagger mastery.png";
      case "Steady Shot":
        return "steady shot.png";
      case "Lesser Heal":
        return "lesser heal.png";
      case "Reinforce":
        return "reinforce.png";
    }
  }

  if (data.me.hero_power.name != this.my_hero_power_name) {
    if (this.my_hero_power) {
      this.stage.removeChild(this.my_hero_power);
    }

    this.my_hero_power_name = data.me.hero_power.name;
    this.my_hero_power = new createjs.Bitmap("/assets/images/" + get_hero_power_name(this.my_hero_power_name));

    this.my_hero_power.x = this.screen_x * 109 / 192;
    this.my_hero_power.y = this.screen_y * 77 / 104;

    this.my_hero_power.scaleX = 130 * this.screen_x / (1920 * 121);
    this.my_hero_power.scaleY = 130 * this.screen_x / (1920 * 121);

    this.stage.addChildAt(this.my_hero_power, 1);

    this.my_hero_power.addEventListener('mousedown', function (h) {
      return function () {
        h.socket.emit('hero_power');
      };
    } (this));
  }

  if (data.me.hero_power.did == data.me.hero_power.max) {
    this.my_hero_power_exhausted.visible = true;
    this.my_hero_power_cost.text = '';
    this.my_hero_power_template.visible = false;
  } else {
    this.my_hero_power_exhausted.visible = false;
    this.my_hero_power_cost.text = data.me.hero_power.mana;
    this.my_hero_power_template.visible = true;
  }

  if (data.enemy.hero_power.name != this.enemy_hero_power_name) {
    if (this.my_hero_power) {
      this.stage.removeChild(this.enemy_hero_power);
    }
    this.enemy_hero_power_name = data.enemy.hero_power.name;
    this.enemy_hero_power = new createjs.Bitmap("/assets/images/" + get_hero_power_name(this.enemy_hero_power_name));

    this.enemy_hero_power.x = this.screen_x * 109 / 192;
    this.enemy_hero_power.y = this.screen_y * 17 / 104;

    this.enemy_hero_power.scaleX = 130 * this.screen_x / (1920 * 121);
    this.enemy_hero_power.scaleY = 130 * this.screen_x / (1920 * 121);

    this.stage.addChildAt(this.enemy_hero_power, 1);
  }

  if (data.enemy.hero_power.did == data.enemy.hero_power.max) {
    this.enemy_hero_power_exhausted.visible = true;
    this.enemy_hero_power_cost.text = '';
    this.enemy_hero_power_template.visible = false;
  } else {
    this.enemy_hero_power_exhausted.visible = false;
    this.enemy_hero_power_cost.text = data.enemy.hero_power.mana;
    this.enemy_hero_power_template.visible = true;
  }

  // Display hero's image
  function get_hero_img_name(job) {
    switch (job) {
      case "warrior":
        return "hero_garrosthis.png";
      case "mage":
        return "hero_jaina.png";
      case "druid":
        return "hero_malfurion.png";
      case "warlock":
        return "hero_guldan.png";
      case "shaman":
        return "hero_thrall.png";
      case "rogue":
        return "hero_valeera.png";
      case "hunter":
        return "hero_rexxar.png";
      case "priest":
        return "hero_anduin.png";
      case "paladin":
        return "hero_uther.png";
    }
  }
  if (data.me.job != this.my_job) {
    if (this.my_job_img) {
      this.stage.removeChild(this.my_job_img);
    }
    this.my_job_img = new createjs.Bitmap("/assets/images/" + get_hero_img_name(data.me.job));
    this.my_job_img.x = this.screen_x / 2 - 140 * this.hero_img_scale;
    this.my_job_img.y = this.my_hero_y;
    this.my_job_img.scaleX = this.hero_img_scale;
    this.my_job_img.scaleY = this.hero_img_scale;
    this.my_job = data.me.job;

    this.stage.addChildAt(this.my_job_img, 1); // must draw first
  }
  if (data.enemy.job != this.enemy_job) {
    if (this.enemy_job_img) {
      this.stage.removeChild();
    }
    this.enemy_job_img = new createjs.Bitmap("/assets/images/" + get_hero_img_name(data.enemy.job));
    this.enemy_job_img.x = this.screen_x / 2 - 140 * this.hero_img_scale;
    this.enemy_job_img.y = this.enemy_hero_y;
    this.enemy_job_img.scaleX = this.hero_img_scale;
    this.enemy_job_img.scaleY = this.hero_img_scale;

    this.stage.addChildAt(this.enemy_job_img, 1);
  }

  // Display hero's current remaining hp
  if (this.my_hero_life) {
    this.my_hero_life.text = data.me.life;
  } else {
    this.my_hero_life = new createjs.Text(data.me.life, "25px Arial", "white");
    this.stage.addChild(this.my_hero_life);

    this.my_hero_life.y = this.my_hero_y + 280 * (this.hero_img_scale - 0.12);
    this.my_hero_life.x = this.screen_x / 2 + 140 * (this.hero_img_scale - 0.3);
  }

  if (this.enemy_hero_life) {
    this.enemy_hero_life.text = data.enemy.life;
  } else {
    this.enemy_hero_life = new createjs.Text(data.enemy.life, "25px Arial", "white");
    this.stage.addChild(this.enemy_hero_life);

    this.enemy_hero_life.y = this.enemy_hero_y + 280 * (this.hero_img_scale - 0.12);
    this.enemy_hero_life.x = this.screen_x / 2 + 140 * (this.hero_img_scale - 0.3);
  }

  // Display hero's current attack damage
  if (this.my_hero_atk) {
    this.stage.removeChild(this.my_hero_atk);
  }

  if (data.my_hero_dmg.hero_dmg > 0) {
    this.my_hero_atk_img.visible = true;
    this.my_hero_atk = new createjs.Text(data.my_hero_dmg.hero_dmg, "25px Arial", "white");
    this.stage.addChild(this.my_hero_atk);

    this.my_hero_atk.y = this.my_hero_y + 280 * (this.hero_img_scale - 0.12);
    this.my_hero_atk.x = this.screen_x / 2 - 140 * (this.hero_img_scale - 0.15);
  } else {
    this.my_hero_atk_img.visible = false;

  }

  if (this.enemy_hero_atk) {
    this.stage.removeChild(this.enemy_hero_atk);
  }

  if (data.enemy_hero_dmg.hero_dmg > 0) {
    this.enemy_hero_atk_img.visible = true;
    this.enemy_hero_atk = new createjs.Text(data.enemy_hero_dmg.hero_dmg, "25px Arial", "white");
    this.stage.addChild(this.enemy_hero_atk);

    this.enemy_hero_atk.y = this.enemy_hero_y + 280 * (this.hero_img_scale - 0.12);
    this.enemy_hero_atk.x = this.screen_x / 2 - 140 * (this.hero_img_scale - 0.15);
  } else {
    this.enemy_hero_atk_img.visible = false;
  }

  // Show armor
  if (data.me.armor) {
    this.my_hero_armor_img.visible = true;
    this.my_hero_armor.text = data.me.armor;
    this.my_hero_armor.visible = true;
  } else {
    this.my_hero_armor_img.visible = false;
    this.my_hero_armor.visible = false;
  }

  if (data.enemy.armor) {
    this.enemy_hero_armor_img.visible = true;
    this.enemy_hero_armor.text = data.enemy.armor;
    this.enemy_hero_armor.visible = true;
  } else {
    this.enemy_hero_armor_img.visible = false;
    this.enemy_hero_armor.visible = false;
  }

  // Draw Hero Secrets
  this.draw_secret(data);

  function min(a, b) {
    if (a > b) return b;
    return a;
  }
  // Draw mana crystals
  if (this.my_hero_mana_img.length > min(10, data.me.mana)) {
    // Remove some images
    for (var i = min(10, data.me.mana); i < this.my_hero_mana_img.length; i++) {
      this.stage.removeChild(this.my_hero_mana_img[i]);
    }
    this.my_hero_mana_img.splice(min(10, data.me.mana));
  } else if (this.my_hero_mana_img.length < min(10, data.me.mana)) {
    // Draw more images
    var mana_distance = this.screen_x / 64; // --> which is 64 = 1920 / 30
    for (var i = this.my_hero_mana_img.length; i < min(10, data.me.mana); i++) {
      var mana_crystal = new createjs.Bitmap("/assets/images/mana_crystal.png");
      this.stage.addChildAt(mana_crystal, 1);
      this.my_hero_mana_img.push(mana_crystal);

      mana_crystal.x = mana_distance * i + 1300 / 1920 * this.screen_x;
      mana_crystal.y = this.screen_y * 12 / 13;

      mana_crystal.scaleX = mana_distance / 100;
      mana_crystal.scaleY = mana_distance / 100;
    }
  }

  // Show Turn
  if (data.turn == 'me') {
    this.end_turn_txt.text = 'End Turn';
    this.my_turn_img.visible = true;
    this.enemy_turn_img.visible = false;
  } else {
    this.end_turn_txt.text = 'Enemy Turn';
    this.my_turn_img.visible = false;
    this.enemy_turn_img.visible = true;
  }
  this.draw_hand();
  this.draw_field();
};
Hearthstone.prototype.init = function () {
  this.socket.on('hearth-event', function (h) {
    return function (data) {
      if (h.stop_processing_received_data) {
        h.received_data_list.push(data);
        return;
      }
      if (data.event) {
        console.log('Event :: ', data.event);
        if (data.event.event_type == 'play_card' && data.event.who == h.enemy_hero_id) {
          h.stop_processing_received_data = true;
          hearth_resource.reg_img(data.event.card.unique, data.event.card.img_src);
          h.received_data_list.push(data);
          h.show_play_card();
          return;
        }
      }

      h.process_received_data(data);
    };
  } (this));

  /*
      Registring Handler for Mulligun
  */
  this.socket.on('choose-starting-cards', function (h) {
    return function (data) {
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

      button.addEventListener('click', function () {
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
  } (this));

  /*
    Registing for Choose one Event
  */

  this.socket.on('choose-one', function (h) {
    return function (data) {
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

      h.field_img.filters = [h.gray_scale];

      // We must cache a bitmap in order to set a filter on it
      h.field_img.cache(0, 0, h.field_img.getBounds().width, h.field_img.getBounds().height);

      h.stage.update();
      console.log('Choose one ::', card_list);
    };
  } (this));

  this.socket.on('select-one', function (h) {
    return function (data) {
      h.selectable_lists = data.list;
      h.need_to_select = true;

      h.field_img.filters = [h.gray_scale];

      // We must cache a bitmap in order to set a filter on it
      h.field_img.cache(0, 0, h.field_img.getBounds().width, h.field_img.getBounds().height);

      h.draw_hand();
      h.draw_field();
    };
  } (this));


  /*

  Register Turn End Button 

  */

  this.my_turn_img = new createjs.Bitmap("/assets/images/turn_end_btn.png");
  this.my_turn_img.x = this.screen_x * 148 / 192;
  this.my_turn_img.y = this.screen_y * 45 / 104;
  this.my_turn_img.scaleX = this.screen_x / 3360;
  this.my_turn_img.scaleY = this.screen_x / 3360;

  this.enemy_turn_img = new createjs.Bitmap("/assets/images/turn_end_btn2.png");
  this.enemy_turn_img.x = this.screen_x * 148 / 192;
  this.enemy_turn_img.y = this.screen_y * 45 / 104;
  this.enemy_turn_img.scaleX = this.screen_x / 3360;
  this.enemy_turn_img.scaleY = this.screen_x / 3360;

  this.stage.addChild(this.my_turn_img);
  this.stage.addChild(this.enemy_turn_img);

  this.my_turn_img.visible = false;
  this.enemy_turn_img.visible = false;

  this.end_turn_txt = new createjs.Text("", "20px Arial", "black");
  this.end_turn_txt.x = this.screen_x * 150 / 192;
  this.end_turn_txt.y = this.screen_y * 47 / 104;
  this.stage.addChild(this.end_turn_txt);

  this.my_turn_img.addEventListener('click', function (h) {
    return function () {
      // Notify the server that the client has ended its turn
      h.socket.emit('hearth-end-turn', {});
    };
  } (this));

  this.socket.on('new-starting-cards', function (h) {
    return function (data) {
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
  } (this));

  this.socket.on('begin-match', function (h) {
    return function (data) {
      console.log('Game has started!');
      h.is_selecting_center = false;

      // When the game is started remove all of the mulligun cards
      for (var i = 0; i < h.center_cards.num_card(); i++) {
        var res = h.center_cont.removeChild(h.center_cards.card_list[i].bitmap);
        h.center_cards.card_list[i].bitmap.removeAllEventListeners();
      }

      h.stage.update();
    };
  } (this));

  /*

    Hero Weapon Images

  */

  this.my_hero_weapon_template = new createjs.Bitmap('/assets/images/inplay_weapon.png');
  this.enemy_hero_weapon_template = new createjs.Bitmap('/assets/images/inplay_weapon.png');

  this.my_hero_weapon_template.x = this.screen_x * 70 / 192;
  this.my_hero_weapon_template.y = this.screen_y * 73 / 104;

  this.my_hero_weapon_template.scaleX = this.screen_x / (250 * 109 / 10);
  this.my_hero_weapon_template.scaleY = this.screen_x / (250 * 109 / 10);

  this.enemy_hero_weapon_template.x = this.screen_x * 70 / 192;
  this.enemy_hero_weapon_template.y = this.screen_y * 13 / 104;

  this.enemy_hero_weapon_template.scaleX = this.screen_x / (250 * 109 / 10);
  this.enemy_hero_weapon_template.scaleY = this.screen_x / (250 * 109 / 10);

  this.stage.addChild(this.my_hero_weapon_template);
  this.stage.addChild(this.enemy_hero_weapon_template);

  this.my_hero_weapon_template.visible = false;
  this.enemy_hero_weapon_template.visible = false;

  this.my_hero_weapon_life = new createjs.Text('', '25px Arial', 'white');
  this.enemy_hero_weapon_life = new createjs.Text('', '25px Arial', 'white');

  this.stage.addChild(this.my_hero_weapon_life);
  this.stage.addChild(this.enemy_hero_weapon_life);

  this.my_hero_weapon_life.x = this.screen_x * 83 / 192;
  this.my_hero_weapon_life.y = this.screen_y * 84 / 104;

  this.enemy_hero_weapon_life.x = this.screen_x * 83 / 192;
  this.enemy_hero_weapon_life.y = this.screen_y * 24 / 104;

  this.my_hero_weapon_life.visible = false;
  this.enemy_hero_weapon_life.visible = false;

  /*

     Initialize Heros and its abilities

  */
  var my_hero_btn = new createjs.Shape();
  var enemy_hero_btn = new createjs.Shape();

  my_hero_btn.graphics.beginFill('yellow').drawRect(this.screen_x / 2 - 80, this.my_hero_y, 150, 150);
  my_hero_btn.alpha = 0;
  my_hero_btn.hitArea = new createjs.Shape();
  my_hero_btn.hitArea.graphics.beginFill("#FFF000").drawRect(this.screen_x / 2 - 100, this.my_hero_y, 150, 150);

  enemy_hero_btn.graphics.beginFill('yellow').drawRect(this.screen_x / 2 - 80, this.enemy_hero_y, 150, 150);
  enemy_hero_btn.alpha = 0;
  enemy_hero_btn.hitArea = new createjs.Shape();
  enemy_hero_btn.hitArea.graphics.beginFill("#FFF000").drawRect(this.screen_x / 2 - 100, this.enemy_hero_y, 150, 150);

  var my_hero = new HearthCard('me', 'me');
  var enemy_hero = new HearthCard('enemy', 'enemy');

  var on_mouse_down = function (c, h) {
    return function (e) {
      if (h.need_to_select) {
        h.socket.emit('select-done', {
          id: c.id
        });
        h.selected_card = null;
        h.need_to_select = false;
        h.selectable_lists = [];

        // Remove a filter when the selection is done
        h.field_img.filters = [];
        h.field_img.updateCache();
        return;
      }

      // Cannot attack itself
      if (h.selected_card && h.selected_card != c) {
        h.socket.emit('hearth-combat', {
          from_id: h.selected_card.id,
          to_id: c.id
        });
        if (h.selected_card.id == 'me') {
          h.my_job_img.shadow = null;
        } else if (h.selected_card.id != 'enemy') {
          h.selected_card.display.added_images[2].shadow = null;
        }
        h.selected_card = null;
        h.stage.update();
      } else {
        h.selected_card = c;
        if (c.id == 'me') {
          h.my_job_img.shadow = new createjs.Shadow("yellow", 0, 0, 20);
          h.stage.update();
        }
      }
    };
  };

  my_hero_btn.addEventListener('mousedown', on_mouse_down(my_hero, this));
  enemy_hero_btn.addEventListener('mousedown', on_mouse_down(enemy_hero, this));

  this.stage.addChild(my_hero_btn);
  this.stage.addChild(enemy_hero_btn);

  /*
  
    Hero Power
  
  */

  this.my_hero_power_template = new createjs.Bitmap('/assets/images/hero_power.png');
  this.enemy_hero_power_template = new createjs.Bitmap('/assets/images/hero_power.png');

  this.my_hero_power_template.x = this.screen_x * 107 / 192;
  this.my_hero_power_template.y = this.screen_y * 73 / 104;

  this.my_hero_power_template.scaleX = this.screen_x / (250 * 109 / 10);
  this.my_hero_power_template.scaleY = this.screen_x / (250 * 109 / 10);

  this.enemy_hero_power_template.x = this.screen_x * 107 / 192;
  this.enemy_hero_power_template.y = this.screen_y * 13 / 104;

  this.enemy_hero_power_template.scaleX = this.screen_x / (250 * 109 / 10);
  this.enemy_hero_power_template.scaleY = this.screen_x / (250 * 109 / 10);

  this.stage.addChild(this.my_hero_power_template);
  this.stage.addChild(this.enemy_hero_power_template);

  /*

  Register Hero Power related images

  */

  this.my_hero_power_exhausted = new createjs.Bitmap('/assets/images/hero_power_exhausted.png');
  this.enemy_hero_power_exhausted = new createjs.Bitmap('/assets/images/hero_power_exhausted.png');

  this.my_hero_power_exhausted.x = this.screen_x * 107 / 192;
  this.my_hero_power_exhausted.y = this.screen_y * 73 / 104;

  this.my_hero_power_exhausted.scaleX = this.screen_x / (250 * 109 / 10);
  this.my_hero_power_exhausted.scaleY = this.screen_x / (250 * 109 / 10);

  this.enemy_hero_power_exhausted.x = this.screen_x * 107 / 192;
  this.enemy_hero_power_exhausted.y = this.screen_y * 13 / 104;

  this.enemy_hero_power_exhausted.scaleX = this.screen_x / (250 * 109 / 10);
  this.enemy_hero_power_exhausted.scaleY = this.screen_x / (250 * 109 / 10);

  this.stage.addChild(this.my_hero_power_exhausted);
  this.stage.addChild(this.enemy_hero_power_exhausted);

  this.my_hero_power_exhausted.visible = false;
  this.enemy_hero_power_exhausted.visible = false;

  this.my_hero_power_cost = new createjs.Text('', '20px Arial', 'white');
  this.enemy_hero_power_cost = new createjs.Text('', '20px Arial', 'white');

  this.my_hero_power_cost.x = this.screen_x * 115 / 192;
  this.my_hero_power_cost.y = this.screen_y * 75 / 104;

  this.enemy_hero_power_cost.x = this.screen_x * 115 / 192;
  this.enemy_hero_power_cost.y = this.screen_y * 15 / 104;

  this.stage.addChild(this.my_hero_power_cost);
  this.stage.addChild(this.enemy_hero_power_cost);

  // Initialize UI
  this.stage.addEventListener('pressmove', function (h) {
    return function (e) {
      if (h.selected_card && h.selected_card.where === 'hand') {
        h.selected_card.display.bitmap.x = e.stageX - h.selected_card.sel_x;
        h.selected_card.display.bitmap.y = e.stageY - h.selected_card.sel_y;

        h.stage.update();
      }
    };
  } (this));

  this.stage.addEventListener('pressup', function (h) {
    return function (e) {
      if (h.selected_card && h.selected_card.where == 'hand') {
        console.log('Card Dropped AT :: ', e.stageY);
        h.draw_hand();

        if (e.stageY <= h.screen_y * 0.65) {
          for (var i = 0; i < h.my_fields.length; i++) {
            if (e.stageX < h.my_fields[i].bitmap.x +
              h.my_fields[i].bitmap.image.width * h.my_fields[i].bitmap.scaleX / 2) {
              break;
            }
          }
          h.socket.emit('hearth-user-play-card', {
            id: h.selected_card.id,
            at: i
          });
        }

        h.current_hover = null;
        h.selected_card = null;
      }
    };
  } (this));

  this.stage.addEventListener('mousedown', function (h) {
    return function (e) {
      if (e.target == h.field_img) {
        if (!h.need_to_select) {
          if (h.selected_card) {
            if (h.selected_card.id == 'me') {
              h.my_job_img.shadow = null;
            } else if (h.selected_card.id != 'enemy') {
              h.selected_card.display.added_images[2].shadow = null;
              if (h.selected_card.chk_state('attackable')) {
                h.selected_card.display.added_images[2].shadow = new createjs.Shadow("green", 0, 0, 20);
              }
            }
          }
          h.selected_card = null;
          h.stage.update();
        } else {
          // When the user is on 'Discover', then the user must select card.
          if (h.is_selecting_center && h.center_card.length == 3) {
            return;
          } else {
            // In other cases, user can cancel the selection.
            h.socket.emit('select-done', {
              id: -1
            });

            h.selected_card = null;
            h.need_to_select = false;
            h.selectable_lists = [];

            h.center_cards.card_list = []; // Remove center cards
            h.center_cont.removeAllChildren();

            // Remove a filter when the selectino is done
            h.field_img.filters = [];
            h.field_img.updateCache();

            h.stage.update();
            return;
          }
        }
      }
    };
  } (this));
};

// Tell the user what card that the enemy has played
Hearthstone.prototype.show_play_card = function (loaded, img_downloaded) {
  if (loaded == 'done') {
    this.stage.removeChild(this.enemy_play_card);
    this.stage.removeChild(this.enemy_play_card_text);

    this.received_data_list.splice(0, 1);
    this.process_saved_data();
    this.stage.update();
    return;
  } else if (loaded && this.received_data_list.length) {
    var data = this.received_data_list[0];
    if (data.event && data.event.event_type == 'play_card') {
      if (data.event.card.unique == loaded.event.card.unique) {
        var img = hearth_resource.get_img(data.event.card.unique, data.event.card.img_src, function (h) {
          return function (u, s, img) {
            h.show_play_card(data, img);
          };
        } (this));

        if (img_downloaded) img = img_downloaded;
        if (!img) return;

        this.stage.removeChild(this.enemy_play_card);
        this.stage.removeChild(this.enemy_play_card_text);

        this.enemy_play_card = new createjs.Bitmap(img.img);
        this.stage.addChild(this.enemy_play_card);
      }
    }
    this.stage.update();
    return;
  }

  // Blocking processing the received datas until
  // the summon-card-showing animation finishes.
  this.stop_processing_received_data = true;

  var data = this.received_data_list[0];

  var img = hearth_resource.get_img(data.event.card.unique, data.event.card.img_src, function (h) {
    return function () {
      h.show_play_card(data);
    };
  } (this));

  if (!img) {
    this.enemy_play_card = new createjs.Shape(new createjs.Graphics().f("green").drawRect(0, 0, 250, 370));
    this.enemy_play_card_text = new createjs.Text(data.event.card.name, '20px Arial', 'white');

    this.stage.addChild(this.enemy_play_card);
    this.stage.addChild(this.enemy_play_card_text);

    this.enemy_play_card_text.x = 50;
    this.enemy_play_card_text.y = 50;
  } else {
    this.enemy_play_card = new createjs.Bitmap(img.img);
    this.stage.addChild(this.enemy_play_card);
  }

  this.enemy_play_card.x = 30;
  this.enemy_play_card.y = 30;
  this.stage.update();

  setTimeout(function (h) {
    return function () {
      h.show_play_card('done');
    };
  } (this), 2000);
};
Hearthstone.prototype.process_saved_data = function () {
  while (this.received_data_list.length) {
    var data = this.received_data_list[0];
    if (data.event) {
      if (this.received_data_list[0].event.event_type == 'play_card') {
        this.show_play_card();

        // 'play card' data will be erased only after when the show_play_card is done.
        return;
      }
    }
    this.process_received_data(data);
    this.received_data_list.splice(0, 1);
  }

  if (this.received_data_list.length == 0) {
    this.stop_processing_received_data = false;
  }
};

/*
 *
 * Draw Secrets
 * 
 */
Hearthstone.prototype.draw_secret = function (data) {
  // relative position to the top center of hero image
  var positions = [
    { x: 0, y: 0 },
    { x: -this.screen_x / 15, y: this.screen_y * 7 / 104 },
    { x: this.screen_x / 15, y: this.screen_y * 7 / 104 },
    { x: -this.screen_x * 4 / 96, y: this.screen_y * 15 / 104 },
    { x: this.screen_x * 4 / 96, y: this.screen_y * 15 / 104 }
  ];

  if (this.my_secret_list.length > data.my_secret.length) {
    var i = data.my_secret.length;
    while (data.my_secret.length != this.my_secret_list.length) {
      this.stage.removeChild(this.my_secret_list[i].img);
      this.my_secret_list.splice(i, 1);
    }
  }

  for (var i = 0; i < this.my_secret_list.length; i++) {
    if (this.my_secret_list[i].job != data.my_secret[i].job) {
      this.stage.removeChild(this.my_secret_list[i].img);

      this.my_secret_list[i].img = new createjs.Bitmap('/assets/images/secret_' + data.my_secret[i].job + '.png');
      this.stage.addChild(this.my_secret_list[i].img);
      this.my_secret_list[i].job = data.my_secret[i].job;
    }
  }
  for (j = this.my_secret_list.length; j < data.my_secret.length; j++) {
    this.my_secret_list.push({
      img: new createjs.Bitmap('/assets/images/secret_' + data.my_secret[j].job + '.png'),
      job: data.my_secret[j].job
    });
    this.stage.addChild(this.my_secret_list[j].img);
  }

  for(var i = 0; i < this.my_secret_list.length; i ++) {
    this.my_secret_list[i].img.x =  this.screen_x / 2 - 140 + positions[i].x;
    this.my_secret_list[i].img.y = this.my_hero_y + positions[i].y - 40;
  }

  // Enemy Hero Secrets

  if (this.enemy_secret_list.length > data.enemy_secret.length) {
    var i = data.enemy_secret.length;
    while (data.enemy_secret.length != this.enemy_secret_list.length) {
      this.stage.removeChild(this.enemy_secret_list[i].img);
      this.enemy_secret_list.splice(i, 1);
    }
  }

  for (var i = 0; i < this.enemy_secret_list.length; i++) {
    if (this.enemy_secret_list[i].job != data.enemy_secret[i].job) {
      this.stage.removeChild(this.enemy_secret_list[i].img);

      this.enemy_secret_list[i].img = new createjs.Bitmap('/assets/images/secret_' + data.enemy_secret[i].job + '.png');
      this.stage.addChild(this.enemy_secret_list[i].img);
      this.enemy_secret_list[i].job = data.enemy_secret[i].job;
    }
  }
  for (j = this.enemy_secret_list.length; j < data.enemy_secret.length; j++) {
    this.enemy_secret_list.push({
      img: new createjs.Bitmap('/assets/images/secret_' + data.enemy_secret[j].job + '.png'),
      job: data.enemy_secret[j].job
    });
    this.stage.addChild(this.enemy_secret_list[j].img);
  }

  for(var i = 0; i < this.enemy_secret_list.length; i ++) {
    this.enemy_secret_list[i].img.x =  this.screen_x / 2 - 140 + positions[i].x;
    this.enemy_secret_list[i].img.y = this.enemy_hero_y + positions[i].y - 40;
  }

};

/*
 *
 * Draw Weapon
 *
 */
Hearthstone.prototype.draw_weapon = function (c) {
  var img = hearth_resource.get_img(c.unique, c.img_src, function (h) {
    return function () {
      h.draw_weapon(c);
    };
  } (this));

  if (c.owner == 'me') {
    // If new weapon image is added
    if (this.my_hero_weapon_id != c.unique) {
      if (this.my_hero_weapon) {
        if (this.my_hero_weapon.bitmap) this.stage.removeChild(this.my_hero_weapon.bitmap);
      }
      this.my_hero_weapon = new DisplayCard(c);
    }
    this.my_hero_weapon_id = c.unique;
  } else {
    // If new weapon image is added
    if (this.enemy_hero_weapon_id != c.unique) {
      if (this.enemy_hero_weapon) {
        if (this.enemy_hero_weapon.bitmap) this.stage.removeChild(this.enemy_hero_weapon.bitmap);
      }
      this.enemy_hero_weapon = new DisplayCard(c);
    }
    this.enemy_hero_weapon_id = c.unique;
  }


  if (img) {
    if (c.owner == 'me') {
      // Then it has been replaced by the simple bitmap image
      if (!this.my_hero_weapon.real_img) {
        this.stage.removeChild(this.my_hero_weapon.bitmap);
      }
      this.my_hero_weapon.real_img = true;
      this.my_hero_weapon.bitmap = new createjs.Bitmap(img.img);
      this.stage.addChildAt(this.my_hero_weapon.bitmap, 1);
    } else {
      if (!this.enemy_hero_weapon.real_img) {
        this.stage.removeChild(this.enemy_hero_weapon.bitmap);
      }
      this.enemy_hero_weapon.real_img = true;
      this.enemy_hero_weapon.bitmap = new createjs.Bitmap(img.img);
      this.stage.addChildAt(this.enemy_hero_weapon.bitmap, 1);
    }
  }
  // If the image is not loaded yet, just replace with simple bitmap circle 
  else {
    if (c.owner == 'me' && !this.my_hero_weapon.bitmap) {
      this.my_hero_weapon.real_img = false;
      this.my_hero_weapon.bitmap = new createjs.Shape(new createjs.Graphics().f("blue").drawCircle(60, 60, 120));
      this.stage.addChildAt(this.my_hero_weapon.bitmap, 1);
    }
    if (c.owner == 'enemy' && !this.enemy_hero_weapon.bitmap) {
      this.enemy_hero_weapon.real_img = false;
      this.enemy_hero_weapon.bitmap = new createjs.Shape(new createjs.Graphics().f("blue").drawCircle(60, 60, 120));
      this.stage.addChildAt(this.enemy_hero_weapon.bitmap, 1);
    }
  }

  var inner_rad = this.screen_x * 85 / (25 * 109);

  // Draw mask and positioning it
  if (c.owner == 'me') {
    this.my_hero_weapon.bitmap.mask = new createjs.Shape(
      new createjs.Graphics().f("#000").drawCircle(inner_rad, inner_rad, inner_rad));

    this.my_hero_weapon.bitmap.mask.x = this.screen_x * 73 / 192;
    this.my_hero_weapon.bitmap.mask.y = this.screen_y * 76 / 104;

    this.my_hero_weapon.bitmap.x = this.screen_x * 68 / 192;
    this.my_hero_weapon.bitmap.y = this.screen_y * 70 / 104;

    this.my_hero_weapon.bitmap.scaleX = this.screen_x / (250 * 109 / 10);
    this.my_hero_weapon.bitmap.scaleY = this.screen_x / (250 * 109 / 10);
  } else {
    this.enemy_hero_weapon.bitmap.mask = new createjs.Shape(
      new createjs.Graphics().f("#000").drawCircle(inner_rad, inner_rad, inner_rad));

    this.enemy_hero_weapon.bitmap.mask.x = this.screen_x * 73 / 192;
    this.enemy_hero_weapon.bitmap.mask.y = this.screen_y * 16 / 104;

    this.enemy_hero_weapon.bitmap.x = this.screen_x * 68 / 192;
    this.enemy_hero_weapon.bitmap.y = this.screen_y * 10 / 104;

    this.enemy_hero_weapon.bitmap.scaleX = this.screen_x / (250 * 109 / 10);
    this.enemy_hero_weapon.bitmap.scaleY = this.screen_x / (250 * 109 / 10);
  }

  this.stage.update();
};

/*
 * 
 * Draw Field
 *
 */
Hearthstone.prototype.is_selectable = function (c) {
  if (!this.need_to_select) return false;

  for (var i = 0; i < this.selectable_lists.length; i++) {
    if (this.selectable_lists[i] == c.id) return true;
  }
  return false;
};
Hearthstone.prototype.draw_field = function () {
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
    var img = hearth_resource.get_img(c.unique, c.img_src, function (h) {
      return function () {
        h.draw_field();
      };
    } (this));

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

        var mask = new createjs.Shape(new createjs.Graphics().f("#000").drawEllipse(0, 0, 120, 161));
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
    display.bitmap.addEventListener('mouseover', function (c, h) {
      return function (e) {
        // When hovers on the field minion, shows the card info
        h.current_hover = c;

        h.stage.update();
      };
    } (c, this));

    display.bitmap.addEventListener('mouseout', function (c, h) {
      return function (e) {
        if (h.current_hover == c) {
          h.current_hover = null;
        }

        h.stage.update();
      };
    } (c, this));
    display.bitmap.addEventListener('mousedown', function (c, h) {
      return function (e) {
        if (h.need_to_select) {
          h.socket.emit('select-done', {
            id: c.id
          });
          h.selected_card = null;
          h.need_to_select = false;
          h.selectable_lists = [];

          // Remove a filter when the selectino is done
          h.field_img.filters = [];
          h.field_img.updateCache();

          return;
        }

        // Cannot attack itself
        if (h.selected_card && h.selected_card != c) {
          h.socket.emit('hearth-combat', {
            from_id: h.selected_card.id,
            to_id: c.id
          });
          if (h.selected_card.chk_state('attackable')) {
            h.selected_card.display.added_images[2].shadow = new createjs.Shadow("green", 0, 0, 20);
          } else {
            if (h.selected_card.id == 'me') {
              h.my_job_img.shadow = null;
            } else if (h.selected_card.id != 'enemy') {
              h.selected_card.display.added_images[2].shadow = null;
            }
          }
          h.selected_card = null;
        } else {
          h.selected_card = c;
          h.selected_card.display.added_images[2].shadow = new createjs.Shadow("yellow", 0, 0, 20);
        }
      };
    } (c, this));
  }

  mine = -1, enemy = -1;

  for (var i = 0; i < this.cards.num_card(); i++) {
    if (this.cards.card_list[i].where != 'field') continue;

    var c = this.cards.card_list[i];
    var display = c.display;

    if (c.owner == 'me') mine++;
    else enemy++;

    var card_width = 160;

    var my_offset_center = num_my_card / 2 * card_width + (num_my_card - 1) / 2 * this.card_distance;
    var enemy_offset_center = num_enemy_card / 2 * card_width + (num_enemy_card - 1) / 2 * this.card_distance;

    if (c.owner == 'me') {
      display.bitmap.x = this.screen_x / 2 - my_offset_center + (card_width + this.card_distance) * mine;
      display.offset = mine;

      if (display.bitmap.mask) {
        display.bitmap.mask.x = this.screen_x / 2 - my_offset_center + (card_width + this.card_distance) * mine + 68 - 20;
        display.bitmap.mask.y = 58 - 18;
      }

    } else {
      display.bitmap.x = this.screen_x / 2 - enemy_offset_center + (card_width + this.card_distance) * enemy;
      display.offset = enemy;

      if (display.bitmap.mask) {
        display.bitmap.mask.x = this.screen_x / 2 - enemy_offset_center + (card_width + this.card_distance) * enemy + 68 - 20;
        display.bitmap.mask.y = 58 - 18;
      }
    }

    display.bitmap.scaleX = 0.7;
    display.bitmap.scaleY = 0.7;

    console.log('Added images :: ', display.added_images);
    // if text field for Health and Damage are empty, we should add it 
    if (display.added_images.length == 0) {
      display.added_images.push(new createjs.Text(c.dmg, "25px Arial", "white"));
      display.added_images.push(new createjs.Text(c.health, "25px Arial", "white"));
      display.added_images.push(new createjs.Bitmap("/assets/images/inplay_minion.png"));

      this.stage.addChild(display.added_images[2]);
      this.stage.addChild(display.added_images[0]);
      this.stage.addChild(display.added_images[1]);

    }

    for (var j = 3; j < display.added_images.length; j++) {
      this.stage.removeChild(display.added_images[j]);
    }

    // Add some images to represent the condition of the card
    if (c.chk_state('taunt')) {
      var taunt_img = new createjs.Bitmap("/assets/images/inplay_minion_taunt.png");
      display.added_images.push(taunt_img);
      this.stage.addChildAt(taunt_img, 1);
    }
    if (c.chk_state('frozen')) {
      var frozen_img = new createjs.Bitmap("/assets/images/inplay_minion_frozen.png");
      display.added_images.push(frozen_img);
      this.stage.addChildAt(frozen_img, 2);
    }
    if (c.chk_state('shield')) {
      var shield_img = new createjs.Bitmap("/assets/images/inplay_minion_divine_shield.png");
      display.added_images.push(shield_img);
      this.stage.addChild(shield_img);

      // Since shield_img covers entire card images, we should put an additional event listener
      shield_img.removeAllEventListeners();
      shield_img.addEventListener('mouseover', function (c, h) {
        return function (e) {
          // When hovers on the field minion, shows the card info
          h.current_hover = c;

          h.stage.update();
        };
      } (c, this));

      shield_img.addEventListener('mouseout', function (c, h) {
        return function (e) {
          if (h.current_hover == c) {
            h.current_hover = null;
          }

          h.stage.update();
        };
      } (c, this));
      shield_img.addEventListener('mousedown', function (c, h) {
        return function (e) {
          if (h.need_to_select) {
            h.socket.emit('select-done', {
              id: c.id
            });
            h.selected_card = null;
            h.need_to_select = false;
            h.selectable_lists = [];

            // Remove a filter when the selectino is done
            h.field_img.filters = [];
            h.field_img.updateCache();

            return;
          }

          // Cannot attack itself
          if (h.selected_card && h.selected_card != c) {
            h.socket.emit('hearth-combat', {
              from_id: h.selected_card.id,
              to_id: c.id
            });
            if (h.selected_card.chk_state('attackable')) {
              h.selected_card.display.added_images[2].shadow = new createjs.Shadow("green", 0, 0, 20);
            } else {
              if (h.selected_card.id == 'me') {
                h.my_job_img.shadow = null;
              } else if (h.selected_card.id != 'enemy') {
                h.selected_card.display.added_images[2].shadow = null;
              }
            }
            h.selected_card = null;
          } else {
            h.selected_card = c;
            h.selected_card.display.added_images[2].shadow = new createjs.Shadow("yellow", 0, 0, 20);
          }
        };
      } (c, this));
    }

    var offset_x = (c.owner == 'me' ? this.my_field_cont.x : this.enemy_field_cont.x);
    var offset_y = (c.owner == 'me' ? this.my_field_cont.y : this.enemy_field_cont.y);

    display.added_images[0].text = c.dmg;
    display.added_images[0].x = display.bitmap.x + offset_x + 55;
    display.added_images[0].y = display.bitmap.y + offset_y + 165;

    display.added_images[1].text = c.health;
    display.added_images[1].x = display.bitmap.x + offset_x + 140;
    display.added_images[1].y = display.bitmap.y + offset_y + 165;

    for (var j = 2; j < display.added_images.length; j++) {
      display.added_images[j].x = display.bitmap.x + offset_x;
      display.added_images[j].y = display.bitmap.y + offset_y + 7;
      display.added_images[j].scaleX = 0.7;
      display.added_images[j].scaleY = 0.7;
    }

    if (c.chk_state('attackable')) {
      display.added_images[2].shadow = new createjs.Shadow("green", 0, 0, 20);
    } else {
      display.added_images[2].shadow = null;
    }

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

Hearthstone.prototype.draw_hand = function () {
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
    var img = hearth_resource.get_img(c.unique, c.img_src, function (h) {
      return function () {
        h.draw_hand();
      };
    } (this));

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
        display.bitmap.scaleX = 0.5;
        display.bitmap.scaleY = 0.5;

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
    display.bitmap.addEventListener('mouseover', function (c, h) {
      return function (e) {
        if (h.current_hover) {
          // If two cards overlaps, select the one that has higher offset
          if (h.current_hover.offset < c.offset) {
            // Revert previously hovered card to a orignal state
            h.current_hover.display.bitmap.rotation = h.current_hover.prev_rot;
            h.current_hover.display.bitmap.scaleX = 0.5;
            h.current_hover.display.bitmap.scaleY = 0.5;

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

        c.display.bitmap.scaleX = 0.8;
        c.display.bitmap.scaleY = 0.8;

        c.display.bitmap.y = -c.display.bitmap.image.height * 0.4;
        c.display.bitmap.x -= c.display.bitmap.image.width * 0.2;

        // move hovered card into the front
        h.my_hand_cont.setChildIndex(h.current_hover.display.bitmap, h.current_hover.offset + 1);

        if (h.current_hover.offset + 1 < h.my_hands.length) {
          h.my_hand_cont.setChildIndex(h.my_hands[h.current_hover.display.offset + 1].bitmap, h.current_hover.display.offset);
        }

        if (h.current_hover.offset == -1) {
          console.error('something is wrong', h.current_hover);
        }
        h.stage.update();
      };
    } (c, this));

    display.bitmap.addEventListener('mouseout', function (c, h) {
      return function (e) {
        if (h.current_hover == c) {
          // unhover hovered card
          h.my_hand_cont.setChildIndex(h.current_hover.display.bitmap, h.current_hover.offset);

          if (h.current_hover.offset + 1 < h.my_hands.length) {
            h.my_hand_cont.setChildIndex(h.my_hands[h.current_hover.offset + 1].bitmap, h.current_hover.offset + 1);
          }
          h.current_hover = null;
        }

        c.display.bitmap.rotation = c.prev_rot;
        c.display.bitmap.scaleX = 0.5;
        c.display.bitmap.scaleY = 0.5;

        h.draw_hand();
      };
    } (c, this));

    display.bitmap.addEventListener('mousedown', function (c, h) {
      return function (e) {
        console.log('HAnd mouse click!');
        // Click is only available for a current hovering object
        if (h.current_hover && h.current_hover == c) {
          h.selected_card = c;
          h.selected_card.sel_x = e.stageX - h.selected_card.display.bitmap.x;
          h.selected_card.sel_y = e.stageY - h.selected_card.display.bitmap.y;
        }
      };
    } (c, this));

    display.bitmap.addEventListener('mousedown', function (c, h) {
      return function (e) {
        console.log('HAnd mouse click! true');
      };
    } (c, this), true);
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

    function min(a, b) {
      if (a > b) return b;
      return a;
    }

    var card_dist = min(150, this.screen_x * (5 / this.my_hands.length / 16)); // -> 600 (width of the hand card length) / 10 (maximum num cards) / 1920

    // Rotate a image a bit. 
    if (c.owner == 'me') {
      display.bitmap.rotation = 0;
      if (num_my_card >= 2) display.bitmap.rotation = -30 + (60 / (num_my_card - 1)) * mine;

      var card_width = 0;
      if (display.bitmap.image) card_width = display.bitmap.image.width;
      display.bitmap.x = this.screen_x / 2 - Math.floor(num_my_card / 2) * card_dist + mine * card_dist - card_width * 0.25;
      display.bitmap.y = 0;

      var x = 0;
      var y = 0;

      if (display.bitmap.image) {
        x = display.bitmap.image.width * 0.5;
        y = display.bitmap.image.height * 0.5;
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

      display.bitmap.x = this.screen_x / 2 - Math.floor(num_enemy_card / 2) * card_dist + enemy * card_dist;

      c.offset = enemy;
      display.offset = enemy;
    }
  }

  while (num_my_card < this.my_hands.length) {
    this.my_hand_cont.removeChild(this.my_hands[num_my_card].bitmap);
    this.my_hands.splice(num_my_card, 1);
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
Hearthstone.prototype.begin_match = function () {

};
// Mulligun (choosing the cards to start)
// 카드들의 offset 꼭 설정할것!!
Hearthstone.prototype.mulligun = function (no_card_remove) {
  if (!this.is_selecting_center) return;

  for (var i = 0; i < this.center_cards.num_card(); i++) {
    var c = this.center_cards.card_list[i];
    var img = hearth_resource.get_img(c.unique, c.img_src, function (h) {
      return function () {
        h.mulligun();
      };
    } (this));

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

    var on_mouse_down = function (c) {
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
      c.bitmap.addEventListener('mousedown', function (c, h) {
        return on_mouse_down.bind(h, c);
      } (c, this));
    }

    c.bitmap.x = 100 + 400 * i;
    c.bitmap.y = 100;
    this.center_cont.addChild(c.bitmap);

  }
  this.stage.update();
};
// 발견 혹은 선택 시에 화면 정 가운데 카드들 보여주는거
Hearthstone.prototype.show_cards = function () {
  if (!this.is_selecting_center) return;

  console.log("Show cards :: ", this.center_cards.card_list);

  for (var i = 0; i < this.center_cards.num_card(); i++) {
    var c = this.center_cards.card_list[i];
    var img = hearth_resource.get_img(c.unique, c.img_src, function (h) {
      return function () {
        h.show_cards();
      };
    } (this));

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
        console.log('Fail loading image, replacing it with bitmap ', c);

        new_bitmap = true;
      } else continue; // when the blank image is already registered
    }

    c.bitmap.addEventListener('mousedown', function (c, h, i) {
      return function (e) {
        // Click is only available for a current hovering object
        h.is_selecting_center = false;
        h.socket.emit('select-done', {
          id: i
        });

        // Remove a filter when the selectino is done
        h.field_img.filters = [];
        h.field_img.updateCache();

        h.center_cards.card_list = []; // Remove center cards
        h.center_cont.removeAllChildren();
        h.stage.update();
      };
    } (c, this, i));

    c.bitmap.x = 100 + 400 * i;
    c.bitmap.y = 100;
    this.center_cont.addChild(c.bitmap);
  }

  this.stage.update();
};

var hearthstone = new Hearthstone();

// Whenever the window resizes, we should adjust the size of the canvas too
$(window).on('resize', function () {
  // $('#field').width($(window).width());
  // $('#field').height($(window).height());
});