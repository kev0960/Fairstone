(function() {
  function inc(n) {
    return function(x) {
      return x + n
    }
  }
  var card_do = {
    '제왕 타우릿산': {
      on_spawn: function(me, listen, target, battlecry, normal, end_spawn) {
        if (normal) {
          listen.add_listener(function(e, me) {
            if (e.turn_end == me.owner) {
              for (var i = 0; i < me.owner.num_card_on_hand(); i++) {
                me.owner.card_on_hand.card_list[i].add_buff(inc(-1), 'mana', me);
              }
            }
          }, 'turn_end', me);
        }
        end_spawn();
      }
    },
    '발톱의 드루이드' : {
      on_spawn : function(me, listen, target, battlecry, normal, end_spawn) {
        if(battlecry) {
          me.owner.choose_one(['표범 변신', '곰 변신'], function(choice) {
            if(choice == 0) {
              me.state.add_state(inc(2), 'dmg', me);
            } else {
              me.state.add_state(inc(2), 'life', me); me.current_life += 2;
              me.state.add_state(null, 'taunt', me);
            }
            end_spawn();
          })
        } else {
          end_spawn();
        }
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
