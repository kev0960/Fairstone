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

  function end_spell(me) {
    me.owner.end_spell_txt(me);
  }

  function nothing() {}

  var card_do = {
    'The Coin': {
      on_play: function(me) {
        me.owner.play_success(me, -1, function(me, non_bc, bc) {
          me.owner.current_mana += 1;
          if (me.owner.current_mana > 10) me.owner.current_mana = 10;

          end_spell(me);
        });
      }
    },
    'Murloc Scout': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Frog': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) me.add_state(function() {}, 'taunt', me);
          end(me, non_bc, bc);
        });
      }
    },
    'Boar': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Stonetusk Boar': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) me.make_charge(me);
          end(me, non_bc, bc);
        });
      }
    },
    'Murloc Raider': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Voodoo Doctor': {
      on_play: function(me, bc, user_play, at) {
        if (user_play) {
          me.owner.select_one(me,
            function(c) {
              if (c.card_data.type == 'minion' || c.card_data.type == 'hero') return true;
            },
            function() {
              me.owner.play_success(me, at, function(me, non_bc, bc) {
                if (bc) {
                  me.owner.heal(2, me, me.target);
                }
                end(me, non_bc, bc);
              });
            },
            function() {},
            false
          );
        }
      }
    },
    'Grimscale Oracle': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.engine.add_aura(function(dmg, c) {
              if (c.card_data.kind == 'murloc') return dmg + 1;
              return dmg;
            }, 'dmg', me)
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Elven Archer': {
      on_play: function(me, bc, user_play, at) {
        if (user_play) {
          me.owner.select_one(me,
            function(c) {
              return true;
            }, // can target anything
            function() {
              me.owner.play_success(me, at, function(me, non_bc, bc) {
                if (bc) {
                  me.owner.deal_dmg(1, me, me.target);
                }
                end(me, non_bc, bc);
              });
            },
            function() {},
            false
          );
        }
      }
    },
    'Goldshire Footman': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) me.add_state(function() {}, 'taunt', me);
          end(me, non_bc, bc);
        });
      }
    },
    'Murloc Tidehunter': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            me.owner.summon_card('Murloc Scout', at + 1);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'River Crocolisk': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Bloodfen Raptor': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Frostwolf Grunt': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) me.add_state(function() {}, 'taunt', me);
          end(me, non_bc, bc);
        });
      }
    },
    'Kobold Geomancer': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.engine.add_aura(function(d, c) {
              if (c.owner == me.owner) return d + 1;
              return d;
            }, 'spell_dmg', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Bluegill Warrior': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) me.add_state(null, 'charge', me);
          end(me, non_bc, bc);
        });
      }
    },
    'Novice Engineer': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            me.owner.draw_cards(1);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Razorfen Hunter': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            me.owner.summon_card('Boar', at + 1);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Raid Leader': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.engine.add_aura(function(d, c) {
              if (c.owner == me.owner) return d + 1;
              return d;
            }, 'dmg', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Wolf Rider': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) me.add_state(null, 'charge', me);
          end(me, non_bc, bc);
        });
      }
    },
    'Dalaran Mage': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.engine.add_aura(function(d, c) {
              if (c.owner == me.owner) return d + 1;
              return d;
            }, 'spell_dmg', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Shattered Sun Cleric': {
      on_play: function(me, bc, user_play, at) {
        if (user_play) {
          me.owner.select_one(me,
            function(c) {
              if (c.card_data.type == 'minion' && c.owner == me.owner) return true;
            },
            function() {
              me.owner.play_success(me, at, function(me, non_bc, bc) {
                if (bc) {
                  me.target.add_state(inc(1), 'dmg', me);
                  me.target.add_state(inc(1), 'life', me);
                  me.target.current_life += 1;
                }
                end(me, non_bc, bc);
              });
            },
            function() {},
            false
          );
        }
      }
    },
    'Ironfur Grizzly': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) me.add_state(null, 'taunt', me);
          end(me, non_bc, bc);
        });
      }
    },
    'Ironforge Rifleman': {
      on_play: function(me, bc, user_play, at) {
        if (user_play) {
          me.owner.select_one(me,
            function(c) {
              return true;
            }, // can target anything
            function() {
              me.owner.play_success(me, at, function(me, non_bc, bc) {
                if (bc) {
                  me.owner.deal_dmg(1, me, me.target);
                }
                end(me, non_bc, bc);
              });
            },
            function() {},
            false
          );
        }
      }
    },
    'Magma Rager': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Silverback Patriarch': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) me.add_state(null, 'taunt', me);
          end(me, non_bc, bc);
        });
      }
    },
    'Gnomish Inventor': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            me.owner.draw_cards(1);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Sen\'jin Shieldmasta': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) me.add_state(null, 'taunt', me);
          end(me, non_bc, bc);
        });
      }
    },
    'Chillwind Yeti': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Stormwind Knight': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) me.add_state(null, 'charge', me);
          end(me, non_bc, bc);
        });
      }
    },
    'Oasis Snapjaw': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Ogre Magi': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.engine.add_aura(function(d, c) {
              if (c.owner == me.owner) return d + 1;
              return d;
            }, 'spell_dmg', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Gurubashi Berserker': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.victim == me) {
                me.add_state(inc(3), 'dmg', me);
              }
            }, 'take_dmg', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Frostwolf Warlord': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            for (var i = 0; i < me.owner.field.num_card(); i++) {
              if (me.owner.field.card_list[i] != me) {
                me.add_state(inc(1), 'dmg', me);
                me.add_state(inc(1), 'life', me);
                me.current_life += 1;
              }
            }
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Stormpike Commando': {
      on_play: function(me, bc, user_play, at) {
        if (user_play) {
          me.owner.select_one(me,
            function(c) {
              return true;
            }, // can target anything
            function() {
              me.owner.play_success(me, at, function(me, non_bc, bc) {
                if (bc) {
                  me.owner.deal_dmg(2, me, me.target);
                }
                end(me, non_bc, bc);
              });
            },
            function() {},
            false
          );
        }
      }
    },
    'Nightblade': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            me.owner.deal_dmg(3, me, me.owner.enemy.hero);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Darkscale Healer': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            var target = me.owner.get_all_character();
            var heal = [];
            for(var i = 0; i < target.length; i ++) {
              heal.push(2);  
            }
            me.owner.heal_many(heal, me, me.owner.get_all_character());
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Archmage': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.engine.add_aura(function(d, c) {
              if (c.owner == me.owner) return d + 1;
              return d;
            }, 'spell_dmg', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Boulderfist Ogre': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Reckless Rocketeer': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) me.add_state(null, 'charge', me);
          end(me, non_bc, bc);
        });
      }
    },
    'Lord of the Arena': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) me.add_state(null, 'taunt', me);
          end(me, non_bc, bc);
        });
      }
    },
    'Stormwind Champion': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.engine.add_aura(function(d, c) {
              if (c.owner == me.owner && c != me) return d + 1;
              return d;
            }, 'dmg', me);
            me.owner.engine.add_aura(function(d, c) {
              if (c.owner == me.owner && c != me) return d + 1;
              return d;
            }, 'life', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Core Hound': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'War Golem': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Wisp': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Abusive Sergeant': {
      on_play: function(me, bc, user_play, at) {
        if (user_play) {
          me.owner.select_one(me,
            function(c) {
              if (c.card_data.type == 'minion' && c.owner == me.owner) return true;
            },
            function() {
              me.owner.play_success(me, at, function(me, non_bc, bc) {
                if (bc) {
                  me.target.add_state(function(turn) {
                    return function(dmg, me) {
                      if (turn == me.owner.engine.current_turn) {
                        return dmg + 2;
                      }
                      return dmg;
                    };
                  }(me.owner.engine.current_turn), 'dmg', me);
                }
                end(me, non_bc, bc);
              });
            },
            function() {},
            false
          );
        }
      }
    },
    'Worgen Infiltrator': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if(non_bc) {
            me.is_stealth.until = 1000; // Infinitely stealth 
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Shieldbearer': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) me.add_state(null, 'charge', me);
          end(me, non_bc, bc);
        });
      }
    },
    'Young Dragonhawk': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) me.add_state(function() { return 2; }, 'atk_num', me);
          end(me, non_bc, bc);
        });
      }
    },
    'Leper Gnome': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card == me) {
                me.owner.deal_dmg(2, me, me.owner.enemy.hero);
              }
            }, 'deathrattle', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Argent Squire': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) me.is_shielded.until = 1000; 
          end(me, non_bc, bc);
        });
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
          me.owner.play_success(me, at, function(me, non_bc, bc) {
            end(me, non_bc, bc);
          });
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
