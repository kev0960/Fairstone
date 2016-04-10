(function() {
  function inc(n) {
    return function(x) {
      return x + n;
    };
  }
  function end(me, non_bc, bc) {
    if(bc && non_bc) { me.owner.end_bc(me); }
  }
  function end_spell(me) {
    me.owner.end_spell_txt(me);
  }
  function nothing() { }
  
  var card_do = {
    'Murloc Raider': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) { end(me, non_bc, bc); });
      }
    },
    'River Crocolisk': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) { end(me, non_bc, bc); });
      }
    },
    'Magma Rager': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) { end(me, non_bc, bc); });
      }
    },
    'Emperor Thaurissan': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.who == me.owner) {
                me.do_action('emperor_thaurissan');
                for (var i = 0; i < me.owner.hand.num_card(); i++) {
                  me.owner.hand.card_list[i].add_state(inc(-1), 'mana', me);
                }
              }
            }, 'turn_end', me, false);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'War Golem': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) { end(me, non_bc, bc); });
      }
    },
    'Druid of the Claw': {
      on_play: function(me, bc, user_play, at) {
        if (user_play) {
          me.owner.choose_one(['표범 변환', '곰 변환'], function(me, at) {
            return function(choice) {
              if (choice == 1) { // 곰 변환
                me.owner.play_success(me, at, function(me, non_bc, bc) {
                  if (non_bc) {
                    me.add_state(inc(2), 'life', me);
                    me.current_life += 2;
                  }
                  end(me, non_bc, bc);
                });
              }
              else { // 표범 변환
                me.owner.play_success(me, at, function(me, non_bc, bc) {
                  if (non_bc) {
                    me.make_charge(me);
                  }
                  end(me, non_bc, bc);
                });
              }
            };
          }(me, at));
        }
        else {
          me.owner.play_success(me, at, function(me, non_bc, bc) { end(me, non_bc, bc); });
        }
      }
    },
    'Fireball': {
      on_play: function(me, forced_target) {
        me.owner.select_one(me, function() {
            return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                me.owner.deal_dmg(me.spell_dmg(6), me, me.target);
                end_spell(me);
              }
            );
          },
          nothing, // on select failure
          forced_target); // if forced_target is enabled then we don't make user to choose
      }
    },
    'Noble Sacrifice': {
      on_play: function(me) {
        // Spell does not require 'at' argument
        me.owner.play_success(me, -1, function(me) {
          me.owner.g_handler.add_handler(function(e, me) {
            if (e.who.owner == me.owner.enemy && me.owner.field.num_card() <= 6) {
              me.owner.summon_card('수호자', 10, function(me) {
                return function(c) {
                  me.target = c;
                };
              }(me))
            }
          }, 'propose_attack', me, true);
          end_spell(me);
        });
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
