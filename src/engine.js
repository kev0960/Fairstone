const card_manager = require('./card_db/card');

function Engine() {
  // Returns current turn
  function current_turn() {}

  function UniqueId() {
    this.id = 0;
    this.get_id = function() {
      return id++;
    }
  }

  var g_id = new UniqueId();
  var g_when = new UniqueId(); // Object to give unique number to the events

  var g_aura = []; // Aura that is (selectively) affecting entire minions on field

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
  }

  function Card(card_data, id, owner) {
    this.id = 0;
    this.card_data = new CardData(card_data);
    this.state = []; // Array of added states
    this.status = 'deck';
    this.owner = owner;

    this.field_summon_turn = 0;

    this.is_frozen = {until : -1};
    this.is_stealth = {until : -1};
    this.is_shielded = {until : -1};

    this.atk_info = {cnt : 0, turn : 0, did : 0};

    // Proposed attack target during combat phase (can be changed)
    this.atk_target = null;

    // Proposed damage that may be given to the target (can be changed)
    this.dmg_given = 0;
  }
  Card.prototype.add_state = function(f, state, who) {
    this.state.push({f : f, state : state, who : who, when : g_when.get_id()});
  }
  Card.prototype.chk_state = function(state) {
    for(var i = 0; i < this.state.length; i ++) {
      if(this.state.state === state) return true;
    }
    return false;
  }
  Card.prototype.calc_state = function(state, init_value) {
    var x = init_value;
    var modifiers = [];

    for(var i = 0; i < this.state.length; i ++) {
      if(this.state[i].state === state) modifiers.push({f : this.state[i].f, when : this.state[i].when});
    }
    for(var i = 0; i < g_aura.length; i ++) {
      if(g_aura[i].who.is_good() && g_aura[i].state === state) {
        modifiers.push({f : g_aura[i].f, when : g_aura[i].when})
      }
    }
    // Sort by ascending order
    modifiers.sort(function(a, b) {return a.when > b.when})

    for(var i = 0; i < modifiers.length; i ++) {
      x = modifiers[i].f(x, this);
    }
    return x ;
  }
  Card.prototype.update_atk_cnt = function() {
    if(this.atk_info.turn == current_turn()) return;
    var atk_num = this.calc_state('atk_num', 1)

    this.atk_info.turn = current_turn();
    this.atk_info.cnt = atk_num;
    this.atk_info.did = 0;
  }
  Card.prototype.is_attackable = function() {
    if(this.is_frozen.until >= current_turn()) return false
    this.update_atk_cnt();

    if(this.atk_info.cnt <= this.atk_info.did) return false;
    return true;
  }
  Card.prototype.make_charge = function(who) {
    this.add_state(null, 'charge', who);
    this.update_atk_cnt();
    this.atk_info.cnt = this.calc_state('atk_num', 1);
  }
  Card.prototype.make_windfury = function(who) {
    // For minions which are not able to attack (e.g Ancient watcher),
    // We should not give windfury to those
    if(this.calc_state('atk_num', 1) == 0) return;

    this.add_state(function() { return 2; }, 'atk_num', who);
    this.update_atk_cnt();

    if(this.atk_info.turn == this.atk_info.field_summon_turn && !this.chk_state('charge')) return;
    this.atk_info.cnt = 2;
  }

  function Deck() {
    this.card_list = []
  }
  Deck.prototype.num_card = function() {
    return this.card_list.length;
  }
  Deck.prototype.put_card = function(card, at) {
    if (!at) at = this.card_list.length;
    this.card_list.splice(at, 0, card);
  }
  Deck.prototype.get_nearby_card = function(c, offset) {
    for (var i = 0; i < this.card_list.length; i++) {
      if (this.card_list[i] == c) {
        if (i + offset >= 0 && i + offset < this.card_list.length) return this.card_list[i + offset]
        return null;
      }
    }
    return null;
  }
  Deck.prototype.remove_card = function(c) {
    for (var i = 0; i < this.card_list.length; i++) {
      this.card_list.splice(i, 1);
      return;
    }
  }
  Deck.prototype.remove_card_at = function(at) {
    this.card_list.splice(at, 1);
  }

  function Player(player_name, job) {
    this.player_name = player_name
    this.player_job = job

    // this.enemy <- 정의할것!!

    this.hero = new Card([player_name], g_id.get_id(), this);

    this.current_mana = 1;

    this.hand = new Deck();
    this.field = new Deck();
  }

  Player.prototype.chk_aura = function (aura) {
    for(var i = 0; i < g_aura.length; i ++) {
      if(g_aura[i].state == aura && g_aura[i].who.is_good()) return true;
    }
    return false;
  }
  // TODO :: Finish implementing this function using user io
  // [options] are the array of name of cards to choose
  Player.prototype.choose_one = function(options, on_success) {

  }
  Player.prototype.play_spell = function (c) {
    var card = card_manager.load_card(c.card_data.name);
    card.on_play(c, g_handler);
  }
  // Play a card from a hand
  Player.prototype.play_minion = function(c, at) {
    var card = card_manager.load_card(c.card_data.name)
    card.on_play(c, true, true, at, g_handler);
  }
  Player.prototype.play_success = function(c, at, next) {
    this.current_mana -= c.mana();

    c.field_summon_turn = current_turn();
    c.id = g_id.get_id();
    c.status = 'field';

    this.hand.remove_card(c);
    this.field.put_card(c, at);

    g_handler.add_event('play_card', c, this);

    // play_done must be called AFTER next
    g_handler.add_callback(this.play_done, this, [c]);

    if(next) {
      g_handler.add_callback(next, this, [c, g_handler, true]);
      if(this.chk_aura('bran_bronzebeard')) {
        // Turn Off non-battlecry stuff
        g_handler.add_callback(next, this, [c, g_handler, false])
      }
    }
  }
  Player.prototype.play_done = function(c) {
    g_handler.add_event('summon', c);
  }

  Player.prototype.chk_enemy_taunt = function (target) {
    if(target.chk_state('taunt')) return true;
    for(var i = 0; i < this.enemy.field.num_card(); i ++) {
      if(this.enemy.field.card_list[i].chk_state('taunt')) return false;
    }
    return true;
  }
  Player.prototype.chk_invincible = function (target) {
    for(var i = 0; i < g_aura.length; i ++) {
      if(g_aura[i].state === 'invincible' && g_aura[i].who.is_good() && g_aura[i].f(target)) {
        return true;
      }
    }
    return false;
  }
  Player.prototype.combat_start = function(c, target) {
    if(!c.is_attackable()  // chks whether the attacker has not exhausted its attack chances
    || !this.chk_enemy_taunt(target) // chks whether the attacker is attacking proper taunt minions
    || target.owner == c.owner // chks whether the attacker is not attacker our own teammates
    || this.chk_invincible (target)) return false; // chks whether the attacker is attacking invincible target

    c.atk_target = target;
    c.is_stealth.until = -1; // stealth is gone!

    // propose_attack event can change the target of the attacker
    g_handler.add_event('propose_attack', [c, target]);
    g_handler.add_callback(this.atack, this, []);
  }
  Player.prototype.attack = function (c) {
    // If the attacker is mortally wounded or out of play, then combat event is closed
    if(c.current_life <= 0 || c.status != 'field') return;

    // attack event does not change the target of an attacker
    g_handler.add_event('attack', [c, c.target]);
    g_handler.add_callback(this.pre_combat, this, [])
  }
  Player.prototype.pre_combat = function(c) {
    var target = c.target;

    c.dmg_given = c.dmg();
    target.dmg_given = target.dmg();

    g_handler.add_event('pre_dmg', [c, target, c.dmg_given]);
    g_handler.add_event('pre_dmg', [target, c, target.dmg_given]);
    g_handler.add_callback(this.combat, this, [c]);
  }
  Player.prototype.combat = function(c) {
    var target = c.target;

    // checking for shields
    if(target.dmg_given > 0 && c.is_shielded.until >= current_turn()) {
      target.dmg_given = 0;
      c.is_shielded.until = -1; // shield is GONE
    }
    if(c.dmg_given > 0 && target.is_shielded.until >= current_turn()) {
      c.dmg_given = 0;
      target.is_shielded.until = -1;
    }

    c.current_life -= target.dmg_given;
    target.current_life -= c.dmg_given;

    if(c.dmg_given > 0) {
      g_handler.add_event('take_dmg', [target, c, c.dmg_given])
      g_handler.add_event('deal_dmg', [c, target, c.dmg_given])
    }
    if(target.dmg_given > 0) {
      g_handler.add_event('take_dmg', [c, target, target.dmg_given]);
      g_handler.add_event('deal_dmg', [target, c, target.dmg_given]);
    }
  }

  function Event(event_type, args) {
    this.event_type = event_type
    this.turn = 0;

    if (e.event_type == 'attack') {
      this.who = args[0];
      this.target = args[1];
      this.type = args[2];
    } else if (e.event_type == 'take_dmg') {
      this.victim = args[0];
      this.attacker = args[1];
      this.dmg = args[2];
    } else if(e.event_type == 'deal_dmg') {
      this.attacker = args[0];
      this.victim = args[1];
      this.dmg = args[2];
    } else if(e.event_type == 'pre_dmg') {
      this.attacker = args[0];
      this.victim = args[1];
      this.dmg = args[2];
    } else if (e.event_type == 'destroyed') {
      this.destroyed = args[0];
      this.attacker = args[1];
    } else if (e.event_type == 'summon') {
      this.spawned = args[0];
      this.is_user_play = args[1];
    } else if (e.event_type == 'draw_card') {
      this.card = args[0];
      this.who = args[1];
    } else if (e.event_type == 'play_card') {
      this.card = args[0];
      this.who = args[1];
    } else if (e.event_type == 'turn_begin') {
      this.who = args[0];
    } else if (e.event_type == 'turn_end') {
      this.who = args[0];
    } else if (e.event_type == 'deathrattle') {
      this.who = args[0];
    } else if (e.event_type == 'propose_attack') {
      this.who = args[0]; this.target = args[1];
    }
  }

  // Global Event handler
  function Handler() {
    this.queue = []

    // record all of the events
    this.record = []

    // Queue of destroyed cards
    this.destroyed_queue = []

    // List of waiting call backs
    this.queue_resolved_callback = []

    var event_type_list = ['attack', 'deal_dmg', 'take_dmg', 'destroyed', 'summon',
                           'draw_card', 'play_card', 'turn_begin', 'turn_end', 'deathrattle',
                           'propose_attack', 'pre_dmg']

    // initialize event handler array
    for (var i = 0; i < event_type_list.length; i++) this.event_handler_arr[event_type_list[i]] = []

    this.exec_lock = false
  }

  var g_handler = new Handler();

  Handler.prototype.add_event = function(e) {
    e.turn = current_turn();

    this.legacy_queue.push(e);

    if (e.event_type == 'destroyed') {
      this.destroyed_queue.push(e);
    } else {
      // Insert in front of all other events
      this.queue.splice(0, 0, e);
    }
  }
  Handler.prototype.add_callback = function(f, that, args) {
    this.queue_resolved_callback.splice(0, 0, {
      f: f,
      that: that,
      args: args
    });
  }
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
      }
    }
    var eve = this.queue[0];
    this.queue.splice(0, 1);

    // Handle the event here
    this.do_event(eve);

    this.exec_lock = false;
  }
  Handler.prototype.do_event = function(e) {
    // Make sure not to use handlers that are added during the do_event process
    var handler_num = this.event_handler_arr[e.event_type].length;
    var handler_arr = this.event_handler_arr[e.event_type];
    for (var i = 0; i < handler_num; i++) {
      if (handler_arr[i].me.status != 'destroyed' || (e.event_type == 'deathrattle' && handler_arr[i].me == e.destroyed)) handler_arr[i].f(e, handler_arr[i].me);
    }
  }

  function UserInterface() {}
  UserInterface.prototype.wait_user_input = function(f, that, args) {
    var user_input; // Get user input

    // wait_user_input function gives 'user_input' as an additional argument to the callback function
    args.push(user_input);
    f.apply(that, args);
  }
  var g_ui = new UserInterface();
}

module.exports = {
  start_match: function(p1, p2) {}
}
