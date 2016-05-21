(function() {
  function inc(n) {
    return function(x) {
      return x + n;
    };
  }

  function end(me, non_bc, bc) {
    if (bc && non_bc) {
      me.owner.end_bc(me);
    }
  }

  function spell_next_step(me, f) {
    me.owner.g_handler.add_callback(f, me, [me]);
  }

  function end_spell(me) {
    me.owner.end_spell_txt(me);
  }

  // Choose AT MOST n cards. 
  // If n is 1, then it returns an element. If not, it will
  // return ARRAY of chosen cards 
  function rand(arr, n) {
    if (n == 1 || !n) return arr[Math.floor(arr.length * Math.random())];

    var sel = [];
    while (arr.length && n > 0) {
      var lucky = Math.floor(arr.length * Math.random());
      sel.push(arr[lucky]);
      arr.splice(lucky, 1);

      n--;
    }
    return sel;
  }

  function get_unique(arr) {
    var s = [];
    for (var i = 0; i < arr.length; i++) s.push(arr[i].unique);
    return s;
  }

  // returns true in probablity of odd
  function chance(odd) {
    return Math.random() < odd;
  }

  function nothing() {}

  var card_do = {
    'Murloc Tinyfin': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Jeweled Scarab': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            var avail_list = rand(me.owner.engine.find_card_cond(function(c) {
              if (c.mana == 3 && c.type == 'minion' && !c.is_token) return true;
            }), 3);

            me.owner.choose_one(me, get_unique(avail_list), function(choice) {
                me.owner.hand_card(avail_list[choice].unique);
                end(me, non_bc, bc);
              },
              nothing,
              true,
              false,
              false,
              null,
              null);
          }
          else {
            end(me, non_bc, bc);
          }
        });
      }
    },
    'Huge Toad': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card == me) {
                var target = me.owner.enemy.get_all_character();
                me.owner.deal_dmg(1, me, rand(target));
              }
            }, 'deathrattle', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Gorillabot A-3': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          var found = false;
          for (var i = 0; i < me.owner.field.num_card(); i++) {
            if (me.owner.field[i].kind == 'machine' && me.owner.field[i] != me) {
              found = true;
            }
          }
          if (bc && found) {
            var avail_list = rand(me.owner.engine.find_card_cond(function(c) {
              if (c.kind == 'machine' && c.type == 'minion' && !c.is_token) return true;
            }), 3);

            me.owner.choose_one(me, get_unique(avail_list),
              function(choice) {
                me.owner.hand_card(avail_list[choice].unique);
                end(me, non_bc, bc);
              },
              nothing,
              true,
              false,
              false,
              null,
              null);
          }
          else {
            end(me, non_bc, bc);
          }
        });
      }
    },
    'Tomb Spider': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            var avail_list = rand(me.owner.engine.find_card_cond(function(c) {
              if (c.kind == 'beast' && c.type == 'minion' && !c.is_token) return true;
            }), 3);

            me.owner.choose_one(me, get_unique(avail_list),
              function(choice) {
                me.owner.hand_card(avail_list[choice].unique);
                end(me, non_bc, bc);
              },
              nothing,
              true,
              false,
              false,
              null,
              null);
          }
          else {
            end(me, non_bc, bc);
          }
        });
      }
    },
    'Anubisath Sentinel': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card == me) {
                var target = me.owner.field;
                if (target.length) {
                  var t = rand(target);
                  t.add_state(inc(3), 'dmg', me);
                  t.add_state(inc(3), 'life', me);
                  t.current_life += 3;
                }

              }
            }, 'deathrattle', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Fossilized Devilsaur': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            var found = false;
            for (var i = 0; i < me.owner.field.num_card(); i++) {
              if (me.owner.field[i].kind == 'beast' && me.owner.field[i] != me) {
                found = true;
              }
            }
            if (found) {
              me.add_state(null, 'taunt', me);
            }
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Ancient Shade': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            me.owner.hand_card('Ancient Curse', 1);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Ancient Curse': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            me.owner.deal_dmg(me.spell_dmg(7), me, me.owner.hero);
            me.owner.draw_cards(1);
            end_spell(me);
          }
        );
      }
    },
    'Eerie Statue': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.add_state(function(d, c) {
              if(c.owner.field.num_card() >= 2) return 1;
              return 0;
            }, 'atk_num', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Summoning Stone': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card.owner == me.owner && e.card.card_data.type == 'spell') {
                var m = e.card.mana();
                var list = me.owner.engine.find_card_cond(function(c) {
                  if(c.mana == m && c.type == 'minion' && !c.is_token) return true;
                });
                me.owner.summon_card(rand(list).unique, 10);
              }
            }, 'play_card', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Wobbling Runts': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            me.owner.summon_card('Rascally Runt', at + 1);
            me.owner.summon_card('Wily Runt', at + 1);
            me.owner.summon_card('Grumbly Runt', at + 1);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Rascally Runt': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Wily Runt': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Grumbly Runt': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    }
  };

  var card_names = [];
  module.exports = {
    load_card: function(c) {
      if (card_do[c]) return card_do[c];
      return null;
    },
    // Check whether certain card is implemented or not
    is_implemented: function(name) {
      if (card_do[name]) return true;
      return false;
    },
    get_card_names: function() {
      if (!card_names.length) {
        for (var x in card_do) {
          card_names.push(x);
        }
      }
      return card_names;
    }
  };

})();
