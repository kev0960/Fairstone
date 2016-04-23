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

  function rand(arr) {
    return arr[Math.floor(arr.length * Math.random())];
  }
  
  // returns true in probablity of odd
  function chance(odd) {
    return Math.random() < odd; 
  }

  function nothing() {}

  var card_do = {
    'Life Tap': {
      on_play: function(me) {
        me.owner.play_success(me, -1, function(me, non_bc, bc) {
          me.owner.deal_dmg(2, me, me.owner.hero);
          me.owner.draw_cards(1);
        });
      }
    },
    'Silver Hand Recruit': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Reinforce': {
      on_play: function(me) {
        me.owner.play_success(me, -1, function(me, non_bc, bc) {
          me.owner.summon_card('Silver Hand Recruit', 10);
        });
      }
    },
    'Lesser Heal': {
      on_play: function(me, forced_target) {
        me.owner.select_one(me, function() {
            return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                me.owner.heal(2, me, me.target);
              }
            );
          },
          nothing, // on select failure
          forced_target); // if forced_target is enabled then we don't make user to choose
      }
    },
    'Shape Shift': {
      on_play: function(me) {
        me.owner.play_success(me, -1, function(me, non_bc, bc) {
          me.owner.turn_dmg.dmg += 1;
          me.owner.turn_dmg.turn = me.owner.engine.current_turn;

          me.owner.add_armor(1, me);
        });
      }
    },
    'Steady Shot': {
      on_play: function(me) {
        me.owner.play_success(me, -1, function(me, non_bc, bc) {
          me.owner.deal_dmg(2, me, me.owner.enemy.hero);
        });
      }
    },
    'Armor Up!': {
      on_play: function(me) {
        me.owner.play_success(me, -1, function(me, non_bc, bc) {
          me.owner.add_armor(2, me);
        });
      }
    },
    'Dagger Mastery': {
      on_play: function(me) {
        me.owner.play_success(me, -1, function(me, non_bc, bc) {
          me.owner.summon_card('Dagger');
        });
      }
    },
    'Fireblast': {
      on_play: function(me, forced_target) {
        me.owner.select_one(me, function() {
            return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                me.owner.deal_dmg(1, me, me.target);
              }
            );
          },
          nothing, // on select failure
          forced_target); // if forced_target is enabled then we don't make user to choose
      }
    },
    'The Coin': {
      on_play: function(me) {
        me.owner.play_success(me, -1, function(me, non_bc, bc) {
          me.owner.current_mana += 1;
          if (me.owner.current_mana > 10) me.owner.current_mana = 10;

          end_spell(me);
        });
      }
    },
    'Imp': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
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
    'Violet Apprentice': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Damaged Golem': {
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
                if (bc && me.target) {
                  me.owner.heal(2, me, me.target);
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
                if (bc && me.target) {
                  me.owner.deal_dmg(1, me, me.target);
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
                if (bc && me.target) {
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
        else {
          me.owner.play_success(me, at, function(me, non_bc, bc) {
            end(me, non_bc, bc);
          });
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
                if (bc && me.target) {
                  me.owner.deal_dmg(1, me, me.target);
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
            for (var i = 0; i < target.length; i++) {
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
                if (bc && me.target) {
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
        else {
          me.owner.play_success(me, at, function(me, non_bc, bc) {
            end(me, non_bc, bc);
          });
        }
      }
    },
    'Worgen Infiltrator': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
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
          if (non_bc) me.add_state(function() {
            return 2;
          }, 'atk_num', me);
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
    'Dire Wolf Alpha': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.engine.add_aura(function(d, c) {
              if (me.owner.field.get_distance(me, c) == 1) return d + 1;
              return d;
            }, 'dmg', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Ironbeak Owl': {
      on_play: function(me, bc, user_play, at) {
        if (user_play) {
          me.owner.select_one(me,
            function(c) {
              if (c.card_data.type == 'minion') return true;
            },
            function() {
              me.owner.play_success(me, at, function(me, non_bc, bc) {
                if (bc && me.target) {
                  me.owner.silence(me, me.target)
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
    'Bloodsail Raider': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc && me.owner.weapon) {
            me.add_state(inc(me.owner.hero_dmg()), 'dmg', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Amani Berserker': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.add_state(function(d, c) {
              if (c.current_life != c.life()) {
                return d + 3;
              }
              return d;
            }, 'dmg', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Loot Hoarder': {
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
    'Youthful Brewmaster': {
      on_play: function(me, bc, user_play, at) {
        if (user_play) {
          me.owner.select_one(me,
            function(c) {
              if (c.card_data.type == 'minion' && c.owner == me.owner) return true;
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
    'Mad Bomber': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            me.owner.deal_multiple_dmg(3, me, function() {
              var l = me.owner.get_all_character([me]);
              return l.concat(me.owner.enemy.get_all_character());
            });
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Acolyte of Pain': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.engine.g_handler.add_handler(function(e, me) {
              if (e.victim == me) me.owner.draw_cards(1);
            }, 'take_dmg', me)
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Flesheating Ghoul': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.engine.g_handler.add_handler(function(e, me) {
              me.add_state(inc(1), 'dmg', me)
            }, 'destroyed', me)
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Earthen Ring Farseer': {
      on_play: function(me, bc, user_play, at) {
        if (user_play) {
          me.owner.select_one(me,
            function(c) {
              if (c.card_data.type == 'minion' || c.card_data.type == 'hero') return true;
            },
            function() {
              me.owner.play_success(me, at, function(me, non_bc, bc) {
                if (bc && me.target) {
                  me.owner.heal(3, me, me.target);
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
    'Jungle Panther': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.is_stealth.until = 1000; // Infinitely stealth 
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Scarlet Crusader': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) me.is_shielded.until = 1000;
          end(me, non_bc, bc);
        });
      }
    },
    'Thrallmar Farseer': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) me.add_state(function() {
            return 2;
          }, 'atk_num', me);
          end(me, non_bc, bc);
        });
      }
    },
    'Tauren Warrior': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.add_state(function(d, c) {
              if (c.current_life != c.life()) {
                return d + 3;
              }
              return d;
            }, 'dmg', me);
            me.add_state(null, 'taunt', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Harvest Golem': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card == me) {
                me.owner.summon_card('Damaged Golem', me.last_position);
              }
            }, 'deathrattle', me, false);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Dark Iron Dwarf': {
      on_play: function(me, bc, user_play, at) {
        if (user_play) {
          me.owner.select_one(me,
            function(c) {
              if (c.card_data.type == 'minion' && c.owner == me.owner) return true;
            },
            function() {
              me.owner.play_success(me, at, function(me, non_bc, bc) {
                if (bc && me.target) {
                  me.target.add_state(function(turn) {
                    return function(dmg, c) {
                      if (turn == c.owner.engine.current_turn) {
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
        else {
          me.owner.play_success(me, at, function(me, non_bc, bc) {
            end(me, non_bc, bc);
          });
        }
      }
    },
    'Ancient Brewmaster': {
      on_play: function(me, bc, user_play, at) {
        if (user_play) {
          me.owner.select_one(me,
            function(c) {
              if (c.card_data.type == 'minion' && c.owner == me.owner) return true;
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
    'Dread Corsair': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      },
      on_draw: function(me) {
        me.add_state(function(m, c) {
          if (c.weapon) {
            return m - c.owner.hero_dmg();
          }
          return m;
        }, 'mana', me);
      }
    },
    'Mogu\'shan Warden': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.add_state(null, 'taunt', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Silvermoon Guardian': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) me.is_shielded.until = 1000;
          end(me, non_bc, bc);
        });
      }
    },
    'Cult Master': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.engine.g_handler.add_handler(function(e, me) {
              if (e.destroyed.owner == me.owner && e.destroyed != me) {
                me.owner.draw_cards(1);
              }
            }, 'destroyed', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Spell Breaker': {
      on_play: function(me, bc, user_play, at) {
        if (user_play) {
          me.owner.select_one(me,
            function(c) {
              if (c.card_data.type == 'minion') return true;
            },
            function() {
              me.owner.play_success(me, at, function(me, non_bc, bc) {
                if (bc && me.target) {
                  me.owner.silence(me, me.target)
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
    'Stranglethorn Tiger': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.is_stealth.until = 1000; // Infinitely stealth 
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Fen Creeper': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) me.add_state(null, 'taunt', me);
          end(me, non_bc, bc);
        });
      }
    },
    'Spiteful Smith': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.engine.add_aura(function(d, c) {
              if (me.owner.weapon && c == me.owner.weapon && me.current_life != me.life()) return d + 2;
              return d;
            }, 'dmg', me)
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Squire': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Silver Hand Knight': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            me.owner.summon_card('Squire', at + 1);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Venture Co. Mercenary': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.engine.add_aura(function(m, c) {
              if (c.card_data.type == 'minion' && c.owner == me.owner) return m + 3;
              return m;
            }, 'mana', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Frost Elemental': {
      on_play: function(me, bc, user_play, at) {
        if (user_play) {
          me.owner.select_one(me,
            function(c) {
              return true;
            },
            function() {
              me.owner.play_success(me, at, function(me, non_bc, bc) {
                if (bc && me.target) {
                  me.target.is_frozen.until = me.owner.engine.current_turn + 1;
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
    'Windfury Harpy': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) me.add_state(function() {
            return 2;
          }, 'atk_num', me);
          end(me, non_bc, bc);
        });
      }
    },
    'Priestess of Elune': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            me.owner.heal(4, me, me.owner.hero);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Murloc Tidecaller': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card.card_data.kind == 'murloc') me.add_state(inc(1), 'dmg', me);
            }, 'summon', me)
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Bloodsail Corsair': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc && me.owner.enemy.weapon) {
            me.owner.enemy.weapon_dec_durability(1, me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Secretkeeper': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card.owner == me.owner && e.card.card_data.is_secret) {
                me.add_state(inc(1), 'dmg', me);
                me.add_state(inc(1), 'life', me);
                me.current_life += 1;
              }
            }, 'summon', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Light Warden': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              me.add_state(inc(2), 'dmg', me);
            }, 'heal', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Young Priestess': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.who == me.owner) {
                var target = me.owner.get_all_character([me, me.owner.hero]);
                if (target.length) {
                  var lucky = target[Math.floor(target.length * Math.random())];

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
    'Master Swordsmith': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.who == me.owner) {
                var target = me.owner.get_all_character([me, me.owner.hero]);
                if (target.length) {
                  var lucky = target[Math.floor(target.length * Math.random())];
                  lucky.add_state(inc(1), 'dmg', me);
                }
              }
            }, 'turn_end', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Angry Chicken': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.add_state(function(d, c) {
              if (c.current_life != c.life()) return d + 5;
              return d;
            }, 'dmg', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Ancient Watcher': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.add_state(function() {
              return 0;
            }, 'atk_num', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Crazed Alchemist': {
      on_play: function(me, bc, user_play, at) {
        if (user_play) {
          me.owner.select_one(me,
            function(c) {
              return true;
            },
            function() {
              me.owner.play_success(me, at, function(me, non_bc, bc) {
                if (bc && me.target) {
                  me.owner.swap_life_dmg(me, me.target);
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
    'Wild Pyromancer': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card.card_data.type == 'spell' && e.card.owner == me.owner) {
                var target = me.owner.get_all_character([me.owner.hero]).concat(me.owner.enemy.get_all_character([me.owner.enemy.hero]));
                var dmg = [];
                for (var i = 0; i < target.length; i++) {
                  dmg.push(1);
                }

                me.owner.deal_dmg_many(dmg, me, target);
              }
            }, 'summon', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Knife Juggler': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card.card_data.type == 'minion' && e.card.owner == me.owner && e.card != me) {
                var target = me.owner.enemy.get_all_character();
                var lucky = target[Math.floor(target.length * Math.random())];

                me.owner.deal_dmg(1, me, lucky);
              }
            }, 'summon', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Mana Wraith': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.engine.add_aura(function(m, c) {
              if (c.card_data.type == 'minion') return m + 1;
              return m;
            }, 'mana', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Mana Addict': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.engine.g_handler.add_handler(function(e, me) {
              if (e.card.owner == me.owner && e.card.card_data.type == 'spell') {
                me.add_state(function(t) {
                  return function(d, c) {
                    if (t == c.owner.engine.current_turn) {
                      return d + 2;
                    }
                    return d;
                  };
                }(me.owner.engine.current_turn), 'dmg', me);
              }
            }, 'play_card', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Sunfury Protector': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            for (var i = 0; i < me.owner.field.num_card(); i++) {
              if (me.owner.field.get_distance(me, me.owner.field.card_list[i]) == 1) {
                me.owner.field.card_list[i].add_state(null, 'taunt', me);
              }
            }
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Alarm-o-Bot': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.who == me.owner) {
                me.status = 'destroyed';
                var loc = me.owner.field.get_pos(me);
                me.owner.field.remove_card(me);

                var hand = me.owner.hand.card_list;
                if (hand.length) {
                  var lucky = me.owner.hand.card_list[Math.floor(me.owner.hand.num_card() * Math.random())];
                  me.owner.summon_card(lucky.card_data.name, loc);
                  me.owner.hand.remove_card(lucky);
                }
                me.owner.hand_card('Alarm-o-Bot');
              }
            }, 'turn_begin', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Injured Blademaster': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            me.owner.deal_dmg(4, me, me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Arcane Golem': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            this.enemy.boosted_mana += 1;
          }
          if (non_bc) {
            me.add_state(null, 'charge', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Coldlight Seer': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            var target = me.owner.get_all_character([me.owner.hero, me]).concat(me.owner.enemy.get_all_character([me.owner.enemy.hero]));
            for (var i = 0; i < target.length; i++) {
              if (target[i].card_data.kind == 'murloc') {
                target[i].add_state(inc(2), 'life', me);
                target[i].current_life += 2;
              }
            }
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Coldlight Oracle': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            me.owner.draw_cards(2);
            me.owner.enemy.draw_cards(2);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Imp Master': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.who == me.owner) {
                me.owner.deal_dmg(1, me, me);
                me.owner.summon_card('Imp', 10);
              }
            }, 'turn_end', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Mind Control Tech': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            if (me.owner.enemy.field.num_card() >= 4) {
              me.owner.take_control(rand(me.owner.enemy.field.card_list), me);
            }
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Questing Adventurer': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.engine.g_handler.add_handler(function(e, me) {
              if (e.card.owner == me.owner) {
                me.add_state(inc(1), 'dmg', me);
                me.add_state(inc(1), 'life', me);
                me.current_life += 1;
              }
            }, 'play_card', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Demolisher': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.engine.g_handler.add_handler(function(e, me) {
              if (e.who == me.owner) {
                var target = me.owner.enemy.get_all_character();
                var lucky = rand(target);

                me.owner.deal_dmg(2, me, lucky);
              }
            }, 'turn_begin', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Emperor Cobra': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.engine.g_handler.add_handler(function(e, me) {
              if (e.attacker == me) {
                me.owner.instant_kill(me, e.victim);
              }
            }, 'take_dmg', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Ancient Mage': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            for (var i = 0; i < me.owner.field.num_card(); i++) {
              if (me.owner.field.get_distance(me, me.owner.field.card_list[i]) == 1) {
                me.owner.engine.add_aura(function(d, c) {
                  if (c.owner == me.owner.field.card_list[i].owner) return d + 1;
                  return d;
                }, 'spell_dmg', me.owner.field.card_list[i]);
              }
            }
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Violet Teacher': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.engine.g_handler.add_handler(function(e, me) {
              if (e.card.owner == me.owner && e.card.card_data.type == 'spell') {
                var loc = me.owner.field.get_pos(me);
                me.owner.summon_card('Violet Apprentice', loc + 1);
              }
            }, 'play_card', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Defender of Argus': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            for (var i = 0; i < me.owner.field.num_card(); i++) {
              if (me.owner.field.get_distance(me, me.owner.field.card_list[i]) == 1) {
                me.owner.field.card_list[i].add_state(null, 'taunt', me);
                me.owner.field.card_list[i].add_state(inc(1), 'dmg', me);
                me.owner.field.card_list[i].add_state(inc(1), 'life', me);
                me.owner.field.card_list[i].current_life += 1;
              }
            }
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Twilight Drake': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            me.add_state(inc(me.owner.hand.num_card()), 'life', me);
            me.curret_life += me.owner.hand.num_card();
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Stampeding Kodo': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            var target = me.owner.enemy.get_all_character([me.owner.enemy.hero], function(c) {
              if(c.dmg() == 2) return true;
            });
            if(target.length) me.owner.instant_kill(me, rand(target));
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Abomination': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card == me) {
                var target = me.owner.get_all_character().concat(me.owner.enemy.get_all_character());
                var dmg = [];
                for (var i = 0; i < target.length; i++) {
                  dmg.push(2);
                }

                me.owner.deal_dmg_many(dmg, me, target);
              }
            }, 'deathrattle', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Azure Drake': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            me.owner.draw_cards(1);
          } 
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
    'Gadgetzan Auctioneer': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.engine.g_handler.add_handler(function(e, me) {
              if (e.card.owner == me.owner && e.card.card_data.type == 'spell') {
                me.owner.draw_cards(1);
              }
            }, 'play_card', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Sunwalker': {
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
    'Argent Commander': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.is_shielded.until = 1000;
            me.add_state(null, 'charge', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Ravenholdt Assassin': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.is_stealth.until = 1000; // Infinitely stealth 
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Hungry Crab': {
      on_play: function(me, bc, user_play, at) {
        if (user_play) {
          me.owner.select_one(me,
            function(c) {
              if(c.card_data.type == 'murloc') return true;
              return false; 
            },
            function() {
              me.owner.play_success(me, at, function(me, non_bc, bc) {
                if (bc && me.target) {
                  me.owner.instant_kill(me, me.target);
                  me.add_state(inc(2), 'dmg', me);
                  me.add_state(inc(2), 'life', me);
                  me.current_life += 2;
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
    'Doomsayer': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if(e.who == me.owner) {
                var target = me.owner.get_all_character([me.owner.hero]).concat(me.owner.enemy.get_all_character([me.owner.enemy.hero]));
                me.owner.instant_kill_many(me, target);
              }
            }, 'turn_begin', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Southsea Captain': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.engine.add_aura(function(d, c) {
              if (c.owner == me.owner && c != me && c.card_data.kind == 'pirate') return d + 1;
              return d;
            }, 'dmg', me);
            me.owner.engine.add_aura(function(d, c) {
              if (c.owner == me.owner && c != me && c.card_data.kind == 'pirate') return d + 1;
              return d;
            }, 'life', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Murloc Warleader': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.engine.add_aura(function(d, c) {
              if (c != me && c.card_data.kind == 'murloc') return d + 2;
              return d;
            }, 'dmg', me);
            me.owner.engine.add_aura(function(d, c) {
              if (c != me && c.card_data.kind == 'murloc') return d + 1;
              return d;
            }, 'life', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Blood Knight': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            var num_shield = 0;
            for(var i = 0; i < me.owner.field.num_card(); i ++) {
              if(me.owner.field.card_list[i].shield()) {
                me.owner.field.card_list[i].is_shielded.until = -1;
                num_shield ++;
              }
            }
            for(var i = 0; i < me.owner.enemy.field.num_card(); i ++) {
              if(me.owner.enemy.field.card_list[i].shield()) {
                me.owner.enemy.field.card_list[i].is_shielded.until = -1;
                num_shield ++;
              }
            }
            
            me.add_state(inc(3 * num_shield), 'dmg', me);
            me.add_state(inc(3 * num_shield), 'life', me);
            me.current_life += 3 * num_shield;
          }
          if(non_bc) {
             me.is_shielded.until = 1000;
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Big Game Hunter': {
      on_play: function(me, bc, user_play, at) {
        if (user_play) {
          me.owner.select_one(me,
            function(c) {
              if(c.card_data.type == 'minion' && c.dmg() >= 7) return true;
            },
            function() {
              me.owner.play_success(me, at, function(me, non_bc, bc) {
                if (bc && me.target) {
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
    'Faceless Manipulator': {
      on_play: function(me, bc, user_play, at) {
        if (user_play) {
          me.owner.select_one(me,
            function(c) {
              if(c.card_data.type == 'minion') return true;
            },
            function() {
              me.owner.play_success(me, at, function(me, non_bc, bc) {
                if (bc && me.target) {
                  me.owner.copy_minion(me.target, me);
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
    'Sea Giant': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      },
      on_draw: function(me) {
        me.add_state(function(m, c) {
          return m - (c.owner.field.num_card() + c.owner.enemy.field.num_card());
        }, 'mana', me);
      }
    },
    'Mountain Giant': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      },
      on_draw: function(me) {
        me.add_state(function(m, c) {
          return m - (c.owner.hand.num_card() - 1);
        }, 'mana', me);
      }
    },
    'Molten Giant': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      },
      on_draw: function(me) {
        me.add_state(function(m, c) {
          return m - (c.owner.hero.life() - c.owner.hero.current_life);
        }, 'mana', me);
      }
    },
    'Nat Pagle': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.who == me.owner) {
                  if(chance(0.5)) me.owner.draw_cards(1); 
              }
            }, 'turn_begin', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Millhouse Manastorm': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            me.owner.engine.add_aura(function(t) { return function(m, c) {
              if(t == c.owner.engine.current_turn && c.owner != me.owner && c.card_data.type == 'spell') return 0;
              return m;
            }; }(me.owner.engine.current_turn), 'mana', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Lorewalker Cho': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if(e.card.card_data.type == 'spell') {
                e.card.owner.enemy.hand_card(e.card.card_data.name);
              }
            }, 'play_card', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Bloodmage Thalnos': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.engine.add_aura(function(d, c) {
              if (c.owner == me.owner) return d + 1;
              return d;
            }, 'spell_dmg', me);
            
            me.owner.g_handler.add_handler(function(e, me) {
              if(e.card == me) me.owner.draw_cards(1);
            }, 'deathrattle', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Bananas': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if(c.card_data.type == 'minion') return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                me.target.add_state(inc(1), 'dmg', me);
                me.target.add_state(inc(1), 'life', me);
                me.current_life += 1;
              }
            );
          },
          nothing, // on select failure
          forced_target,
          random_target);
      }
    },
    'King Mukla': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            me.owner.enemy.hand_card('Bananas', 2);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Devilsaur': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Squirrel': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Tinkmaster Overspark': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            me.owner.enemy.hand_card('Bananas', 2);
          }
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
          random_target);  // if random_target is enabled then Engine Randomly Selects Available Target
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
              }(me));
            }
          }, 'propose_attack', me, true);
          end_spell(me);
        });
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
