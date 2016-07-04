"use strict";
const card_manager = require('./card_db/all_cards');
const card_db = require('./card_api.js');
const util = require('./utility');
const colors = require('colors');

function CardData(args) {
  this.name = args[0];
  this.type = args[1];
  this.level = args[2];
  this.job = args[3];
  this.mana = args[4];
  this.dmg = args[5];
  this.life = args[6];
  this.kind = args[7];
  this.is_token = args[8];
  this.is_secret = args[9];
  this.img_path = args[10];
  this.unique = args[11];
  this.mech = args[12];
}
CardData.prototype.to_array = function() {
  var arr = [this.name, this.type, this.level, this.job, this.mana, this.dmg, this.life, this.kind, this.is_token, this.is_secret, this.img_path, this.unique, this.mech];
  return arr;
};

// card_data 는 여기서 CardData 객체의 Array 표현이다!
function Card(card_data, id, owner) {
  this.id = 0;

  this.card_data = new CardData(card_data);

  this.state = []; // Array of added states

  if (this.card_data.type != 'hero') this.status = 'deck';
  else this.status = 'field'; // HERO is always on the field

  this.owner = owner;

  this.field_summon_turn = -1;
  this.summon_order = -1;

  // If some minion has transformed, it does not create SUMMON event 
  // when it is summoned
  this.transformed = false;

  this.current_life = this.card_data.life;

  this.is_frozen = {
    until: -1
  };
  this.is_stealth = {
    until: -1
  };
  this.is_shielded = {
    until: -1
  };
  this.is_invincible = {
    until: -1
  };

  // Spell & Hero Power Immune? 
  this.is_not_target = {
    until: -1
  };

  this.atk_info = {
    max: 0,
    turn: -1,
    did: 0
  };

  // Proposed attack target during combat phase (can be changed)
  this.target = null;

  // Is this card attacking?
  this.is_attacking = false;

  // Proposed damage that may be given to the target (can be changed)
  this.dmg_given = 0;

  // Life Aura Points
  this.life_aura = [];

  // Armor (For Hero)
  this.armor = 0;

  // Check whether this minion is already destroyed. 
  this.already_destroyed = false;

  // Last position before gets destroyed
  this.last_position = -1;
  
  // Cannot Attack Hero
  this.no_hero_attack = false; 
}
Card.prototype.add_state = function(f, state, who) {
  this.state.push({
    f: f,
    state: state,
    who: who,
    when: this.owner.g_when.get_id()
  });
};
Card.prototype.chk_state = function(state) {
  for (var i = 0; i < this.state.length; i++) {
    if (this.state[i].state === state) return true;
  }
  return false;
};
Card.prototype.chk_mech = function(mech) {
  for (var i = 0; i < this.card_data.mech.length; i++) {
    if (this.card_data.mech[i] == mech) return true;
  }
  return false;
};
Card.prototype.do_action = function(action) {
  this.owner.engine.send_client_minion_action(this.id, action);
}

Card.prototype.calc_state = function(state, init_value, should_sort) {
  var x = init_value;
  var modifiers = [];

  for (var i = 0; i < this.state.length; i++) {
    if (this.state[i].state === state) modifiers.push({
      f: this.state[i].f,
      when: this.state[i].when,
      me: this.state[i].me
    });
  }
  for (i = 0; i < this.owner.engine.g_aura.length; i++) {
    if (this.owner.engine.g_aura[i].who.is_good() && this.owner.engine.g_aura[i].state === state) {
      modifiers.push({
        f: this.owner.engine.g_aura[i].f,
        when: this.owner.engine.g_aura[i].when,
        me: this.owner.engine.g_aura[i].who
      });
    }
  }

  // Mana is only case we should sort as a chornical order
  if (should_sort) {
    // Sort by ascending order
    modifiers.sort(function(a, b) {
      return a.when > b.when
    });
  }

  for (i = 0; i < modifiers.length; i++) {
    x = modifiers[i].f(x, this, modifiers[i].me);
  }
  return x;
};
Card.prototype.dmg = function() {
  var d = this.calc_state('dmg', this.card_data.dmg, false);
  if (d < 0) return 0;
  return d;
}

// Calculates the maximum possible life point
// Enchantment has a higher priority over Auras 
Card.prototype.life = function() {
  var x = this.card_data.life;
  var modifiers = [];
  for (var i = 0; i < this.state.length; i++) {
    if (this.state[i].state === 'life') modifiers.push({
      f: this.state[i].f,
      when: this.state[i].when
    });
  }
  for (i = 0; i < this.life_aura.length; i++) {
    modifiers.push({
      f: this.life_aura[i].f,
      when: this.life_aura[i].when
    });
  }

  for (i = 0; i < modifiers.length; i++) {
    x = modifiers[i].f(x, this);
  }
  return x;
};
Card.prototype.spell_dmg = function(dmg) {
  return this.owner.spell_dmg(this, dmg, false);
};
Card.prototype.mana = function() {
  var m = this.calc_state('mana', this.card_data.mana, true);
  if (m < 0) return 0;

  return m;
};
Card.prototype.update_atk_info = function() {
  var max = this.calc_state('atk_num', 1);
  // Special Case; When non attackable minion (atk_info.max = 0) becomes attackable
  // due to some condition (or vice versa), then we must apply it

  if (this.atk_info.max != max) {
    this.atk_info.max = max;
  }

  if (this.atk_info.turn == this.owner.engine.current_turn) return;

  this.atk_info.turn = this.owner.engine.current_turn;
  this.atk_info.max = max;
  this.atk_info.did = 0;
};
Card.prototype.is_attackable = function() {
  if (this.is_frozen.until >= this.owner.engine.current_turn) return false;
  if (this.dmg() <= 0) return false;

  this.update_atk_info();

  if (this.atk_info.did < this.atk_info.max) return true;

  return false;
};
Card.prototype.frozen = function() {
  if (this.is_frozen.until >= this.owner.engine.current_turn) return true;
  return false;
}
Card.prototype.stealth = function() {
  if (this.is_stealth.until >= this.owner.engine.current_turn) return true;
  return false;
};
Card.prototype.shield = function() {
  if (this.is_shielded.until >= this.owner.engine.current_turn) return true;
  return false;
};
Card.prototype.not_target = function() {
  if (this.is_not_target.until >= this.owner.engine.current_turn) return true;
  return false;
};
Card.prototype.make_charge = function(who) {
  this.add_state(null, 'charge', who);
  this.update_atk_info();
  this.atk_info.max = this.calc_state('atk_num', 1);
};
Card.prototype.make_windfury = function(who) {
  // For minions which are not able to attack (e.g Ancient watcher),
  // We should not give windfury to those
  if (this.calc_state('atk_num', 1) == 0) return;

  this.add_state(function() {
    return 2;
  }, 'atk_num', who);
  this.update_atk_info();

  if (this.atk_info.turn == this.atk_info.field_summon_turn && !this.chk_state('charge')) return;
  this.atk_info.max = 2;
};

Card.prototype.is_good = function() {
  if (this.status != 'destroyed') {
    return true;
  }
  return false;
}

function create_card(id, owner) {
  var cd = card_db.load_card(id);

  return new Card(cd, 0, owner);
}

function Deck() {
  this.card_list = [];
}
Deck.prototype.num_card = function() {
  return this.card_list.length;
};
Deck.prototype.put_card = function(card, at) {
  if (!at && at != 0) at = this.card_list.length;
  this.card_list.splice(at, 0, card);
};
Deck.prototype.get_nearby_card = function(c, offset) {
  for (var i = 0; i < this.card_list.length; i++) {
    if (this.card_list[i] == c) {
      if (i + offset >= 0 && i + offset < this.card_list.length) return this.card_list[i + offset];
      return null;
    }
  }
  return null;
};
Deck.prototype.remove_card = function(c) {
  for (var i = 0; i < this.card_list.length; i++) {
    if (this.card_list[i] == c) {
      this.card_list.splice(i, 1);
      return;
    }
  }
};
Deck.prototype.remove_card_at = function(at) {
  this.card_list.splice(at, 1);
};
Deck.prototype.get_card_datas = function() {
  var data = [];
  for (var i = 0; i < this.card_list.length; i++) {
    data.push(this.card_list[i].card_data);
  }
  return data;
};
Deck.prototype.get_distance = function(from, to) {
  var from_loc = -1,
    to_loc = -1;
  for (var i = 0; i < this.card_list.length; i++) {
    if (this.card_list[i] == from) from_loc = i;
    if (this.card_list[i] == to) to_loc = i;
  }

  if (from_loc == -1 || to_loc == -1) return -1;
  return Math.abs(from_loc - to_loc);
};
Deck.prototype.get_pos = function(c) {
  for (var i = 0; i < this.card_list.length; i++) {
    if (this.card_list[i] == c) return i;
  }
  return -1;
};
Deck.prototype.search_deck = function(cond) {
  var r = [];
  for (var i = 0; i < this.card_list.length; i++) {
    if (cond(this.card_list[i])) r.push(this.card_list[i]);
  }
  return r;
};

function Player(player_name, job, engine) {
  this.player_name = player_name;
  this.player_job = job;
  this.engine = engine;

  // Engine 에서 설정해준다. 
  this.enemy = null;

  // 플레이어 역시 하나의 카드로 취급되기 때문에 고유의 ID 번호를 부여받게 된다. 
  this.id = this.engine.g_id.get_id();

  // Player ID 와 Player.hero.id 를 언제나 싱크 시켜주어야 한다!!!
  this.hero = new Card([player_name, 'hero', 'hero', job, 0, 0, 30, ''], this.id, this);

  // TODO make it to the default setting
  this.current_mana = 100;
  this.boosted_mana = 0;
  this.max_mana = this.current_mana;

  // current turn's overloaded mana
  this.current_overload_mana = 0;

  // Next turn's overloaded mana
  this.next_overload_mana = 0;

  // How many cards drawn in this turn
  this.turn_card_play = [];

  this.hand = new Deck();
  this.field = new Deck();
  this.deck = new Deck();

  this.g_handler = this.engine.g_handler;
  this.g_aura = this.engine.g_aura;
  this.g_id = this.engine.g_id;
  this.g_when = this.engine.g_when;

  this.selection_waiting = false;

  this.choose_waiting = false;
  this.forced_target = null;
  this.random_target = null;
  this.must_choose = false;

  this.who_select_wait = null;
  this.selection_fail_timer = null;
  this.available_list = [];

  this.on_select_success = null;
  this.on_select_fail = null;

  this.socket = null;

  this.starting_cards = [];

  // Maximum 8
  this.exhaust_dmg = 0;

  // Hero Powers 
  this.hero_power = null;
  this.power_used = {
    max: 1,
    did: 0,
    turn: -1
  };

  this.init_hero_power(); // Set Hero POWER 

  // Hero Weapon
  this.weapon = null;

  // Damage added to the hero
  this.turn_dmg = {
    dmg: 0,
    turn: -1
  };


  this.turn_hero_atk = {
    did: 0,
    turn: -1
  };

  // List of secrets
  this.secret_list = [];

  // Auras (This is updated in update_aura section)
  this.aura = [];

  // C'Thun Buffs
  this.cthun_dmg_buff = 0;
  this.cthun_life_buff = 0;
  
  // User Play Stacks
  // (애니메이션이 끝나기 전에 여러가지 행동을 하는 경우 이 stack 에 저장된다)
  this.user_play_stack = []; 
}
Player.prototype.chk_aura = function(aura) {
  for (var i = 0; i < this.aura.length; i++) {
    if (this.aura[i] == aura) return true;
  }
  return false;
};
// Check whether c is charge due to the global aura effect
Player.prototype.chk_charge = function(c) {
  for (var i = 0; i < this.g_aura.length; i++) {
    if (this.g_aura[i].state == 'charge' && this.g_aura[i].who.is_good() && this.g_aura[i].f(c, this.g_aura[i].who)) {
      return true;
    }
  }
  return false;
};
// TODO :: Finish implementing this function using user io
// [options] are the array of name of cards to choose
// we can us choose_one as a DISCOVER too (by using the option must)
Player.prototype.choose_one = function(me, options, on_success, on_fail, must,
  forced_choose, random_choose, forced_target, random_target, engine_called) {
  // If the user is already on choose/select process, then we add this
  // into user_waiting_queue
  if ((this.choose_waiting || this.selection_waiting) && !engine_called) {
    this.engine.add_user_waiting(this.choose_one, this, [me, options, on_success, on_fail, must,
      forced_choose, random_choose, forced_target, random_target
    ]);
    return;
  }

  if (forced_choose === 0 || forced_choose) {
    on_success(forced_choose, me, forced_target, random_target);
    return;
  }
  if (random_choose) {
    var choice = Math.floor(Math.random() * options.length);
    console.log('Random Choice :: ', choice);
    on_success(choice);
    return;
  }

  this.forced_target = forced_target;
  this.random_target = random_target;
  this.must_choose = must;

  this.on_select_success = on_success;
  this.on_select_fail = on_fail;
  this.who_select_wait = me;
  this.available_list = options;
  this.choose_waiting = true;

  function get_cards(arr) {
    var x = [];
    for (var i = 0; i < arr.length; i++) {
      x.push(new CardData(card_db.load_card(arr[i])));
    }
    return x;
  }

  console.log('Options :: ', options);
  console.log('Options :: ', get_cards(options));
  this.socket.emit('choose-one', {
    list: get_cards(options)
  });

  this.selection_fail_timer = setTimeout(function(p) {
    return function(c) {
      if (p.choose_waiting) p.choose_waiting = false;
      else return;

      if (p.must_choose) {
        p.on_select_success(0, c, p.forced_target, p.random_target);
      }
      else {
        p.on_select_fail(c);
      }

      p.on_select_success = null;
      p.on_select_fail = null;
      p.engine.do_user_waiting();
    };
  }(this), 40000);
};
// We dont have to send 'target' as an argument to success function
// because the card itself stores the info of it in its target property

// select_one 작동 개요 설명
// 일단 select_cond 에 부합하는 후보들을 데이터로 하여서, socket 으로 'select-one' 소켓을 
// 전송하게 된다. 그리고 해당 player 의 selection_waiting 를 on 시킨다.
// 이 소켓을 client 에서 수신하게 된다면 'selected-done' 이라는 소켓에 보내게 되는데
// 만일 해당 Player 의 selection_waiting 가 on 되어 있다면, 결과에 따라 이에 대응하는
// success 함수, 혹은 fail 함수를 호출하면 된다.
// 참고로 force_target 의 경우 이 것이 설정되어 있다면 target 을 유저로 부터 받는게
// 아니라 자동으로 force_target 으로 설정된다. 
// random_target 의 경우, 주문이 랜덤하게 고르게 된다. 
Player.prototype.select_one = function(c, select_cond, success, fail, forced_target, random_target, engine_called) {
  if ((this.choose_waiting || this.selection_waiting) && !engine_called) {
    this.engine.add_user_waiting(this.select_one, this, [c, select_cond, success, fail, forced_target, random_target]);
    return;
  }

  if (forced_target) {
    c.target = forced_target;
    success(c);
    return;
  }

  // Cannot Target the Stealth Ones
  var available_list = [];
  for (var i = 0; i < this.field.num_card(); i++) {
    if (select_cond(this.field.card_list[i]) && !this.field.card_list[i].not_target()) {
      available_list.push(this.field.card_list[i]);
    }
  }

  // Cannot target Enemy Stealth minion (but can target mine)
  for (var i = 0; i < this.enemy.field.num_card(); i++) {
    if (select_cond(this.enemy.field.card_list[i]) && !this.enemy.field.card_list[i].stealth() && !this.enemy.field.card_list[i].not_target()) {
      available_list.push(this.enemy.field.card_list[i]);
    }
  }

  if (select_cond(this.hero)) {
    available_list.push(this.hero);
  }
  if (select_cond(this.enemy.hero)) {
    available_list.push(this.enemy.hero);
  }

  // Randomly choose target if available  
  if (random_target) {
    if (available_list.length) {
      c.target = available_list[Math.floor(available_list.length * Math.random())];
      console.log('Random Target :: ', c.target.card_data.name);
      success(c);
    }
    else {
      console.log('No Target!');
    }
    return;
  }

  this.on_select_success = success;
  this.on_select_fail = fail;

  this.selection_waiting = true;
  this.who_select_wait = c;
  this.available_list = available_list;

  console.log(colors.green('[select one] among'), to_id(available_list, this));

  function to_id(arr, me) {
    var x = [];
    for (var i = 0; i < arr.length; i++) {
      if (arr[i] == me.hero) x.push('me');
      else if (arr[i] == me.enemy.hero) x.push('enemy');
      else x.push(arr[i].id);
    }
    return x;
  }

  this.socket.emit('select-one', {
    list: to_id(available_list, this)
  });

  this.selection_fail_timer = setTimeout(function(p) {
    return function(c) {
      if (p.selection_waiting) p.selection_waiting = false;
      else return;

      p.on_select_fail(c);

      p.on_select_success = null;
      p.on_select_fail = null;
      p.engine.do_user_waiting();
    };
  }(this), 40000);
};
Player.prototype.play_spell = function(c) {
  if (this.current_mana < c.mana()) return; // Enough mana?

  var card = card_manager.load_card(c.card_data.unique);
  this.turn_card_play.push(c);

  if (this.chk_aura('fandral_staghelm')) {
    card.on_play(c, false, false, 2);
  }
  else {
    card.on_play(c);
  }
};
// Forcefully cast a spell to target
Player.prototype.force_cast_spell = function(c, target) {
  var card = card_manager.load_card(c.card_data.unique);
  card.on_play(c, target);
};
// Targeting phase does not create death creation step!
Player.prototype.chk_target = function(c, next) {
  if (c.status == 'destroyed') return;
  if (c.target) {
    this.g_handler.add_event(new Event('target', [c]));
  }

  // At this point, we can guarantee that the spell will be executed
  if (c.card_data.is_secret) {
    this.secret_list.push(c);
  }

  this.g_handler.add_callback(next, this, [c]);
  this.g_handler.execute();
};
Player.prototype.end_hero_power = function() {
  this.g_handler.execute();
};
Player.prototype.end_spell_txt = function(c) {
  this.g_handler.add_phase_block = false;
  this.g_handler.add_phase(this.summon_phase, this, [c]);
};
Player.prototype.hand_card = function(unique, n, after_hand, force) {
  if (!n) n = 1;
  while (n--) {
    var card = card_manager.load_card(unique);
    var c = create_card(unique, this);

    c.status = 'hand';
    c.id = this.g_id.get_id();

    if (card.on_draw && !force) card.on_draw(c);
    this.hand.put_card(c, 10);

    if (after_hand) this.g_handler.add_callback(after_hand, this, [c]);
    if (!force) {
      this.g_handler.add_event(new Event('hand_card', [c, this]));
    }
    this.g_handler.execute();
  }
};
// Draw n cards from a deck
Player.prototype.draw_cards = function(n, after_draw, who, done) {
  if(!n) n = 1;
  if(!done) done = 0;
  
  if(done < n) {
    this.g_handler.add_callback(this.draw_cards, this, [n, after_draw, who, done + 1]);
    
    if (this.deck.num_card() == 0) {
      this.exhaust_dmg = this.exhaust_dmg > 8 ? 8 : this.exhaust_dmg + 1;

      this.deal_dmg(this.exhaust_dmg, this.hero, this.hero);
      return;
    }
    var rand = Math.floor(Math.random() * this.deck.num_card());
    var c = this.deck.card_list[rand];
    this.deck.remove_card_at(rand);

    if (this.hand.num_card() >= 10) {
      this.g_handler.add_event(new Event('card_burnt', [c]));
      return;
    }

    var card = card_manager.load_card(c.card_data.unique);

    c.status = 'hand';
    c.id = this.g_id.get_id();

    if (card.on_draw) card.on_draw(c);

    this.hand.put_card(c, 10);

    if (after_draw) {
      this.g_handler.add_callback(after_draw, this, [c, who]);
    }

    if(who) this.g_handler.add_event(new Event('draw_card', [c, who]));
    else  this.g_handler.add_event(new Event('draw_card', [c, this.hero]));
  }
  this.g_handler.execute();
};
Player.prototype.draw_card = function(c) {
  this.deck.remove_card(c);
  if (this.hand.num_card() >= 10) {
    // Card is burned!!
    this.g_handler.add_event(new Event('card_burnt', [c]));
    return;
  }

  var card = card_manager.load_card(c.card_data.unique);

  c.status = 'hand';
  c.id = this.g_id.get_id(); // ID is issued when the card goes to the user's hand

  if (card.on_draw) card.on_draw(c);

  this.hand.put_card(c, 10);

  this.g_handler.add_event(new Event('draw_card', [c, this]));
  this.g_handler.execute();
};
Player.prototype.draw_card_name = function(name) {
  for (var i = 0; i < this.deck.num_card(); i++) {
    if (this.deck.card_list[i].card_data.name == name) {
      this.draw_card(this.deck.card_list[i]);
      return;
    }
  }
};
// Play a card from a hand
Player.prototype.play_minion = function(c, at) {
  console.log(colors.blue('[play minion] mana : '), this.current_mana, ' vs ', c.mana());

  if (this.field.num_card() >= 7 || this.current_mana < c.mana()) {
    this.emit_play_card_fail(c);
    return;
  }

  var card = card_manager.load_card(c.card_data.unique);
  this.turn_card_play.push(c);

  if (this.chk_aura('fandral_staghelm')) {
    card.on_play(c, true, true, at, 2);
  }
  else {
    card.on_play(c, true, true, at);
  }
};
Player.prototype.play_success = function(c, at, next) {
  // if the status of card is already specified as 'field',
  // then this means that the minion is not summoning by user card play
  // but forcefully summoned
  if (c.status == 'field' && c.card_data.type != 'hero_power') {
    this.g_handler.add_callback(this.summon_phase, this, [c]);

    // only turn on non-battlecry stuff (어치파 bc phase 로 들어갈 일은 없다)
    this.g_handler.add_callback(next, this, [c, true, false]);
    return;
  }

  c.status = 'field';
  this.current_mana -= c.mana();
  c.field_summon_turn = this.engine.current_turn;
  c.summon_order = this.g_when.get_id();

  this.hand.remove_card(c);
  this.emit_play_card_success(c, at, c.mana());

  if (c.card_data.type == 'minion') {
    console.log('PUT ', c.card_data.name, ' at ', at);
    this.field.put_card(c, at);

    this.g_handler.add_event(new Event('play_card', [c, this]));
    this.g_handler.add_phase(this.battlecry_phase, this, [c, next]);
  }
  else if (c.card_data.type == 'spell') {
    this.g_handler.add_event(new Event('play_card', [c, this]));
    this.g_handler.add_phase(this.chk_target, this, [c, next]);
  }
  else if (c.card_data.type == 'hero_power') {
    this.g_handler.add_event(new Event('inspire', [this]));
    this.g_handler.add_phase(this.chk_target, this, [c, next]);
  }
  else if (c.card_data.type == 'weapon') {
    this.load_weapon(c);

    this.g_handler.add_event(new Event('play_card', [c, this]));
    this.g_handler.add_phase(this.battlecry_phase, this, [c, next]);
  }

  this.g_handler.execute();
};
// next (card, non_battlecry_stuff, battlecry_stuff)
// battlecry phase 실행 중에 다른 battlecry 가 진행될 가능성은 없다
// (왜냐하면 battlecry 는 직접적인 카드의 play 로만 가능하기 때문)
Player.prototype.battlecry_phase = function(c, next) {
  // 따라서 battlecry phase 진행 중에는 다른 최상위 phase 가 발생하지
  // 않도록 add_phase 시에 설사 next_phase 가 등록되어 있지 않더라도 
  // next_phase 가 등록되는 것을 방지해야 한다. 
  this.g_handler.add_phase_block = true;

  if (next) {
    next(c, true, true); // Do battle cry!

    if (this.chk_aura('bran_bronzebeard')) {
      // Turn Off non-battlecry stuff
      next(c, false, true);
    }
  }

  this.g_handler.execute();
};
Player.prototype.end_bc = function(c) {
  this.g_handler.add_phase_block = false;
  this.g_handler.add_phase(this.after_play_phase, this, [c]);

  this.g_handler.execute();
};
Player.prototype.after_play_phase = function(c) {
  this.g_handler.add_event(new Event('after_play', [c, this]));

  // Death creation step is not created following this phase!
  this.g_handler.add_callback(this.summon_phase, this, [c]);

  this.g_handler.execute();
};
Player.prototype.summon_phase = function(c) {
  if (!c.transformed) this.g_handler.add_event(new Event('summon', [c]));

  if (c.card_data.type === 'minion') {
    c.atk_info.max = c.calc_state('atk_num', 1);
    c.atk_info.turn = this.engine.current_turn;

    if (c.chk_state('charge') || this.chk_charge(c)) {
      c.atk_info.did = 0;
    }
    else {
      c.atk_info.did = c.atk_info.max; // Cannot move at a spawned turn
    }
  }
  else if (c.card_data.type == 'weapon') {
    this.weapon = c;
    this.weapon.atk_info.max = this.weapon.calc_state('atk_num', 1, false);
    this.weapon.atk_info.turn = this.engine.current_turn;

    if (this.turn_hero_atk.turn != this.engine.current_turn) {
      this.turn_hero_atk.did = 0;
      this.turn_hero_atk.turn = this.engine.current_turn;
    }

    this.weapon.atk_info.did = this.turn_hero_atk.did;
  }
  this.g_handler.execute();
};

// transform 이 true 인 경우는, 어떤 하수인이 다른 하수인으로 transform
// 된 경우를 의미한다 (copy 와는 다르다) 이 경우에 SUMMON 이벤트가 
// 발생하지 않는다. 
Player.prototype.summon_card = function(unique, at, transformed, after_summon) {
  if (!transformed) transformed = false;

  var c = create_card(unique);

  c.field_summon_turn = this.engine.current_turn;
  c.status = 'field';
  c.owner = this;
  c.summon_order = this.g_when.get_id();
  c.id = this.engine.g_id.get_id();

  if (transformed) this.transformed = true;

  var card = card_manager.load_card(c.card_data.unique);

  if (c.card_data.type == 'minion') this.field.put_card(c, at);
  else if (c.card_data.type == 'weapon') {
    this.load_weapon(c);
  }

  if (after_summon) this.g_handler.add_callback(after_summon, this, [c]);

  card.on_play(c, false, false, at);
};
Player.prototype.emit_play_card_success = function(card, at, mana) {
  this.socket.emit('hearth-play-card', {
    result: true,
    id: card.id,
    at: at,
    cost: mana
  });
};
Player.prototype.emit_play_card_fail = function(card) {
  this.socket.emit('hearth-play-card', {
    result: false,
    id: card.id,
  });
};
Player.prototype.chk_enemy_taunt = function(target) {
  if (target.chk_state('taunt')) return true;
  for (var i = 0; i < this.enemy.field.num_card(); i++) {
    if (this.enemy.field.card_list[i].chk_state('taunt')) return false;
  }
  return true;
};
Player.prototype.chk_invincible = function(target) {
  for (var i = 0; i < this.g_aura.length; i++) {
    if (this.g_aura[i].state === 'invincible' && this.g_aura[i].who.is_good() && this.g_aura[i].f(target)) {
      return true;
    }
  }
  if (target.is_invincible.until >= this.engine.current_turn) return true;

  return false;
};
Player.prototype.hero_combat = function(target) {
  // check the target condition

  if (!this.chk_enemy_taunt(target) // chks whether the attacker is attacking proper taunt minions
    || target.owner == this // chks whether the attacker is not attacker our own teammates
    || this.chk_invincible(target) || target.stealth()) return false;

  // Check whether I can attack  
  if (this.hero.is_frozen.until >= this.engine.current_turn) return false;

  if (this.turn_hero_atk.turn != this.engine.current_turn) {
    this.turn_hero_atk.did = 0;
    this.turn_hero_atk.turn = this.engine.current_turn;
  }
  // First chk whether the hero is attackable
  if (this.weapon) {
    if (this.weapon.atk_info.turn != this.engine.current_turn) {
      this.weapon.atk_info.max = this.weapon.calc_state('atk_num', 1, false);
      this.weapon.atk_info.did = 0;
      this.weapon.atk_info.turn = this.engine.current_turn;
    }

    // Weapon is loaded After the hero attacked something else
    // (It exhausted its attack this turn)
    if (this.turn_hero_atk.did != this.weapon.atk_info.did) {
      return;
    }

    if (this.weapon.atk_info.did >= this.weapon.atk_info.max) return;

    this.weapon.atk_info.did++;
    this.turn_hero_atk.did++;
  }
  else if (this.hero_dmg() != 0) {
    if (this.turn_hero_atk.did == 0) {
      this.turn_hero_atk.did++;
    }
    else {
      return;
    }
  }

  this.hero.target = target;

  this.g_handler.add_event(new Event('propose_attack', [this.hero, target]));
  this.g_handler.add_callback(this.hero_attack, this, [target]);

  this.g_handler.execute();
};
Player.prototype.hero_attack = function(target) {
  // attack event does not change the target of an attacker
  this.g_handler.add_event(new Event('attack', [this.hero, this.hero.target]));
  this.g_handler.add_callback(this.pre_hero_combat, this, []);

  this.g_handler.execute();
};
Player.prototype.pre_hero_combat = function() {
  var target = this.hero.target;

  this.hero.is_attacking = true;
  target.is_attacking = false;

  this.hero.dmg_given = this.hero_dmg();
  target.dmg_given = target.dmg();

  this.g_handler.add_event(new Event('pre_dmg', [this.hero, target, this.hero.dmg_given]));
  this.g_handler.add_event(new Event('pre_dmg', [target, this.hero, target.dmg_given]));
  this.g_handler.add_callback(this.actual_combat, this, [this.hero]);

  this.g_handler.execute();
};
// Conducts combat no matter what happens
Player.prototype.forced_combat = function(c, target) {
  c.target = target;
  c.is_stealth.until = -1; // stealth is gone!
  c.atk_info.did += 1; // Did attack 

  // propose_attack event can change the target of the attacker
  this.g_handler.add_event(new Event('propose_attack', [c, target]));
  this.g_handler.add_callback(this.attack, this, [c]);

  this.g_handler.execute();
}
Player.prototype.combat = function(c, target) {
  if (!c.is_attackable() // chks whether the attacker has not exhausted its attack chances
    || !this.chk_enemy_taunt(target) // chks whether the attacker is attacking proper taunt minions
    || target.owner == c.owner // chks whether the attacker is not attacker our own teammates
    || this.chk_invincible(target)  // chks whether the attacker is attacking invincible target
    || target.stealth() 
    || (target.card_data.type == 'hero' && c.no_hero_attack)) return false; 

  c.target = target;
  c.is_stealth.until = -1; // stealth is gone!
  c.atk_info.did += 1; // Did attack 

  // propose_attack event can change the target of the attacker
  this.g_handler.add_event(new Event('propose_attack', [c, target]));
  this.g_handler.add_callback(this.attack, this, [c]);

  this.g_handler.execute();
};
Player.prototype.attack = function(c) {
  // If the attacker is mortally wounded or out of play, then combat event is closed
  if (c.current_life <= 0 || c.status != 'field') return;

  // attack event does not change the target of an attacker
  this.g_handler.add_event(new Event('attack', [c, c.target]));
  this.g_handler.add_callback(this.pre_combat, this, [c]);

  this.g_handler.execute();
};
Player.prototype.pre_combat = function(c) {
  var target = c.target;

  c.is_attacking = true;
  target.is_attacking = false;

  c.dmg_given = c.dmg();
  target.dmg_given = target.dmg();

  this.g_handler.add_event(new Event('pre_dmg', [c, target, c.dmg_given]));
  this.g_handler.add_event(new Event('pre_dmg', [target, c, target.dmg_given]));
  this.g_handler.add_callback(this.actual_combat, this, [c]);

  this.g_handler.execute();
};
Player.prototype.actual_combat = function(c) {
  var target = c.target;

  // checking for shields
  if (target.dmg_given > 0 && c.is_shielded.until >= this.engine.current_turn) {
    target.dmg_given = 0;
    c.is_shielded.until = -1; // shield is GONE
  }
  if (c.dmg_given > 0 && target.is_shielded.until >= this.engine.current_turn) {
    c.dmg_given = 0;
    target.is_shielded.until = -1;
  }

  c.already_destroyed = false;
  target.already_destroyed = false;

  // Mark whether any one of minion has destroyed before ( to prevent duplicated Event queing)
  if (c.current_life <= 0 || c.status == 'destroyed') c.already_destroyed = true;
  if (target.current_life <= 0 || target.status == 'destroyed') target.already_destroyed = true;

  if (c.armor > target.dmg_given) {
    c.armor -= target.dmg_given;
  }
  else {
    c.armor = 0;
    c.current_life -= (target.dmg_given - c.armor);
  }

  // Check for the Armor
  if (target.armor > c.dmg_given) {
    target.armor -= c.dmg_given;
  }
  else {
    target.armor = 0;
    target.current_life -= (c.dmg_given - target.armor);
  }

  if (c.dmg_given > 0) {
    this.g_handler.add_event(new Event('take_dmg', [target, c, c.dmg_given]));
    this.g_handler.add_event(new Event('deal_dmg', [c, target, c.dmg_given]));
  }
  if (target.dmg_given > 0) {
    this.g_handler.add_event(new Event('take_dmg', [c, target, target.dmg_given]));
    this.g_handler.add_event(new Event('deal_dmg', [target, c, target.dmg_given]));
  }

  var first = c.summon_order > target.summon_order ? target : c;
  var second = c.summon_order > target.summon_order ? c : target;

  console.log('First :: ', first.card_data.name, ' life : ', first.current_life);
  console.log('Second :: ', second.card_data.name, ' life : ', second.current_life);

  // Minion must be alive before this attack in order to invoke destroyed event!
  // (DESTROYED EVENT IS NOT CREATED TWICE)
  if (first.current_life <= 0 && !first.already_destroyed && first.status != 'destroyed')
    this.g_handler.add_event(new Event('destroyed', [first, second]));

  if (second.current_life <= 0 && !second.already_destroyed && second.status != 'destroyed')
    this.g_handler.add_event(new Event('destroyed', [second, first]));

  // If it was an attack by a hero, we have to decrease its weapon's durability (if it has one)
  if (c == this.hero) {
    if (this.weapon) {
      this.weapon_dec_durability(1, this.hero);
    }
  }

  this.g_handler.execute();
};
Player.prototype.spell_dmg = function(c, dmg) {
  for (var i = 0; i < this.g_aura.length; i++) {
    if (this.g_aura[i].state == 'spell_dmg' && this.g_aura[i].who.is_good()) {
      dmg = this.g_aura[i].f(dmg, c, this.g_aura[i].who);
    }
  }
  if (this.chk_aura('prophet_velen')) {
    dmg *= 2;
  }
  return dmg;
};

Player.prototype.deal_dmg = function(dmg, from, to) {
  console.log(colors.red('[deal dmg] '), from.card_data.name, ' -> ', to.card_data.name);

  from.dmg_given = dmg;
  this.g_handler.add_event(new Event('pre_dmg', [from, to, dmg]));
  this.g_handler.add_callback(this.actual_dmg_deal, this, [from, to]);
};
Player.prototype.actual_dmg_deal = function(from, to) {
  var dmg = from.dmg_given;
  if (dmg > 0 && to.is_shielded.until >= this.engine.current_turn) {
    dmg = 0;
    to.is_shielded.until = -1;
  }
  if (this.chk_invincible(to)) {
    dmg = 0;
  }
  if (dmg == 0) return; // May be we should at least create an animation for this too..

  to.already_destroyed = false;
  if (to.current_life <= 0 || to.status == 'destroyed') to.already_destroyed = true;

  // Check for the Armor
  if (to.armor > dmg) {
    to.armor -= dmg;
  }
  else {
    to.armor = 0;
    to.current_life -= (dmg - to.armor);
  }


  this.g_handler.add_event(new Event('take_dmg', [to, from, dmg]));
  this.g_handler.add_event(new Event('deal_dmg', [from, to, dmg]));

  if (to.current_life <= 0 && !to.already_destroyed && to.status != 'destroyed')
    this.g_handler.add_event(new Event('destroyed', [to, from]));
};

// Do not specify increased healing amount into 'heal'
Player.prototype.heal = function(heal, from, to) {
  if (this.chk_aura('auchenai_soulpriest') || this.chk_aura('embrace_the_shadow')) {
    this.deal_dmg(this.spell_dmg(from, heal), from, to);
    return;
  }
  if (this.chk_aura('prophet_velen')) {
    heal *= 2;
  }

  if (to.current_life != to.life) {
    var bef = to.current_life;

    to.current_life += heal;
    if (to.current_life > to.life()) to.current_life = to.life();

    this.g_handler.add_event(new Event('heal', [from, to, to.current_life - bef]));
  }

  this.g_handler.execute();
};
Player.prototype.heal_many = function(heal_arr, from, to_arr, done) {
  if (this.chk_aura('auchenai_soulpriest') || this.chk_aura('embrace_the_shadow')) {
    var dmg_arr = [];
    for (var i = 0; i < heal_arr.length; i++) {
      dmg_arr.push(this.spell_dmg(from, heal_arr[i]));
    }
    this.deal_dmg_many(dmg_arr, from, to_arr);
    return;
  }

  if (this.chk_aura('prophet_velen')) {
    for (var i = 0; i < heal_arr.length; i++) heal_arr[i] *= 2;
  }

  // sort the list of targes in order of play
  var temp_arr = [];
  for (var i = 0; i < heal_arr.length; i++) {
    temp_arr.push({
      h: heal_arr[i],
      to: to_arr[i]
    });
  }
  temp_arr.sort(function(a, b) {
    return a.to.summon_order > b.to.summon_order;
  });

  // Rearrange dmg_arr and to_arr according to the summon_order
  for (i = 0; i < temp_arr.length; i++) {
    heal_arr[i] = temp_arr[i].h;
    to_arr[i] = temp_arr[i].to;
  }

  for (var i = 0; i < temp_arr.length; i++) {
    if (temp_arr[i].to.current_life != temp_arr[i].to.life) {
      var bef = temp_arr[i].to.current_life;

      temp_arr[i].to.current_life += temp_arr[i].h;
      if (temp_arr[i].to.current_life > temp_arr[i].to.life()) temp_arr[i].to.current_life = temp_arr[i].to.life();

      this.g_handler.add_event(new Event('heal', [from, temp_arr[i].to, temp_arr[i].to.current_life - bef]));
    }
  }

  this.g_handler.execute();
};

// to is a function that returns possible targets every time
// THIS FUNCTION DOES NOT CHECK WHETHER TARGET LIFE IS BELOW ZERO OR NOT
// PLZ CHECK IT IN to_f FUNCTION 
Player.prototype.deal_multiple_dmg = function(total_dmg, from, to_f, done) {
  if (!done) done = 0;

  if (done < total_dmg) {
    var possible_target = to_f();
    if (possible_target.length == 0) return;

    this.g_handler.add_callback(this.deal_multiple_dmg, this, [total_dmg, from, to_f, done + 1]);
    this.deal_dmg(1, from, possible_target[Math.floor(Math.random() * possible_target.length)]);
  }

  this.g_handler.execute();
};
// Deals damage to many targets
Player.prototype.deal_dmg_many = function(dmg_arr, from, to_arr, done) {
  if (!done) {
    done = 0;

    // sort the list of targes in order of play
    var temp_arr = [];
    for (var i = 0; i < dmg_arr.length; i++) {
      temp_arr.push({
        d: dmg_arr[i],
        to: to_arr[i]
      });
    }
    temp_arr.sort(function(a, b) {
      return a.to.summon_order > b.to.summon_order;
    });

    // Rearrange dmg_arr and to_arr according to the summon_order
    for (i = 0; i < temp_arr.length; i++) {
      dmg_arr[i] = temp_arr[i].d;
      to_arr[i] = temp_arr[i].to;
    }
  }
  if (done < dmg_arr.length) {
    if (done >= 1) dmg_arr[done - 1] = from.dmg_given;

    from.dmg_given = dmg_arr[done];
    // Create pre_dmg events and handle those
    this.g_handler.add_event(new Event('pre_dmg', [from, to_arr[done], dmg_arr[done]]));
    this.g_handler.add_callback(this.deal_dmg_many, this, [dmg_arr, from, to_arr, done + 1]);
    return;
  }
  else { // Now pre_dmg events are done
    dmg_arr[done - 1] = from.dmg_given;

    for (i = 0; i < to_arr.length; i++) {
      // shield is dispelled
      if (dmg_arr[i] > 0 && to_arr[i].is_shielded.until >= this.engine.current_turn) {
        to_arr[i].is_shielded.until = -1;
        dmg_arr[i] = 0;
      }

      // We only create dmg event when dmg is over 0
      if (dmg_arr[i] > 0) {

        to_arr[i].already_destroyed = false;
        if (to_arr[i].current_life <= 0 || to_arr[i].status == 'destroyed') to_arr[i].already_destroyed = true;

        // Check for the Armor
        if (to_arr[i].armor > dmg_arr[i]) {
          to_arr[i].armor -= dmg_arr[i];
        }
        else {
          to_arr[i].armor = 0;
          to_arr[i].current_life -= (dmg_arr[i] - to_arr[i].armor);
        }

        this.g_handler.add_event(new Event('deal_dmg', [from, to_arr[i], dmg_arr[i]]));
        this.g_handler.add_event(new Event('take_dmg', [to_arr[i], from, dmg_arr[i]]));

        if (to_arr[i].current_life <= 0 && !to_arr[i].already_destroyed && to_arr[i].status != 'destroyed')
          this.g_handler.add_event(new Event('destroyed', [to_arr[i], from]));
      }
    }
  }
};
// Brings card on field to hand
Player.prototype.return_to_hand = function(c, who, after_hand) {
  // Card will be marked as destroyed but will not queued into
  // destroyed_queue unless the hand is full
  c.status = 'destroyed';

  // Remove Card from field
  c.owner.field.remove_card(c);

  if (c.owner.hand.num_card() >= 10) {
    this.g_handler.add_event(new Event('destroyed', [c, who]));
  }

  c.owner.hand_card(c.card_data.unique, 1, after_hand);

  this.g_handler.execute();
};
// Discard a card on hand
Player.prototype.discard_card = function(c, who) {
  c.status = 'destroyed';

  this.hand.remove_card(c);
  this.g_handler.add_event(new Event('discard', [c, who]));
  this.g_handler.execute();
};
// 'who' takes control of c
Player.prototype.take_control = function(c, who) {
  c.owner.field.remove_card(c);
  c.owner = who.owner;

  who.owner.field.put_card(c, 10);

  c.atk_info.turn = this.engine.current_turn;
  c.atk_info.max = c.calc_state('atk_num', 1, false);

  if (c.chk_state('charge')) {
    c.atk_info.did = 0;
  }
  else c.atk_info.did = c.atk_info.max;
};
// Everything about src copies to dest
Player.prototype.copy_minion = function(src, dest) {
  // First Copy all the Card datas
  dest.card_data = new CardData(src.card_data.to_array());

  dest.owner = this;
  dest.status = src.status;

  dest.is_frozen = src.is_frozen;
  dest.is_stealth = src.is_stealth;
  dest.is_shielded = src.is_shielded;
  dest.is_invincible = src.is_invincible;

  dest.atk_info = src.atk_info;
  dest.current_life = src.current_life;

  dest.state = [];
  for (let i = 0; i < src.state.length; i++) {
    dest.state.push({
      f: src.state[i].f,
      state: src.state[i].state,
      who: (src.state[i].who == src) ? dest : src.state[i].who,
      when: src.state[i].when
    });
  }

  // Life Auras are not copied 
  // dest.life_aura = src.life_aura.slice();

  // Removing Dest's Handlers 
  for (var e_name in this.g_handler.event_handler_arr) {
    var arr = this.g_handler.event_handler_arr[e_name];
    for (let i = 0; i < arr.length; i++) {
      if (arr[i].target === dest || arr[i].me === dest) {
        arr.splice(i, 1);
        i--;
      }
    }
  }

  // Now We are copying the Handlers that are registered By/For src
  for (var e_name in this.g_handler.event_handler_arr) {
    var arr = this.g_handler.event_handler_arr[e_name];
    for (let i = 0; i < arr.length; i++) {
      // If there is a handler that targets our src 
      // then we have to make that handler to target our dest too 
      if (arr[i].target === src || arr[i].me === src) {
        arr.push({
          f: arr[i].f,
          me: (arr[i].me == src ? dest : arr[i].me),
          is_secret: arr[i].is_secret,
          must: arr[i].must,
          target: (arr[i].target == src ? dest : arr[i].target)
        });
      }
    }
  }

  for (var i = 0; i < this.engine.g_aura.length; i++) {
    var aura = this.engine.g_aura[i];
    if (aura.who === dest) {
      this.engine.g_aura.splice(i, 1);
      i--;
    }
  }
  for (var i = 0; i < this.engine.g_aura.length; i++) {
    var aura = this.engine.g_aura[i];
    if (aura.who === src) {
      this.engine.add_aura(aura[i].f, aura[i].state, dest, aura[i].must);
    }
  }
};
Player.prototype.instant_kill = function(from, target) {
  if (target.status != 'destroyed') {
    target.status = 'destroyed';
    if (target.current_life > 0) this.g_handler.add_event(new Event('destroyed', [target, from]));
  }

  this.g_handler.execute();
};
Player.prototype.instant_kill_many = function(from, target_arr) {
  target_arr.sort(function(a, b) {
    return a.summon_order > b.summon_order;
  });

  for (var i = 0; i < target_arr.length; i++) {
    if (target_arr[i].status != 'destroyed') {
      target_arr[i].status = 'destroyed';
      if (target_arr[i].current_life > 0) this.g_handler.add_event(new Event('destroyed', [target_arr[i], from]));
    }
  }

  this.g_handler.execute();
};
Player.prototype.add_hero_dmg = function(d) {
  if (this.turn_dmg.turn == this.engine.current_turn) {
    this.turn_dmg.dmg += d;
  }
  else {
    this.turn_dmg.turn = this.engine.current_turn;
    this.turn_dmg.dmg = d;
  }
}
Player.prototype.hero_dmg = function() {
  var dmg = 0;
  if (this.weapon) {
    dmg = this.weapon.dmg();
  }
  if (this.turn_dmg.turn == this.engine.current_turn) dmg += this.turn_dmg.dmg;

  return dmg;
};
Player.prototype.weapon_dec_durability = function(d, who) {
  if (this.weapon) {
    this.weapon.current_life -= d;
  }
  if (this.weapon.current_life <= 0) {
    this.weapon.status = 'destroyed';
    this.g_handler.add_event(new Event('destroyed', [this.weapon, who]));
  }
};
Player.prototype.use_hero_power = function() {
  var default_max = 1;
  for (var i = 0; i < this.engine.g_aura.length; i++) {
    if (this.engine.g_aura[i].state == 'hero_power_num') {
      default_max = this.engine.g_aura[i].f(default_max, this.hero_power, this.engine.g_aura[i].who);
    }
  }
  
  if (this.power_used.turn != this.engine.current_turn) {
    this.power_used.turn = this.engine.current_turn;
    this.power_used.max = default_max;
    this.power_used.did = 0;
  } else if (this.power_used.max < default_max) {
    // There are some cases the Max hero power availablity 
    // can be increased during a turn
    this.power_used.max = default_max; 
  }

  if (this.power_used.did >= this.power_used.max) {
    return;
  }

  if (this.current_mana < this.hero_power.mana()) {
    return;
  }

  this.power_used.did++;

  var c = card_manager.load_card(this.hero_power.card_data.unique);
  c.on_play(this.hero_power);

  this.engine.g_handler.execute();
};
Player.prototype.joust = function(after_joust) {
  var my_cost = 0;
  var enemy_cost = 0;

  var mine = null,
    enemy = null;
  if (this.deck.num_card()) {
    mine = util.rand_select(this.deck.card_list, 1)[0];
    my_cost = mine.card_data.mana;
  }
  if (this.enemy.deck.num_card()) {
    enemy = util.rand_select(this.enemy.deck.card_list, 1)[0];
    enemy_cost = enemy.card_data.mana;
  }

  if (after_joust) {
    this.g_handler.add_callback(after_joust, this, [my_cost > enemy_cost, mine, enemy]);
  }

  if (my_cost > enemy_cost) {
    return true;
  }
  else {
    return false;
  }
}
Player.prototype.change_hero_power = function(name) {
  var default_max = 1;
  for (var i = 0; i < this.engine.g_aura.length; i++) {
    if (this.engine.g_aura[i].state == 'hero_power_num') {
      default_max = this.engine.g_aura[i].f(default_max, this, this.engine.g_aura[i].me);
    }
  }
  this.power_used.turn = this.engine.current_turn;
  this.power_used.max = default_max;
  this.power_used.did = 0;

  this.hero_power = create_card(name, this);
};
Player.prototype.init_hero_power = function() {
  switch (this.hero.card_data.job) {
    case 'warlock':
      this.change_hero_power('Life Tap');
      break;
    case 'paladin':
      this.change_hero_power('Reinforce');
      break;
    case 'priest':
      this.change_hero_power('Lesser Heal');
      break;
    case 'druid':
      this.change_hero_power('Shapeshift');
      break;
    case 'hunter':
      this.change_hero_power('Steady Shot');
      break;
    case 'shaman':
      this.change_hero_power('Totemic Call');
      break;
    case 'warrior':
      this.change_hero_power('Armor Up!');
      break;
    case 'rogue':
      this.change_hero_power('Dagger Mastery');
      break;
    case 'mage':
      this.change_hero_power('Fireblast');
      break;
  }
};

// Silence a minion
Player.prototype.silence = function(from, target) {
  target.is_frozen.until = -1;
  target.is_shielded.until = -1;
  target.is_invincible.until = -1;
  target.no_hero_attack = false; 

  for (var i = 0; i < this.g_aura.length; i++) {
    if (this.g_aura[i].who == target && !this.g_aura[i].must) {
      this.g_aura.splice(i, 1);
      i--;
    }
  }

  target.state = [];

  var e_name;
  for (e_name in this.g_handler.event_handler_arr) {
    var arr = this.g_handler.event_handler_arr[e_name];
    for (i = 0; i < arr.length; i++) {
      if ((arr[i].me == target || arr[i].target == target) && !arr[i].must) {
        arr.splice(i, 1);
        i--;
      }
    }
  }

  target.current_life = (target.current_life > target.life() ? target.life() : target.current_life);

  // Non Attacking Minions can attack when they are silenced (in that turn)
  if (target.atk_info.max == 0 && target.field_summon_turn != target.engine.current_turn) {
    target.atk_info.max = 1;
    target.turn = this.engine.current_turn;
  }

  this.g_handler.add_event(new Event('silence', [from, target]));
  this.g_handler.execute();
};
Player.prototype.transform = function(who, target, name) {
  target.status = 'destroyed';
  var loc = target.owner.field.get_pos(target);

  target.owner.field.remove_card(target);
  target.owner.summon_card(name, loc, true);
};
Player.prototype.shift_card_hand = function(target, unique) {
  var loc = target.owner.hand.get_pos(target);
  target.owner.hand.remove_card(target);

  var card = card_manager.load_card(unique);
  var c = create_card(unique, this);

  c.status = 'hand';
  c.id = target.id;

  if (card.on_draw) card.on_draw(c);
  this.hand.put_card(c, loc);
};
// Put 'card' into deck (card :: unique of card)
Player.prototype.put_card_to_deck = function(who, card) {
  var c = create_card(card, this);

  c.status = 'deck';
  this.deck.card_list.push(c);
};
Player.prototype.swap_life_dmg = function(from, target) {
  var life = target.current_life();
  var dmg = target.dmg();

  target.add_state(function() {
    return dmg;
  }, 'life', from);
  target.current_life = dmg;

  target.add_state(function() {
    return life;
  }, 'dmg', from);

  if (target.current_life == 0) {
    this.g_handler.add_event(new Event('destroyed', [target, from]));
  }
};
Player.prototype.add_armor = function(armor, who) {
  this.hero.armor += armor;
  this.g_handler.add_event(new Event('armor', [who, this.hero, armor]));

  this.g_handler.execute();
};
Player.prototype.add_overload = function(overload, who) {
  this.next_overload_mana += overload;
  this.g_handler.add_event(new Event('overload', [who, this.hero, overload]));

  this.g_handler.execute();
};
Player.prototype.load_weapon = function(weapon) {
  if (this.weapon) {
    this.weapon.status = 'destroyed';
    this.g_handler.add_event(new Event('destroyed', [this.weapon, weapon]));
  }

  // ** WEAPON LOADING SEQUENCE IS HANDLED IN SUMMON PHASE ** 
};
Player.prototype.give_cthun_buff = function(d, l) {
  if (d) this.cthun_dmg_buff += d;
  if (l) this.cthun_life_buff += l;

  // TODO :: Show Cthun Buff info here
};
Player.prototype.random_cast_spell = function(unique) {
  var c = create_card(unique);

  c.owner = this;
  c.status = 'field';

  var card = card_manager.load_card(unique);

  card.on_play(c, false, true, false, true);
  this.g_handler.death_creation(true); // Forced Death Phase
};
Player.prototype.get_all_character = function(exclude, cond) {
  var ret = [];
  var pass = true;

  for (let i = 0; i < this.field.num_card(); i++) {
    pass = true;
    if (exclude) {
      for (let j = 0; j < exclude.length; j++) {
        if (this.field.card_list[i] == exclude[j]) {
          pass = false;
          break;
        }
      }
    }
    if (pass) {
      // Check for the condition if specified
      if (!cond || (cond(this.field.card_list[i]))) ret.push(this.field.card_list[i]);
    }
  }

  pass = true;
  if (exclude) {
    for (let i = 0; i < exclude.length; i++) {
      if (exclude[i] == this.hero) {
        pass = false;
        break;
      }
    }
  }
  if (pass) {
    if (!cond || (cond(this.hero))) ret.push(this.hero);
  }
  return ret;
};

function Event(event_type, args) {
  this.event_type = event_type;
  this.turn = 0;
  this.args = args;

  if (event_type == 'attack') {
    this.who = args[0];
    this.target = args[1];
    this.type = args[2];
  }
  else if (event_type == 'take_dmg') {
    this.victim = args[0];
    this.attacker = args[1];
    this.dmg = args[2];
  }
  else if (event_type == 'deal_dmg') {
    this.attacker = args[0];
    this.victim = args[1];
    this.dmg = args[2];
  }
  else if (event_type == 'pre_dmg') {
    this.attacker = args[0];
    this.victim = args[1];
    this.dmg = args[2];
  }
  else if (event_type == 'destroyed') {
    this.destroyed = args[0];
    this.attacker = args[1];
  }
  else if (event_type == 'summon') {
    this.card = args[0];
  }
  else if (event_type == 'draw_card') {
    this.card = args[0];
    this.who = args[1];
  }
  else if (event_type == 'hand_card') {
    this.card = args[0];
    this.who = args[1];
  }
  else if (event_type == 'play_card') {
    this.card = args[0];
    this.who = args[1];
  }
  else if (event_type == 'after_play') {
    this.card = args[0];
    this.who = args[1];
  }
  else if (event_type == 'turn_begin') {
    this.who = args[0];
  }
  else if (event_type == 'turn_end') {
    this.who = args[0];
  }
  else if (event_type == 'deathrattle') {
    this.card = args[0];
  }
  else if (event_type == 'propose_attack') {
    this.who = args[0];
    this.target = args[1];
  }
  else if (event_type == 'target') {
    this.who = args[0];
  }
  else if (event_type == 'silence') {
    this.who = args[0];
    this.target = args[1];
  }
  else if (event_type == 'card_burnt') {
    this.card = args[0];
  }
  else if (event_type == 'heal') {
    this.who = args[0];
    this.target = args[1];
    this.heal = args[2];
  }
  else if (event_type == 'inspire') {
    this.who = args[0];
  }
  else if (event_type == 'armor') {
    this.who = args[0];
    this.target = args[1];
    this.armor = args[2];
  }
  else if (event_type == 'overload') {
    this.who = args[0];
    this.target = args[1];
    this.overload = args[2];
  }
  else if (event_type == 'discard') {
    this.card = args[0];
    this.who = args[1];
  }
  else if (event_type == 'reveal') {
    this.card = args[0];
  }
}
Event.prototype.packer = function() {
  if (this.args.length == 0) {
    return {
      event_type: this.event_type
    };
  }
  else if (this.args.length == 1) {
    return {
      event_type: this.event_type,
      from: this.args[0].id
    };
  }
  else if (this.args.length == 2) {
    return {
      event_type: this.event_type,
      from: this.args[0].id,
      to: this.args[1].id
    };
  }
  else if (this.args.length == 3) {
    return {
      event_type: this.event_type,
      from: this.args[0].id,
      to: this.args[1].id,
      amount: this.args[2]
    };
  }
  throw Error('something is wrong with Event Packer');
};
// Global Event handler
function Handler(engine) {
  this.queue = [];

  // record all of the events
  this.record = [];

  // Queue of destroyed cards
  this.destroyed_queue = [];
  this.destroyed_queue_length = 0;

  this.legacy_queue = [];

  // List of waiting call backs
  this.queue_resolved_callback = [];

  var event_type_list = ['attack', 'deal_dmg', 'take_dmg', 'destroyed', 'summon', 'hand_card',
    'draw_card', 'play_card', 'after_play', 'turn_begin', 'turn_end', 'deathrattle',
    'propose_attack', 'pre_dmg', 'heal', 'silence', 'card_burnt', 'target', 'inspire', 'armor', 'discard',
    'overload', 'reveal'
  ];

  // initialize event handler array
  this.event_handler_arr = {};
  for (var i = 0; i < event_type_list.length; i++) this.event_handler_arr[event_type_list[i]] = [];

  this.exec_lock = false;

  // Phase 는 여기서 항상 최상단의 phase 를 의미한다. 
  // 이 phase 를 도입한 이유는 phase 가 끝날 때 반드시 death creation step 을 
  // 거쳐야 하기 때문에 기존의 callback 에 최상단 phase 를 등록하게 되면 위 단계를
  // 건너 뛰기 때문이다.
  this.next_phase = null;

  this.add_phase_block = false;

  this.engine = engine;
}
Handler.prototype.search_legacy_queue = function(cond, turn) {
  var res = [];

  if (turn != 0 && !turn) turn = -1;
  for (var i = this.legacy_queue.length - 1; i >= 0; i--) {
    if (turn != 1 && this.legacy_queue[i].turn < turn) {
      break;
    }
    if (cond(this.legacy_queue[i])) res.push(this.legacy_queue[i]);
  }

  return res;
};
Handler.prototype.add_event = function(e) {
  console.log(colors.yellow('[Event]'), e.event_type, ' is added!!');
  e.turn = this.engine.current_turn;

  this.legacy_queue.push(e);

  if (e.event_type == 'destroyed') {
    this.destroyed_queue.push(e);
  }
  else {
    // Insert in front of all other events
    this.queue.splice(0, 0, e);
  }
};
Handler.prototype.force_add_deathrattle_event = function(c) {
  this.add_event(new Event('deathrattle', [c]));
};
// Target :: If this handler targets certain Minion, then we (optionally) set 
// This is for 'Copying' minion effect can also copy the handlers that are registered
// to target minion 
Handler.prototype.add_handler = function(f, event, me, is_secret, must, target) {
  this.event_handler_arr[event].push({
    f: f,
    me: me,
    'is_secret': (is_secret ? true : false),
    'must': (must ? true : false),
    target: target
  });
};
Handler.prototype.force_add_event = function(e) {
  e.turn = this.engine.current_turn;

  this.queue.push(e);
};
Handler.prototype.add_callback = function(f, that, args) {
  this.queue_resolved_callback.splice(0, 0, {
    f: f,
    that: that,
    args: args
  });
};
Handler.prototype.add_phase = function(f, that, args) {
  if (!this.next_phase && !this.add_phase_block) {
    this.next_phase = {
      f: f,
      that: that,
      args: args
    };
  }
  else {
    this.add_callback(f, that, args);
  }
};
Handler.prototype.execute = function() {
  console.log('execute!');
  if (this.exec_lock) return;
  this.exec_lock = true;

  if (this.queue.length == 0) {
    if (this.queue_resolved_callback.length) {
      var f = this.queue_resolved_callback[0];
      this.queue_resolved_callback.splice(0, 1);

      f.f.apply(f.that, f.args);

      this.exec_lock = false;
      this.execute();
      return;
    }
    else {
      // If both destoryed queue and callback queues are empty, then we initiate
      // death creation phase
      this.death_creation();
      return;
    }
  }
  var eve = this.queue[0];
  this.queue.splice(0, 1);

  // Handle the event here
  this.do_event(eve);

  // this.exec_lock = false;
};
Handler.prototype.log_event = function(e) {
  function get_name(c) {
    if (c.hero) return c.hero.card_data.name;
    else return c.card_data.name;
  }

  var s = '[' + e.event_type + '] ';
  switch (e.event_type) {
    case 'attack':
      s += get_name(e.who) + '(#' + e.who.id + ') attacks ' + get_name(e.target);
      break;
    case 'deal_dmg':
      s += get_name(e.attacker) + '(#' + e.attacker.id + ') deals a damage to ' + get_name(e.victim) + ' / dmg :: ' + e.dmg;
      break;
    case 'take_dmg':
      s += get_name(e.victim) + '(#' + e.victim.id + ') takes a damage from ' + get_name(e.attacker) + ' / dmg :: ' + e.dmg;
      break;
    case 'destroyed':
      s += get_name(e.destroyed) + '(#' + e.destroyed.id + ') is destroyed';
      break;
    case 'summon':
      s += get_name(e.card) + '(#' + e.card.id + ') is summoned';
      break;
    case 'draw_card':
      s += get_name(e.card) + '(#' + e.card.id + ') is drawn from a deck';
      break;
    case 'play_card':
      s += get_name(e.card) + '(#' + e.card.id + ') is played from hand';
      break;
    case 'hand_card':
      s += get_name(e.card) + '(#' + e.card.id + ') is handed';
      break;
    case 'after_play':
    case 'turn_begin':
      s += get_name(e.who) + '(#' + e.who.id + ') turn begins';
      break;
    case 'turn_end':
      s += get_name(e.who) + '(#' + e.who.id + ') turn ends';
      break;
    case 'deathrattle':
      s += get_name(e.card) + '(#' + e.card.id + ') deathrattle ';
      break;
    case 'propose_attack':
      break;
    case 'pre_dmg':
      break;
    case 'heal':
      s += get_name(e.who) + '(#' + e.who.id + ') heals ' + get_name(e.target) + ' / heal :: ' + e.heal;
      break;
    case 'inspire':
      s += get_name(e.who) + ' used Hero Power';
      break;
    case 'armor':
      s += get_name(e.who) + '(#' + e.who.id + ') gives armor to ' + get_name(e.target) + ' / Armor :: ' + e.armor;
      break;
  }
  console.log(colors.red(s));
};
Handler.prototype.do_event = function(e) {
  this.log_event(e)

  // Whenever some event is handled, notify it to clients
  this.engine.send_client_data(e);

  // Make sure not to use handlers that are added during the do_event process
  var handler_num = this.event_handler_arr[e.event_type].length;
  var handler_arr = this.event_handler_arr[e.event_type];
  for (var i = 0; i < handler_num; i++) {
    if (handler_arr[i].me.status != 'destroyed' || (e.event_type == 'deathrattle' && (handler_arr[i].me == e.card || handler_arr[i].target == e.card))) {
      handler_arr[i].f(e, handler_arr[i].me, handler_arr[i].target);
    }
  }

  // Check for the secret that is deleted
  for (var i = 0; i < this.engine.p1.secret_list.length; i++) {
    if (this.engine.p1.secret_list[i].status === 'destroyed') {
      this.add_event(new Event('reveal', [this.engine.p1.secret_list[i]]));
      this.engine.p1.secret_list.splice(i, 1);
      i--;
    }
  }

  for (var i = 0; i < this.engine.p2.secret_list.length; i++) {
    if (this.engine.p2.secret_list[i].status === 'destroyed') {
      this.add_event(new Event('reveal', [this.engine.p2.secret_list[i]]));
      this.engine.p2.secret_list.splice(i, 1);
      i--;
    }
  }

  // Send Client an information about the board
  this.engine.send_client_data();

  this.exec_lock = false;
  this.execute();
};
Handler.prototype.death_creation = function(is_forced) {
  console.log('Death Creation ', this.destroyed_queue.length);
  console.log('Callback size, ', this.queue_resolved_callback.length);

  this.engine.update_aura();

  this.destroyed_queue_length = this.destroyed_queue.length;
  var dq = this.destroyed_queue;

  // Mark mortally wounded ones to 'destroy' and remove it from the field
  for (var i = 0; i < this.destroyed_queue_length; i++) {
    var dead = dq[i].destroyed;
    if (dead.current_life <= 0 || dead.status == 'destroyed') {
      dead.status = 'destroyed'; // Mark it as destroyed
      dead.last_position = dead.owner.field.get_pos(dead); // Mark the last location of the dead
      dead.owner.field.remove_card(dead); // Remove card from the field
    }
  }
  // Since Event queue is already flushed out, we can comfortably
  // force push events

  // Deathrattle 을 Destroyed 와 동일한 이벤트로 봐야할듯 (실제론 다르지만)
  // 즉 Destroyed Handler 에 Deathrattle 을 시간 순으로 정렬하여 집어넣어야됨
  for (i = 0; i < this.destroyed_queue.length; i++) {
    this.force_add_event(new Event('deathrattle', [dq[i].destroyed]));
    this.force_add_event(new Event('destroyed', [dq[i].destroyed, dq[i].attacker]));
  }

  // Clear destroyed queue
  dq.splice(0, dq.length);

  // Death Creation step 이 끝나면 end phase 를 실행할 수 있게 된다.
  if (this.next_phase && !is_forced) {
    this.add_callback(this.end_phase, this, []);
  }
  else if (this.queue.length == 0 && this.destroyed_queue.length == 0 && this.queue_resolved_callback.length == 0) {
    console.log('Phase is ended anyway (OUTTER MOST PHASE)! (without next phase to chk) ');
    this.engine.update_aura();

    // After the aura update, Engine checks for the win or lose
    this.engine.chk_win_or_lose();
  }

  this.exec_lock = false;
  if (this.queue.length || this.queue_resolved_callback.length) {
    this.execute();
  }
};
Handler.prototype.end_phase = function() {
  console.log('end phase invoked!');
  this.engine.update_aura();

  // After the aura update, Engine checks for the win or lose
  this.engine.chk_win_or_lose();

  if (this.next_phase) {
    var f = this.next_phase;
    this.next_phase = null;

    f.f.apply(f.that, f.args);
  }
};

function UserInterface(engine, p1_socket, p2_socket) {
  this.p1_socket = p1_socket;
  this.p2_socket = p2_socket;
  this.engine = engine;
}
UserInterface.prototype.wait_user_input = function(player, f, that, args) {
  var user_input; // Get user input

  // wait_user_input function gives 'user_input' as an additional argument to the callback function
  args.push(user_input);
  f.apply(that, args);
};

// send :: what to send
// recv :: callback when there is a reply
UserInterface.prototype.get_user_input = function(socket, send, recv) {
  socket.emit(send.send_event_name, socket.data);
  socket.on(recv.recv_event_name, function(recv) {
    return function(data) {
      recv.f(data);
    };
  });
};

function Engine(p1_socket, p2_socket, p1, p2, game_result_callback) {
  this.p1_info = p1;
  this.p2_info = p2;

  this.current_turn = 0;

  this.game_result_callback = game_result_callback;
  this.is_game_finished = false;

  function UniqueId() {
    this.id = 0;
    this.get_id = function() {
      return this.id++;
    };
  }

  console.log(p1);
  this.g_id = new UniqueId();
  this.g_when = new UniqueId(); // Object to give unique number to the events

  this.g_aura = []; // Aura that is (selectively) affecting entire minions on field
  this.g_handler = new Handler(this);

  this.p1 = new Player(p1.id, p1.deck.job, this); // First
  this.p2 = new Player(p2.id, p2.deck.job, this); // Second

  // TODO IMPLEMENT THIS
  this.current_player = this.p1;

  this.p1.enemy = this.p2;
  this.p2.enemy = this.p1;

  for (let i = 0; i < p1.deck.cards.length / 2; i++) {
    let c = p1.deck.cards[2 * i];
    let num = p1.deck.cards[2 * i + 1];

    for (let j = 0; j < num; j++) {
      this.p1.deck.card_list.push(create_card(c, this.p1));
    }
  }

  for (let i = 0; i < p2.deck.cards.length / 2; i++) {
    let c = p2.deck.cards[2 * i];
    let num = p2.deck.cards[2 * i + 1];

    for (let j = 0; j < num; j++) {
      this.p2.deck.card_list.push(create_card(c, this.p2));
    }
  }
  this.p1_socket = p1_socket;
  this.p2_socket = p2_socket;
  this.p1.socket = p1_socket;
  this.p2.socket = p2_socket;

  this.g_ui = new UserInterface(this, p1_socket, p2_socket);

  this.p1_selection_waiting = false;
  this.p2_selection_waiting = false;

  this.user_waiting_queue = [];
}
Engine.prototype.add_user_waiting = function(f, that, args) {
  this.user_waiting_queue.push({
    f: f,
    that: that,
    args: args
  });
};
Engine.prototype.do_user_waiting = function() {
  if (this.user_waiting_queue.length) {
    var x = this.user_waiting_queue[0];
    this.user_waiting_queue.splice(0, 1);

    x.args.push(true); // Set engine_called as true
    x.f.apply(x.that, x.args);
  }
};
Engine.prototype.add_aura = function(f, state, who, must) {
  this.g_aura.push({
    f: f,
    state: state,
    who: who,
    when: this.g_when.get_id(),
    'must': (must ? true : false)
  });
};
Engine.prototype.update_life_aura = function(p) {
  // Health Updategiv
  for (var i = 0; i < p.field.num_card(); i++) {
    var card = p.field.card_list[i];
    var bef = card.current_life;

    // First check the existence of nullified Aura effecting this minion
    for (var j = 0; j < card.life_aura.length; j++) {
      if (!(card.life_aura[j].who.is_good() || card.life_aura[j].must) || card.life_aura[j].f(bef, card) == bef) {
        card.life_aura.splice(j, 1);
        j--;
      }
    }

    var max = card.life();

    // Recalculate Max Life and compares
    if (card.current_life > max) {
      card.current_life = max;
    }

    // Search for all available auras.
    for (var j = 0; j < this.g_aura.length; j++) {
      // After removing unnecessary aura, we now seek for possible new Aura for the minion
      if (this.g_aura[j].state == 'life') {
        // When this Health Aura is effecting this card
        // Check whether this Aura effect has taken into account
        if ((this.g_aura[j].who.is_good() || this.g_aura[j].must) && this.g_aura[j].f(bef, card) != bef) {
          for (var k = 0; k < card.life_aura.length; k++) {
            if (card.life_aura[k] == this.g_aura[j]) break;
          }

          // If that life Aura is not registered
          // Register as a card health aura and give it a BUFF 
          // This process makes sure that the card is given a health buff only single time
          if (k == card.life_aura.length) {
            card.life_aura.push(this.g_aura[j]);
            card.current_life = this.g_aura[j].f(card.current_life, card);
          }
        }
      }
    }
  }
};
Engine.prototype.update_aura = function() {
  this.update_life_aura(this.p1);
  this.update_life_aura(this.p2);

  // The Following Auras are checked in this step
  // Baron Rivendare, Auchenai Soulpriest, Brann Bronzebeard, Mal'Ganis's Immune effect, Prophet Velen
  // baron_rivendare, auchenai_soulpriest, bran_bronzebeard, prophet_velen
  function chk_aura(p) {
    var aura_list = ['baron_rivendare', 'auchenai_soulpriest', 'bran_bronzebeard', 'prophet_velen', 'fandral_staghelm', 'embrace_the_shadow'];
    for (var j = 0; j < aura_list.length; j++) {
      for (var i = 0; i < p.g_aura.length; i++) {
        if (p.g_aura[i].state == aura_list[j] && p.g_aura[i].who.is_good() && p.g_aura[i].who.owner == p) {
          p.aura.push(aura_list[j]);
        }
      }
    }
  }

  this.p1.aura = [];
  this.p2.aura = [];

  chk_aura(this.p1);
  chk_aura(this.p2);
};
Engine.prototype.find_card_cond = function(cond) {
  var list = card_db.get_implemented_list();
  var arr = [];
  for (var i = 0; i < list.length; i++) {
    if (cond(new CardData(card_db.to_arr(list[i])))) {
      arr.push(new CardData(card_db.to_arr(list[i])));
    }
  }
  return arr;
};
Engine.prototype.find_card_by_id = function(id, p) {
  for (var i = 0; i < this.p1.hand.num_card(); i++) {
    if (this.p1.hand.card_list[i].id == id) return this.p1.hand.card_list[i];
  }
  for (var i = 0; i < this.p1.field.num_card(); i++) {
    if (this.p1.field.card_list[i].id == id) return this.p1.field.card_list[i];
  }
  for (var i = 0; i < this.p2.hand.num_card(); i++) {
    if (this.p2.hand.card_list[i].id == id) return this.p2.hand.card_list[i];
  }
  for (var i = 0; i < this.p2.field.num_card(); i++) {
    if (this.p2.field.card_list[i].id == id) return this.p2.field.card_list[i];
  }

  if (id == 'me') return p.hero;
  if (id == 'enemy') return p.enemy.hero;

  return null; // If no card is found
};
Engine.prototype.start_match = function() {
  this.p1.starting_cards = util.rand_select(this.p1.deck.get_card_datas(), 3);
  this.p2.starting_cards = util.rand_select(this.p2.deck.get_card_datas(), 4);

  this.p1_socket.emit('choose-starting-cards', {
    cards: this.p1.starting_cards
  });
  this.p2_socket.emit('choose-starting-cards', {
    cards: this.p2.starting_cards
  });
  
  console.log('Choose starting cards emit done')

  function remove_some_cards(p, starting_cards, util, num) {
    return function(data) {
      if (p.selection_waiting == false) return;
      p.selection_waiting = false;
      clearTimeout(p.selection_fail_timer);

      var removed = data.removed;
      removed.sort(); // Sort by ascending order

      for (var i = removed.length - 1; i >= 0; i--) {
        starting_cards.splice(removed[i], 1);
      }

      var card_data_list = p.deck.get_card_datas();

      // Remove already starting_cards added cards
      for (var i = 0; i < starting_cards.length; i++) {
        for (var j = 0; j < card_data_list.length; j++) {
          if (starting_cards[i] == card_data_list[j]) {
            card_data_list.splice(j, 1);
            break;
          }
        }
      }

      var new_starting_cards = util.rand_select(card_data_list, removed.length);

      p.socket.emit('new-starting-cards', {
        cards: new_starting_cards
      });

      p.starting_cards = p.starting_cards.concat(new_starting_cards);

      if (!p.selection_waiting && !p.enemy.selection_waiting) {
        p.socket.emit('begin-match', {});
        p.enemy.socket.emit('begin-match', {});

        p.engine.begin_game();
      }
    };
  }

  this.p1.selection_waiting = true;
  this.p2.selection_waiting = true;

  this.p1_socket.on('remove-some-cards', remove_some_cards(this.p1, this.p1.starting_cards, util, 3));
  this.p2_socket.on('remove-some-cards', remove_some_cards(this.p2, this.p2.starting_cards, util, 4));

  function fail_client_select(p) {
    return function() {
      p.selection_waiting = false;
      p.socket.emit('new-starting-cards', {
        cards: []
      });

      if (!p.selection_waiting && !p.enemy.selection_waiting) {
        p.socket.emit('begin-match', {});
        p.enemy.socket.emit('begin-match', {});

        p.engine.begin_game();
      }
    };
  }
  this.p1.selection_fail_timer = setTimeout(fail_client_select(this.p1), 90000);
  this.p2.selection_fail_timer = setTimeout(fail_client_select(this.p2), 90000);
};
Engine.prototype.chk_win_or_lose = function() {
  if(this.is_game_finished) return ;
  
  // Draw!
  if (this.p1.hero.current_life <= 0 && this.p2.hero.current_life <= 0) {
    this.is_game_finished = true;
    this.game_result_callback(2, this.p1_info, this.p2_info); // DRAW

    this.p1_socket.emit('hearth-game-end', {
      info: 'draw'
    });

    this.p2_socket.emit('hearth-game-end', {
      info: 'draw'
    });
  }
  else if (this.p1.hero.current_life <= 0) { // p1 lose
    this.is_game_finished = true;
    this.game_result_callback(1, this.p1_info, this.p2_info); // p2 wins!

    this.p1_socket.emit('hearth-game-end', {
      info: 'lose'
    });

    this.p2_socket.emit('hearth-game-end', {
      info: 'win'
    });
  }
  else if (this.p2.hero.current_life <= 0) { // p2 lose
    this.is_game_finished = true;
    this.game_result_callback(0, this.p1_info, this.p2_info); // p1 wins!

    this.p1_socket.emit('hearth-game-end', {
      info: 'win'
    });

    this.p2_socket.emit('hearth-game-end', {
      info: 'lose'
    });
  }
};
// Begins the game by putting selected cards to each player's deck
Engine.prototype.begin_game = function() {
  function hand_card(player) {
    for (var i = 0; i < player.starting_cards.length; i++) {
      for (var j = 0; j < player.deck.card_list.length; j++) {
        if (player.starting_cards[i].name == player.deck.card_list[j].card_data.name) {
          var c = player.deck.card_list[j];

          console.log('added :: ', c.card_data.name);
          player.deck.card_list.splice(j, 1);

          c.id = player.g_id.get_id();
          c.status = 'hand';

          player.hand.card_list.push(c);
          break;
        }
      }
    }
  }

  console.log('[Game Begins!]');

  hand_card(this.p1);
  hand_card(this.p2);

  this.send_client_data();

  this.set_up_listener(this.p1);
  this.set_up_listener(this.p2);

  this.p2.hand_card('The Coin');
  this.start_turn();
};
Engine.prototype.end_turn = function() {
  console.log('change Turn!!');

  // Change the players
  if (this.current_player == this.p1) {
    this.current_player = this.p2;
  }
  else this.current_player = this.p1;

  this.current_turn += 1;

  // Set maximum mana as 10
  this.current_player.current_mana = Math.floor(this.current_turn / 2) + 1 + this.current_player.boosted_mana;
  if (this.current_player.current_mana > 10) this.current_player.current_mana = 10;

  this.current_player.max_mana = this.current_player.current_mana;

  // Apply overloaded mana deduction
  this.current_player.current_mana -= this.current_player.next_overload_mana;
  if (this.current_player.current_mana < 0) this.current_player.current_mana = 0;

  this.current_player.current_overload_mana = this.current_player.next_overload_mana;
  this.current_player.next_overload_mana = 0;
  this.current_player.turn_card_play = [];

  this.g_handler.add_event(new Event('turn_begin', [this.current_player]));
  this.g_handler.add_callback(this.start_turn, this, []);
  this.g_handler.execute();
};
Engine.prototype.start_turn = function() {
  console.log('Turn begins! ', this.current_player.name);

  // current player draws 1 card from a deck
  this.current_player.draw_cards(1);
};
Engine.prototype.set_up_listener = function(p) {
  p.socket.on('hearth-user-play-card', function(e) {
    return function(data) {
      var card_id = data.id;
      console.log('player draws card ::', card_id);

      // User can only play the card when it is his/her turn
      if (p == e.current_player) {
        console.log('Lets find the card #', card_id);

        for (var i = 0; i < p.hand.card_list.length; i++) {
          if (p.hand.card_list[i].id == card_id) {
            var c = p.hand.card_list[i];

            if (c.card_data.type == 'minion' || c.card_data.type == 'weapon') {
              console.log(colors.green('[play card] :: '), c.card_data.name, ' , at ', data.at);
              p.play_minion(c, data.at);
              return;
            }
            else if (c.card_data.type == 'spell') {
              p.play_spell(c);
              return;
            }
          }
        }
      }
      // If something goes wrong
      p.socket.emit('hearth-play-card', {
        result: false,
        card: card_id
      });
    };
  }(this));

  p.socket.on('hearth-combat', function(e) {
    return function(data) {
      var from = e.find_card_by_id(data.from_id, p);
      var to = e.find_card_by_id(data.to_id, p);

      //console.log('combat detected', from.card_data.name, ' vs ', to.card_data.name);
      if (from && to && p == e.current_player) {
        console.log('combat detected', from.card_data.name, ' vs ', to.card_data.name);
        if (from === p.hero) p.hero_combat(to);
        else from.owner.combat(from, to);
      }
    };
  }(this));

  p.socket.on('hearth-end-turn', function(e) {
    return function(data) {
      if (p == e.current_player) {
        console.log('Player ', p.player_name, 'turn ends');
        e.g_handler.add_event(new Event('turn_end', [p]));
        e.g_handler.add_callback(e.end_turn, e, []);
        e.g_handler.execute();
      }
    };
  }(this));

  p.socket.on('select-done', function(e) {
    return function(data) {
      console.log('Received Selection ', data.id);

      if (p == e.current_player && p.selection_waiting) {
        p.selection_waiting = false;

        var target = e.find_card_by_id(data.id, p);

        // If target is not actual card on a field
        if (!target) {
          p.on_select_fail(p.who_select_wait);
          return;
        }

        // Check again whether the user has chosen the correct one
        // (which was available for the selection)
        var select_correct = false;
        for (var i = 0; i < p.available_list.length; i++) {
          if (target == p.available_list[i]) {
            select_correct = true;
            break;
          }
        }

        if (!select_correct) {
          p.on_select_fail(p.who_select_wait);
          return;
        }

        console.log('Who was a target? :: ', target.card_data.name);
        console.log('Who was waiting for a selection :: ', p.who_select_wait.card_data.name);

        p.who_select_wait.target = target;
        p.on_select_success(p.who_select_wait);

        clearTimeout(p.selection_fail_timer);
        p.engine.do_user_waiting();
      }
      else if (p == e.current_player && p.choose_waiting) {
        p.choose_waiting = false;

        if (!(data.id >= 0 && data.id < p.available_list.length)) {
          if (p.must_choose) data.id = 0;
          else {
            p.on_select_fail(p.who_select_wait);
            return;
          }
        }
        p.on_select_success(data.id, p.who_select_wait, p.forced_target, p.random_target);
        clearTimeout(p.selection_fail_timer);

        p.engine.do_user_waiting();
      }
    };
  }(this));

  p.socket.on('hero_power', function(e) {
    return function(data) {
      if (p == e.current_player) {
        console.log('Player Used Hero Power');
        p.use_hero_power();
      }
    };
  }(this));
};
Engine.prototype.send_client_minion_action = function(c, action) {
  this.p1_socket.emit('hearth-minion-action', {
    id: c.id,
    action: action
  });
  this.p2_socket.emit('hearth-minion-action', {
    id: c.id,
    action: action
  });
};
// e : the event that we just handled
Engine.prototype.send_client_data = function(e) {
  function hero_info(p) {
    return {
      life: p.hero.current_life,
      mana: p.current_mana,
      id: p.hero.id,
      armor: p.hero.armor
    };
  }

  function chk_card_state(c) {
    var state = [];
    if (c.is_attackable()) state.push('attackable');
    if (c.stealth()) state.push('stealth');
    if (c.shield()) state.push('shield');
    if (c.frozen()) state.push('frozen');
    if (c.chk_state('taunt')) state.push('taunt');

    return state;
  }

  function put_deck_info(arr, deck, where, owner) {
    for (var i = 0; i < deck.length; i++) {
      arr.push({
        where: where,
        owner: owner,
        id: deck[i].id,
        life: deck[i].current_life,
        mana: deck[i].mana(),
        dmg: deck[i].dmg(),
        name: deck[i].card_data.name,
        type: deck[i].card_data.type,
        img_path: deck[i].card_data.img_path,
        unique: deck[i].card_data.unique,
        state: chk_card_state(deck[i])
      });
    }
  }

  // Do not show SECRET card to the opponent player
  if (e && (e.event_type == 'draw_card' || e.event_type == 'spwan_card')) {

  }

  var p1_card_info = [];
  var p2_card_info = [];

  var p1_hand = this.p1.hand.card_list;
  var p1_deck = this.p1.deck.card_list;

  var p2_hand = this.p2.hand.card_list;
  var p2_deck = this.p2.deck.card_list;

  var p1_field = this.p1.field.card_list;
  var p2_field = this.p2.field.card_list;

  put_deck_info(p1_card_info, p1_hand, 'hand', 'me');
  put_deck_info(p2_card_info, p2_hand, 'hand', 'me');

  put_deck_info(p1_card_info, p1_field, 'field', 'me');
  put_deck_info(p2_card_info, p1_field, 'field', 'enemy');

  put_deck_info(p1_card_info, p2_field, 'field', 'enemy');
  put_deck_info(p2_card_info, p2_field, 'field', 'me');

  // console.log('[p1 card info]', p1_card_info);
  //  console.log('[p2 card info]', p2_card_info);

  if (e) {
    console.log(e.packer(), ' event has sent!');
  }
  this.p1_socket.emit('hearth-event', {
    card_info: p1_card_info,
    enemy_num_hand: this.p2.hand.num_card(),
    event: (e ? e.packer() : null),
    me: hero_info(this.p1),
    enemy: hero_info(this.p2)
  });
  this.p2_socket.emit('hearth-event', {
    card_info: p2_card_info,
    enemy_num_hand: this.p1.hand.num_card(),
    event: (e ? e.packer() : null),
    me: hero_info(this.p2),
    enemy: hero_info(this.p1)
  });
};

Engine.prototype.socket = function(p) {
  if (p == this.p1) {
    return this.p1_socket;
  }
  else if (p == this.p2) {
    return this.p2_socket;
  }
  throw "SOCKET ERROR";
};

var current_working_engine = null;
module.exports = {
  start_match: function(p1_socket, p2_socket, p1, p2, game_result) {
    card_db.init_implemented(card_manager.implemented_card_list());
    console.log(p1, p2);
    var e = new Engine(p1_socket, p2_socket, p1, p2, game_result);
    e.start_match();

    // FOR THE DEBUG !! 
    // PLEASE REMOVE FOR THE ACTUAL RELEASE
    current_working_engine = e;

    return e;
  },
  init_implemented: function() {
    card_db.init_implemented(card_manager.implemented_card_list());
  }
};

/*

Here is a support for the Debugging procedures

*/

var stdin = process.openStdin();
stdin.addListener('data', function(d) {
  var input = d.toString().trim();

  // split into commands
  var args = input.split(' ');
  console.log(args);

  if (args[0] == 'add') {
    var to = (args[1] == 'p1' ? current_working_engine.p1 : current_working_engine.p2);

    var card_name = args[2];
    for (var i = 3; i < args.length; i++) card_name += (' ' + args[i]);

    var list = card_db.get_implemented_list();
    for (var i = 0; i < list.length; i++) {
      if (list[i].name == card_name) {
        to.hand_card(card_name);
        break;
      }
    }
  }
  else if (args[0] == 'mana') {
    var to = (args[1] == 'p1' ? current_working_engine.p1 : current_working_engine.p2);
    to.current_mana = 100;
  }
  else if (args[0] == 'show') {
    var to = (args[1] == 'p1' ? current_working_engine.p1 : current_working_engine.p2);
    for (var i = 0; i < to.field.num_card(); i++) {
      console.log(to.field.card_list[i].card_data.name, ' ', to.field.card_list[i].mana(), '/', to.field.card_list[i].dmg(), ' Life : ', to.field.card_list[i].current_life, '/', to.field.card_list[i].life());
    }
  }
});
