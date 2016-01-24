(function() {
  function inc(n) {
    return function(x) {
      return x + n
    }
  }
  var card_do = {
    '제왕 타우릿산': {
      on_play = function(me, bc, user_play, at, g_h) {
        me.owner.play_success(me, at, function(me, g_h, non_bc,) {
          if(non_bc) {
            g_h.add_handler(function(e, me) { if(e.turn_end == me.owner) {
              for(var i = 0; i < me.owner.hand.num_card(); i ++) {
                me.owner.hand[i].add_state(inc(-1), 'mana', me);
              }
            }});
          }
        });
      }
    },
    '발톱의 드루이드' : {
      on_spawn : function(me, bc, user_play, at, g_h) {
        if(user_play) {
          me.owner.choose_one (['표범 변환', '곰 변환'], function(me, at) { return function(choice) {
            if(choice == 1) { // 곰 변환
              me.owner.play_success(me, at, function(me, g_h, non_bc) {
                if(non_bc) {
                  me.add_state(inc(2), 'life', me);
                  me.current_life += 2;
                }
              });
            }
            else { // 표범 변환
              me.owner.play_success(me, at, function(me, g_h, non_bc) {
                if(non_bc) { me.make_charge(me); }
              });
            }
          });
         }
        } (me, at));
      }
      else {
        me.owner.play_success(me, at);
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
