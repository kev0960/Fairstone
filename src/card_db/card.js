(function() {
  function inc(n) {
    return function(x) {
      return x + n
    }
  }
  var card_do = {
    '제왕 타우릿산': {
      on_play = function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if(non_bc) {
            me.owner.g_h.add_handler(function(e, me) { if(e.turn_end == me.owner) {
              for(var i = 0; i < me.owner.hand.num_card(); i ++) {
                me.owner.hand[i].add_state(inc(-1), 'mana', me);
              }
            }});
          }
        });
      }
    },
    '발톱의 드루이드' : {
      on_play : function(me, bc, user_play, at) {
        if(user_play) {
          me.owner.choose_one (['표범 변환', '곰 변환'], function(me, at) { return function(choice) {
            if(choice == 1) { // 곰 변환
              me.owner.play_success(me, at, function(me, non_bc, bc) {
                if(non_bc) {
                  me.add_state(inc(2), 'life', me);
                  me.current_life += 2;
                }
              });
            }
            else { // 표범 변환
              me.owner.play_success(me, at, function(me, non_bc, bc) {
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
    },
    '화염구' : {
      on_play : function(me, forced_target) {
        me.owner.select_one(me, function() { return true; }, // It can attack anything
        function select_success(me) {  // on select success
          me.owner.play_success(me, -1,
            function(me) {
              me.owner.deal_dmg(me.calc_spell_dmg(6), me.target, me);
            }
          );},
          null, // on select failure
          forced_target); // if forced_target is enabled then we don't make user to choose
        }
    }
    '고귀한 희생' : {
      on_play : function(me) {
        // Spell does not require 'at' argument
        me.owner.play_success(me, -1, function(me) {
          me.owner.g_h.add_handler(function(e, me) {
            if(e.who.owner == me.owner.enemy && me.owner.field.num_card() <= 6) {
              me.owner.summon_card('수호자', 10, function(me) { return function(c) { me.target = c; }; }(me))
            }}, 'propose_attack', me, true)
        })
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
