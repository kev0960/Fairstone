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

  function Card(card_data, id) {
    this.id = 0;
    this.card_data = new CardData(card_data);
    this.state = []; // Array of added states

    this.field_summon_turn = 0;

    this.is_frozen = false;
    this.atk_info = {cnt : 0, turn : 0, did_action : 0}
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
      x = modifiers[i].f(x);
    }
    return x ;
  }
  Card.prototype.update_atk_cnt = function() {
    if(this.atk_info.turn == current_turn()) return;
    var atk_num = this.calc_state('atk_num', 1)

    this.atk_info.turn = current_turn();
    this.atk_info.cnt = atk_num;
    this.atk_info.did_action = 0;
  }
  Card.prototype.is_attackable = function() {
    if(this.is_frozen) return false
    this.update_atk_cnt();

    if(this.atk_info.turn == 0) return false;
    return true;
  }
  Card.prototype.make_charge = function(who) {
    
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

    this.hero = new Card([player_name], g_id.get_id());

    this.current_mana = 1;

    this.hand = new Deck();
    this.field = new Deck();
  }

  // TODO :: Finish implementing this function using user io
  // [options] are the array of name of cards to choose
  Player.prototype.choose_one = function(options, on_success) {

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

    this.hand.remove_card(c);
    this.field.put_card(c, at);

    // play_done must be called AFTER next
    g_handler.add_callback(this.play_done, this, [c]);

    if(next) g_handler.add_callback(next, this, [c, g_handler]);
  }
  Player.prototype.play_done = function(c) {
    g_handler.add_event('summon', c);
  }

  function Event(event_type, args) {
    this.event_type = event_type
    this.turn = 0;

    if (e.event_type == 'attack') {
      this.who = args[0];
      this.target = args[1];
      this.type = args[2];
    } else if (e.event_type == 'damaged') {
      this.damaged = args[0];
      this.attacker = args[1];
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

    var event_type_list = ['attack', 'damaged', 'destroyed', 'summon', 'draw_card', 'play_card', 'turn_begin', 'turn_end', 'deathrattle']

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
