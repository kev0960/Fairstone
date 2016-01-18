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
  // [options] are the array of name of cards to choose
  Player.prototype.choose_one = function(options) {

  }
  // play a card from a hand
  Player.prototype.play_minion = function(c, at, select_done, user_choice) {
    var card = card_manager.load_card[c.card_data.name];
    if (!select_done) select_done = false;
    else {
      // the card goes back to the hand if the user does not choice
      // appropriate target even though there are available one
      if (!user_choice || !card.select_cond(user_choice)) {
        return
      }
    }
    if (!select_done && card.select_cond) {
      // If there are appropriate choice, then we have to select
      // If there are no available choice, then we just spawn
      var choice_available = false;
      for (var i = 0; i < this.field.num_card(); i++) {
        if (card.select_cond(this.field.card_list[i])) {
          choice_available = true;
          break;
        }
      }
      for (var i = 0; i < this.enemy.field.num_card(); i++) {
        if (card.select_cond(this.enemy.field.card_list[i])) {
          choice_available = true;
          break;
        }
      }
      if (card.select_cond(this.hero) || card.select_cond(this.enemy.hero)) choice_available = true;

      // We have to wait until user selects
      if (choice_available) {
        g_ui.wait_user_input(this.play_card, this.play_card, this, [c, at, true])
      }
    }

    if (c.calc_mana() < this.current_mana) {
      this.current_mana -= c.calc_mana();
    }
    this.hand.remove_card(c);
    this.field.put_card(c, at);

    g_handler.add_event(new Event('play_card', [c, this]))
    g_handler.add_callback(this.spawn_card, this, [c, true, user_choice]);
  }
  Player.prototype.spwan_card = function(c, is_user_play, target) {
    var card = card_manager.load_card[c.card_data.name];
    card.on_spawn(c, g_handler, is_user_play, true, this.end_spawn_card.bind(this, c, is_user_play));
  }
  Player.prototype.end_spawn_card = function(c, is_user_play, resolved) {
    if(!resolved) resolved = false;

    if(!resolved) {
      g_handler.add_callback(this.end_spawn_card, this, [c, is_user_play, true]);
      return;
    }
    if(resolved) {
      g_handler.add_event(new Event('spawn', c, is_user_play))
      return
    }
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
    } else if (e.event_type == 'spawn') {
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

    var event_type_list = ['attack', 'damaged', 'destroyed', 'spawn', 'draw_card', 'play_card', 'turn_begin', 'turn_end', 'deathrattle']

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
