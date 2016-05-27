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
              if (c.owner.field.num_card() >= 2) return 1;
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
                  if (c.mana == m && c.type == 'minion' && !c.is_token) return true;
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
    },
    'Naga Sea Witch': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.engine.add_aura(function(m, c, me) {
              if (c.owner == me.owner) return 5;
            }, 'mana', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Djinni of Zephyrs': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card.card_data.type == 'spell' && e.card.owner == me.owner && e.card.target && e.card.target.owner == me.owner && e.card.target != me) {
                me.owner.force_cast_spell(e.card, me);
              }
            }, 'summon', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Brann Bronzebeard': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.engine.add_aura(null, 'bran_bronzebeard', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Elise Starseeker': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            me.owner.put_card_to_deck(me, 'Map to the Golden Monkey');
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Map to the Golden Monkey': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            me.owner.put_card_to_deck(me, 'Golden Monkey');
            end_spell(me);
          }
        );
      }
    },
    'Golden Monkey': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            var hand_num = me.owner.hand.num_card();
            var deck_num = me.owner.deck.num_card();

            me.owner.hand.card_list = [];
            me.owner.deck.card_list = [];

            var avail_list = me.owner.engine.find_card_cond(function(c) {
              if (c.level == 'legendary' && c.type == 'minion' && !c.is_token) return true;
            });

            for (var i = 0; i < hand_num; i++) {
              me.owner.hand_card(rand(avail_list).unique, 1, null, true);
            }
            for (var i = 0; i < deck_num; i++) {
              me.owner.put_card_to_deck(me, rand(avail_list).unique);
            }
          }
          if (non_bc) me.add_state(null, 'taunt', me);
          end(me, non_bc, bc);
        });
      }
    },
    'Reno Jackson': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            var dup = false;
            for (var i = 0; i < me.owner.deck.num_card(); i++) {
              for (var j = i + 1; j < me.owner.deck.num_card(); j++) {
                if (me.owner.deck.card_list[i].card_data.unique == me.owner.deck.card_list[j].card_data.unique) {
                  dup = true;
                  break;
                }
              }
              if (dup) break;
            }
          }
          if (!dup) {
            me.owner.heal(me.owner.hero.life(), me, me.owner.hero);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Arch-Thief Rafaam': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            var avail_list = ['Lantern of Power', 'Mirror of Doom', 'Timepiece of Horror'];
            me.owner.choose_one(me, avail_list,
              function(choice) {
                me.owner.hand_card(avail_list[choice]);
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
    'Lantern of Power': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type === 'minion') return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  me.target.add_state(inc(10), 'dmg', me);
                  me.target.add_state(inc(10), 'life', me);
                  me.target.current_life += 10;
                }
                end_spell(me);
              }
            );
          },
          nothing, // on select failure
          forced_target, // if forced_target is enabled then we don't make user to choose
          random_target); // if random_target is enabled then Engine Randomly Selects Available Target
      }
    },
    'Mirror of Doom': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            var left = 7 - me.owner.field.num_card();
            for (var i = 0; i < left; i++) {
              me.owner.summon_card('Mummy Zombie', 10);
            }
            end_spell(me);
          }
        );
      }
    },
    'Mummy Zombie': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Timepiece of Horror': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            me.owner.deal_multiple_dmg(me.spell_dmg(10), me, function() {
              return me.owner.enemy.get_all_character([], function(c) {
                if (c.current_life > 0) return true;
              });
            });
            end_spell(me);
          }
        );
      }
    },
    'Fierce Monkey': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) me.add_state(null, 'taunt', me);
          end(me, non_bc, bc);
        });
      }
    },
    'Scarab': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) me.add_state(null, 'taunt', me);
          end(me, non_bc, bc);
        });
      }
    },
    'Obsidian Destroyer': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.who == me.owner) {
                me.owner.summon_card('Scarab', at + 1);
              }
            }, 'turn_end', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Cursed Blade': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.victim == me.owner.hero) {
                e.attacker.dmg_given *= 2;
              }
            }, 'pre_dmg', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Tunnel Trogg': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.who.owner == me.owner) {
                me.add_state(inc(e.overload), 'dmg', me);
              }
            }, 'overload', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Rumbling Elemental': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card.owner == me.owner && e.card.chk_mech('battlecry')) {
                var target = me.owner.enemy.get_all_character();
                me.owner.deal_dmg(2, me, rand(target));
              }
            }, 'after_play', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Everyfin is Awesome': {
      on_draw: function(me) {
        me.add_state(function(m, c) {
          var cnt = 0;
          for (var i = 0; i < me.owner.field.num_card(); i++) {
            if (me.owner.field.card_list[i].card_data.kind == 'murloc') cnt++;
          }
          return m - cnt;
        }, 'mana', me);
      },
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            var mine = me.owner.get_all_character([me.owner.hero]);
            for (var i = 0; i < mine.length; i++) {
              mine.add_state(inc(2), 'dmg', me);
              mine.add_state(inc(2), 'life', me);
              mine.current_life += 2;
            }
            end_spell(me);
          }
        );
      }
    },
    'Pit Snake': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.attacker == me && e.victim.card_data.type == 'minion') {
                me.owner.instant_kill(me, e.victim);
              }
            }, 'take_dmg', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Tomb Pillager': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card == me) {
                me.owner.hand_card('The Coin');
              }
            }, 'deathrattle', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Unearthed Raptor': {
      on_play: function(me, bc, user_play, at) {
        if (user_play) {
          me.owner.select_one(me,
            function(c) {
              if (c.card_data.type == 'minion' && c.owner == me.owner) return true;
            },
            function() {
              me.owner.play_success(me, at, function(me, non_bc, bc) {
                if (bc && me.target) {
                  // Find target's deathrattle
                  var arr = me.owner.g_handler.event_handler_arr['deathrattle'];
                  var len = arr.length;
                  for (var i = 0; i < len; i++) {
                    if (arr[i].me == me.target || arr[i].target == me.target) {
                      // Copy this Deathrattle
                      me.owner.g_handler.add_handler(
                        arr[i].f,
                        'deathrattle',
                        arr[i].me == me.target ? me : arr[i].me,
                        false,
                        false,
                        arr[i].target == me.target ? me : arr[i].target);
                    }
                  }
                }
                end(me, non_bc, bc);
              });
            },
            function() {},
            false
          );
        }
        else {
          me.owner.play_success(me, at, function(me, non_bc, bc) {
            end(me, non_bc, bc);
          });
        }
      }
    },
    'Sacred Trial': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card.card_data.type == 'minion' && me.owner.enemy.field.num_card() >= 4 &&
                me.owner.engine.current_player != me.owner) {
                me.owner.instant_kill(me, e.card);
                me.status = 'destroyed';
              }
            }, 'after_play', me, true);
            end_spell(me);
          }
        );
      }
    },
    'Keeper of Uldaman': {
      on_play: function(me, bc, user_play, at) {
        if (user_play) {
          me.owner.select_one(me,
            function(c) {
              if (c.card_data.type == 'minion') return true;
            },
            function() {
              me.owner.play_success(me, at, function(me, non_bc, bc) {
                if (bc && me.target) {
                  me.target.add_state(function() {
                    return 3;
                  }, 'dmg', me);
                  me.target.add_state(function() {
                    return 3;
                  }, 'life', me);
                  me.target.current_life = 3;
                }
                end(me, non_bc, bc);
              });
            },
            function() {},
            false
          );
        }
        else {
          me.owner.play_success(me, at, function(me, non_bc, bc) {
            end(me, non_bc, bc);
          });
        }
      }
    },
    'Anyfin Can Happen': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            var old = me.owner.g_handler.legacy_queue.length;
            var dead_murloc = [];
            for (var i = 0; i < old.length; i++) {
              if (old[i].event_type == 'destroyed' && old[i].destroyed.card_data.kind == 'murloc') {
                dead_murloc.push(old[i].destroyed.card_data.unique);
              }
            }
            var lucky = rand(dead_murloc, 7);
            for (var i = 0; i < lucky.length; i++) me.owner.summon_card(lucky[i], 10);
            end_spell(me);
          }
        );
      }
    },
    'Sacred Trial': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.who == me.owner.enemy &&
                me.owner.engine.current_player != me.owner) {
                var target = me.owner.enemy.get_all_character();
                me.owner.deal_dmg(me.spell_dmg(5), me, rand(target));
                me.status = 'destroyed';
              }
            }, 'inspire', me, true);
            end_spell(me);
          }
        );
      }
    },
    'Desert Camel': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            var mine = me.owner.deck.search_deck(function(x) {
              if (x.card_data.mana == 1) return true;
            });
            var ene = me.owner.enemy.deck.search_deck(function(x) {
              if (x.card_data.mana == 1) return true;
            });

            if (mine.length) mine = rand(mine);
            else mine = null;

            if (ene.length) ene = rand(ene);
            else ene = null;

            if (mine) {
              me.owner.deck.remove_card(mine);
              me.owner.summon_card(mine.card_data.unique, 10);
            }
            if (ene) {
              me.owner.enemy.deck.remove_card(ene);
              me.owner.enemy.summon_card(ene.card_data.unique, 10);
            }
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Explorer\'s Hat': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type === 'minion') return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  me.target.add_state(inc(1), 'dmg', me);
                  me.target.add_state(inc(1), 'life', me);
                  me.target.current_life += 1;
                  me.owner.engine.g_handler.add_handler(function(e, me, target) {
                    if (e.card == target) {
                      me.owner.hand_card('Explorer\'s Hat', 1);
                    }
                  }, 'deathrattle', me, false, false, me.target);
                }
                end_spell(me);
              }
            );
          },
          nothing, // on select failure
          forced_target, // if forced_target is enabled then we don't make user to choose
          random_target); // if random_target is enabled then Engine Randomly Selects Available Target
      }
    },
    'Raven Idol': {
      on_play: function(me, forced_target, random_target, forced_choose, random_choose) {
        me.owner.choose_one(me, ['LOE_115a', 'LOE_115b'],
          function choose_success(choice, me, forced_target, random_target) {
            console.log('Your CHOICE :: ', choice);
            if (choice == 0) {
              me.owner.play_success(me, -1,
                function(me) {
                  var avail_list = rand(me.owner.engine.find_card_cond(function(c) {
                    if (c.type == 'minion' && !c.is_token) return true;
                  }), 3);

                  me.owner.choose_one(me, get_unique(avail_list),
                    function(choice) {
                      me.owner.hand_card(avail_list[choice].unique);
                      end_spell(me);
                    },
                    nothing,
                    true,
                    false,
                    false,
                    null,
                    null);
                });
            }
            else if (choice == 1) {
              me.owner.play_success(me, -1,
                function(me) {
                  var avail_list = rand(me.owner.engine.find_card_cond(function(c) {
                    if (c.type == 'spell' && !c.is_token) return true;
                  }), 3);

                  me.owner.choose_one(me, get_unique(avail_list),
                    function(choice) {
                      me.owner.hand_card(avail_list[choice].unique);
                      end_spell(me);
                    },
                    nothing,
                    true,
                    false,
                    false,
                    null,
                    null);
                });
            }
            // This choice is only for Fandral Staghelm 
            else if (choice == 2) {
              me.owner.play_success(me, -1,
                function(me) {
                  var avail_list = rand(me.owner.engine.find_card_cond(function(c) {
                    if (c.type == 'spell' && !c.is_token) return true;
                  }), 3);

                  me.owner.choose_one(me, get_unique(avail_list),
                    function(choice) {
                      me.owner.hand_card(avail_list[choice].unique);
                      end_spell(me);
                    },
                    nothing,
                    true,
                    false,
                    false,
                    null,
                    null);

                  var avail_list2 = rand(me.owner.engine.find_card_cond(function(c) {
                    if (c.type == 'minion' && !c.is_token) return true;
                  }), 3);
                  me.owner.choose_one(me, get_unique(avail_list2),
                    function(choice) {
                      me.owner.hand_card(avail_list2[choice].unique);
                    },
                    nothing,
                    true,
                    false,
                    false,
                    null,
                    null);
                });
            }
          },
          nothing,
          false,
          forced_choose, random_choose, forced_target, random_target);
      }
    },
    'Jungle Moonkin': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.engine.add_aura(function(d, c, me) {
              return d + 2;
            }, 'spell_dmg', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Curse of Rafaam': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            me.owner.enemy.hand_card('Cursed!', 1);
            end_spell(me);
          }
        );
      }
    },
    'Cursed!': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            end_spell(me);
          }
        );
      },
      on_draw: function(me) {
        me.owner.g_handler.add_handler(function(e, me) {
          if (e.who == me.owner && me.staus == 'hand') {
            me.owner.deal_dmg(me.spell_dmg(2), me, me.owner.hero);
          }
        }, 'turn_begin', me);
      }
    },
    'Dark Peddler': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            var avail_list = rand(me.owner.engine.find_card_cond(function(c) {
              if (c.mana == 1 && c.type == 'minion' && !c.is_token) return true;
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
    'Reliquary Seeker': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            if (me.owner.field.num_card() == 7) {
              me.state.add_state(inc(4), 'dmg', me);
              me.state.add_state(inc(4), 'life', me);
              me.current_life += 4;
            }
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Forgotten Torch': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function() {
            return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                me.owner.deal_dmg(me.spell_dmg(3), me, me.target);
                me.owner.put_card_to_deck(me, 'Roaring Torch');
                end_spell(me);
              }
            );
          },
          nothing, // on select failure
          forced_target, // if forced_target is enabled then we don't make user to choose
          random_target); // if random_target is enabled then Engine Randomly Selects Available Target
      }
    },
    'Roaring Torch': {
      on_play: function(me, forced_target, random_target) {
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
          forced_target, // if forced_target is enabled then we don't make user to choose
          random_target); // if random_target is enabled then Engine Randomly Selects Available Target
      }
    },
    'Ethereal Conjurer': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            var avail_list = rand(me.owner.engine.find_card_cond(function(c) {
              if (c.type == 'spell' && !c.is_token && c.job == me.owner.hero.card_data.job) return true;
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
    'Animated Armor': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.victim == me.owner.hero) {
                // Now current hero becomes invincible so that victims' given dmg is 0
                e.attacker.dmg_given = 1;
              }
            }, 'pre_dmg', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Museum Curator': {
      on_play: function(me, bc, user_play, at) {
        function chk_deathrattle(arr) {
          if (arr) {
            for (var i = 0; i < arr.length; i++) {
              if (arr[i] == 'deathrattle') return true;
            }
          }
        }
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            var avail_list = rand(me.owner.engine.find_card_cond(function(c) {
              if (c.type == 'minion' && chk_deathrattle(c.mech) && !c.is_token) return true;
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
    'Entomb': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if(c.card_data.type == 'minion' && c.owner != me.owner) return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if(me.target) {
                  me.owner.enemy.field.remove_card(me.target);
                  me.target.status = 'destroyed';
                  me.owner.put_card_to_deck(me, me.target.card_data.unique);
                }
                end_spell(me);
              }
            );
          },
          nothing, // on select failure
          forced_target, // if forced_target is enabled then we don't make user to choose
          random_target); // if random_target is enabled then Engine Randomly Selects Available Target
      }
    },
    'Excavated Evil': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            var target = me.owner.get_all_character([me.owner.hero])
              .concat(me.owner.enemy.get_all_character([me.owner.enemy.hero]));

            var dmg = [];
            for (var i = 0; i < target.length; i++) {
              dmg.push(me.spell_dmg(3));
            }
            me.owner.deal_dmg_many(dmg, me, target);
            me.owner.enemy.hand_card('Excavated Evil', 1);
            end_spell(me);
          }
        );
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
