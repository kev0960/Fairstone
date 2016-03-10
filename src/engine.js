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
}
CardData.prototype.to_array = function() {
  var arr = [this.name, this.type, this.level, this.job, this.mana, this.dmg, this.life];
  return arr;
};

function Card(card_data, id, owner) {
  this.id = 0;
  this.card_data = new CardData(card_data);
  this.state = []; // Array of added states

  if(this.card_data.type != 'hero') this.status = 'deck';
  else this.status = 'field'; // HERO is always on the field

  this.owner = owner;

  this.field_summon_turn = -1;
  this.summon_order = -1;

  this.current_life = this.card_data.info[1];

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
Card.prototype.update_atk_cnt = function() {
  if (this.atk_info.turn == this.owner.engine.current_turn()) return;
  var atk_num = this.calc_state('atk_num', 1);

  this.atk_info.turn = this.owner.engine.current_turn();
  this.atk_info.cnt = atk_num;
  this.atk_info.did = 0;
};
Card.prototype.is_attackable = function() {
  if (this.is_frozen.until >= this.owner.engine.current_turn()) return false;
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

function create_card(name) {
  var cd = card_db.load_card(name);
  var card_data = new CardData(cd);

  return new Card(card_data, 0, null);
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
    this.card_list.splice(i, 1);
    return;
  }
};
Deck.prototype.remove_card_at = function(at) {
  this.card_list.splice(at, 1);
};
Deck.prototype.get_card_names = function() {
  var names = [];
  for(var i = 0; i < this.card_list.length; i ++) {
    names.push(this.card_list[i].card_data.name);
  }
}

function Player(player_name, job, engine) {
  this.player_name = player_name;
  this.player_job = job;
  this.engine = engine;

  // TODO this.enemy <- 정의할것!!

  this.hero = new Card({name : player_name, type : 'hero', info : [30, 0, 0], level : 'hero', job : job}}, this.engine.g_id.get_id(), this);

  this.current_mana = 1;

  this.hand = new Deck();
  this.field = new Deck();
  this.deck = new Deck();

  this.g_handler = this.engine.g_handler;
  this.g_aura = this.engine.g_aura;
  this.g_id = this.engine.g_id;
  this.g_when = this.engine.g_when;
}

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
Player.prototype.chk_target = function(c, next) {
  if (c.status == 'destroyed') return;
  if (c.target) {
    this.g_handler.add_event(new Event('target', c));
  }

  this.g_handler.add_callback(next, this, [c]);
};
// Play a card from a hand
Player.prototype.play_minion = function(c, at) {
  if (this.field.num_card() >= 7) return; // Is space available for a minion?
  if (this.current_mana < c.mana()) return; // Enough mana?

  var card = card_manager.load_card(c.card_data.name);
  card.on_play(c, true, true, at);
};
Player.prototype.play_success = function(c, at, next) {
  // if the status of card is already specified as 'field',
  // then this means that the minion is not summoning by user card play
  if (c.status == 'field') {
    this.g_handler.add_callback(this.play_done, this, [c]);

    // only turn on non-battlecry stuff
    this.g_handler.add_callback(next, this, [c, true, false]);
    return;
  }

  c.status = 'field';
  this.current_mana -= c.mana();
  c.field_summon_turn = this.engine.current_turn();
  c.id = this.g_id.get_id();
  c.summon_order = this.g_when.get_id();

  this.hand.remove_card(c);

  this.g_handler.add_event(new Event('play_card', c, this));

  if (c.card_data.type == 'minion') {
    this.field.put_card(c, at);

    // play_done must be called AFTER next
    this.g_handler.add_callback(this.play_done, this, [c]);

    if (next) {
      this.g_handler.add_callback(next, this, [c, true, true]);
      if (this.chk_aura('bran_bronzebeard')) {
        // Turn Off non-battlecry stuff
        this.g_handler.add_callback(next, this, [c, false, true]);
      }
    }
  } else if (c.card_data.type == 'spell') {
    // play_done must be called at LAST
    this.g_handler.add_callback(this.play_done, this, [c]);
    this.g_handler.add_callback(this.chk_target, this, [c, next]);
  }
};
Player.prototype.play_done = function(c) {
  this.g_handler.add_event(new Event('summon', c));
};
Player.prototype.summon_card = function(name, at, after_summon) {
  var c = create_card(name);

  c.field_summon_turn = this.engine.current_turn();
  c.id = this.g_id.get_id();
  c.status = 'field';
  c.owner = this;
  c.summon_order = this.g_when.get_id();

  this.field.put_card(c, at);
  var card = card_manager.load_card(c.card_data.name);

  // Optional argument - after_summon; which is called after the card is summoned
  if (after_summon) this.g_handler.add_callback(after_summon, this, [c]);

  card.on_play(c, false, false, at);
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
  if (this.is_invincible.until >= this.engine.current_turn()) return true;

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
  if (target.dmg_given > 0 && c.is_shielded.until >= this.engine.current_turn()) {
    target.dmg_given = 0;
    c.is_shielded.until = -1; // shield is GONE
  }
  if (c.dmg_given > 0 && target.is_shielded.until >= this.engine.current_turn()) {
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
  if (dmg > 0 && to.is_shielded.until >= this.engine.current_turn()) {
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
  } else { // Now pre_dmg events are done
    dmg_arr[done - 1] = from.dmg_given;

    for (i = 0; i < from.length; i++) {
      // shield is dispelled
      if (dmg_arr[i] > 0 && to_arr[i].is_shielded.until >= this.engine.current_turn()) {
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

  this.g_msg.add_event(new Event('silenced', from, target));
};

function Event(event_type, args) {
  this.event_type = event_type;
  this.turn = 0;

  if (event_type == 'attack') {
    this.who = args[0];
    this.target = args[1];
    this.type = args[2];
  } else if (event_type == 'take_dmg') {
    this.victim = args[0];
    this.attacker = args[1];
    this.dmg = args[2];
  } else if (event_type == 'deal_dmg') {
    this.attacker = args[0];
    this.victim = args[1];
    this.dmg = args[2];
  } else if (event_type == 'pre_dmg') {
    this.attacker = args[0];
    this.victim = args[1];
    this.dmg = args[2];
  } else if (event_type == 'destroyed') {
    this.destroyed = args[0];
    this.attacker = args[1];
  } else if (event_type == 'summon') {
    this.spawned = args[0];
    this.is_user_play = args[1];
  } else if (event_type == 'draw_card') {
    this.card = args[0];
    this.who = args[1];
  } else if (event_type == 'play_card') {
    this.card = args[0];
    this.who = args[1];
  } else if (event_type == 'turn_begin') {
    this.who = args[0];
  } else if (event_type == 'turn_end') {
    this.who = args[0];
  } else if (event_type == 'deathrattle') {
    this.who = args[0];
  } else if (event_type == 'propose_attack') {
    this.who = args[0];
    this.target = args[1];
  } else if (event_type == 'target') {
    this.who = args[0];
  } else if (event_type == 'silence') {
    this.who = args[0];
    this.target = args[1];
  }
}
// Global Event handler
function Handler() {
  this.queue = [];

  // record all of the events
  this.record = [];

  // Queue of destroyed cards
  this.destroyed_queue = [];
  this.destroyed_queue_length = 0;

  // List of waiting call backs
  this.queue_resolved_callback = [];

  var event_type_list = ['attack', 'deal_dmg', 'take_dmg', 'destroyed', 'summon',
    'draw_card', 'play_card', 'turn_begin', 'turn_end', 'deathrattle',
    'propose_attack', 'pre_dmg', 'heal', 'silence'
  ];

  // initialize event handler array
  this.event_handler_arr = {};
  for (var i = 0; i < event_type_list.length; i++) this.event_handler_arr[event_type_list[i]] = [];

  this.exec_lock = false;
}

Handler.prototype.add_event = function(e) {
  e.turn = this.engine.current_turn();

  this.legacy_queue.push(e);

  if (e.event_type == 'destroyed') {
    this.destroyed_queue.push(e);
  } else {
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
  e.turn = this.engine.current_turn();

  this.queue.push(e);
};
Handler.prototype.add_callback = function(f, that, args) {
  this.queue_resolved_callback.splice(0, 0, {
    f: f,
    that: that,
    args: args
  });
};
Handler.prototype.execute = function() {
  if (this.exec_lock) return;
  this.exec_lock = true;

  if (this.queue.length == 0) {
    if (this.queue_resolved_callback.length) {
      var f = this.queue_resolved_callback[0];
      this.queue_resolved_callback.splice(0, 1);
      this.exec_lock = false;

      f.f.apply(f.that, f.args);
      return;
    } else {
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
  // Whenever some event is handled, notify it to clients

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
  })
}

function Engine(p1_socket, p2_socket, p1, p2, io) {
  // Returns current turn
  this.current_turn = function() {};

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
  this.g_handler = new Handler();

  this.p1 = new Player(p1.id, p1.deck_list[0].job, this); // First
  this.p2 = new Player(p2.id, p2.deck_list[0].job, this); // Second

  for (var i = 0; i < p1.deck_list[0].cards.length / 2; i++) {
    var c = p1.deck_list[0].cards[2 * i];
    var num = p1.deck_list[0].cards[2 * i + 1];

    for (var j = 0; j < num; j++) {
      this.p1.deck.card_list.push(create_card(c));
    }
  }

  for (var i = 0; i < p2.deck_list[0].cards.length / 2; i++) {
    var c = p2.deck_list[0].cards[2 * i];
    var num = p2.deck_list[0].cards[2 * i + 1];

    for (var j = 0; j < num; j++) {
      this.p2.deck.card_list.push(create_card(c));
    }
  }
  this.p1_socket = p1_socket;
  this.p2_socket = p2_socket;

  this.g_ui = new UserInterface(this, p1_socket, p2_socket);
}

Engine.prototype.start_match = function() {
  var p1_starting_cards = util.rand_select(this.p1.deck.get_card_names(), 3);
  var p2_starting_cards = util.rand_select(this.p2.deck.get_card_names(), 4);

  this.p1_socket.emit('choose_starting_cards', p1_starting_cards);
  this.p2_socket.emit('choose_starting_cards', p2_starting_cards);

  this.p1_socket.on('remove_some_cards', function( ) { return function(data) {

  }; }())
};

// e : the event that we just handled
Engine.prototype.send_client_data = function(e) {
  // Do not show SECRET card to the opponent player
  if (e.event_type == 'draw_card' || e.event_type == 'spwan_card') {

  }

  var p1_card_info = [];

  var p1_hand = this.p1.hand.card_list;
  var p1_deck = this.p1.deck.card_list;

  for (var i = 0; i < p1_hand.length; i++) {
    p1_card_info.push({
      where: 'hand',
      owner: 'me',
      id: p1_hand[i].id,
      life: p1_hand[i].current_life,
      mana: p1_hand[i].mana(),
      dmg: p1_hand[i].dmg()
    })
  }

  // We should give info about the cards that are on the field
  for (var i = 0; i < p1_deck.length; i++) {
    p1_card_info.push({
      where: 'field',
      owner: 'me',
      id: p1_deck[i].id,
      life: p1_deck[i].current_life,
      mana: p1_deck[i].mana(),
      dmg: p1_deck[i].dmg()
    });
    p2_card_info.push({
      where: 'field',
      owner: 'enemy',
      id: p1_deck[i].id,
      life: p1_deck[i].current_life,
      mana: p1_deck[i].mana(),
      dmg: p1_deck[i].dmg()
    });
  }

  var p2_card_info = [];

  var p2_hand = this.p2.hand.card_list;
  var p2_deck = this.p2.deck.card_list;

  for (var i = 0; i < p1_hand.length; i++) {
    p2_card_info.push({
      where: 'hand',
      owner: 'me',
      id: p2_hand[i].id,
      life: p2_hand[i].current_life,
      mana: p2_hand[i].mana(),
      dmg: p2_hand[i].dmg()
    })
  }
  for (var i = 0; i < p1_deck.length; i++) {
    p2_card_info.push({
      where: 'field',
      owner: 'me',
      id: p2_deck[i].id,
      life: p2_deck[i].current_life,
      mana: p2_deck[i].mana(),
      dmg: p2_deck[i].dmg()
    })
    p1_card_info.push({
      where: 'field',
      owner: 'enemy',
      id: p2_deck[i].id,
      life: p2_deck[i].current_life,
      mana: p2_deck[i].mana(),
      dmg: p2_deck[i].dmg()
    })
  }

  p1_socket.emit('hearth-event', p1_card_info);
  p2_socket.emit('hearth_event', p2_card_info);
}

Engine.prototype.socket = function(p) {
  if (p == this.p1) {
    return this.p1_socket;
  } else if (p == this.p2) {
    return this.p2_socket;
  }
  throw "SOCKET ERROR"
}
module.exports = {
  start_match: function(p1_socket, p2_socket, p1, p2) {
    var e = new Engine(p1_socket, p2_socket, p1, p2);
    e.start_match();

    return e;
  }
};
