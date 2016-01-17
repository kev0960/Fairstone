(function() {
  function inc(n) {
    return function(x) {
      return x + n
    }
  }
  var card_do = {
    '제왕 타우릿산': {
      on_spawn: function(me, listen) {
        listen.add_listener(function(e, me) {
          if (e.turn_end == me.owner) {
            for (var i = 0; i < me.owner.num_card_on_hand(); i++) {
              me.owner.card_on_hand.card_list[i].add_buff(inc(-1), 'mana', me);
            }
          }
        }, 'turn_end', me)
      }
    }
  }

  module.exports = {
    load_card: function(c) {
      if (card_do[c]) return card_do[c];
      return null;
    }
  }
}());
