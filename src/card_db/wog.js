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
    'Tentacle of N\'Zoth': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card == me) {
                var target = me.owner.get_all_character([me.owner.hero])
                  .concat(me.owner.enemy.get_all_character([me.owner.enemy.hero]));

                var dmg = [];
                for (var i = 0; i < target.length; i++) {
                  dmg.push(1);
                }
                me.owner.deal_dmg_many(dmg, me, target);
              }
            }, 'deathrattle', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Zealous Initiate': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card == me) {
                var target = me.owner.get_all_character([me.owner.hero]);

                if (target.length) {
                  var lucky = rand(target);
                  lucky.add_state(inc(1), 'dmg', me);
                  lucky.add_state(inc(1), 'life', me);
                  lucky.current_life += 1;
                }
              }
            }, 'deathrattle', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Twisted Worgen': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.is_stealth.until = 1000;
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Vilefin Tidehunter': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            me.owner.summon_card('Ooze', at + 1);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Ooze': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.add_state(null, 'taunt', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Beckoner of Evil': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            me.owner.give_cthun_buff(2, 2);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Duskboar': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Twilight Geomancer': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(owner) {
              return function(e, me) {
                if (e.card.owner == owner && e.card.card_data.name == 'C\'Thun') {
                  e.card.add_state(null, 'taunt', me);
                }
              };
            }(me.owner), 'draw_card', me, false, true);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Brood of N\'Zoth ': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card == me) {
                var target = me.owner.get_all_character([me.owner.hero]);
                for (var i = 0; i < target.length; i++) {
                  target[i].add_state(inc(1), 'dmg', me);
                  target[i].add_state(inc(1), 'life', me);
                  target[i].current_life += 1;
                }
              }
            }, 'deathrattle', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Squirming Tentacle': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.add_state(null, 'taunt', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Am\'gam Rager': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Twilight Elder': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.who == me.owner) {
                me.owner.give_cthun_buff(1, 1);
              }
            }, 'turn_end', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Infested Tauren': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card == me) {
                me.owner.summon_card('Slime', me.last_position);
              }
            }, 'deathrattle', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Slime': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.add_state(null, 'taunt', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Aberrant Berserker': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.add_state(function(d, me) {
              if (me.life() != me.current_life) return d + 2;
              return d;
            }, 'dmg', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Polluted Hoarder': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card == me) {
                me.owner.draw_cards(1);
              }
            }, 'deathrattle', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Evolved Kobold': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.engine.add_aura(function(d, c, me) {
              if (c.owner == me.owner) return d + 2;
              return d;
            }, 'spell_dmg', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'C\'Thun\'s Chosen': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            me.owner.give_cthun_buff(2, 2);
          }
          if (non_bc) {
            me.is_shielded.until = 1000;
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Psych-o-Tron': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.is_shielded.until = 1000;
            me.add_state(null, 'taunt', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Cult Apothecary': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            me.owner.heal(me.owner.enemy.field.num_card(), me, me.owner.hero);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Nerubian Prophet': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      },
      on_draw: function(me) {
        me.owner.g_handler.add_handler(function(e, me) {
          if (e.who == me.owner) {
            me.add_state(inc(-1), 'mana', me);
          }
        }, 'turn_begin', me);
      }
    },
    'Grotesque Dragonhawk': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) me.add_state(function() {
            return 2;
          }, 'atk_num', me);
          end(me, non_bc, bc);
        });
      }
    },
    'Bog Creeper': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.add_state(null, 'taunt', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Eldritch Horror': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Faceless Behemoth': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Silithid Swarmer': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.add_state(function(d, c) {
              var arr = me.owner.g_handler.search_legacy_queue(function(e) {
                if (e.event_type == 'attack' && e.who == me.owner.hero) return true;
              }, me.owner.engine.current_turn);

              if (arr.length >= 2) return 1;
              return 0;
            }, 'atk_num', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Disciple of C\'Thun': {
      on_play: function(me, bc, user_play, at) {
        if (user_play) {
          me.owner.select_one(me,
            function(c) {
              return true;
            },
            function() {
              me.owner.play_success(me, at, function(me, non_bc, bc) {
                if (bc && me.target) {
                  me.owner.give_cthun_buff(2, 2);
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
    'Blackwater Pirate': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.engine.add_aura(function(m, c, me) {
              if (c.card_data.type == 'weapon' && c.owner == me.owner) return m - 2;
              return m;
            }, 'mana', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Eater of Secrets': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            me.add_state(inc(me.owner.enemy.secret_list.length), 'dmg', me);
            me.add_state(inc(me.owner.enemy.secret_list.length), 'life', me);
            me.current_life += me.owner.enemy.secret_list.length;

            for (var i = 0; i < me.owner.enemy.secret_list.length; i++) {
              me.owner.enemy.secret_list[i].status = 'destroyed';
            }
            me.owner.enemy.secret_list = [];
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Midnight Drake': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            me.add_state(inc(me.owner.hand.num_card()), 'dmg', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Corrupted Healbot': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card == me) {
                me.owner.heal(8, me, me.owner.enemy.hero);
              }
            }, 'deathrattle', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Skeram Cultist': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            me.owner.give_cthun_buff(2, 2);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Corrupted Seer': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            var target = me.owner.get_all_character([me.owner.hero], function(c) {
                if (c.card_data.kind != 'murloc') return true;
              })
              .concat(me.owner.enemy.get_all_character([me.owner.enemy.hero], function(c) {
                if (c.card_data.kind != 'murloc') return true;
              }));

            var dmg = [];
            for (var i = 0; i < target.length; i++) {
              dmg.push(2);
            }
            me.owner.deal_dmg_many(dmg, me, target);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Doomcaller': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            me.owner.give_cthun_buff(2, 2);

            var arr = me.owner.g_handler.search_legacy_queue(function(e) {
              if (e.event_type == 'destroyed' && e.destroyed.card_data.name == 'C\'Thun' &&
                e.destroyed.owner == me.owner) {
                return true;
              }
            });
            if (arr.length) {
              me.owner.put_card_to_deck(me, 'C\'Thun');
            }
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Cyclopian Horror': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            me.add_state(inc(me.owner.enemy.field.num_card()), 'life', me);
            me.current_life += me.owner.enemy.field.num_card();
          }
          if (non_bc) {
            me.add_state(null, 'taunt', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Faceless Shambler': {
      on_play: function(me, bc, user_play, at) {
        if (user_play) {
          me.owner.select_one(me,
            function(c) {
              if (c.card_data.type == 'minion' && c.owner == me.owner) return true;
            },
            function() {
              me.owner.play_success(me, at, function(me, non_bc, bc) {
                if (bc && me.target) {
                  var life = me.target.current_life;
                  var dmg = me.target.dmg();

                  me.add_state(function() {
                    return life;
                  }, 'life', me);
                  me.current_life = life;

                  me.add_state(function() {
                    return dmg;
                  }, 'dmg', me);
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
    'Twilight Summoner': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card == me) {
                me.owner.summon_card('Faceless Destroyer', me.last_position);
              }
            }, 'deathrattle', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Faceless Destroyer': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Validated Doomsayer': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.who == me.owner) {
                me.add_state(function() {
                  return 7;
                }, 'dmg', me);
              }
            }, 'turn_begin', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Crazed Worshiper': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.victim == me) {
                me.owner.give_cthun_buff(1, 1);
              }
            }, 'take_dmg', me, false);

            me.add_state(null, 'taunt', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Darkspeaker': {
      on_play: function(me, bc, user_play, at) {
        if (user_play) {
          me.owner.select_one(me,
            function(c) {
              if (c.card_data.type == 'minion' && c.owner == me.owner) return true;
            },
            function() {
              me.owner.play_success(me, at, function(me, non_bc, bc) {
                if (bc && me.target) {
                  var my_life = me.current_life;
                  var target_life = me.target.current_life;

                  var my_dmg = me.dmg();
                  var target_dmg = me.target.dmg();

                  me.add_state(function() {
                    return target_life;
                  }, 'life', me);
                  me.current_life = target_life;

                  me.target.add_state(function() {
                    return my_life;
                  }, 'life', me);
                  me.target.currentTarget = my_life;

                  me.add_state(function() {
                    return target_life;
                  }, 'dmg', me);
                  me.target.add_state(function() {
                    return my_dmg;
                  }, 'dmg', me);
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
    'Ancient Harbinger': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.who == me.owner) {
                var arr = me.owner.deck.search_deck(function(c) {
                  if (c.card_data.mana == 10) return true;
                });

                if (arr.length) {
                  var lucky = rand(arr);
                  me.owner.hand_card(lucky.card_data.unique);
                  me.owner.deck.remove_card(lucky);
                }
              }
            }, 'turn_begin', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Scaled Nightmare': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.who == me.owner) {
                me.add_state(function(d) {
                  return d * 2;
                }, 'dmg', me);
              }
            }, 'turn_begin', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Blood of the Ancient One': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.who == me.owner) {
                var mine = me.owner.get_all_character([], function(c) {
                  if (c.card_data.name == 'Blood of the Ancient One') return true;
                });

                if (mine.length >= 2) {
                  me.owner.instant_kill(me, mine[0]);
                  me.owner.instant_kill(me, mine[1]);

                  me.owner.summon_card('The Ancient One', 10);
                }
              }
            }, 'turn_end', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'The Ancient One': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Shifter Zerus': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      },
      on_draw: function(me) {
        me.owner.g_handler.add_handler(function(e, me) {
          if (e.who == me.owner) {
            for (var i = 0; i < me.owner.hand.num_card(); i++) {
              if (me.owner.hand.card_list[i].id == me.id) {
                var lucky = rand(me.owner.engine.find_card_cond(function(c) {
                  if (c.type == 'minion' && !c.is_token) return true;
                }));

                console.log('Zerus change ', me.owner.hand.card_list[i].card_data.name, ' -> ', lucky.name);
                me.owner.shift_card_hand(me.owner.hand.card_list[i], lucky.unique);
                break;
              }
            }
          }
        }, 'turn_begin', me);
      }
    },
    'Nat, the Darkfisher': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.who == me.owner.enemy) {
                if (chance(0.5)) me.owner.enemy.draw_cards(1);
              }
            }, 'turn_begin', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Mukla, Tyrant of the Vale': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            me.owner.hand_card('Bananas', 2);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Twin Emperor Vek\'lor': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            if (me.owner.cthun_dmg_buff >= 4) {
              me.owner.summon_card('Twin Emperor Vek\'nilash', at + 1);
            }
          }
          if (non_bc) {
            me.add_state(null, 'taunt', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Twin Emperor Vek\'nilash': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.add_state(null, 'taunt', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Hogger, The Doom of Elwynn': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.victim == me) {
                var pos = me.owner.hand.get_pos(me);
                me.owner.summon_card('Gnoll', pos + 1);
              }
            }, 'take_dmg', me, false);

            me.add_state(null, 'taunt', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Gnoll': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.add_state(null, 'taunt', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'The Boogeymonster': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.attacker == me && me.is_attacking) {
                me.add_state(inc(2), 'dmg', me);
                me.add_state(inc(2), 'life', me);
                me.current_life += 2;
              }
            }, 'destroyed', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Soggoth the Slitherer': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.is_not_target.until = 1000;
            me.add_state(null, 'taunt', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Deathwing, Dragonlord': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card == me) {
                for (var i = 0; i < me.owner.hand.num_card(); i++) {
                  var c = me.owner.hand.card_list[i];
                  if (c.card_data.kind == 'dragon') {
                    me.owner.hand.remove_card(c);
                    me.owner.summon_card(c.card_data.unique, 10);
                  }
                }
              }
            }, 'deathrattle', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'N\'Zoth, the Corruptor': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            var dead = me.owner.g_handler.search_legacy_queue(function(e) {
              if (e.event_type == 'destroyed' && e.destroyed.owner == me.owner && e.destroyed.chk_mech('deathrattle')) {
                return true;
              }
            });
            if (dead.length) {
              var lucky = rand(dead, 7 - me.owner.field.num_card());
              for (var i = 0; i < lucky.length; i++) {
                me.owner.summon_card(lucky[i].card_data.unique, 10);
              }
            }
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Y\'Shaarj, Rage Unbound': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.who == me.owner) {
                var mine = me.owner.hand.search_deck(function(c) {
                  if (c.card_data.type == 'minion') return true;
                });
                if (mine.length) {
                  var lucky = rand(mine);
                  me.owner.hand.remove_card(lucky);
                  me.owner.summon_card(lucky.card_data.unique, me.owner.field.get_pos(me) + 1);
                }
              }
            }, 'turn_end', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'C\'Thun': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.add_state(inc(me.owner.cthun_dmg_buff), 'dmg', me);
            me.add_state(inc(me.owner.cthun_life_buff), 'life', me);
            me.current_life += me.owner.cthun_life_buff;
          }
          if (bc) {
            me.owner.deal_multiple_dmg(me.dmg(), me, function() {
              return me.owner.enemy.get_all_character([], function(c) {
                if (c.current_life > 0) return true;
              });
            });
          }
          end(me, non_bc, bc);
        });
      }
    },
    'N\'Zoth\'s First Mate': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            me.owner.summon_card('Rusty Hook', 1);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Rusty Hook': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Ravaging Ghoul': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            var target = me.owner.get_all_character([me.owner.hero])
              .concat(me.owner.enemy.get_all_character([me.owner.enemy.hero]));

            var dmg = [];
            for (var i = 0; i < target.length; i++) {
              dmg.push(1);
            }
            me.owner.deal_dmg_many(dmg, me, target);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Bloodhoof Brave': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.add_state(function(d, me) {
              if (me.life() != me.current_life) return d + 3;
              return d;
            }, 'dmg', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Blood to Ichor': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type == 'minion') return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  spell_next_step(me, function(me) {
                    if (me.target.current_life > 0) me.owner.summon_card('OG_202c');
                    end_spell(me);
                  });
                  me.owner.deal_dmg(me.spell_dmg(1), me, me.target);
                }
                else end_spell(me);
              }
            );
          },
          nothing, // on select failure
          forced_target, // if forced_target is enabled then we don't make user to choose
          random_target); // if random_target is enabled then Engine Randomly Selects Available Target
      }
    },
    'OG_202c': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Bloodsail Cultist': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            var mine = me.owner.field.search_deck(function(c) {
              if (c.card_data.kind == 'pirate') return true;
            });
            if (mine.length) {
              if (me.owner.weapon) {
                me.owner.weapon.add_state(inc(1), 'dmg', me);
                me.owner.weapon.add_state(inc(1), 'life', me);
                me.owner.weapon.current_life += 1;
              }
            }
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Ancient Shieldbearer': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc && me.owner.cthun_dmg_buff >= 4) {
            me.owner.add_armor(10, me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Blood Warriors': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            var mine = me.owner.field.search_deck(function(c) {
              if (c.life() != c.current_life) return true;
            });

            for (var i = 0; i < mine.length; i++) {
              me.owner.hand_card(mine[i].card_data.unique, 1);
            }
            end_spell(me);
          }
        );
      }
    },
    'Tentacles for Arms': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card == me) me.owner.hand_card('Tentacles for Arms', 1);
            }, 'deathrattle', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Malkorok': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            var lucky = rand(me.owner.engine.find_card_cond(function(c) {
              if (c.type == 'weapon' && !c.is_token) return true;
            }));

            me.owner.summon_card(lucky.unique, 1);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Primal Fusion': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type == 'minion') return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  var cnt = me.owner.field.search_deck(function(c) {
                    if (c.card_data.kind == 'totem') return true;
                  }).length;

                  me.target.add_state(inc(cnt), 'dmg', me);
                  me.target.add_state(inc(cnt), 'life', me);
                  me.target.current_life += cnt;
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
    'Stormcrack': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type == 'minion') return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  me.owner.deal_dmg(me.spell_dmg(4), me, me.target);
                  me.owner.add_overload(1, me);
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
    'Flamewreathed Faceless': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (user_play) me.owner.add_overload(2, me);

          end(me, non_bc, bc);
        });
      }
    },
    'Evolve': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            for (var i = 0; i < me.owner.field.num_card(); i++) {
              var cost = me.owner.field.card_list[i].card_data.mana;
              var lucky = rand(me.owner.engine.find_card_cond(function(c) {
                if (c.type == 'minion' && c.mana == cost + 1 && !c.is_token) return true;
              }));
              console.log('Transform :: ', me.owner.field.card_list[i].card_data.name, ' -> ', lucky.name);
              me.owner.transform(me, me.owner.field.card_list[i], lucky.unique);
            }
            end_spell(me);
          }
        );
      }
    },
    'Master of Evolution': {
      on_play: function(me, bc, user_play, at) {
        if (user_play) {
          me.owner.select_one(me,
            function(c) {
              if (c.card_data.type == 'minion' && c.owner == me.owner) return true;
            },
            function() {
              me.owner.play_success(me, at, function(me, non_bc, bc) {
                if (bc && me.target) {
                  var cost = me.target.card_data.mana;
                  var lucky = rand(me.owner.engine.find_card_cond(function(c) {
                    if (c.type == 'minion' && c.mana == cost + 1 && !c.is_token) return true;
                  }));
                  me.owner.transform(me, me.target, lucky.unique);
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
    'Thing from Below': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) me.add_state(null, 'taunt', me);
          end(me, non_bc, bc);
        });
      },
      on_draw: function(me) {
        me.add_state(function(m, me) {
          var arr = me.owner.g_handler.search_legacy_queue(function(e) {
            if (e.event_type == 'summon' && e.card.owner == me.owner && e.card.card_data.kind == 'totem') return true;
          });
          return m - arr.length;
        }, 'mana', me);
      }
    },
    'Eternal Sentinel': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            me.owner.current_mana += me.owner.current_overload_mana;
            me.owner.current_overload_mana = 0;
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Hammer of Twilight': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card == me) {
                me.owner.summon_card('Twilight Elemental', 10);
              }
            }, 'deathrattle', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Twilight Elemental': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Hallazeal the Ascended': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.attacker.card_data.type == 'spell' && e.attacker.owner == me.owner) {
                me.owner.heal(e.dmg, me, me.owner.hero);
              }
            }, 'deal_dmg', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Bladed Cultist': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc && me.owner.turn_card_play >= 2) {
            me.add_state(inc(1), 'dmg', me);
            me.add_state(inc(1), 'life', me);
            me.current_life += 1;
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Shadow Strike': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.life() != c.current_life) return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                me.owner.deal_dmg(me.spell_dmg(5), me, me.target);
                end_spell(me);
              }
            );
          },
          nothing, // on select failure
          forced_target, // if forced_target is enabled then we don't make user to choose
          random_target); // if random_target is enabled then Engine Randomly Selects Available Target
      }
    },
    'Southsea Squidface': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card == me) {
                if (me.owner.weapon) {
                  me.owner.weapon.add_state(inc(2), 'dmg', me);
                  me.owner.weapon.add_state(inc(2), 'life', me);
                  me.owner.current_life += 2;
                }
              }
            }, 'deathrattle', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Journey Below': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            function chk_deathrattle(arr) {
              if (arr) {
                for (var i = 0; i < arr.length; i++) {
                  if (arr[i] == 'deathrattle') return true;
                }
              }
            }
            var avail_list = rand(me.owner.engine.find_card_cond(function(c) {
              if (chk_deathrattle(c.mech) && !c.is_token) return true;
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
          }
        );
      }
    },
    'Undercity Huckster': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card == me) {
                var lucky = rand(me.owner.engine.find_card_cond(function(c) {
                  if (c.job == me.owner.job && !c.is_token) return true;
                }));
                me.owner.hand_card(lucky.card_data.unique, 1);
              }
            }, 'deathrattle', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Thistle Tea': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            me.owner.draw_cards(1, function(c) {
              me.owner.hand_card(c.card_data.unique, 2);
            });
            end_spell(me);
          }
        );
      }
    },
    'Shadowcaster': {
      on_play: function(me, bc, user_play, at) {
        if (user_play) {
          me.owner.select_one(me,
            function(c) {
              if (c.card_data.type == 'minion' && c.owner == me.owner) return true;
            },
            function() {
              me.owner.play_success(me, at, function(me, non_bc, bc) {
                if (bc && me.target) {
                  me.owner.hand_card(me.target.card_data.unique, 1, function(c) {
                    c.add_state(function() {
                      return 1;
                    }, 'dmg', me);
                    c.add_state(function() {
                      return 1;
                    }, 'mana', me);
                    c.add_state(function() {
                      return 1;
                    }, 'life', me);
                    c.current_life = 1;
                  })
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
    'Blade of C\'Thun': {
      on_play: function(me, bc, user_play, at) {
        if (user_play) {
          me.owner.select_one(me,
            function(c) {
              if (c.card_data.type == 'minion') return true;
            },
            function() {
              me.owner.play_success(me, at, function(me, non_bc, bc) {
                if (bc && me.target) {
                  me.owner.give_cthun_buff(me.target.dmg(), me.target.current_life);
                  me.owner.instant_kill(me, me.target);
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
    'Bloodthistle Toxin': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type == 'minion' && c.owner == me.owner) return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  me.owner.return_to_hand(me.target, me, function(c) {
                    c.add_state(inc(-2), 'mana', me);
                  });
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
    'Briarthorn Toxin': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type == 'minion' && c.owner == me.owner) return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  me.target.add_state(inc(3), 'dmg', me);
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
    'Fadeleaf Toxin': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type == 'minion' && c.owner == me.owner) return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  me.target.is_stealth.until = me.owner.engine.current_turn + 1;
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
    'Firebloom Toxin': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  me.owner.deal_dmg(me.spell_dmg(2), me, me.target);
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
    'Kingsblood Toxin': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            me.owner.draw_cards(1);
            end_spell(me);
          }
        );
      }
    },
    'Xaril, Poisoned Mind': {
      on_play: function(me, bc, user_play, at) {
        var list = ['Bloodthistle Toxin', 'Briarthorn Toxin', 'Fadeleaf Toxin', 'Firebloom Toxin', 'Kingsblood Toxin'];
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card == me) {
                me.owner.hand_card(rand(list), 1);
              }
            }, 'deathrattle', me);
          }
          if (bc) {
            me.owner.hand_card(rand(list), 1);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Divine Strength': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type == 'minion') return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  me.target.add_state(inc(1), 'dmg', me);
                  me.target.add_state(inc(2), 'life', me);
                  me.target.current_life += 2;
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
    'A Light in the Darkness': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            var avail_list = rand(me.owner.engine.find_card_cond(function(c) {
              if (c.type == 'minion' && !c.is_token) return true;
            }), 3);

            me.owner.choose_one(me, get_unique(avail_list),
              function(choice) {
                me.owner.hand_card(avail_list[choice].unique, 1, function(c) {
                  c.add_state(inc(1), 'dmg', me);
                  c.add_state(inc(1), 'life', me);
                  c.current_life += 1;

                  end_spell(me);
                });
              },
              nothing,
              true,
              false,
              false,
              null,
              null);
          }
        );
      }
    },
    'Stand Against Darkness': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            me.owner.summon_card('Silver Hand Recruit', 10);
            me.owner.summon_card('Silver Hand Recruit', 10);
            me.owner.summon_card('Silver Hand Recruit', 10);
            me.owner.summon_card('Silver Hand Recruit', 10);
            me.owner.summon_card('Silver Hand Recruit', 10);
            end_spell(me);
          }
        );
      }
    },
    'Selfless Hero': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card == me) {
                var target = me.owner.get_all_character([me.owner.hero]);
                if (target.length) {
                  var lucky = rand(target.length);
                  lucky.is_stealth.until = 1000;
                }
              }
            }, 'deathrattle', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Steward of Darkshire': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card.owner == me.owner && e.card.card_data.type == 'minion' && e.card.card_data.life == 1) {
                e.card.is_stealth.until = 1000;
              }
            }, 'summon', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Rallying Blade': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            var mine = me.owner.get_all_character([me.owner.hero]);
            for (var i = 0; i < mine.length; i++) {
              if (mine[i].shield()) {
                mine[i].add_state(inc(1), 'dmg', me);
                mine[i].add_state(inc(1), 'life', me);
                mine[i].current_life += 1;
              }
            }
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Forbidden Healing': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  var c = me.owner.current_mana;
                  me.owner.heal(2 * c, me, me.target);
                  me.owner.current_mana = 0;
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
    'Ragnaros, Lightlord': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.who == me.owner) {
                var target = me.owner.get_all_character([], function(c) {
                  if (c.current_life != c.life()) return true;
                });
                if (target.length) {
                  me.owner.heal(8, me, rand(target));
                }
              }
            }, 'turn_end', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'On the Hunt': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  me.owner.deal_dmg(me.spell_dmg(1), me, me.target);
                  me.owner.summon_card('Mastiff', 10);
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
    'Mastiff': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Fiery Bat': {
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
    'Carrion Grub': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Infest': { // Todo :: CHK
      on_play: function(me) {
        me.owner.play_success(me, -1, function(me, non_bc, bc) {
          var target = me.owner.get_all_character([me.owner.hero]);

          for (var i = 0; i < target.length; i++) {
            me.owner.engine.g_handler.add_handler(function(e, me, target) {
              if (e.card == target) {
                var lucky = rand(me.owner.engine.find_card_cond(function(c) {
                  if (c.type == 'minion' && c.kind == 'beast' && !c.is_token) return true;
                }));
                me.owner.hand_card(lucky.unique, 1);
              }
            }, 'deathrattle', me, false, false, target[i]);
          }
          end_spell(me);
        });
      }
    },
    'Forlorn Stalker': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            for (var i = 0; i < me.owner.hand.num_card(); i++) {
              if (me.owner.hand.card_list[i].chk_mech('deathrattle')) {
                me.owner.hand.card_list[i].add_state(inc(1), 'dmg', me);
                me.owner.hand.card_list[i].add_state(inc(1), 'life', me);
                me.owner.hand.card_list[i].current_life += 1;
              }
            }
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Infested Wolf': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card == me) {
                me.owner.summon_card('Spider', me.last_position);
                me.owner.summon_card('Spider', me.last_position);
              }
            }, 'deathrattle', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Spider': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Giant Sandworm': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.attacker == me && me.is_attacking) {
                me.atk_info.did--;
              }
            }, 'destroyed', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Call of the Wild': {
      on_play: function(me) {
        me.owner.play_success(me, -1, function(me, non_bc, bc) {
          me.owner.summon_card('Huffer', 10);
          me.owner.summon_card('Leokk', 10);
          me.owner.summon_card('Misha', 10);
          end_spell(me);
        });
      }
    },
    'Princess Huhuran': {
      on_play: function(me, bc, user_play, at) {
        if (user_play) {
          me.owner.select_one(me,
            function(c) {
              if (c.card_data.type == 'minion' && c.owner == me.owner) return true;
            },
            function() {
              me.owner.play_success(me, at, function(me, non_bc, bc) {
                if (bc && me.target) {
                  me.owner.g_handler.force_add_deathrattle_event(me.target);
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
    'Mark of Y\'shaarj': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type == 'minion') return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  me.target.add_state(inc(2), 'dmg', me);
                  me.target.add_state(inc(2), 'life', me);
                  me.target.current_life += 2;

                  if (me.target.card_data.kind == 'beast') me.owner.draw_cards(1);
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
    'Feral Rage': {
      on_play: function(me, forced_target, random_target, forced_choose, random_choose) {
        me.owner.choose_one(me, ['Evolve Spines', 'Evolve Scales'],
          function choose_success(choice, me, forced_target, random_target) {
            console.log('Your CHOICE :: ', choice);
            if (choice == 0) {
              me.owner.play_success(me, -1, function(me, non_bc, bc) {
                me.owner.add_hero_dmg(4);
                end_spell(me);
              });
            }
            else if (choice == 1) {
              me.owner.play_success(me, -1, function(me, non_bc, bc) {
                me.owner.add_armor(8, me);
                end_spell(me);
              });
            }
            // This choice is only for Fandral Staghelm 
            else if (choice == 2) {
              me.owner.play_success(me, -1, function(me, non_bc, bc) {
                me.owner.add_hero_dmg(4);
                me.owner.add_armor(8, me);
                end_spell(me);
              });
            }
          },
          nothing,
          false,
          forced_choose, random_choose, forced_target, random_target);
      }
    },
    'Dark Arakkoa': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.add_state(null, 'taunt', me);
          }
          if (bc) {
            me.owner.give_cthun_buff(3, 3);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Addled Grizzly': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card.card_data.type == 'minion' && e.card.owner == me.owner) {
                e.card.add_state(inc(1), 'dmg', me);
                e.card.add_state(inc(1), 'life', me);
                e.card.current_life += 1;
              }
            }, 'summon', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Mire Keeper': {
      on_play: function(me, bc, user_play, at, forced_choose) {
        if (user_play) {
          me.owner.choose_one(me, ['Yogg-Saron\'s Magic', 'Y\'Shaarj\'s Strength'], function(me, at) {
              return function(choice) {
                if (choice == 0) {
                  me.owner.play_success(me, at, function(me, non_bc, bc) {
                    if (non_bc) {
                      me.owner.boosted_mana += 1;
                    }
                    end(me, non_bc, bc);
                  });
                }
                else if (choice == 1) {
                  me.owner.play_success(me, at, function(me, non_bc, bc) {
                    if (non_bc) {
                      me.owner.summon_card('Slime', at + 1);
                    }
                    end(me, non_bc, bc);
                  });
                }
                else if (choice == 2) {
                  me.owner.play_success(me, at, function(me, non_bc, bc) {
                    if (non_bc) {
                      me.owner.summon_card('Slime', at + 1);
                      me.owner.boosted_mana += 1;
                    }
                    end(me, non_bc, bc);
                  });
                }
              };
            }(me, at),
            nothing,
            false,
            forced_choose);
        }
        else {
          me.owner.play_success(me, at, function(me, non_bc, bc) {
            end(me, non_bc, bc);
          });
        }
      }
    },
    'Klaxxi Amber-Weaver': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            if (me.owner.cthun_dmg_buff >= 4) {
              me.add_state(inc(5), 'life', me);
              me.current_life += 5;
            }
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Forbidden Ancient': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            var m = me.owner.current_mana;
            me.add_state(inc(m), 'dmg', me);
            me.add_state(inc(m), 'life', me);
            me.current_life += m;

            me.owner.current_mana = 0;
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Wisps of the Old Gods': {
      on_play: function(me, forced_target, random_target, forced_choose, random_choose) {
        me.owner.choose_one(me, ['Many Wisps', 'Big Wisps'],
          function choose_success(choice, me, forced_target, random_target) {
            console.log('Your CHOICE :: ', choice);
            if (choice == 0) {
              me.owner.play_success(me, -1, function(me, non_bc, bc) {
                me.owner.summon_card('OG_195c', 10);
                me.owner.summon_card('OG_195c', 10);
                me.owner.summon_card('OG_195c', 10);
                me.owner.summon_card('OG_195c', 10);
                me.owner.summon_card('OG_195c', 10);
                me.owner.summon_card('OG_195c', 10);
                me.owner.summon_card('OG_195c', 10);
                end_spell(me);
              });
            }
            else if (choice == 1) {
              me.owner.play_success(me, -1, function(me, non_bc, bc) {
                for (var i = 0; i < me.owner.field.num_card(); i++) {
                  me.owner.field.card_list[i].add_state(inc(2), 'dmg', me);
                  me.owner.field.card_list[i].add_state(inc(2), 'life', me);
                  me.owner.field.card_list[i].current_life += 2;
                }
                end_spell(me);
              });
            }
            // This choice is only for Fandral Staghelm 
            else if (choice == 2) {
              me.owner.play_success(me, -1, function(me, non_bc, bc) {
                me.owner.summon_card('OG_195c', 10);
                me.owner.summon_card('OG_195c', 10);
                me.owner.summon_card('OG_195c', 10);
                me.owner.summon_card('OG_195c', 10);
                me.owner.summon_card('OG_195c', 10);
                me.owner.summon_card('OG_195c', 10);
                me.owner.summon_card('OG_195c', 10, false, function() {
                  for (var i = 0; i < me.owner.field.num_card(); i++) {
                    me.owner.field.card_list[i].add_state(inc(2), 'dmg', me);
                    me.owner.field.card_list[i].add_state(inc(2), 'life', me);
                    me.owner.field.card_list[i].current_life += 2;
                  }
                });
                end_spell(me);
              });
            }
          },
          nothing,
          false,
          forced_choose, random_choose, forced_target, random_target);
      }
    },
    'Fandral Staghelm': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.engine.add_aura(null, 'fandral_staghelm', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Possessed Villager': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card == me) {
                me.owner.summon_card('Shadowbeast', me.last_position);
              }
            }, 'deathrattle', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Shadowbeast': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Darkshire Councilman': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card == me) {
                me.add_state(inc(1), 'dmg', me);
              }
            }, 'summon', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Usher of Souls': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.destroyed.owner == me.owner) {
                me.owner.give_cthun_buff(1, 1);
              }
            }, 'destroyed', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Forbidden Ritual': {
      on_play: function(me) {
        me.owner.play_success(me, -1, function(me, non_bc, bc) {
          for (var i = 0; i < me.owner.current_mana; i++) {
            me.owner.summon_card('Icky Tentacle', 10);
          }
          me.owner.current_mana = 0;
          end_spell(me);
        });
      }
    },
    'Icky Tentacle': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Darkshire Librarian': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            if (me.owner.hand.num_card()) {
              me.owner.discard_card(rand(me.owner.hand.card_list), me);
            }
          }
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card == me) {
                me.owner.draw_cards(1);
              }
            }, 'deathrattle', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Spreading Madness': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            me.owner.deal_multiple_dmg(me.spell_dmg(9), me, function() {
              var arr = me.owner.enemy.get_all_character([], function(c) {
                if (c.current_life > 0) return true;
              }).concat(me.owner.get_all_character([], function(c) {
                if (c.current_life > 0) return true;
              }));
              return arr;
            });
            end_spell(me);
          }
        );
      }
    },
    'DOOM!': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            var target = me.owner.get_all_character([me.owner.hero])
              .concat(me.owner.enemy.get_all_character([me.owner.enemy.hero]));

            me.owner.instant_kill_many(me, target);
            me.owner.draw_cards(target.length);
            end_spell(me);
          }
        );
      }
    },
    'Shatter': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type == 'minion' && c.is_frozen()) return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  me.owner.instant_kill(me, me.target);
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
    'Twilight Flamecaller': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            var target = me.owner.enemy.get_all_character([me.owner.enemy.hero]);

            var dmg = [];
            for (var i = 0; i < target.length; i++) {
              dmg.push(1);
            }
            me.owner.deal_dmg_many(dmg, me, target);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Faceless Summoner': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            var lucky = rand(me.owner.engine.find_card_cond(function(c) {
              if (c.type == 'minion' && c.mana == 3 && !c.is_token) return true;
            }));
            me.owner.summon_card(lucky.unique, at + 1);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Cult Sorcerer': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card.card_data.type == 'spell' && e.card.owner == me.owner) {
                me.owner.give_cthun_buff(1, 1);
              }
            }, 'summon', me);
            me.owner.engine.add_aura(function(d, c, me) {
              if (c.owner == me.owner) return d + 1;
              return d;
            }, 'spell_dmg', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Demented Frostcaller': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card.card_data.type == 'spell' && e.card.owner == me.owner) {
                var target = me.owner.enemy.get_all_character([], function(c) {
                  if (!c.frozen()) return true;
                });
                if (target.length) {
                  rand(target).is_frozen.until = 1000;
                }
              }
            }, 'summon', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Forbidden Flame': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type == 'minion') return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  me.owner.deal_dmg(me.spell_dmg(me.owner.current_mana), me, me.target);
                  me.owner.current_mana = 0;
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
    'Cabalist\'s Tome': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            var lucky = rand(me.owner.engine.find_card_cond(function(c) {
              if (c.type == 'spell' && c.job == 'mage' && !c.is_token) return true;
            }), 3);
            for(var i = 0; i < 3; i ++) {
              me.owner.hand_card(lucky[i].unique, 1);
            }
            end_spell(me);
          }
        );
      }
    },
    'Anomalus': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card == me) {
                var target = me.owner.get_all_character([me.owner.hero])
                  .concat(me.owner.enemy.get_all_character([me.owner.enemy.hero]));

                var dmg = [];
                for (var i = 0; i < target.length; i++) {
                  dmg.push(8);
                }
                me.owner.deal_dmg_many(dmg, me, target);
              }
            }, 'deathrattle', me);
          }
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
