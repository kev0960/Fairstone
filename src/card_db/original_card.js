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
    'Life Tap': {
      on_play: function(me) {
        me.owner.play_success(me, -1, function(me, non_bc, bc) {
          me.owner.deal_dmg(2, me, me.owner.hero);
          me.owner.draw_cards(1, null, me);
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
          function select_fail(me) {
            me.owner.power_used.did --;
          }, // on select failure
          forced_target); // if forced_target is enabled then we don't make user to choose
      }
    },
    'Shapeshift': {
      on_play: function(me) {
        me.owner.play_success(me, -1, function(me, non_bc, bc) {
          me.owner.add_hero_dmg(1);
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
          function select_fail(me) {
            me.owner.power_used.did --;
          }, // on select failure
          forced_target); // if forced_target is enabled then we don't make user to choose
      }
    },
    'Healing Totem': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.who == me.owner) {
                var target = me.owner.get_all_character([me.owner.hero]);

                var arr = [];
                for (var i = 0; i < target.length; i++) {
                  arr.push(1);
                }
                me.owner.heal_many(arr, me, target);
              }
            }, 'turn_end', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Searing Totem': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Stoneclaw Totem': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) me.add_state(null, 'taunt', me);
          end(me, non_bc, bc);
        });
      }
    },
    'Wrath of Air Totem': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.engine.add_aura(function(d, c, me) {
              if (c.owner == me.owner) return d + 1;
              return d;
            }, 'spell_dmg', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Totemic Call': {
      on_play: function(me) {
        me.owner.play_success(me, -1, function(me, non_bc, bc) {
          var avail = ['Healing Totem', 'Searing Totem', 'Stoneclaw Totem', 'Wrath of Air Totem'];
          var list = me.owner.get_all_character([me.owner.hero]);

          for (var i = 0; i < list.length; i++) {
            for (var j = 0; j < avail.length; j++) {
              if (avail[j] == list[i].card_data.name) {
                avail.splice(j, 1);
                break;
              }
            }
          }

          if (avail.length) me.owner.summon_card(rand(avail), 10);
          else me.owner.summon_card(rand(['Healing Totem', 'Searing Totem', 'Stoneclaw Totem', 'Wrath of Air Totem']), 10);
        });
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
            }, 'dmg', me);
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
    'Acidic Swamp Ooze': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if(bc) {
            if(me.owner.enemy.weapon) {
              me.owner.enemy.weapon_dec_durability(me.owner.enemy.weapon.current_life, this.hero);
            }
          }
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
            me.owner.engine.add_aura(function(d, c, me) {
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
            me.owner.engine.add_aura(function(d, c, me) {
              if (c.owner == me.owner && c.card_data.type == 'minion') return d + 1;
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
            me.owner.engine.add_aura(function(d, c, me) {
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
            me.owner.engine.add_aura(function(d, c, me) {
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
            me.owner.engine.add_aura(function(d, c, me) {
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
          if (non_bc) {
            me.add_state(function() {
              return 2;
            }, 'atk_num', me);
          }
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
            me.engine.add_aura(function(d, c, me) {
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
                  me.owner.silence(me, me.target);
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
            }, 'take_dmg', me);
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
              me.add_state(inc(1), 'dmg', me);
            }, 'destroyed', me);
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
                  me.owner.silence(me, me.target);
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
            me.owner.engine.add_aura(function(d, c, me) {
              if (me.owner.weapon && c == me.owner.weapon && me.current_life != me.life()) return d + 2;
              return d;
            }, 'dmg', me);
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
            me.owner.engine.add_aura(function(m, c, me) {
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
            }, 'summon', me);
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
                var target = me.owner.get_all_character([me.owner.hero])
                  .concat(me.owner.enemy.get_all_character([me.owner.enemy.hero]));
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
                var lucky = rand(target);

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
                  me.owner.summon_card(lucky.card_data.unique, loc);
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
                me.owner.engine.add_aura(function(d, c, me) {
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
            me.current_life += me.owner.hand.num_card();
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
              if (c.dmg() <= 2) return true;
            });
            if (target.length) me.owner.instant_kill(me, rand(target));
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
                var target = me.owner.get_all_character()
                  .concat(me.owner.enemy.get_all_character());
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
            me.owner.engine.add_aura(function(d, c, me) {
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
              if (c.card_data.type == 'murloc') return true;
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
              if (e.who == me.owner) {
                var target = me.owner.get_all_character([me.owner.hero])
                  .concat(me.owner.enemy.get_all_character([me.owner.enemy.hero]));
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
            me.owner.engine.add_aura(function(d, c, me) {
              if (c.owner == me.owner && c != me && c.card_data.kind == 'pirate') return d + 1;
              return d;
            }, 'dmg', me);
            me.owner.engine.add_aura(function(d, c, me) {
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
            me.owner.engine.add_aura(function(d, c, me) {
              if (c != me && c.card_data.kind == 'murloc') return d + 2;
              return d;
            }, 'dmg', me);
            me.owner.engine.add_aura(function(d, c, me) {
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
            for (var i = 0; i < me.owner.field.num_card(); i++) {
              if (me.owner.field.card_list[i].shield()) {
                me.owner.field.card_list[i].is_shielded.until = -1;
                num_shield++;
              }
            }
            for (var i = 0; i < me.owner.enemy.field.num_card(); i++) {
              if (me.owner.enemy.field.card_list[i].shield()) {
                me.owner.enemy.field.card_list[i].is_shielded.until = -1;
                num_shield++;
              }
            }

            me.add_state(inc(3 * num_shield), 'dmg', me);
            me.add_state(inc(3 * num_shield), 'life', me);
            me.current_life += 3 * num_shield;
          }
          if (non_bc) {
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
              if (c.card_data.type == 'minion' && c.dmg() >= 7) return true;
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
              if (c.card_data.type == 'minion') return true;
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
                if (chance(0.5)) me.owner.draw_cards(1);
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
            me.owner.engine.add_aura(function(t) {
              return function(m, c, me) {
                if (t == c.owner.engine.current_turn && c.owner != me.owner && c.card_data.type == 'spell') return 0;
                return m;
              };
            }(me.owner.engine.current_turn), 'mana', me);
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
              if (e.card.card_data.type == 'spell') {
                e.card.owner.enemy.hand_card(e.card.card_data.unique);
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
            me.owner.engine.add_aura(function(d, c, me) {
              if (c.owner == me.owner) return d + 1;
              return d;
            }, 'spell_dmg', me);

            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card == me) me.owner.draw_cards(1);
            }, 'deathrattle', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Bananas': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type == 'minion') return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                me.target.add_state(inc(1), 'dmg', me);
                me.target.add_state(inc(1), 'life', me);
                me.target.current_life += 1;
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
            var target = me.owner.get_all_character([me.owner.hero])
              .concat(me.owner.enemy.get_all_character([me.owner.enemy.hero]));
            me.owner.transform(me, rand(target), (chance(0.5) ? 'Devilsaur' : 'Squirrel'));
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Old Murk-eye': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.add_state(null, 'charge', me);
            me.add_state(function(d, c) {
              var target = c.owner.get_all_character([me], function(c) {
                  if (c.card_data.kind == 'murloc') return true;
                })
                .concat(c.owner.enemy.get_all_character([], function(c) {
                  if (c.card_data.kind == 'murloc') return true;
                }));
              return d + target.length;
            }, 'dmg', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Whelp': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Leeroy Jenkins': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.add_state(null, 'charge', me);
          }
          if (bc) {
            me.owner.enemy.summon_card('Whelp', 10);
            me.owner.enemy.summon_card('Whelp', 10);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Harrison Jones': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc && me.owner.enemy.weapon) {
            var d = me.owner.enemy.weapon.current_life;
            me.owner.enemy.weapon_dec_durability(d, me);
            me.owner.draw_cards(d);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Finkle Einhorn': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'The Beast': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card == me) {
                me.owner.enemy.summon_card('Finkle Einhorn', 10);
              }
            }, 'deathrattle', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Gnoll': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) me.add_state(null, 'taunt', me);
          end(me, non_bc, bc);
        });
      }
    },
    'Hogger': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.who == me.owner) {
                var pos = me.owner.field.get_pos(me);
                me.owner.summon_card('Gnoll', pos + 1);
              }
            }, 'turn_end', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Sylvanas Windrunner': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card == me) {
                var target = me.owner.enemy.get_all_character([me.owner.enemy.hero]);
                if (target.length) {
                  me.owner.take_control(rand(target), me);
                }
              }
            }, 'deathrattle', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Flame of Azzinoth': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Illidan Stormrage': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card.owner == me.owner) {
                var pos = me.owner.field.get_pos(me);
                me.owner.summon_card('Flame of Azzinoth', pos + 1);
              }
            }, 'play_card', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Baine Bloodhoof': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Cairne Bloodhoof': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card == me) {
                me.owner.summon_card('Baine Bloodhoof', me.last_position);
              }
            }, 'deathrattle', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'The Black Knight': {
      on_play: function(me, bc, user_play, at) {
        if (user_play) {
          me.owner.select_one(me,
            function(c) {
              if (c.card_data.type == 'minion' && c.chk_state('taunt')) return true;
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
    'Baron Geddon': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.who == me.owner) {
                var target = me.owner.get_all_character([me])
                  .concat(me.owner.enemy.get_all_character());
                var dmg = [];
                for (var i = 0; i < target.length; i++) {
                  dmg.push(2);
                }

                me.owner.deal_dmg_many(dmg, me, target);
              }
            }, 'turn_end', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Gruul': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              me.add_state(inc(1), 'dmg', me);
              me.add_state(inc(1), 'life', me);
              me.current_life += 1;
            }, 'turn_end', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Ragnaros the Firelord': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.who == me.owner) {
                var target = me.owner.enemy.get_all_character();
                me.owner.deal_dmg(8, me, rand(target));
              }
            }, 'turn_end', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Alexstrasza': {
      on_play: function(me, bc, user_play, at) {
        if (user_play) {
          me.owner.select_one(me,
            function(c) {
              if (c.card_data.type == 'hero') return true;
            },
            function() {
              me.owner.play_success(me, at, function(me, non_bc, bc) {
                if (bc && me.target) {
                  if (me.target.life() < 15) {
                    me.target.add_state(function() {
                      return 15;
                    }, 'life', me);
                  }
                  me.target.current_life = 15;
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
    'Onyxia': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            var num = 7 - me.owner.field.num_card();
            for (var i = 0; i < num; i++) me.owner.summon_card('Whelp', 10);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Ysera Awakens': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            var target = me.owner.get_all_character([], function(c) {
                if (c.card_data.name != 'Ysera') return true;
              })
              .concat(me.owner.enemy.get_all_character());

            var dmg = [];
            for (var i = 0; i < target.length; i++) {
              dmg.push(5);
            }
            me.owner.deal_dmg_many(dmg, me, target);
            end_spell(me);
          }
        );
      }
    },
    'Dream': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type == 'minion') return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                me.target.owner.return_to_hand(me.target, me);
                end_spell(me);
              }
            );
          },
          nothing, // on select failure
          forced_target, // if forced_target is enabled then we don't make user to choose
          random_target); // if random_target is enabled then Engine Randomly Selects Available Target
      }
    },
    'Laughing Sister': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.is_not_target.until = 1000;
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Nightmare': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type == 'minion') return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                me.owner.g_handler.add_handler(function(e, me, target) {
                  if (e.who == me.owner) {
                    me.owner.instant_kill(me, target);
                  }
                }, 'turn_begin', me, false, false, me.target);
                me.target.add_state(inc(5), 'dmg', me);
                me.target.add_state(inc(5), 'life', me);
                me.target.current_life += 5;
                end_spell(me);
              }
            );
          },
          nothing, // on select failure
          forced_target, // if forced_target is enabled then we don't make user to choose
          random_target); // if random_target is enabled then Engine Randomly Selects Available Target
      }
    },
    'Emerald Drake': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Ysera': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.who == me.owner) {
                var list = ['Ysera Awakens', 'Dream', 'Nightmare', 'Laughing Sister', 'Emerald Drake'];
                me.owner.hand_card(rand(list), 1);
              }
            }, 'turn_end', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Deathwing': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            var target = me.owner.get_all_character([me, me.owner.hero])
              .concat(me.owner.enemy.get_all_character([me.owner.enemy.hero]));

            me.owner.instant_kill_many(me, target);
            while (me.owner.hand.num_card()) {
              me.owner.discard_card(me.owner.hand.card_list[0], me);
            }
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Execute': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type == 'minion' && c.life() != c.current_life) return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) me.owner.instant_kill(me, me.target);
                end_spell(me);
              }
            );
          },
          nothing, // on select failure
          forced_target, // if forced_target is enabled then we don't make user to choose
          random_target); // if random_target is enabled then Engine Randomly Selects Available Target
      }
    },
    'Whirlwind': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            var target = me.owner.get_all_character([me.owner.hero])
              .concat(me.owner.enemy.get_all_character([me.owner.enemy.hero]));

            var dmg = [];
            for (var i = 0; i < target.length; i++) {
              dmg.push(me.spell_dmg(1));
            }
            me.owner.deal_dmg_many(dmg, me, target);
            end_spell(me);
          }
        );
      }
    },
    'Heroic Strike': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            me.owner.add_hero_dmg(4);
            end_spell(me);
          }
        );
      }
    },
    'Fiery War Axe': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Cleave': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            var target = me.owner.get_all_character([me.owner.hero])
              .concat(me.owner.enemy.get_all_character([me.owner.enemy.hero]));

            target = rand(target, 2);

            if (target.length) {
              var dmg = [];
              for (var i = 0; i < target.length; i++) {
                dmg.push(me.spell_dmg(1));
              }
              me.owner.deal_dmg_many(dmg, me, target);
            }
            end_spell(me);
          }
        );
      }
    },
    'Charge': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type == 'minion' && c.owner == me.owner) return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  me.target.make_charge(me);
                  me.target.add_state(inc(2), 'dmg', me);
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
    'Shield Block': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            me.owner.add_armor(5, me);
            me.owner.draw_cards(1);
            end_spell(me);
          }
        );
      }
    },
    'Warsong Commander': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.engine.add_aura(function(d, c, me) {
              if (c.chk_state('charge') && c.owner == me.owner) {
                return d + 1;
              }
              return d;
            }, 'dmg', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Kor\'kron Elite': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.add_state(null, 'charge', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Arcanite Reaper': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Inner Rage': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type == 'minion') return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  me.owner.deal_dmg(me.spell_dmg(1), me, me.target);
                  me.target.add_state(inc(2), 'dmg', me);
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
    'Slam': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type == 'minion') return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  spell_next_step(me, function(me) {
                    if (me.target.current_life > 0) me.owner.draw_cards(1);
                    end_spell(me);
                  });
                  me.owner.deal_dmg(me.spell_dmg(2), me, me.target);
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
    'Rampage': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type == 'minion' && c.current_life != c.life()) return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  me.target.add_state(inc(3), 'dmg', me);
                  me.target.add_state(inc(3), 'life', me);
                  me.current_life += 3;
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
    'Cruel Taskmaster': {
      on_play: function(me, bc, user_play, at) {
        if (user_play) {
          me.owner.select_one(me,
            function(c) {
              if (c.card_data.type == 'minion' && c.owner == me.owner) return true;
            },
            function() {
              me.owner.play_success(me, at, function(me, non_bc, bc) {
                if (bc && me.target) {
                  me.target.add_state(inc(2), 'dmg', me);
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
    'Battle Rage': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            var mine = me.owner.get_all_character([], function(c) {
              if (c.current_life != c.life()) return true;
            });

            me.owner.draw_cards(mine.length);
            end_spell(me);
          }
        );
      }
    },
    'Battle Axe': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Arathi Weaponsmith': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            me.owner.summon_card('Battle Axe');
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Heavy Axe': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Upgrade!': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            if (me.owner.weapon) {
              me.owner.weapon.add_state(inc(1), 'dmg', me);
              me.owner.weapon.add_state(inc(1), 'life', me);
              me.owner.weapon.current_life += 1;
            }
            else {
              me.owner.summon_card('Heavy Axe');
            }
            end_spell(me);
          }
        );
      }
    },
    'Armorsmith': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.victim.owner == me.owner && e.victim.card_data.type == 'minion') {
                me.owner.add_armor(1, me);
              }
            }, 'take_dmg', me, false);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Commanding Shout': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            me.owner.g_handler.add_handler(function(t) {
              return function(e, me) {
                if (e.victim.owner == me.owner && me.owner.engine.current_turn == t) {
                  var dmg = e.dmg;
                  if (e.victim.current_life - dmg < 1) {
                    e.attacker.dmg_given = (e.victim.current_life - 1);
                  }
                }
              };
            }(me.owner.engine.current_turn), 'pre_dmg', me);
            end_spell(me);
          }
        );
      }
    },
    'Frothing Berserker': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.victim.card_data.type == 'minion') {
                me.add_state(inc(1), 'dmg', me);
              }
            }, 'take_dmg', me, false);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Mortal Strike': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  if (me.owner.hero.current_life <= 12) {
                    me.owner.deal_dmg(me.spell_dmg(6), me, me.target);
                  }
                  else me.owner.deal_dmg(me.spell_dmg(4), me, me.target);
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
    'Shield Slam': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type == 'minion') return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  me.owner.deal_dmg(me.spell_dmg(me.owner.hero.armor), me, me.target);
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
    'Brawl': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            var target = me.owner.get_all_character([me.owner.hero])
              .concat(me.owner.enemy.get_all_character([me.owner.enemy.hero]));

            if (target.length) {
              var lucky = rand(target, 1);
              for (var i = 0; i < target.length; i++) {
                if (target[i] == lucky) {
                  target.splice(i, 1);
                  break;
                }
              }

              me.owner.instant_kill_many(me, target);
            }
            end_spell(me);
          }
        );
      }
    },
    'Gorehowl': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.who === me.owner.hero && e.target.card_data.type === 'minion' && me.owner.hero.weapon === me) {
                me.owner.hero.weapon.current_life += 1; // Does not Decrease its durability
              }
            }, 'attack', me, false);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Grommash Hellscream': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.add_state(function(d, c) {
              if (c.current_life != c.life()) {
                return d + 6;
              }
              return d;
            }, 'dmg', me);
            me.add_state(null, 'charge', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Arcane Missiles': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            me.owner.deal_multiple_dmg(me.spell_dmg(3), me, function() {
              return me.owner.enemy.get_all_character([], function(c) {
                if (c.current_life > 0) return true;
              });
            });
            end_spell(me);
          }
        );
      }
    },
    'Arcane Explosion': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            var target = me.owner.enemy.get_all_character([me.owner.enemy.hero]);
            var dmg = [];
            for (var i = 0; i < target.length; i++) {
              dmg.push(me.spell_dmg(1));
            }

            me.owner.deal_dmg_many(dmg, me, target);
            end_spell(me);
          }
        );
      }
    },
    'Frostbolt': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function() {
            return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                me.owner.deal_dmg(me.spell_dmg(3), me, me.target);
                me.target.is_frozen.until = me.owner.engine.current_turn + 1;
                end_spell(me);
              }
            );
          },
          nothing, // on select failure
          forced_target, // if forced_target is enabled then we don't make user to choose
          random_target); // if random_target is enabled then Engine Randomly Selects Available Target
      }
    },
    'Frost Nova': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            var target = me.owner.enemy.get_all_character([me.owner.enemy.hero]);
            for (var i = 0; i < target.length; i++) {
              target[i].is_frozen.until = me.owner.engine.current_turn + 1;
            }

            end_spell(me);
          }
        );
      }
    },
    'Arcane Intellect': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            me.owner.draw_cards(2);
            end_spell(me);
          }
        );
      }
    },
    'Water Elemental': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.attacker === me) {
                e.victim.is_frozen.until = me.owner.engine.current_turn + 1;
              }
            }, 'take_dmg', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Sheep': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Polymorph': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type == 'minion') return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  me.owner.transform(me, me.target, 'Sheep');
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
          random_target); // if random_target is enabled then Engine Randomly Selects Available Target
      }
    },
    'Flamestrike': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            var target = me.owner.enemy.get_all_character([me.owner.enemy.hero]);
            var dmg = [];
            for (var i = 0; i < target.length; i++) {
              dmg.push(me.spell_dmg(4));
            }

            me.owner.deal_dmg_many(dmg, me, target);
            end_spell(me);
          }
        );
      }
    },
    'Mana Wyrm': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card.owner === me.owner && e.card.card_data.type == 'spell') {
                me.add_state(inc(1), 'dmg', me);
              }
            }, 'play_card', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Ice Lance': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function() {
            return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target.is_frozen.until >= me.owner.engine.current_turn) {
                  me.owner.deal_dmg(me.spell_dmg(4), me, me.target);
                }
                else {
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
    'Sorcerer\'s Apprentice': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.engine.add_aura(function(m, c, me) {
              if (c.card_data.type == 'spell' && c.owner == me.owner) {
                return m - 1;
              }
              return m;
            }, 'mana', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Mirror Entity': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card.owner == me.owner.enemy && e.card.card_data.type == 'minion' &&
                me.owner.engine.current_player != me.owner) {
                me.owner.summon_card(e.card.card_data.unique, 10, false, function(c) {
                  me.owner.copy_minion(e.card, c);
                });
                me.status = 'destroyed';
              }
            }, 'after_play', me, true);
            end_spell(me);
          }
        );
      }
    },
    'Ice Barrier': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.victim == me.owner.hero &&
                me.owner.engine.current_player != me.owner) {
                me.owner.add_armor(8, me);
                me.status = 'destroyed';
              }
            }, 'pre_dmg', me, true);
            end_spell(me);
          }
        );
      }
    },
    'Cone of Cold': {
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

                var dmg = [];
                for (var i = 0; i < target.length; i++) {
                  target[i].is_frozen.until = me.owner.engine.current_turn + 1;
                  dmg.push(me.spell_dmg(1));
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
    'Counterspell': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card.owner == me.owner.enemy &&
                me.owner.engine.current_player != me.owner) {
                e.card.status = 'destroyed';
                me.status = 'destroyed';
              }
            }, 'play_card', me, true);
            end_spell(me);
          }
        );
      }
    },
    'Vaporize': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card.owner == me.owner.enemy && e.card.card_data.type == 'minion' &&
                me.owner.engine.current_player != me.owner) {
                me.owner.instant_kill(me, e.card);
              }
            }, 'propose_attack', me, true);
            end_spell(me);
          }
        );
      }
    },
    'Ethereal Arcanist': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.who == me.owner && me.owner.secret_list.length) {
                me.add_state(inc(2), 'dmg', me);
                me.add_state(inc(2), 'life', me);
                me.current_life += 2;
              }
            }, 'turn_end', me, false);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Ice Block': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.victim == me.owner.hero && !me.owner.chk_invincible(me.owner.hero) &&
                me.owner.engine.current_player != me.owner) {
                // Now carefully chk the dmg is actually lethal
                if (me.owner.hero.current_life + me.owner.hero.armor <= e.attacker.dmg_given) {
                  e.attacker.dmg_given = 0;
                  me.owner.hero.is_invincible.until = me.owner.engine.current_turn + 1;
                  me.status = 'destroyed';
                }
              }
            }, 'pre_dmg', me, true);
            end_spell(me);
          }
        );
      }
    },
    'Blizzard': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            var target = me.owner.enemy.get_all_character([me.owner.enemy.hero]);
            var dmg = [];
            for (var i = 0; i < target.length; i++) {
              dmg.push(me.spell_dmg(2));
            }

            me.owner.deal_dmg_many(dmg, me, target);

            for (var i = 0; i < target.length; i++) {
              target[i].is_frozen.turn = me.owner.engine.current_turn + 1;
            }
            end_spell(me);
          }
        );
      }
    },
    'Pyroblast': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function() {
            return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                me.owner.deal_dmg(me.spell_dmg(10), me, me.target);
                end_spell(me);
              }
            );
          },
          nothing, // on select failure
          forced_target, // if forced_target is enabled then we don't make user to choose
          random_target); // if random_target is enabled then Engine Randomly Selects Available Target
      }
    },
    'Archmage Antonidas': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card.owner === me.owner && e.card.card_data.type === 'spell') {
                me.owner.hand_card('Fireball');
              }
            }, 'play_card', me, false);
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
    get_card_names : function() {
      if(!card_names.length) {
        for(var x in card_do) {
          card_names.push(x);
        }
      }
      return card_names;
    }
  };
}());
