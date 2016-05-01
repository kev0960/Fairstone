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
            var num = me.owner.enemy.hand.num_card() - me.ower.hand.num_card();
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
    'Wrath': {
      on_play: function(me, forced_target, random_target, forced_choose, random_choose) {
        me.owner.choose_one(me, ['EX1_154a', 'EX1_154b'],
          function choose_success(choice, me, forced_target, random_target) {
            console.log('Your CHOICE :: ', choice);
            if (choice == 0) {
              me.owner.select_one(me, function(c) {
                  return true;
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
                  return true;
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
                  return true;
                }, function select_success(me) {
                  me.owner.play_success(me, -1,
                    function(me) {
                      if (me.target) {
                        me.owner.deal_dmg(me.spell_dmg(3), me, me.target);
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
    'Keeper of the Grove': {
      on_play: function(me, bc, user_play, at) {
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
            false);
        }
        else {
          me.owner.play_success(me, at, function(me, non_bc, bc) {
            end(me, non_bc, bc);
          });
        }
      }
    }
  };
  module.exports = {
    load_card: function(c) {
      if (card_do[c]) return card_do[c];
      return null;
    },
    // Check whether certain card is implemented or not
    is_implemented: function(name) {
      if (card_do[name]) return true;
      return false;
    }
  };
}());