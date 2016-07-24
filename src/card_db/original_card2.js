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

  // returns true in probablity of odd
  function chance(odd) {
    return Math.random() < odd;
  }

  function nothing() {}

  var card_do = {
    'Humility': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type == 'minion') return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  me.target.add_state(function() {
                    return 1;
                  }, 'dmg', me);
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
    'Hand of Protection': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type == 'minion') return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  me.target.is_shielded.until = 1000;
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
    'Light\'s Justice': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Blessing of Might': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type == 'minion') return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  me.target.add_state(inc(3), 'dmg', me)
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
    'Holy Light': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type == 'minion') return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  me.owner.heal(6, me, me.target);
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
    'Consecration': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            var target = me.owner.enemy.get_all_character();

            var dmg = [];
            for (var i = 0; i < target.length; i++) {
              dmg.push(me.spell_dmg(2));
            }
            me.owner.deal_dmg_many(dmg, me, target);
            end_spell(me);
          }
        );
      }
    },
    'Blessing of Kings': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type == 'minion') return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  me.target.add_state(inc(4), 'dmg', me);
                  me.target.add_state(inc(4), 'life', me);
                  me.target.current_life += 4;
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
    'Truesilver Champion': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.who == me.owner.hero) {
                me.owner.heal(2, me, me.owner.hero);
              }
            }, 'attack', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Hammer of Wrath': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type == 'minion') return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  me.owner.deal_dmg(me.spell_dmg(3), me, me.target);
                  me.owner.draw_cards(1);
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
    'Guardian of Kings': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            me.owner.heal(6, me, me.owner.hero);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Defender': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Noble Sacrifice': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.who.owner == me.owner.enemy && me.owner.field.num_card() < 7 &&
                me.owner.engine.current_player != me.owner) {
                me.owner.summon_card('Defender', 10, false, function(c) {
                  e.who.target = c;
                  me.status = 'destroyed';
                })
              }
            }, 'propose_attack', me, true);
            end_spell(me);
          }
        );
      }
    },
    'Redemption': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.destroyed.owner == me.owner && me.owner.field.num_card() < 7 &&
                me.owner.engine.current_player != me.owner) {
                me.owner.summon_card(e.destroyed.card_data.name, 10, false, function(c) {
                  c.add_state(function() {
                    return 1;
                  }, 'life', me);
                  c.current_life = 1;
                  me.status = 'destroyed';
                })
              }
            }, 'destroyed', me, true);
            end_spell(me);
          }
        );
      }
    },
    'Eye for an Eye': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.victim == me.owner.hero &&
                me.owner.engine.current_player != me.owner) {
                me.owner.deal_dmg(me.spell_dmg(e.dmg), me, me.owner.enemy.hero);
                me.status = 'destroyed';
              }
            }, 'take_dmg', me, true);
            end_spell(me);
          }
        );
      }
    },
    'Blessing of Wisdom': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type == 'minion') return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  me.owner.g_handler.add_handler(function(e, me, target) {
                    if (e.who == target) {
                      me.owner.draw_cards(1);
                    }
                  }, 'attack', me, false, false, me.target);
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
    'Repentance': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card.owner == me.owner.enemy && e.card.card_data.type == 'minion' &&
                me.owner.engine.current_player != me.owner) {
                e.card.add_state(function() {
                  return 1;
                }, 'life', me);
                e.card.current_life = 1;
                me.status = 'destroyed';
              }
            }, 'after_play', me, true);
            end_spell(me);
          }
        );
      }
    },
    'Argent Protector': {
      on_play: function(me, bc, user_play, at) {
        if (user_play) {
          me.owner.select_one(me,
            function(c) {
              if (c.card_data.type == 'minion') return true;
            },
            function() {
              me.owner.play_success(me, at, function(me, non_bc, bc) {
                if (bc && me.target) {
                  me.target.is_shielded.until = 1000;
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
    'Divine Favor': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            var num = me.owner.enemy.hand.num_card() - me.owner.hand.num_card();
            if (num > 0) me.owner.draw_cards(num);

            end_spell(me);
          }
        );
      }
    },
    'Equality': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            var target = me.owner.get_all_character([me.owner.hero])
              .concat(me.owner.enemy.get_all_character([me.owner.enemy.hero]));

            for (var i = 0; i < target.length; i++) {
              target[i].add_state(function() {
                return 1;
              }, 'life', me);
              target[i].current_life = 1;
            }
            end_spell(me);
          }
        );
      }
    },
    'Aldor Peacekeeper': {
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
                    return 1;
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
    'Holy Wrath': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  me.owner.draw_cards(1, function(c) {
                    if (c) me.owner.deal_dmg(me.spell_dmg(c.card_data.mana), me, me.target);
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
    'Blessed Champion': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type === 'minion') return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  me.target.add_state(function(d, c) {
                    return d * 2;
                  }, 'dmg', me);
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
    'Sword of Justice': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card.owner === me.owner && e.card.card_data.type === 'minion') {
                e.card.add_state(inc(1), 'dmg', me);
                e.card.add_state(inc(1), 'life', me);
                e.card.current_life += 1;
                me.owner.weapon_dec_durability(1, me);
              }
            }, 'summon', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Avenging Wrath': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            me.owner.deal_multiple_dmg(me.spell_dmg(8), me, function() {
              return me.owner.enemy.get_all_character([], function(c) {
                if (c.current_life > 0) return true;
              });
            });
            end_spell(me);
          }
        );
      }
    },
    'Lay on Hands': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  me.owner.heal(8, me, me.target);
                  me.owner.draw_cards(3);
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
    'Ashbringer': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Tirion Fordring': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.is_shielded.until = 1000;
            me.add_state(null, 'taunt', me);
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card == me) {
                me.owner.summon_card('Ashbringer', 1);
              }
            }, 'deathrattle', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Moonfire': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function() {
            return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                me.owner.deal_dmg(me.spell_dmg(1), me, me.target);
                end_spell(me);
              }
            );
          },
          nothing, // on select failure
          forced_target, // if forced_target is enabled then we don't make user to choose
          random_target); // if random_target is enabled then Engine Randomly Selects Available Target
      }
    },
    'Innervate': {
      on_play: function(me) {
        me.owner.play_success(me, -1, function(me, non_bc, bc) {
          me.owner.current_mana += 2;
          if (me.owner.current_mana > 10) me.owner.current_mana = 10;

          end_spell(me);
        });
      }
    },
    'Claw': {
      on_play: function(me) {
        me.owner.play_success(me, -1, function(me, non_bc, bc) {
          me.owner.add_hero_dmg(2);
          me.owner.add_armor(2, me);
          end_spell(me);
        });
      }
    },
    'Excess Mana': {
      on_play: function(me) {
        me.owner.play_success(me, -1, function(me, non_bc, bc) {
          me.owner.draw_cards(1);
          end_spell(me);
        });
      }
    },
    'Wild Growth': {
      on_play: function(me) {
        me.owner.play_success(me, -1, function(me, non_bc, bc) {
          if (me.owner.max_mana >= 10) {
            me.owner.hand_card('Excess Mana');
          }
          else me.owner.boosted_mana += 1;

          end_spell(me);
        });
      }
    },
    'Mark of the Wild': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type == 'minion') return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  me.add_state(null, 'taunt', me);
                  me.add_state(inc(2), 'dmg', me);
                  me.add_state(inc(2), 'life', me);
                  me.current_life += 2;
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
    'Savage Roar': {
      on_play: function(me) {
        me.owner.play_success(me, -1, function(me, non_bc, bc) {
          var target = me.owner.get_all_character([me.owner.hero]);

          for (var i = 0; i < target.length; i++) {
            target[i].add_state(function(t) {
              return function(d, c) {
                if (t == c.owner.engine.current_turn) {
                  return d + 2;
                }
                return d;
              };
            }(me.owner.engine.current_turn), 'dmg', me);
          }

          me.owner.add_hero_dmg(2);
          end_spell(me);
        });
      }
    },
    'Healing Touch': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function() {
            return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) me.owner.heal(8, me, me.target);
                end_spell(me);
              }
            );
          },
          nothing, // on select failure
          forced_target, // if forced_target is enabled then we don't make user to choose
          random_target); // if random_target is enabled then Engine Randomly Selects Available Target
      }
    },
    'Swipe': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.owner != me.owner) return true;
          },
          function select_success(me) { 
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  var target = me.owner.enemy.get_all_character([], function(c) {
                    if (c == me.target) return false;
                    return true;
                  });

                  var dmg = [];
                  for (var i = 0; i < target.length; i++) {
                    dmg.push(me.spell_dmg(1));
                  }

                  target.push(me.target);
                  dmg.push(me.spell_dmg(4));

                  me.owner.deal_dmg_many(dmg, me, target);
                }
                end_spell(me);
              }
            );
          },
          nothing,
          forced_target, 
          random_target);
      }
    },
    'Starfire': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function() {
            return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) me.owner.deal_dmg(me.spell_dmg(5), me, me.target);
                me.owner.draw_cards(1);
                end_spell(me);
              }
            );
          },
          nothing, // on select failure
          forced_target, // if forced_target is enabled then we don't make user to choose
          random_target); // if random_target is enabled then Engine Randomly Selects Available Target
      }
    },
    'Ironbark Protector': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.add_state(null, 'taunt', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Naturalize': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function() {
            return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) me.owner.instant_kill(me, me.target);
                me.owner.enemy.draw_cards(2);
                end_spell(me);
              }
            );
          },
          nothing, // on select failure
          forced_target, // if forced_target is enabled then we don't make user to choose
          random_target); // if random_target is enabled then Engine Randomly Selects Available Target
      }
    },
    'Panther': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Power of the Wild': {
      on_play: function(me, forced_target, random_target, forced_choose, random_choose) {
        me.owner.choose_one(me, ['Leader of the Pack', 'Summon a Panther'],
          function choose_success(choice, me, forced_target, random_target) {
            console.log('Your CHOICE :: ', choice);
            if (choice == 0) {
              me.owner.play_success(me, -1, function(me, non_bc, bc) {
                var target = me.owner.get_all_character([me.owner.hero]);
                for (var i = 0; i < target.length; i++) {
                  target[i].add_state(inc(1), 'dmg', me);
                  target[i].add_state(inc(1), 'life', me);
                  target[i].current_life += 1;
                }
                end_spell(me);
              });
            }
            else if (choice == 1) {
              me.owner.play_success(me, -1, function(me, non_bc, bc) {
                me.owner.summon_card('Panther', 10);
                end_spell(me);
              });
            }
            // This choice is only for Fandral Staghelm 
            else if (choice == 2) {
              me.owner.play_success(me, -1, function(me, non_bc, bc) {
                me.owner.summon_card('Panther', 10, false, function(c) {
                  var target = me.owner.get_all_character([me.owner.hero]);
                  for (var i = 0; i < target.length; i++) {
                    target[i].add_state(inc(1), 'dmg', me);
                    target[i].add_state(inc(1), 'life', me);
                    target[i].current_life += 1;
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
    'Wrath': {
      on_play: function(me, forced_target, random_target, forced_choose, random_choose) {
        me.owner.choose_one(me, ['EX1_154a', 'EX1_154b'],
          function choose_success(choice, me, forced_target, random_target) {
            console.log('Your CHOICE :: ', choice);
            if (choice == 0) {
              me.owner.select_one(me, function(c) {
                  if (c.card_data.type == 'minion') return true;
                }, function select_success(me) {
                  me.owner.play_success(me, -1,
                    function(me) {
                      if (me.target) {
                        me.owner.deal_dmg(me.spell_dmg(3), me, me.target);
                      }
                      end_spell(me);
                    });
                },
                nothing,
                forced_target,
                random_target);
            }
            else if (choice == 1) {
              me.owner.select_one(me, function(c) {
                  if (c.card_data.type == 'minion') return true;
                }, function select_success(me) {
                  me.owner.play_success(me, -1,
                    function(me) {
                      if (me.target) {
                        me.owner.deal_dmg(me.spell_dmg(1), me, me.target);
                        me.owner.draw_cards(1);
                      }
                      end_spell(me);
                    });
                },
                nothing,
                forced_target,
                random_target);
            }
            // This choice is only for Fandral Staghelm 
            else if (choice == 2) {
              me.owner.select_one(me, function(c) {
                  if (c.card_data.type == 'minion') return true;
                }, function select_success(me) {
                  me.owner.play_success(me, -1,
                    function(me) {
                      if (me.target) {
                        me.owner.deal_dmg(me.spell_dmg(4), me, me.target);
                        me.owner.draw_cards(1);
                      }
                      end_spell(me);
                    });
                },
                nothing,
                forced_target,
                random_target);
            }
          },
          nothing,
          false,
          forced_choose, random_choose, forced_target, random_target);
      }
    },
    'Mark of Nature': {
      on_play: function(me, forced_target, random_target, forced_choose, random_choose) {
        me.owner.choose_one(me, ['EX1_155a', 'EX1_155b'],
          function choose_success(choice, me, forced_target, random_target) {
            console.log('Your CHOICE :: ', choice);
            if (choice == 0) {
              me.owner.select_one(me, function(c) {
                  if (c.card_data.type == 'minion') return true;
                }, function select_success(me) {
                  me.owner.play_success(me, -1,
                    function(me) {
                      if (me.target) {
                        me.target.add_state(inc(4), 'dmg', me);
                      }
                      end_spell(me);
                    });
                },
                nothing,
                forced_target,
                random_target);
            }
            else if (choice == 1) {
              me.owner.select_one(me, function(c) {
                  if (c.card_data.type == 'minion') return true;
                }, function select_success(me) {
                  me.owner.play_success(me, -1,
                    function(me) {
                      if (me.target) {
                        me.target.add_state(inc(4), 'life', me);
                        me.target.current_life += 4;
                      }
                      end_spell(me);
                    });
                },
                nothing,
                forced_target,
                random_target);
            }
            // This choice is only for Fandral Staghelm 
            else if (choice == 2) {
              me.owner.select_one(me, function(c) {
                  if (c.card_data.type == 'minion') return true;
                }, function select_success(me) {
                  me.owner.play_success(me, -1,
                    function(me) {
                      if (me.target) {
                        me.target.add_state(inc(4), 'life', me);
                        me.target.current_life += 4;

                        me.target.add_state(inc(4), 'dmg', me);
                      }
                      end_spell(me);
                    });
                },
                nothing,
                forced_target,
                random_target);
            }
          },
          nothing,
          false,
          forced_choose, random_choose, forced_target, random_target);
      }
    },
    'Soul of the Forest': { // Todo :: CHK
      on_play: function(me) {
        me.owner.play_success(me, -1, function(me, non_bc, bc) {
          var target = me.owner.get_all_character([me.owner.hero]);

          for (var i = 0; i < target.length; i++) {
            me.owner.engine.g_handler.add_handler(function(e, me, target) {
              if (e.card == target) {
                me.owner.summon_card('EX1_158t', target.last_position);
              }
            }, 'deathrattle', me, false, false, target[i]);
          }
          end_spell(me);
        });
      }
    },
    'EX1_158t': { // Treant
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Druid of the Claw': {
      on_play: function(me, bc, user_play, at, forced_choose) {
        if (user_play) {
          me.owner.choose_one(me, ['Cat Form', 'Bear Form'], function(me, at) {
              return function(choice) {
                if (choice == 0) { // Cat Form
                  me.owner.play_success(me, at, function(me, non_bc, bc) {
                    if (non_bc) {
                      me.make_charge(me);
                    }
                    end(me, non_bc, bc);
                  });
                }
                else if (choice == 1) { // Bear Form
                  me.owner.play_success(me, at, function(me, non_bc, bc) {
                    if (non_bc) {
                      me.add_state(inc(2), 'life', me);
                      me.current_life += 2;
                    }
                    end(me, non_bc, bc);
                  });
                }
                else if (choice == 2) {
                  me.owner.play_success(me, at, function(me, non_bc, bc) {
                    if (non_bc) {
                      me.add_state(inc(2), 'life', me);
                      me.current_life += 2;
                      me.make_charge(me);
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
    'Savagery': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function() {
            return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) me.owner.deal_dmg(me.spell_dmg(me.owner.hero_dmg()), me, me.target);
                end_spell(me);
              }
            );
          },
          nothing, // on select failure
          forced_target, // if forced_target is enabled then we don't make user to choose
          random_target); // if random_target is enabled then Engine Randomly Selects Available Target
      }
    },
    'Bite': {
      on_play: function(me) {
        me.owner.play_success(me, -1, function(me, non_bc, bc) {
          me.owner.add_hero_dmg(4);
          me.owner.add_armor(4, me);
          end_spell(me);
        });
      }
    },
    'Keeper of the Grove': {
      on_play: function(me, bc, user_play, at, forced_choose) {
        if (user_play) {
          me.owner.choose_one(me, ['EX1_166a', 'Dispel'],
            function(choice, me) {
              if (choice == 0) {
                me.owner.select_one(me,
                  function(c) {
                    if (c.card_data.type == 'minion') return true;
                  },
                  function() {
                    me.owner.play_success(me, at, function(me, non_bc, bc) {
                      if (bc && me.target) {
                        me.owner.deal_dmg(2, me, me.target);
                      }
                      end(me, non_bc, bc);
                    });
                  },
                  nothing,
                  false
                );
              }
              else if (choice == 1) {
                me.owner.select_one(me,
                  function(c) {
                    if (c.card_data.type == 'minion') return true;
                  },
                  function() {
                    me.owner.play_success(me, at, function(me, non_bc, bc) {
                      if (bc && me.target) {
                        me.owner.silence(me, me.target);
                      }
                      end(me, non_bc, bc);
                    });
                  },
                  nothing,
                  false
                );
              }
              else if (choice == 2) {
                me.owner.select_one(me,
                  function(c) {
                    if (c.card_data.type == 'minion') return true;
                  },
                  function() {
                    me.owner.play_success(me, at, function(me, non_bc, bc) {
                      if (bc && me.target) {
                        me.owner.silence(me, me.target);
                        me.owner.deal_dmg(2, me, me.target);
                      }
                      end(me, non_bc, bc);
                    });
                  },
                  nothing,
                  false
                );
              }
            },
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
    'Starfall': {
      on_play: function(me, forced_target, random_target, forced_choose, random_choose) {
        me.owner.choose_one(me, ['NEW1_007b', 'NEW1_007a'],
          function choose_success(choice, me, forced_target, random_target) {
            console.log('Your CHOICE :: ', choice);
            if (choice == 0) {
              me.owner.select_one(me, function(c) {
                  if (c.card_data.type == 'minion') return true;
                }, function select_success(me) {
                  me.owner.play_success(me, -1,
                    function(me) {
                      if (me.target) {
                        me.owner.deal_dmg(me.spell_dmg(5), me, me.target);
                      }
                      end_spell(me);
                    });
                },
                nothing,
                forced_target,
                random_target);
            }
            else if (choice == 1) {
              me.owner.play_success(me, -1, function(me, non_bc, bc) {
                var target = me.owner.enemy.get_all_character([me.owner.hero]);
                var dmg = [];
                for (var i = 0; i < target.length; i++) {
                  dmg.push(me.spell_dmg(2));
                }
                me.owner.deal_dmg_many(dmg, me, target);

                end_spell(me);
              });
            }
            // This choice is only for Fandral Staghelm 
            else if (choice == 2) {
              me.owner.select_one(me, function(c) {
                  if (c.card_data.type == 'minion') return true;
                }, function select_success(me) {
                  me.owner.play_success(me, -1,
                    function(me) {
                      var target = me.owner.enemy.get_all_character([me.owner.enemy.hero], function(c) {
                        if (c == me.target) return false;
                        return true;
                      });

                      var dmg = [];
                      for (var i = 0; i < target.length; i++) {
                        dmg.push(me.spell_dmg(2));
                      }

                      target.push(me.target);
                      dmg.push(me.spell_dmg(7));

                      me.owner.deal_dmg_many(dmg, me, target);
                    });
                },
                nothing,
                forced_target,
                random_target);
            }
          },
          nothing,
          false,
          forced_choose, random_choose, forced_target, random_target);
      }
    },
    'Nourish': {
      on_play: function(me, forced_target, random_target, forced_choose, random_choose) {
        me.owner.choose_one(me, ['EX1_164a', 'EX1_164b'],
          function choose_success(choice, me, forced_target, random_target) {
            console.log('Your CHOICE :: ', choice);
            if (choice == 0) {
              me.owner.play_success(me, -1, function(me, non_bc, bc) {
                me.owner.current_mana += 2;
                if (me.owner.current_mana > 10) me.owner.current_mana = 10;
                end_spell(me);
              });
            }
            else if (choice == 1) {
              me.owner.play_success(me, -1, function(me, non_bc, bc) {
                me.owner.draw_cards(3);
                end_spell(me);
              });
            }
            // This choice is only for Fandral Staghelm 
            else if (choice == 2) {
              me.owner.play_success(me, -1, function(me, non_bc, bc) {
                me.owner.draw_cards(3);
                me.owner.current_mana += 2;
                if (me.owner.current_mana > 10) me.owner.current_mana = 10;
                end_spell(me);
              });
            }
          },
          nothing,
          false,
          forced_choose, random_choose, forced_target, random_target);
      }
    },
    'Force of Nature': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            me.owner.summon_card('Treat', 10);
            me.owner.summon_card('Treat', 10);
            me.owner.summon_card('Treat', 10);
            end_spell(me);
          }
        );
      }
    },
    'Ancient of War': {
      on_play: function(me, bc, user_play, at, forced_choose) {
        if (user_play) {
          me.owner.choose_one(me, ['Uproot', 'Rooted'], function(me, at) {
              return function(choice) {
                if (choice == 0) { // Cat Form
                  me.owner.play_success(me, at, function(me, non_bc, bc) {
                    if (non_bc) {
                      me.add_state(inc(5), 'dmg', me);
                    }
                    end(me, non_bc, bc);
                  });
                }
                else if (choice == 1) { // Bear Form
                  me.owner.play_success(me, at, function(me, non_bc, bc) {
                    if (non_bc) {
                      me.add_state(inc(5), 'life', me);
                      me.current_life += 5;
                    }
                    end(me, non_bc, bc);
                  });
                }
                else if (choice == 2) {
                  me.owner.play_success(me, at, function(me, non_bc, bc) {
                    if (non_bc) {
                      me.add_state(inc(5), 'life', me);
                      me.current_life += 5;
                      me.add_state(inc(5), 'dmg', me);
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
    'Ancient of Lore': {
      on_play: function(me, bc, user_play, at, forced_choose) {
        if (user_play) {
          me.owner.choose_one(me, ['Ancient Teachings', 'Ancient Secrets'], function(me, at) {
              return function(choice) {
                if (choice == 0) { // Cat Form
                  me.owner.play_success(me, at, function(me, non_bc, bc) {
                    if (non_bc) {
                      me.owner.draw_cards(1);
                    }
                    end(me, non_bc, bc);
                  });
                }
                else if (choice == 1) { // Bear Form
                  me.owner.select_one(me,
                    function(c) {
                      return true;
                    },
                    function() {
                      me.owner.play_success(me, at, function(me, non_bc, bc) {
                        if (non_bc && me.target) { // Choose One Effects are not BATTLECRY
                          me.owner.heal(5, me, me.target);
                        }
                        end(me, non_bc, bc);
                      });
                    },
                    function() {},
                    false
                  );
                }
                else if (choice == 2) {
                  me.owner.select_one(me,
                    function(c) {
                      return true;
                    },
                    function() {
                      me.owner.play_success(me, at, function(me, non_bc, bc) {
                        if (non_bc && me.target) {
                          me.owner.heal(5, me, me.target);
                          me.owner.draw_cards(1);
                        }
                        end(me, non_bc, bc);
                      });
                    },
                    function() {},
                    false
                  );
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
    'EX1_573t': { // Treant with Taunt
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.add_state(null, 'taunt', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Cenarius': {
      on_play: function(me, bc, user_play, at, forced_choose) {
        if (user_play) {
          me.owner.choose_one(me, ['Demigod\'s Favor', 'Shan\'do\'s Lesson'], function(me, at) {
              return function(choice) {
                if (choice == 0) {
                  me.owner.play_success(me, at, function(me, non_bc, bc) {
                    if (non_bc) {
                      var target = me.owner.get_all_character([me.owner.hero, me]);
                      for (var i = 0; i < target.length; i++) {
                        target[i].add_state(inc(2), 'dmg', me);
                        target[i].add_state(inc(2), 'life', me);
                        target[i].current_life += 2;
                      }
                    }
                    end(me, non_bc, bc);
                  });
                }
                else if (choice == 1) {
                  me.owner.play_success(me, at, function(me, non_bc, bc) {
                    if (non_bc) {
                      var pos = me.owner.field.get_pos(me);
                      me.owner.summon_card('EX1_573t', pos + 1);
                      me.owner.summon_card('EX1_573t', pos + 2);
                    }
                    end(me, non_bc, bc);
                  });
                }
                else if (choice == 2) {
                  me.owner.play_success(me, at, function(me, non_bc, bc) {
                    if (non_bc) {
                      var pos = me.owner.field.get_pos(me);
                      me.owner.summon_card('EX1_573t', pos + 1);
                      me.owner.summon_card('EX1_573t', pos + 2, false,
                        function(c) {
                          var target = me.owner.get_all_character([me.owner.hero, me]);
                          for (var i = 0; i < target.length; i++) {
                            target[i].add_state(inc(2), 'dmg', me);
                            target[i].add_state(inc(2), 'life', me);
                            target[i].current_life += 2;
                          }
                        });
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
    'Ancestral Healing': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type == 'minion') return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  me.owner.heal(me.target.life() - me.target.current_life, me, me.target);
                  me.target.add_state(null, 'taunt', me);
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
    'Totemic Might': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            var target = me.owner.enemy.get_all_character();

            for (var i = 0; i < target.length; i++) {
              if (target[i].card_data.kind == 'totem') {
                target[i].add_state(inc(2), 'life', me);
                target[i].current_life += 2;
              }
            }
            end_spell(me);
          }
        );
      }
    },
    'Frozen Shock': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  me.target.deal_dmg(me.spell_dmg(1), me, me.target);
                  me.target.is_frozen.until = me.owner.engine.current_turn + 1;
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
    'Rockbiter Weapon': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  if (me.target == me.owner.hero || me.target == me.owner.enemy.hero) {
                    me.target.owner.add_hero_dmg(3, me);
                  }
                  else {
                    me.target.add_state(function(t) {
                      return function(d, c) {
                        if (c.owner.engine.current_turn == t) return d + 3;
                        return d;
                      };
                    }(me.owner.engine.current_turn), 'dmg', me);
                  }
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
    'Flametongue Totem': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.engine.add_aura(function(d, c, me) {
              if (c.owner.field.get_distance(c, me) == 1) {
                return d + 2;
              }
              return d;
            }, 'dmg', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Windfury': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type == 'minion') return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  me.target.make_windfury(me);
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
    'Hex': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type == 'minion') return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  me.owner.transform(me, me.target, 'Frog');
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
    'Windspeaker': {
      on_play: function(me, bc, user_play, at) {
        if (user_play) {
          me.owner.select_one(me,
            function(c) {
              if (c.card_data.type == 'minion' && c.owner == me.owner) return true;
            },
            function() {
              me.owner.play_success(me, at, function(me, non_bc, bc) {
                if (bc && me.target) {
                  me.target.make_windfury(me);
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
    'Bloodlust': {
      on_play: function(me) {
        me.owner.play_success(me, -1, function(me, non_bc, bc) {
          var target = me.owner.get_all_character([me.owner.hero]);
          for (var i = 0; i < target.length; i++) {
            target[i].add_state(function(t) {
              return function(d, c) {
                if (t == c.owner.engine.current_turn) {
                  return d + 3;
                }
                return d;
              };
            }, 'dmg', me);
          }
          end_spell(me);
        });
      }
    },
    'Fire Elemental': {
      on_play: function(me, bc, user_play, at) {
        if (user_play) {
          me.owner.select_one(me,
            function(c) {
              return true;
            },
            function() {
              me.owner.play_success(me, at, function(me, non_bc, bc) {
                if (bc && me.target) {
                  me.owner.deal_dmg(3, me, me.target);
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
    'Forked Lightning': {
      on_play: function(me) {
        me.owner.play_success(me, -1, function(me, non_bc, bc) {
          if (me.owner.enemy.field.num_card()) {
            var target = rand(me.owner.enemy.get_all_character([me.owner.enemy.hero]), 2);
            var dmg = [];

            for (var i = 0; i < target.length; i++) {
              dmg.push(me.spell_dmg(2));
            }

            me.owner.deal_dmg_many(dmg, me, target);
            me.owner.add_overload(2, me);
          }
          end_spell(me);
        });
      }
    },
    'Earth Shock': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type == 'minion') return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  me.owner.silence(me, me.target);
                  me.owner.deal_dmg(me.spell_dmg(1), me, me.target);
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
    'Dust Devil': {
      on_play: function(me, bc, user_play, at) {
        if (user_play) me.owner.add_overload(2, me);
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.add_state(function() {
              return 2;
            }, 'atk_num', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Lightning Bolt': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  me.owner.deal_dmg(me.spell_dmg(3), me, me.target);
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
    'Stormforged Axe': {
      on_play: function(me, bc, user_play, at) {
        if (user_play) me.owner.add_overload(1, me);
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Ancestral Spirit': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type == 'minion') return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  me.owner.g_handler.add_handler(function(e, me, target) {
                    if (e.card == target) {
                      me.owner.summon_card(target.card_data.unique, target.last_position);
                    }
                  }, 'deathrattle', me, false, false, me.target);
                }
                end_spell(me);
              }
            );
          },
          nothing,
          forced_target,
          random_target);
      }
    },
    'Mana Tide Totem': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.victim == me.owner.hero) e.dmg *= 2;
            }, 'turn_end', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Lightning Storm': {
      on_play: function(me) {
        me.owner.play_success(me, -1, function(me, non_bc, bc) {
          var target = me.owner.enemy.get_all_character([me.owner.enemy.hero]);
          var dmg = [];

          for (var i = 0; i < target.legnth; i++) {
            dmg.push(me.spell_dmg(2) + (chance(0.5) ? 1 : 0));
          }

          me.owner.deal_dmg_many(dmg, me, target);
          me.owner.add_overload(2, me);
          end_spell(me);
        });
      }
    },
    'Spirit Wolf': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.add_state(null, 'taunt', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Feral Spirit': {
      on_play: function(me) {
        me.owner.play_success(me, -1, function(me, non_bc, bc) {
          me.owner.summon_card('Spirit Wolf', 10);
          me.owner.summon_card('Spirit Wolf', 10);

          me.owner.add_overload(2, me);
          end_spell(me);
        });
      }
    },
    'Lava Burst': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  me.owner.deal_dmg(me.spell_dmg(5), me, me.target);
                  me.owner.add_overload(2, me);
                }
                end_spell(me);
              }
            );
          },
          nothing,
          forced_target,
          random_target);
      }
    },
    'Far Sight': {
      on_play: function(me) {
        me.owner.play_success(me, -1, function(me, non_bc, bc) {
          me.owner.draw_cards(1, function(c) {
            if (c) {
              c.add_state(inc(-3), 'mana', me);
            }
          });
          end_spell(me);
        });
      }
    },
    'Earth Elemental': {
      on_play: function(me, bc, user_play, at) {
        if (user_play) me.owner.add_overload(3, me);
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.add_state(null, 'taunt', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Doomhammer': {
      on_play: function(me, bc, user_play, at) {
        if (user_play) me.owner.add_overload(1, me);
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.add_state(function() {
              return 2;
            }, 'atk_num', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Al\'Akir the Windlord': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.add_state(null, 'taunt', me);
            me.make_charge(me);
            me.is_shielded.until = 1000;
            me.add_state(function() {
              return 2;
            }, 'atk_num', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Sacrificial Pact': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.kind == 'demon') return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  me.owner.instant_kill(me, me.target);
                  me.owner.heal(5, me, me.owner.hero);
                }
                end_spell(me);
              }
            );
          },
          nothing,
          forced_target,
          random_target);
      }
    },
    'Voidwalker': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.add_state(null, 'taunt', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Corruption': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type == 'minion') return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  me.owner.g_handler.add_handler(function(e, me, target) {
                    if (e.who == me.owner) {
                      me.owner.instant_kill(me, target);
                    }
                  }, 'turn_begin', me, false, false, me.target);
                }
                end_spell(me);
              }
            );
          },
          nothing,
          forced_target,
          random_target);
      }
    },
    'Soulfire': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  me.owner.deal_dmg(me.spell_dmg(4), me, me.owner.hero);
                  if (me.owner.hand.num_card()) {
                    me.owner.discard_card(rand(me.owner.hand.card_list), me);
                  }
                }
                end_spell(me);
              }
            );
          },
          nothing,
          forced_target,
          random_target);
      }
    },
    'Mortal Coil': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type == 'minion') return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  spell_next_step(me, function(me) {
                    if (me.target.current_life <= 0) me.owner.draw_cards(1);
                    end_spell(me);
                  });
                  me.owner.deal_dmg(me.spell_dmg(1), me, me.target);
                }
                else end_spell(me);
              }
            );
          },
          nothing,
          forced_target,
          random_target);
      }
    },
    'Succubus': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            if (me.owner.hand.num_card()) {
              me.owner.discard_card(rand(me.owner.hand.card_list), me);
            }
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Drain Life': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  me.owner.deal_dmg(me.spell_dmg(2), me, me.target);
                  me.owner.heal(2, me, me.owner);
                }
                end_spell(me);
              }
            );
          },
          nothing,
          forced_target,
          random_target);
      }
    },
    'Shadow Bolt': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type == 'minion') return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) me.owner.deal_dmg(me.spell_dmg(4), me, me.target);
                end_spell(me);
              }
            );
          },
          nothing,
          forced_target,
          random_target);
      }
    },
    'Hellfire': {
      on_play: function(me) {
        me.owner.play_success(me, -1, function(me, non_bc, bc) {
          var target = me.owner.get_all_character().concat(me.owner.enemy.get_all_character());
          var dmg = [];
          for (var i = 0; i < target.length; i++) dmg.push(me.spell_dmg(3));

          me.owner.deal_dmg_many(dmg, me, target);
          end_spell(me);
        });
      }
    },
    'Dread Infernal': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            var target = me.owner.get_all_character([me.owner.hero])
              .concat(me.owner.enemy.get_all_character([me.owner.enemy.hero]));
            var dmg = [];
            for (var i = 0; i < target.length; i++) dmg.push(me.spell_dmg(1));

            me.owner.deal_dmg_many(dmg, me, target);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Power Overwhelming': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type == 'minion' && c.owner == me.owner) return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  me.target.add_state(inc(4), 'dmg', me);
                  me.target.add_state(inc(4), 'life', me);
                  me.target.current_life += 4;

                  me.owner.g_handler.add_handler(function(e, me, target) {
                    if (e.who == me.owner) {
                      me.owner.instant_kill(me, target);
                    }
                  }, 'turn_end', me, false, false, me.target);
                }
                end_spell(me);
              }
            );
          },
          nothing,
          forced_target,
          random_target);
      }
    },
    'Blood Imp': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.is_stealth.until = 1000;
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.who == me.owner) {
                var target = me.owner.get_all_character([me, me.owner.hero]);
                if (target.length) {
                  var lucky = rand(target);
                  lucky.add_state(inc(1), 'life', me);
                  lucky.current_life += 1;
                }
              }
            }, 'turn_end', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Flame Imp': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            me.owner.deal_dmg(3, me, me.owner.hero);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Demonfire': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type == 'minion') return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  if (me.target.card_data.kind == 'devil' && me.target.owner == me.owner) {
                    me.target.add_state(inc(2), 'dmg', me);
                    me.target.add_state(inc(2), 'life', me);
                    me.target.current_life += 2;
                  }
                  else {
                    me.owner.deal_dmg(me.spell_dmg(2), me, me.target);
                  }
                }
                end_spell(me);
              }
            );
          },
          nothing,
          forced_target,
          random_target);
      }
    },
    'Summoning Portal': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.engine.add_aura(function(m, c, me) {
              if (c.owner == me.owner && c.card_data.type == 'minion') {
                if (m - 2 >= 1) return m - 2;
                if (m <= 0) return 0;
                return 1;
              }
            })
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Void Terror': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            var target = [];
            var list = me.owner.get_all_character([me, me.owner.hero]);
            var life = 0,
              dmg = 0;

            for (var i = 0; i < list.length; i++) {
              if (me.owner.field.get_distance(me, list[i]) == 1) {
                target.push(list[i]);
                life += list[i].current_life;
                dmg += list[i].dmg();
              }
            }
            if (target.length) {
              me.owner.instant_kill_many(me, target);
              me.add_state(inc(life), 'life', me);
              me.current_life += life;
              me.add_state(inc(dmg), 'dmg', me);
            }
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Felguard': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) me.owner.boosted_mana -= 1;
          if (non_bc) me.add_state(null, 'taunt', me);
          end(me, non_bc, bc);
        });
      }
    },
    'Shadowflame': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type == 'minion' && c.owner == me.owner) return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  var d = me.target.dmg();
                  me.owner.instant_kill(me, me.target);

                  var target = me.owner.enemy.get_all_character([me.owner.enemy.hero]);

                  var dmg = [];
                  for (var i = 0; i < target.length; i++) {
                    dmg.push(me.spell_dmg(d));
                  }
                  me.owner.deal_dmg_many(dmg, me, target);
                }
                end_spell(me);
              }
            );
          },
          nothing,
          forced_target,
          random_target);
      }
    },
    'Doomguard': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            if (me.owner.hand.num_card()) {
              me.owner.discard_card(rand(me.owner.hand.card_list), me);
            }
            if (me.owner.hand.num_card()) {
              me.owner.discard_card(rand(me.owner.hand.card_list), me);
            }
          }
          if (non_bc) {
            me.make_charge(me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Siphon Soul': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type == 'minion') return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  me.instant_kill(me, me.target);
                  me.owner.heal(3, me, me.owner.hero);
                }
                end_spell(me);
              }
            );
          },
          nothing,
          forced_target,
          random_target);
      }
    },
    'Pit Lord': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            me.owner.deal_dmg(5, me, me.owner.hero);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Twisting Nether': {
      on_play: function(me) {
        me.owner.play_success(me, -1, function(me, non_bc, bc) {
          var target = me.owner.get_all_character([me.owner.hero])
            .concat(me.owner.enemy.get_all_character([me.owner.enemy.hero]));

          me.owner.instant_kill_many(me, target);
          end_spell(me);
        });
      }
    },
    'Mind Vision': {
      on_play: function(me) {
        me.owner.play_success(me, -1, function(me, non_bc, bc) {
          if (me.owner.enemy.hand.num_card()) {
            var lucky = rand(me.owner.enemy.hand.card_list);
            me.owner.hand_card(lucky.card_data.unique);
          }
          end_spell(me);
        });
      }
    },
    'Northshire Cleric': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.target.card_data.type == 'minion') {
                me.owner.draw_cards(1);
              }
            }, 'heal', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Holy Smite': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) me.owner.deal_dmg(me.spell_dmg(2), me, me.target);
                end_spell(me);
              }
            );
          },
          nothing,
          forced_target,
          random_target);
      }
    },
    'Power Word: Shield': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type == 'minion') return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  me.target.add_state(inc(2), 'life', me);
                  me.target.current_life += 2;
                  me.owner.draw_cards(1);
                }
                end_spell(me);
              }
            );
          },
          nothing,
          forced_target,
          random_target);
      }
    },
    'Shadow Word: Pain': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type == 'minion' && c.dmg() <= 3) return true;
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
          nothing,
          forced_target,
          random_target);
      }
    },
    'Mind Blast': {
      on_play: function(me) {
        me.owner.play_success(me, -1, function(me, non_bc, bc) {
          me.owner.deal_dmg(me.spell_dmg(5), me, me.owner.enemy.hero);
          end_spell(me);
        });
      }
    },
    'Divine Spirit': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type == 'minion') return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  me.target.add_state(inc(me.target.current_life), 'life', me);
                  me.target.current_life += me.target.current_life;
                }
                end_spell(me);
              }
            );
          },
          nothing,
          forced_target,
          random_target);
      }
    },
    'Shadow Word: Death': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type == 'minion' && c.dmg() >= 5) return true;
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
          nothing,
          forced_target,
          random_target);
      }
    },
    'Holy Nova': {
      on_play: function(me) {
        me.owner.play_success(me, -1, function(me, non_bc, bc) {
          var target = me.owner.enemy.get_all_character([me.owner.enemy.hero]);

          var dmg = [];
          for (var i = 0; i < target.length; i++) {
            dmg.push(me.spell_dmg(2));
          }
          me.owner.deal_dmg_many(dmg, me, target);

          var heal = [];
          var mine = me.owner.get_all_character([me.owner.hero]);
          for (var i = 0; i < mine.length; i++) {
            heal.push(2);
          }

          me.owner.heal_many(heal, me, mine);
          end_spell(me);
        });
      }
    },
    'Take Control': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type == 'minion') return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  me.owner.take_control(me.target, me);
                }
                end_spell(me);
              }
            );
          },
          nothing,
          forced_target,
          random_target);
      }
    },
    'Circle of Healing': {
      on_play: function(me) {
        me.owner.play_success(me, -1, function(me, non_bc, bc) {
          var target = me.owner.get_all_character([me.owner.hero])
            .concat(me.owner.enemy.get_all_character([me.owner.enemy.hero]));

          var heal = [];
          for (var i = 0; i < target.length; i++) {
            heal.push(4);
          }

          me.owner.heal_many(heal, me, target);
          end_spell(me);
        });
      }
    },
    'Silence': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type == 'minion') return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  me.owner.silence(me, me.target);
                }
                end_spell(me);
              }
            );
          },
          nothing,
          forced_target,
          random_target);
      }
    },
    'Inner Fire': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type == 'minion') return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  me.target.add_state(function(d) {
                    return function() {
                      return d;
                    };
                  }(me.target.current_life), 'dmg', me);
                }
                end_spell(me);
              }
            );
          },
          nothing,
          forced_target,
          random_target);
      }
    },
    'Thought Steal': {
      on_play: function(me) {
        me.owner.play_success(me, -1, function(me, non_bc, bc) {
          if (me.owner.enemy.deck.num_card()) {
            var lucky = rand(me.owner.enemy.deck.card_list);
            me.owner.hand_card(lucky.card_data.unique);
          }
          if (me.owner.enemy.deck.num_card()) {
            lucky = rand(me.owner.enemy.deck.card_list);
            me.owner.hand_card(lucky.card_data.unique);
          }
          end_spell(me);
        });
      }
    },
    'Lightspawn': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.add_state(function(d, c) {
              return c.current_life;
            }, 'dmg', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Temple Enforcer': {
      on_play: function(me, bc, user_play, at) {
        if (user_play) {
          me.owner.select_one(me,
            function(c) {
              if (c.card_data.type == 'minion' && c.owner == me.owner) return true;
            },
            function() {
              me.owner.play_success(me, at, function(me, non_bc, bc) {
                if (bc && me.target) {
                  me.target.add_state(inc(3), 'life', me);
                  me.target.current_life += 3;
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
    'Hunter\'s Mark': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type == 'minion') return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  me.target.add_state(function() {
                    return 1;
                  }, 'life', me);
                }
                end_spell(me);
              }
            );
          },
          nothing,
          forced_target,
          random_target);
      }
    },
    'Arcane Shot': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  me.owner.deal_dmg(me.spell_dmg(1), me, me.target);
                }
                end_spell(me);
              }
            );
          },
          nothing,
          forced_target,
          random_target);
      }
    },
    'Timber Wolf': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.engine.add_aura(function(d, c, me) {
              if (c.owner == me.owner && c.card_data.kind == 'beast') return d + 1;
              return d;
            }, 'dmg', me)
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Kill Command': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  var mine = me.owner.get_all_character([me.owner.hero]);
                  var found = false;
                  for (var i = 0; i < mine.length; i++) {
                    if (mine[i].card_data.kind == 'beast') {
                      me.owner.deal_dmg(me.spell_dmg(5), me, me.target);
                      found = true;
                      break;
                    }
                  }
                  if (!found) me.owner.deal_dmg(me.spell_dmg(3), me, me.target);
                }
                end_spell(me);
              }
            );
          },
          nothing,
          forced_target,
          random_target);
      }
    },
    'Leokk': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.engine.add_aura(function(d, c, me) {
              if (c.owner == me.owner && c.card_data.type == 'minion') return d + 1;
              return d;
            }, 'dmg', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Misha': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.add_state(null, 'taunt', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Huffer': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.make_charge(me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Animal Companion': {
      on_play: function(me) {
        me.owner.play_success(me, -1, function(me, non_bc, bc) {
          var avail = ['Leokk', 'Misha', 'Huffer'];
          me.owner.summon_card(rand(avail), 10);
          end_spell(me);
        });
      }
    },
    'Houndmaster': {
      on_play: function(me, bc, user_play, at) {
        if (user_play) {
          me.owner.select_one(me,
            function(c) {
              if (c.card_data.kind == 'beast' && c.owner == me.owner) return true;
            },
            function() {
              me.owner.play_success(me, at, function(me, non_bc, bc) {
                if (bc && me.target) {
                  me.target.add_state(inc(2), 'dmg', me);
                  me.target.add_state(inc(2), 'life', me);
                  me.target.current_life += 2;
                  me.target.add_state(null, 'taunt', me);
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
    'Multi-Shot': {
      on_play: function(me) {
        me.owner.play_success(me, -1, function(me, non_bc, bc) {
          if (me.owner.enemy.field.num_card()) {
            var target = rand(me.owner.enemy.get_all_character([me.owner.enemy.hero]), 2);
            var dmg = [];

            for (var i = 0; i < target.length; i++) {
              dmg.push(me.spell_dmg(3));
            }

            me.owner.deal_dmg_many(dmg, me, target);
          }
          end_spell(me);
        });
      }
    },
    'Starving Buzzard': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.who == me.owner) {
                me.owner.draw_cards(1);
              }
            }, 'summon', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Tundra Rhino': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.engine.add_aura(function(c, me) {
              if (c.owner == me.owner && c.card_data.kind == 'beast') return true;
              return false;
            }, 'charge', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Freezing Trap': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.who.owner == me.owner.enemy && e.who.card_data.type == 'minion' &&
                me.owner.engine.current_player != me.owner) {
                me.owner.hand_card(e.who.card_data.unique, function(c) {
                  c.add_state(inc(2), 'mana', me);
                });
                me.status = 'destroyed';
              }
            }, 'propose_attack', me, true);
            end_spell(me);
          }
        );
      }
    },
    'Snipe': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card.owner == me.owner.enemy && e.card.card_data.type == 'minion' &&
                me.owner.engine.current_player != me.owner) {
                me.owner.deal_dmg(me.spell_dmg(4), me, me.target);
                me.status = 'destroyed';
              }
            }, 'after_play', me, true);
            end_spell(me);
          }
        );
      }
    },
    'Scavenging Hyena': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.destroyed.owner == me.owner && e.destroyed.card_data.kind == 'beast') {
                me.add_state(inc(2), 'dmg', me);
                me.add_state(inc(1), 'life', me);
                me.current_life += 1;
              }
            }, 'destroyed', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Explosive Trap': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.who.owner == me.owner.enemy && (e.who.card_data.type == 'minion' || e.who == me.owner.enemy.hero) && me.owner.engine.current_player != me.owner && e.who.target == me.owner.hero) { // Activates only when attacking hero
                var target = me.owner.enemy.get_all_character();
                var dmg = [];
                for (var i = 0; i < target.length; i++) {
                  dmg.push(me.spell_dmg(2));
                }
                me.owner.deal_dmg_many(dmg, me, target);
                me.status = 'destroyed';
              }
            }, 'propose_attack', me, true);
            end_spell(me);
          }
        );
      }
    },
    'Hound': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.make_charge(me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Unleash the Hounds': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            for (var i = 0; i < me.owner.enemy.field.num_card(); i++) {
              me.owner.summon_card('Hound', 10);
            }
            end_spell(me);
          }
        );
      }
    },
    'Deadly Shot': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            var target = me.owner.enemy.get_all_character([me.owner.enemy.hero]);
            if (target.length) {
              me.owner.instant_kill(me, rand(target));
            }
            end_spell(me);
          }
        );
      }
    },
    'Flare': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            var target = me.owner.enemy.get_all_character([me.owner.enemy.hero]);
            for (var i = 0; i < target.length; i++) {
              target[i].stealth.until = -1;
            }
            for (var i = 0; i < me.owner.enemy.secret_list.length; i++) {
              me.owner.enemy.secret_list[i].status = 'destroyed';
            }
            me.owner.enemy.secret_list = [];
            me.owner.draw_cards(1);
            end_spell(me);
          }
        );
      }
    },
    'Eaglehorn Bow': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card.owner == me.owner) {
                me.add_state(inc(1), 'life', me);
                me.current_life += 1;
              }
            }, 'reveal', me)
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Explosive Shot': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type == 'minion') return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                var target = [me.target];
                for (var i = 0; i < me.owner.field.num_card(); i++) {
                  if (me.owner.field.get_distance(me.target, me.owner.field.card_list[i]) == 1) {
                    target.push(me.owner.field.card_list[i]);
                  }
                }

                for (var i = 0; i < me.owner.enemy.field.num_card(); i++) {
                  if (me.owner.enemy.field.get_distance(me.target, me.owner.enemy.field.card_list[i]) == 1) {
                    target.push(me.owner.enemy.field.card_list[i]);
                  }
                }

                var dmg = [me.spell_dmg(5)];
                for (var i = 1; i < target.length; i++) {
                  dmg.push(me.spell_dmg(2));
                }

                me.owner.deal_dmg_many(dmg, me, target);

                end_spell(me);
              }
            );
          },
          nothing, // on select failure
          forced_target, // if forced_target is enabled then we don't make user to choose
          random_target); // if random_target is enabled then Engine Randomly Selects Available Target
      }
    },
    'Savannah Highmane': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card == me) {
                me.owner.summon_card('Hyena', me.last_position);
                me.owner.summon_card('Hyena', me.last_position);
              }
            }, 'deathrattle', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Hyena': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Bestial Wrath': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.kind == 'beast') return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  me.target.add_state(inc(2), 'dmg', me);
                  me.target.is_invincible = me.owner.engine.current_turn;
                }
              }
            );
          },
          nothing, // on select failure
          forced_target, // if forced_target is enabled then we don't make user to choose
          random_target); // if random_target is enabled then Engine Randomly Selects Available Target
      }
    },
    'Snake': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Snake Trap': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card.owner == me.owner.enemy && e.target.card_data.type == 'minion' // Triggers when my minion is attacked
                && e.target.owner == me.owner && me.owner.engine.current_player != me.owner) {
                me.owner.summon_card('Snake', 10);
                me.owner.summon_card('Snake', 10);
                me.status = 'destroyed';
              }
            }, 'propose_attack', me, true);
            end_spell(me);
          }
        );
      }
    },
    'Gladiator\'s Longbow': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.attacker == me.owner.hero && me.owner.hero.is_attacking) {
                // Now current hero becomes invincible so that victims' given dmg is 0
                e.victim.dmg_given = 0;
              }
            }, 'pre_dmg', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'King Krush': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.make_charge(me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Backstab': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type == 'minion' && c.current_life == c.life()) return true;
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
    'Deadly Poison': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            if (me.owner.weapon) {
              me.owner.weapon.add_state(inc(2), 'dmg', me);
            }
            end_spell(me);
          }
        );
      }
    },
    'Sinister Strike': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            me.owner.deal_dmg(me.spell_dmg(3), me, me.owner.enemy.hero);
            end_spell(me);
          }
        );
      }
    },
    'Shiv': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  me.owner.deal_dmg(me.spell_dmg(1), me, me.target);
                  me.owner.draw_cards(1);
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
    'Sap': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type == 'minion' && c.owner == me.owner.enemy) return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  me.owner.return_to_hand(me.target, me);
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
    'Fan of Knives': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            var target = me.owner.enemy.get_all_character([me.owner.enemy.hero]);

            var dmg = [];
            for (var i = 0; i < target.length; i++) {
              dmg.push(me.spell_dmg(1));
            }
            me.owner.deal_dmg_many(dmg, me, target);
            me.owner.draw_cards(1);
            end_spell(me);
          }
        );
      }
    },
    'Assasinate': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type == 'minion' && c.owner == me.owner.enemy) return true;
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
    'Assasin\'s Blade': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.attacker == me.owner.hero && me.owner.hero.is_attacking) {
                // Now current hero becomes invincible so that victims' given dmg is 0
                e.victim.dmg_given = 0;
              }
            }, 'pre_dmg', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Vanish': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            var target = me.owner.get_all_character([me.owner.hero])
              .concat(me.owner.enemy.get_all_character([me.owner.enemy.hero]));

            for (var i = 0; i < target.length; i++) {
              me.owner.return_to_hand(target[i], me)
            }
            me.owner.deal_dmg_many(dmg, me, target);
            me.owner.draw_cards(1);
            end_spell(me);
          }
        );
      }
    },
    'Sprint': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            me.owner.draw_cards(4);
            end_spell(me);
          }
        );
      }
    },
    'Shadowstep': {
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
          nothing,
          forced_target,
          random_target);
      }
    },
    'Cold Blood': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type == 'minion') return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  if (me.owner.turn_card_play.length >= 2) me.target.add_state(inc(4), 'dmg', me);
                  else me.target.add_state(inc(2), 'dmg', me);
                }
                end_spell(me);
              }
            );
          },
          nothing,
          forced_target,
          random_target);
      }
    },
    'Conceal': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            var target = me.owner.get_all_character([me.owner.hero]);
            for (var i = 0; i < target.length; i++) {
              target[i].is_stealth.until = me.owner.engine.current_turn + 1;
            }
            end_spell(me);
          }
        );
      }
    },
    'Defias Bandit': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Defias Ringleader': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            me.owner.summon_card('Defias Bandit', at + 1);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Betrayal': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type == 'minion' && c.owner == me.owner.enemy) return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  var target = [];
                  for (var i = 0; i < me.owner.enemy.field.num_card(); i++) {
                    if (me.owner.enemy.field.get_distance(me.target, me.owner.enemy.field.card_list[i]) == 1) {
                      target.push(me.owner.enemy.field.card_list[i]);
                    }
                  }

                  var dmg = [];
                  for (var i = 0; i < target.length; i++) target.push(me.target.dmg());
                  me.owner.deal_dmg_many(dmg, me.target, target);
                }
                end_spell(me);
              }
            );
          },
          nothing,
          forced_target,
          random_target);
      }
    },
    'Eviscerate': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  if (me.owner.turn_card_play.length >= 2) {
                    me.owner.deal_dmg(me.spell_dmg(4), me, me.target);
                  }
                  else me.owner.deal_dmg(me.spell_dmg(2), me, me.target);
                }
                end_spell(me);
              }
            );
          },
          nothing,
          forced_target,
          random_target);
      }
    },
    'Blade Furry': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            if (me.owner.weapon) {
              var target = me.owner.enemy.get_all_character([me.owner.enemy.hero]);
              var dmg = [];
              for (var i = 0; i < target.length; i++) {
                dmg.push(me.spell_dmg(me.owner.hero_dmg()));
              }
              // Destroy weapon
              me.owner.weapon_dec_durability(me.owner.weapon.current_life, me);
            }
            end_spell(me);
          }
        );
      }
    },
    'SI:7 Agent': {
      on_play: function(me, bc, user_play, at) {
        if (user_play && me.owner.turn_card_play.length >= 2) {
          me.owner.select_one(me,
            function(c) {
              return true;
            },
            function() {
              me.owner.play_success(me, at, function(me, non_bc, bc) {
                if (bc && me.target) {
                  me.owner.deal_dmg(2, me, me.target);
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
    'Headcrack': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            me.owner.deal_dmg(me.spell_dmg(2), me, me.owner.enemy.hero);
            if (me.owner.turn_card_play.length >= 2) {
              me.owner.g_handler.add_handler(function(t) {
                return function(e, me) {
                  if (e.who == me.owner && me.owner.engine.current_turn == t) {
                    me.owner.hand_card('Headcrack');
                  }
                };
              }(me.owner.engine.current_turn + 1), 'turn_begin', me);
            }
            end_spell(me);
          }
        );
      }
    },
    'Perdition\'s Blade': {
      on_play: function(me, bc, user_play, at) {
        if (user_play) {
          me.owner.select_one(me,
            function(c) {
              return true;
            },
            function() {
              me.owner.play_success(me, at, function(me, non_bc, bc) {
                if (bc && me.target) {
                  if (me.owner.turn_card_play.length >= 2) {
                    me.owner.deal_dmg(2, me, me.target);
                  }
                  else {
                    me.owner.deal_dmg(1, me, me.target);
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
    'Master of Disguise': {
      on_play: function(me, bc, user_play, at) {
        if (user_play) {
          me.owner.select_one(me,
            function(c) {
              if (c.card_data.type == 'minion' && c.owner == me.owner) return true;
            },
            function() {
              me.owner.play_success(me, at, function(me, non_bc, bc) {
                if (bc && me.target) {
                  me.target.is_stealth.until = me.owner.engine.current_turn + 1;
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
    'Preparation': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            me.owner.engine.add_aura(function(t) {
              return function(m, c, me) {
                if (me.owner.engine.current_turn == t) {
                  // If no spell card is used after this card
                  var my_loc = 1000;
                  for (var i = 0; i < me.owner.turn_card_play.length; i++) {
                    // Location of 'Me' is found
                    if (me.owner.turn_card_play[i] == me) {
                      my_loc = i;
                    }
                    // If some spell card is used after Preparation
                    if (me.owner.turn_card_play[i].card_data.type == 'spell' && i > my_loc) {
                      return m;
                    }
                  }
                  return m - 3;
                }
              };
            }(me.owner.engine.current_turn), 'mana', me);
            end_spell(me);
          }
        );
      }
    },
    'Patient Assassin': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.attacker == me && e.victim.card_data.type == 'minion') {
                me.owner.instant_kill(me, e.victim);
              }
            }, 'take_dmg', me);
            me.is_stealth.until = 1000;
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Kidnapper': {
      on_play: function(me, bc, user_play, at) {
        if (user_play && me.owner.turn_card_play.length >= 2) {
          me.owner.select_one(me,
            function(c) {
              return true;
            },
            function() {
              me.owner.play_success(me, at, function(me, non_bc, bc) {
                if (bc && me.target) {
                  me.owner.return_to_hand(me.target, me);
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
    'Edwin VanCleef': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            var bef = me.owner.turn_card_play.length - 1;
            me.add_state(inc(2 * bef), 'dmg', me);
            me.add_state(inc(2 * bef), 'life', me);
            me.current_life += (2 * bef);
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
}());