const card_manager = require('./card_db/card');
const card_db = require('./card_db/card_db');
const util = require('./utility');

function CardData(args) {
  this.name = args[0];
  this.type = args[1];
  this.level = args[2];
  this.job = args[3];
  this.mana = args[4];
  this.dmg = args[5];
  this.life = args[6];
  this.kind = args[7];
}
CardData.prototype.to_array = function() {
  var arr = [this.name, this.type, this.level, this.job, this.mana, this.dmg, this.life, this.kind];
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

  this.atk_info = {
    cnt: 0,
    turn: 0,
    did: 0
  };

  // Proposed attack target during combat phase (can be changed)
  this.target = null;

  // Proposed damage that may be given to the target (can be changed)
  this.dmg_given = 0;
}
Card.prototype.add_state = function(f, state, who) {
  this.state.push({
    f: f,
    state: state,
    who: who,
    when: this.engine.g_when.get_id()
  });
};
Card.prototype.chk_state = function(state) {
  for (var i = 0; i < this.state.length; i++) {
    if (this.state.state === state) return true;
  }
  return false;
};
Card.prototype.do_action = function(action) {
  this.owner.engine.send_client_minion_action(this.id, action);
}
Card.prototype.calc_state = function(state, init_value) {
  var x = init_value;
  var modifiers = [];

  for (var i = 0; i < this.state.length; i++) {
    if (this.state[i].state === state) modifiers.push({
      f: this.state[i].f,
      when: this.state[i].when
    });
  }
  for (i = 0; i < this.owner.engine.g_aura.length; i++) {
    if (this.owner.engine.g_aura[i].who.is_good() && this.owner.engine.g_aura[i].state === state) {
      modifiers.push({
        f: this.owner.engine.g_aura[i].f,
        when: this.owner.engine.g_aura[i].when
      });
    }
  }
  // Sort by ascending order
  modifiers.sort(function(a, b) {
    return a.when > b.when
  });

  for (i = 0; i < modifiers.length; i++) {
    x = modifiers[i].f(x, this);
  }
  return x;
};
Card.prototype.dmg = function() {
  return this.calc_state('dmg', this.card_data.dmg);
}
Card.prototype.mana = function() {
  return this.calc_state('mana', this.card_data.mana);
}
Card.prototype.update_atk_cnt = function() {
  if (this.atk_info.turn == this.owner.engine.current_turn) return;
  var atk_num = this.calc_state('atk_num', 1);

  this.atk_info.turn = this.owner.engine.current_turn;
  this.atk_info.cnt = atk_num;
  this.atk_info.did = 0;
};
Card.prototype.is_attackable = function() {
  if (this.is_frozen.until >= this.owner.engine.current_turn) return false;
  this.update_atk_cnt();

  if (this.atk_info.cnt <= this.atk_info.did) return false;
  return true;
};
Card.prototype.make_charge = function(who) {
  this.add_state(null, 'charge', who);
  this.update_atk_cnt();
  this.atk_info.cnt = this.calc_state('atk_num', 1);
};
Card.prototype.make_windfury = function(who) {
  // For minions which are not able to attack (e.g Ancient watcher),
  // We should not give windfury to those
  if (this.calc_state('atk_num', 1) == 0) return;

  this.add_state(function() {
    return 2;
  }, 'atk_num', who);
  this.update_atk_cnt();

  if (this.atk_info.turn == this.atk_info.field_summon_turn && !this.chk_state('charge')) return;
  this.atk_info.cnt = 2;
};
Card.prototype.copy_to_other_card = function(c) {
  this.card_data = c.card_data;
  this.status = c.status;

  this.is_frozen.until = c.is_frozen.until;
  this.is_shielded.until = c.is_shielded.until;

  this.atk_info = {
    cnt: c.atk_info.cnt,
    turn: c.atk_info.turn,
    did: c.atk_info.did
  };
  this.state = [];
  for (var i = 0; i < c.state.length; i++) {
    this.add_state(c.state[i].f, c.state[i].state, (c.state[i].who == c ? this : c.state[i].who));
  }
};

function create_card(name, owner) {
  var cd = card_db.load_card(name);

  return new Card(cd, 0, owner);
}

function Deck() {
  this.card_list = [];
}
Deck.prototype.num_card = function() {
  return this.card_list.length;
};
Deck.prototype.put_card = function(card, at) {
  if (!at) at = this.card_list.length;
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
}

function Player(player_name, job, engine) {
  this.player_name = player_name;
  this.player_job = job;
  this.engine = engine;

  // Engine 에서 설정해준다. 
  this.enemy = null;

  this.hero = new Card([player_name, 'hero', 'hero', job, 30, 0, 0], this.engine.g_id.get_id(), this);

  // TODO make it to the default setting
  this.current_mana = 100;
  this.boosted_mana = 0;

  // current turn's overloaded mana
  this.current_overload_mana = 0;

  // Next turn's overloaded mana
  this.next_overload_mana = 0;

  this.hand = new Deck();
  this.field = new Deck();
  this.deck = new Deck();

  this.g_handler = this.engine.g_handler;
  this.g_aura = this.engine.g_aura;
  this.g_id = this.engine.g_id;
  this.g_when = this.engine.g_when;

  this.selection_waiting = false;
  this.selection_fail_timer = null;
  this.socket = null;

  this.starting_cards = [];
};

Player.prototype.chk_aura = function(aura) {
  for (var i = 0; i < this.g_aura.length; i++) {
    if (this.g_aura[i].state == aura && this.g_aura[i].who.is_good() && this.g_aura[i].who.owner == this) return true;
  }
  return false;
};
// TODO :: Finish implementing this function using user io
// [options] are the array of name of cards to choose
Player.prototype.choose_one = function(options, on_success) {

};
// We dont have to send 'target' as an argument to success function
// because the card itself stores the info of it in its target property
Player.prototype.select_one = function(c, select_cond, success, fail, forced_target) {
  if (forced_target) {
    c.target = forced_target;
    success(c)
  }

  // chk with select_cond

  // if selection is success
  //c.target = selected;
  success(c);
};
Player.prototype.play_spell = function(c) {
  if (this.current_mana < c.mana()) return; // Enough mana?

  var card = card_manager.load_card(c.card_data.name);
  card.on_play(c);
};

// Targeting phase does not create death creation step!
Player.prototype.chk_target = function(c, next) {
  if (c.status == 'destroyed') return;
  if (c.target) {
    this.g_handler.add_event(new Event('target', c));
  }

  this.g_handler.add_callback(next, this, [c]);
};
Player.prototype.spell_txt_phase = function(c, next) {
  this.g_handler.add_phase_block = true;

  next(c);
};
Player.prototype.end_spell_txt = function (c) {
  this.g_handler.add_phase_block = false;
  this.g_handler.add_phase(this.summon_phase, this, [c]);
};

Player.prototype.draw_card = function(c) {
  this.deck.remove_card(c);
  if (this.hand.num_card() >= 10) {
    // Card is burned!!
    this.g_handler.add_event(new Event('card_burnt', c));
    return;
  }

  var card = card_manager.load_card(c.card_data.name);

  c.status = 'hand';
  c.id = this.g_id.get_id(); // ID is issued when the card goes to the user's hand

  card.on_draw(c);
}
Player.prototype.draw_card_name = function(name) {
    for (var i = 0; i < this.deck.num_card(); i++) {
      if (this.deck.card_list[i].card_data.name == name) {
        this.draw_card(this.deck.card_list[i]);
        return;
      }
    }
  }
  // Play a card from a hand
Player.prototype.play_minion = function(c, at) {
  console.log('mana : ', this.current_mana, ' vs ', c.mana());

  if (this.field.num_card() >= 7 || this.current_mana < c.mana()) {
    this.emit_play_card_fail(c);
    return;
  }

  console.log('play card!!');

  var card = card_manager.load_card(c.card_data.name);
  card.on_play(c, true, true, at);
};
Player.prototype.play_success = function(c, at, next) {
  // if the status of card is already specified as 'field',
  // then this means that the minion is not summoning by user card play
  // but forcefully summoned
  if (c.status == 'field') {
    this.g_handler.add_phase(this.summon_phase, this, [c]);
    
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
    this.field.put_card(c, at);

    console.log('battle cry phase is added');
    this.g_handler.add_event(new Event('play_card', c, this));
    this.g_handler.add_phase(this.battlecry_phase, this, [c, next]);
  }
  else if (c.card_data.type == 'spell') {
    this.g_handler.add_event(new Event('play_card', c, this));
    this.g_handler.add_phase(this.chk_target, this, [c, next]);
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
  
  console.log('battle cry phase !!')
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
  console.log('afterplay phase!')
  this.g_handler.add_event(new Event('after_play', c, this));
  
  // Death creation step is not created following this phase!
  this.g_handler.add_callback(this.summon_phase, this, [c]);
  
  this.g_handler.execute();
};
Player.prototype.summon_phase = function(c) {
  this.g_handler.add_event(new Event('summon', c));
  
  this.g_handler.execute();
};

Player.prototype.summon_card = function(name, at, after_summon) {
  var c = create_card(name);

  c.field_summon_turn = this.engine.current_turn;
  c.status = 'field';
  c.owner = this;
  c.summon_order = this.g_when.get_id();

  this.field.put_card(c, at);
  var card = card_manager.load_card(c.card_data.name);

  // Optional argument - after_summon; which is called after the card is summoned
  if (after_summon) this.g_handler.add_callback(after_summon, this, [c]);

  card.on_play(c, false, false, at);
};
Player.prototype.emit_play_card_success = function(card, at, mana) {
  this.socket.emit('hearth-play-card', {
    result: true,
    id: card.id,
    at: at,
    cost: mana
  })
}
Player.prototype.emit_play_card_fail = function(card) {
  this.socket.emit('hearth-play-card', {
    result: false,
    id: card.id,
  })
}
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
  if (this.is_invincible.until >= this.engine.current_turn) return true;

  return false;
};
Player.prototype.combat = function(c, target) {
  if (!c.is_attackable() // chks whether the attacker has not exhausted its attack chances
    || !this.chk_enemy_taunt(target) // chks whether the attacker is attacking proper taunt minions
    || target.owner == c.owner // chks whether the attacker is not attacker our own teammates
    || this.chk_invincible(target)) return false; // chks whether the attacker is attacking invincible target

  c.target = target;
  c.is_stealth.until = -1; // stealth is gone!

  // propose_attack event can change the target of the attacker
  this.g_handler.add_event(new Event('propose_attack', [c, target]));
  this.g_handler.add_callback(this.attack, this, []);
};
Player.prototype.attack = function(c) {
  // If the attacker is mortally wounded or out of play, then combat event is closed
  if (c.current_life <= 0 || c.status != 'field') return;

  // attack event does not change the target of an attacker
  this.g_handler.add_event(new Event('attack', [c, c.target]));
  this.g_handler.add_callback(this.pre_combat, this, []);
};
Player.prototype.pre_combat = function(c) {
  var target = c.target;

  c.dmg_given = c.dmg();
  target.dmg_given = target.dmg();

  this.g_handler.add_event(new Event('pre_dmg', [c, target, c.dmg_given]));
  this.g_handler.add_event(new Event('pre_dmg', [target, c, target.dmg_given]));
  this.g_handler.add_callback(this.actual_combat, this, [c]);
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

  c.current_life -= target.dmg_given;
  target.current_life -= c.dmg_given;

  if (c.dmg_given > 0) {
    this.g_handler.add_event(new Event('take_dmg', [target, c, c.dmg_given]));
    this.g_handler.add_event(new Event('deal_dmg', [c, target, c.dmg_given]));
  }
  if (target.dmg_given > 0) {
    this.g_handler.add_event(new Event('take_dmg', [c, target, target.dmg_given]));
    this.g_handler.add_event(new Event('deal_dmg', [target, c, target.dmg_given]));
  }

  var first = c.summon_order > target.summon_order ? target.summon_order : c.summon_order;
  var second = c.summon_order > target.summon_order ? c.summon_order : target.summon_order;

  // Minion must be alive before this attack in order to invoke destroyed event!
  // (DESTROYED EVENT IS NOT CREATED TWICE)
  if (first.currnet_life <= 0 && first.current_life + first.dmg_given > 0 && first.status != 'destroyed')
    this.g_handler.add_event(new Event('destroyed', first, second));

  if (second.currnet_life <= 0 && second.current_life + second.dmg_given > 0 && second.status != 'destroyed')
    this.g_handler.add_event(new Event('destroyed', second, first));
};
Player.prototype.spell_dmg = function(c, dmg) {
  for (var i = 0; i < this.g_aura.length; i++) {
    if (this.g_aura[i].state == 'spell_dmg' && this.g_aura[i].who.is_good()) {
      dmg = this.g_aura[i].f(dmg, c);
    }
  }
  if (this.chk_aura('prophet_velen')) {
    dmg *= 2;
  }
  return dmg;
};

Player.prototype.deal_dmg = function(dmg, from, to) {
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
  if (to.chk_invincible()) {
    dmg = 0;
  }
  if (dmg == 0) return; // May be we should at least create an animation for this too..

  to.current_life -= dmg;

  this.g_handler.add_event(new Event('take_dmg', [to, from, dmg]));
  this.g_handler.add_event(new Event('deal_dmg', [from, to, dmg]));

  if (to.current_life <= 0 && to.current_life + dmg > 0 && to.status != 'destroyed')
    this.g_handler.add_event(new Event('destroyed', to, from));
};

// Do not specify increased healling amount into 'heal'
Player.prototype.heal = function(heal, from, to) {
  if (this.chk_aura('auchenai_soulpriest')) {
    this.deal_dmg(this.spell_dmg(from, heal), from, to);
    return;
  }
  if (this.chk_aura('prophet_velen')) {
    heal *= 2;
  }
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
      return a.to.summon_order > b.to.summon_order
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

    for (i = 0; i < from.length; i++) {
      // shield is dispelled
      if (dmg_arr[i] > 0 && to_arr[i].is_shielded.until >= this.engine.current_turn) {
        to_arr[i].is_shielded.until = -1;
        dmg_arr[i] = 0;
      }

      // We only create dmg event when dmg is over 0
      if (dmg_arr[i] > 0) {
        to_arr[i].current_life -= dmg_arr[i];

        this.g_handler.add_event(new Event('deal_dmg', [from, to_arr[i], dmg_arr[i]]));
        this.g_handler.add_event(new Event('take_dmg', [to_arr[i], from, dmg_arr[i]]));

        if (to_arr[i].current_life <= 0 && to_arr[i].current_life + dmg_arr[i] > 0 && to_arr[i].status != 'destroyed')
          this.g_handler.add_event(new Event('destroyed', to_arr[i], from));
      }
    }
  }
};

// Silence a minion
Player.prototype.silence = function(from, target) {
  target.is_frozen.until = -1;
  target.is_shielded.until = -1;
  target.is_invincible = -1;

  for (var i = 0; i < this.g_aura.length; i++) {
    if (this.g_aura[i].who == target) {
      this.g_aura.splice(i, 1);
      i--;
    }
  }

  target.state = [];

  var arr;
  for (arr in this.g_handler.event_handler_arr) {
    for (i = 0; i < arr.length; i++) {
      if (arr[i].me == target) {
        arr.splice(i, 1);
        i--;
      }
    }
  }

  this.g_handler.add_event(new Event('silenced', from, target));
};

function Event(event_type, args) {
  this.event_type = event_type;
  this.turn = 0;

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
    this.spawned = args[0];
    this.is_user_play = args[1];
  }
  else if (event_type == 'draw_card') {
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
    this.who = args[0];
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
}
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

  var event_type_list = ['attack', 'deal_dmg', 'take_dmg', 'destroyed', 'summon',
    'draw_card', 'play_card', 'after_play', 'turn_begin', 'turn_end', 'deathrattle',
    'propose_attack', 'pre_dmg', 'heal', 'silence', 'card_burnt'
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

Handler.prototype.add_event = function(e) {
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
Handler.prototype.add_handler = function(f, event, me, is_secret) {
  this.event_handler_arr[event].push({
    f: f,
    me: me,
    is_secret: is_secret
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
}
Handler.prototype.execute = function() {
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
Handler.prototype.do_event = function(e) {
  console.log('[Handler] Process Event :: ', e.event_type);

  // Whenever some event is handled, notify it to clients
  this.engine.send_client_data(e);

  // Make sure not to use handlers that are added during the do_event process
  var handler_num = this.event_handler_arr[e.event_type].length;
  var handler_arr = this.event_handler_arr[e.event_type];
  for (var i = 0; i < handler_num; i++) {
    if (handler_arr[i].me.status != 'destroyed' || (e.event_type == 'deathrattle' && handler_arr[i].me == e.destroyed)) {
      handler_arr[i].f(e, handler_arr[i].me);
    }
  }

  this.exec_lock = false;
  this.execute();
};
Handler.prototype.death_creation = function() {
  console.log('Death Creation ', this.destroyed_queue.length);
  console.log('Callback size, ', this.queue_resolved_callback.length);
  
  this.destroyed_queue_length = this.destroyed_queue.length;
  var dq = this.destroyed_queue;

  // Mark mortally wounded ones to 'destroy' and remove it from the field
  for (var i = 0; i < this.destroyed_queue_length; i++) {
    var dead = dq[i].destroyed;
    if (dead.current_life <= 0 || dead.status == 'destroyed') {
      dead.status = 'destroyed'; // Mark it as destroyed
      dead.owner.field.remove_card(dead); // Remove card from the field
    }
  }
  // Since Event queue is already flushed out, we can comfortably
  // force push events
  for (i = 0; i < this.destroyed_queue.length; i++) {
    this.force_add_event(new Event('destroyed', dq[i].destroyed, dq[i].attacker));
    this.force_add_event(new Event('deathrattle', dq[i].destroyed));
  }
  
  // Clear destroyed queue
  dq.splice(0, dq.length);

  // Death Creation step 이 끝나면 end phase 를 실행할 수 있게 된다.
  if(this.next_phase) this.add_callback(this.end_phase, this, []);
  
  this.exec_lock = false;
  if(this.queue.length || this.queue_resolved_callback.length) {
    this.execute();
  }
};
Handler.prototype.end_phase = function() {
  console.log('end phase invoked!');
  if (this.next_phase) {
    var f = this.next_phase;
    this.next_phase = null;
    
    f.f.apply(f.that, f.args);
  }
}

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

function Engine(p1_socket, p2_socket, p1, p2, io) {
  // TODO Returns current turn
  this.current_turn = 0;

  this.server_io = io;

  function UniqueId() {
    this.id = 0;
    this.get_id = function() {
      return this.id++;
    };
  }

  this.g_id = new UniqueId();
  this.g_when = new UniqueId(); // Object to give unique number to the events

  this.g_aura = []; // Aura that is (selectively) affecting entire minions on field
  this.g_handler = new Handler(this);

  this.p1 = new Player(p1.id, p1.deck_list[0].job, this); // First
  this.p2 = new Player(p2.id, p2.deck_list[0].job, this); // Second

  // TODO IMPLEMENT THIS
  this.current_player = this.p1;

  this.p1.enemy = this.p2;
  this.p2.enemy = this.p1;

  for (var i = 0; i < p1.deck_list[0].cards.length / 2; i++) {
    var c = p1.deck_list[0].cards[2 * i];
    var num = p1.deck_list[0].cards[2 * i + 1];

    for (var j = 0; j < num; j++) {
      this.p1.deck.card_list.push(create_card(c, this.p1));
    }
  }

  for (var i = 0; i < p2.deck_list[0].cards.length / 2; i++) {
    var c = p2.deck_list[0].cards[2 * i];
    var num = p2.deck_list[0].cards[2 * i + 1];

    for (var j = 0; j < num; j++) {
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
}

Engine.prototype.start_match = function() {
  this.p1.starting_cards = util.rand_select(this.p1.deck.get_card_datas(), 3);
  this.p2.starting_cards = util.rand_select(this.p2.deck.get_card_datas(), 4);

  this.p1_socket.emit('choose-starting-cards', {
    cards: this.p1.starting_cards
  });
  this.p2_socket.emit('choose-starting-cards', {
    cards: this.p2.starting_cards
  });

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

      console.log('[Starting Cards :: ]', p.starting_cards)
      console.log('[New Starting Cards :: ]', new_starting_cards)
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
// Begins the game by putting selected cards to each player's deck
Engine.prototype.begin_game = function() {
  function hand_card(player) {
    console.log('[player starting cards]', player.starting_cards);
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

  // Apply overloaded mana deduction
  this.current_player.current_mana -= this.current_player.next_overload_mana;
  if (this.current_player.current_mana < 0) this.current_player.current_mana = 0;

  this.current_player.current_overload_mana = this.current_player.next_overload_mana;
  this.current_player.next_overload_mana = 0;

  this.g_handler.add_event(new Event('turn_begin', this.current_player));
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

            console.log('card :: ', c.card_data.type, ' , ', c.card_data);
            if (c.card_data.type == 'minion') {
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

  p.socket.on('hearth-end-turn', function(e) {
    return function(data) {
      if (p == e.current_player) {
        console.log('Player ', p.player_name, 'turn ends');
        e.g_handler.add_event(new Event('turn_end', p));
        e.g_handler.add_callback(e.end_turn, e, []);
        e.g_handler.execute();
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

  for (var i = 0; i < p1_hand.length; i++) {
    p1_card_info.push({
      where: 'hand',
      owner: 'me',
      id: p1_hand[i].id,
      life: p1_hand[i].current_life,
      mana: p1_hand[i].mana(),
      dmg: p1_hand[i].dmg(),
      name: p1_hand[i].card_data.name
    });
  }

  // We should give info about the cards that are on the field
  for (var i = 0; i < p1_field.length; i++) {
    p1_card_info.push({
      where: 'field',
      owner: 'me',
      id: p1_field[i].id,
      life: p1_field[i].current_life,
      mana: p1_field[i].mana(),
      dmg: p1_field[i].dmg(),
      name: p1_field[i].card_data.name
    });
    p2_card_info.push({
      where: 'field',
      owner: 'enemy',
      id: p1_field[i].id,
      life: p1_field[i].current_life,
      mana: p1_field[i].mana(),
      dmg: p1_field[i].dmg(),
      name: p1_field[i].card_data.name
    });
  }

  for (var i = 0; i < p2_hand.length; i++) {
    p2_card_info.push({
      where: 'hand',
      owner: 'me',
      id: p2_hand[i].id,
      life: p2_hand[i].current_life,
      mana: p2_hand[i].mana(),
      dmg: p2_hand[i].dmg(),
      name: p2_hand[i].card_data.name
    });
  }
  for (var i = 0; i < p2_field.length; i++) {
    p2_card_info.push({
      where: 'field',
      owner: 'me',
      id: p2_field[i].id,
      life: p2_field[i].current_life,
      mana: p2_field[i].mana(),
      dmg: p2_field[i].dmg(),
      name: p2_field[i].card_data.name
    });
    p1_card_info.push({
      where: 'field',
      owner: 'enemy',
      id: p2_field[i].id,
      life: p2_field[i].current_life,
      mana: p2_field[i].mana(),
      dmg: p2_field[i].dmg(),
      name: p2_field[i].card_data.name
    });
  }

  //  console.log('[p1 card info]', p1_card_info);
  //  console.log('[p2 card info]', p2_card_info);

  this.p1_socket.emit('hearth-event', {
    card_info: p1_card_info,
    event: e,
    enemy_num_hand: this.p2.hand.num_card()
  });
  this.p2_socket.emit('hearth-event', {
    card_info: p2_card_info,
    event: e,
    enemy_num_hand: this.p1.hand.num_card()
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
module.exports = {
  start_match: function(p1_socket, p2_socket, p1, p2) {
    var e = new Engine(p1_socket, p2_socket, p1, p2);
    e.start_match();

    return e;
  }
};