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
    'Gadgetzan Jouster': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc && me.owner.joust()) {
            me.add_state(inc(1), 'dmg', me);
            me.add_state(inc(1), 'life', me);
            me.current_life += 1;
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Tournament Attendee': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.add_state(null, 'taunt', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Lowly Squire': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.who == me.owner) {
                me.add_state(inc(1), 'dmg', me);
              }
            }, 'inspire', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Flame Juggler': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            var enemy = rand(me.owner.enemy.get_all_character());
            me.owner.deal_dmg(1, me, enemy);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Lance Carrier': {
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
    'Boneguard Lieutenant': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.who == me.owner) {
                me.add_state(inc(1), 'life', me);
                me.current_life += 1;
              }
            }, 'inspire', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Silent Knight': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.is_shielded.until = 1000;
            me.is_stealth.until = 1000;
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Ice Rager': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Dragonhawk Rider': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.who == me.owner) {
                me.add_state(function(turn) {
                  return function(n, me) {
                    if (me.owner.engine.current_turn == turn) {
                      return 2;
                    }
                    return n;
                  }
                }(this.engine.current_turn), 'atk_num', me);
              }
            }, 'inspire', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Silver Hand Regent': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.who == me.owner) {
                me.owner.summon('Silver Hand Recruit', me.owner.field.get_pos(me) + 1);
              }
            }, 'inspire', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Argent Horserider': {
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
    'Evil Heckler': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) me.add_state(null, 'taunt', me);
          end(me, non_bc, bc);
        });
      }
    },
    'Frigid Snobold': {
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
    'Tournament Medic': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.who == me.owner) {
                me.owner.heal(2, me, me.owner.hero);
              }
            }, 'inspire', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Refreshment Vendor': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            me.owner.heal(4, me, me.owner.hero);
            me.owner.heal(4, me, me.owner.enemy.hero);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Maiden of the Lake': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.engine.add_aura(function(m, c, me) {
              if (c.type == 'hero_power' && c.owner == me.owner) {
                return 1;
              }
              return m;
            }, 'mana', me)
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Pit Fighter': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Mukla\'s Champion': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.who == me.owner) {
                var mine = me.owner.get_all_character([me, me.owner.hero]);
                for (var i = 0; i < mine.length; i++) {
                  mine[i].add_state(inc(1), 'dmg', me);
                  mine[i].add_state(inc(1), 'life', me);
                  mine[i].current_life += 1;
                }
              }
            }, 'inspire', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Kvaldir Raider': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.who == me.owner) {
                me.add_state(inc(2), 'dmg', me);
                me.add_state(inc(2), 'life', me);
                me.current_life += 2;
              }
            }, 'inspire', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Clockwork Knight': {
      on_play: function(me, bc, user_play, at) {
        if (user_play) {
          me.owner.select_one(me,
            function(c) {
              if (c.card_data.type == 'minion' && c.owner == me.owner && c.card_data.kind == 'mech') return true;
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
    'Captured Jormungar': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'North Sea Kraken': {
      on_play: function(me, bc, user_play, at) {
        if (user_play) {
          me.owner.select_one(me,
            function(c) {
              return true;
            },
            function() {
              me.owner.play_success(me, at, function(me, non_bc, bc) {
                if (bc && me.target) {
                  me.owner.deal_dmg(4, me, me.target);
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
    'Injured Kvaldir': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) me.owner.deal_dmg(3, me, me);
          end(me, non_bc, bc);
        });
      }
    },
    'Argent Watchmen': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.add_state(function() {
              return 0;
            }, 'atk_num', me);
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.who == me.owner) {
                me.add_state(function(turn) {
                  return function(n, me) {
                    if (me.owner.engine.current_turn == turn) {
                      return 1;
                    }
                    return n;
                  }
                }(this.engine.current_turn), 'atk_num', me);
              }
            }, 'inspire', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Coliseum Manager': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.who == me.owner) {
                me.owner.return_to_hand(me, me);
              }
            }, 'inspire', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Light\'s Champion': {
      on_play: function(me, bc, user_play, at) {
        if (user_play) {
          me.owner.select_one(me,
            function(c) {
              if (c.card_data.type == 'minion' && c.card_data.kind == 'devil') return true;
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
    'Saboteur': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            me.owner.engine.add_aura(function(t) {
              return function(m, c, me) {
                if (c.type == 'hero_power' && c.owner == me.owner.enemy && t == me.owner.engine.current_turn) {
                  return m + 5;
                }
                return m;
              };
            }(me.owner.engine.current_turn + 1), 'mana', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Armored Warhorse': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            if (me.owner.joust()) {
              me.add_state(null, 'charge', me);
            }
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Master Jouster': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            if (me.owner.joust()) {
              me.add_state(null, 'taunt', me);
              me.is_shielded.until = 1000;
            }
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Garrison Commander': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.engine.add_aura(function(n, c, me) {
              if (c.owner == me.owner) return 2;
            }, 'hero_power_num', me);
            me.owner.update_hero_power();
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Master of Ceremonies': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            if (me.spell_dmg(1) != 1) {
              me.add_state(inc(2), 'dmg', me);
              me.add_state(inc(2), 'life', me);
              me.current_life += 2;
            }
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Crowd Favorite': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card.owner == me.owner) {
                if (e.card.chk_mech('battlecry')) {
                  me.add_state(inc(1), 'dmg', me);
                  me.add_state(inc(1), 'life', me);
                  me.current_life += 1;
                }
              }
            }, 'play_card', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Twilight Guardian': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            for (var i = 0; i < me.owner.hand.num_card(); i++) {
              if (me.owner.hand.card_list[i].card_data.kind == 'dragon') {
                me.add_state(null, 'taunt', me);
                me.add_state(inc(1), 'life', me);
                me.current_life += 1;
                break;
              }
            }
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Recruiter': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.who == me.owner) {
                me.owner.hand_card('Squire', 1);
              }
            }, 'inspire', me);
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
    'Grand Crusader': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            var lucky = rand(me.owner.engine.find_card_cond(function(c) {
              if (c.job == 'paladin' && !c.is_token) return true;
            }));
            me.owner.hand(lucky.unique, 1);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Kodorider': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.who == me.owner) {
                me.owner.summon('War Kodo', me.owner.field.get_pos(me) + 1);
              }
            }, 'inspire', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'War Kodo': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
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
          var num = me.owner.g_handler.search_legacy_queue(function(e) {
            if (e.event_type == 'inspire' && e.who == me.owner) return true;
          }).length;
          return m - num;
        }, 'mana', me);
      }
    },
    'Eydis Darkbane': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.who == me) {
                var enemy = me.owner.enemy.get_all_character();
                me.owner.deal_dmg(3, me, rand(enemy));
              }
            }, 'target', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Fjola Lightbane': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.who == me) {
                me.is_shielded.until = 1000;
              }
            }, 'target', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Gormok the Impaler': {
      on_play: function(me, bc, user_play, at) {
        if (user_play && me.owner.field.num_card() >= 4) {
          me.owner.select_one(me,
            function(c) {
              return true;
            },
            function() {
              me.owner.play_success(me, at, function(me, non_bc, bc) {
                if (bc && me.target) {
                  me.owner.deal_dmg(4, me, me.target);
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
    'Nexus-Champion Saraad': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.who == me.owner) {
                var lucky = rand(me.owner.engine.find_card_cond(function(c) {
                  if (c.type == 'spell' && !c.is_token) return true;
                }));
                me.owner.hand_card(lucky.unique, 1);
              }
            }, 'inspire', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Bolf Ramshield': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.victim == me.owner.hero) {
                var dmg = e.attacker.dmg_given;
                e.attacker.dmg_given = 0;
                me.owner.deal_dmg(dmg, me, me);
              }
            }, 'pre_dmg', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Soul Tap': {
      on_play: function(me) {
        me.owner.play_success(me, -1, function(me, non_bc, bc) {
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
    'The Silver Hand': {
      on_play: function(me) {
        me.owner.play_success(me, -1, function(me, non_bc, bc) {
          me.owner.summon_card('Silver Hand Recruit', 10);
          me.owner.summon_card('Silver Hand Recruit', 10);
        });
      }
    },
    'Heal': {
      on_play: function(me, forced_target) {
        me.owner.select_one(me, function() {
            return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                me.owner.heal(4, me, me.target);
              }
            );
          },
          nothing, // on select failure
          forced_target); // if forced_target is enabled then we don't make user to choose
      }
    },
    'Dire Shapeshift': {
      on_play: function(me) {
        me.owner.play_success(me, -1, function(me, non_bc, bc) {
          me.owner.add_hero_dmg(2);
          me.owner.add_armor(2, me);
        });
      }
    },
    'Ballista Shot': {
      on_play: function(me) {
        me.owner.play_success(me, -1, function(me, non_bc, bc) {
          me.owner.deal_dmg(3, me, me.owner.enemy.hero);
        });
      }
    },
    'Tank Up!': {
      on_play: function(me) {
        me.owner.play_success(me, -1, function(me, non_bc, bc) {
          me.owner.add_armor(4, me);
        });
      }
    },
    'Poisoned Daggers': {
      on_play: function(me) {
        me.owner.play_success(me, -1, function(me, non_bc, bc) {
          me.owner.summon_card('Poisoned Dagger');
        });
      }
    },
    'Poisoned Dagger': {
      on_play: function(me) {
        me.owner.play_success(me, -1, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Fireblast Rank 2': {
      on_play: function(me, forced_target) {
        me.owner.select_one(me, function() {
            return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                me.owner.deal_dmg(2, me, me.target);
              }
            );
          },
          nothing, // on select failure
          forced_target); // if forced_target is enabled then we don't make user to choose
      }
    },
    'Totemic Slam': {
      on_play: function(me) {
        me.owner.play_success(me, -1, function(me, non_bc, bc) {
          var avail = ['Healing Totem', 'Searing Totem', 'Stoneclaw Totem', 'Wrath of Air Totem'];
          me.owner.choose_one(me, avail,
            function(choice) {
              me.owner.summon_card(avail[choice], 10);
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
    'Justicar Trueheart': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            var change = {
              'warrior': 'Tank Up!',
              'warlock': 'Soul Tap',
              'paladin': 'Silver Hand',
              'mage': 'Fireblast Rank 2',
              'rogue': 'Poisoned Daggers',
              'hunter': 'Ballista Shot',
              'druid': 'Dire Shapeshift',
              'shaman': 'Totemic Slam',
              'priest': 'Heal'
            }[me.owner.hero.card_data.job];
            me.owner.change_hero_power(change);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'The Skeleton Knight': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card == me) {
                if (me.owner.joust()) {
                  me.owner.hand_card('The Skeleton Knight', 1);
                }
              }
            }, 'deathrattle', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Chillmaw': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card == me) {
                for (var i = 0; i < me.owner.hand.num_card(); i++) {
                  if (me.owner.hand.card_list[i].card_data.kind == 'dragon') {
                    var target = me.owner.get_all_character([me.owner.hero])
                      .concat(me.owner.enemy.get_all_character([me.owner.enemy.hero]));

                    var dmg = [];
                    for (var i = 0; i < target.length; i++) {
                      dmg.push(3);
                    }
                    me.owner.deal_dmg_many(dmg, me, target);
                    break;
                  }
                }
              }
            }, 'deathrattle', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Skycap\'n Kragg': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.add_state(null, 'charge', me);
          }
          end(me, non_bc, bc);
        });
      },
      on_draw: function(me) {
        me.add_state(function(m, me) {
          return m - (me.owner.get_all_character([me.owner.hero], function(c) {
            if (c.card_data.kind == 'pirate') return true;
          }).length);
        }, 'mana', me);
      }
    },
    'Icehowl': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.add_state(null, 'charge', me);
            me.no_hero_attack = true;
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Bolster': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            var mine = me.owner.get_all_character([me.owner.hero]);
            for (var i = 0; i < mine.length; i++) {
              if (mine[i].chk_state('taunt')) {
                mine[i].add_state(inc(2), 'dmg', me);
                mine[i].add_state(inc(2), 'life', me);
                mine[i].current_life += 2;
              }
            }
            end_spell(me);
          }
        );
      }
    },
    'Bash': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  me.owner.deal_dmg(me.spell_dmg(3), me, me.target);
                  me.owner.add_armor(3, me);
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
    'Orgrimmar Aspirant': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.who == me.owner && me.owner.weapon) {
                me.owner.weapon.add_state(inc(1), 'dmg', me);
              }
            }, 'inspire', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Sparring Partner': {
      on_play: function(me, bc, user_play, at) {
        if (user_play) {
          me.owner.select_one(me,
            function(c) {
              if (c.card_data.type == 'minion') return true;
            },
            function() {
              me.owner.play_success(me, at, function(me, non_bc, bc) {
                if (bc && me.target) {
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
    'Alexstrasza\'s Champion': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            for (var i = 0; i < me.owner.hand.num_card(); i++) {
              if (me.owner.hand.card_list[i].card_data.kind == 'dragon') {
                me.add_state(null, 'charge', me);
                me.add_state(inc(1), 'dmg', me);
                break;
              }
            }
          }
          end(me, non_bc, bc);
        });
      }
    },
    'King\'s Defender': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            var num = me.owner.get_all_character([me.owner.hero],
              function(c) {
                if (c.chk_state('taunt')) return true;
              }).length;
            if (num) {
              me.add_state(inc(1), 'life', me);
              me.current_life += 1;
            }
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Magnataur Alpha': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.who == me) {
                var target = [],
                  dmg = [];
                for (var i = 0; i < me.owner.enemy.field.num_card(); i++) {
                  if (me.owner.enemy.field.get_distance(me.owner.enemy.field.card_list[i], e.target) == 1) {
                    target.push(me.owner.enemy.field.card_list[i]);
                    dmg.push(me.dmg());
                  }
                }
                if (target.length) me.owner.deal_dmg_many(dmg, me, target);
              }
            }, 'attack', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Sea Reaver': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card == me) {
                var mine = me.owner.get_all_character([me, me.owner.hero]);
                var dmg = [];
                for (var i = 0; i < mine.length; i++) {
                  dmg.push(1);
                }

                me.owner.deal_dmg_many(dmg, me, mine);
              }
            }, 'play_card', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Varian Wrynn': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            me.owner.draw_cards(3, function(c) {
              if (c.card_data.type == 'minion') {
                me.owner.summon_card(c.card_data.unique, 10);
                me.owner.hand.remove_card(c);
              }
            });
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Ancestral Knowledge': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            me.owner.draw_cards(2);
            me.owner.add_overload(2, me);
            end_spell(me);
          }
        );
      }
    },
    'Totem Golem': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (user_play) {
            me.owner.add_overload(1, me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Tuskarr Totemic': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            var lucky = rand(me.owner.engine.find_card_cond(function(c) {
              if (c.kind == 'totem' && !c.is_token) return true;
            }));
            me.owner.summon_card(lucky.unique, at + 1);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Healing Wave': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  if (me.owner.joust()) {
                    me.owner.heal(14, me, me.target);
                  }
                  else {
                    me.owner.heal(7, me, me.target);
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
    'Draenei Totemcarver': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            var mine = me.owner.get_all_character([me], function(c) {
              if (c.card_data.kind == 'totem') return true;
            }).length;

            me.add_state(inc(mine), 'dmg', me);
            me.add_state(inc(mine), 'life', me);
            me.current_life += mine;
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Thunder Bluff Valiant': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.who == me.owner) {
                for (var i = 0; i < me.owner.field.num_card(); i++) {
                  if (me.owner.field.card_list[i].card_data.kind == 'totem') {
                    me.owner.field.card_list[i].add_state(inc(2), 'dmg', me);
                    me.owner.field.card_list[i].add_state(inc(2), 'life', me);
                    me.owner.field.card_list[i].current_life += 2;
                  }
                }
              }
            }, 'inspire', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Elemental Destruction': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            var target = me.owner.get_all_character([me.owner.hero])
              .concat(me.owner.enemy.get_all_character([me.owner.enemy.hero]));

            var dmg = [];
            for (var i = 0; i < target.length; i++) {
              if (chance(0.5)) dmg.push(me.spell_dmg(5));
              else dmg.push(me.spell_dmg(4));
            }
            me.owner.deal_dmg_many(dmg, me, target);
            end_spell(me);
          }
        );
      }
    },
    'Charged Hammer': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card == me) {
                me.owner.change_hero_power('Lightning Jolt');
              }
            }, 'deathrattle', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Lightning Jolt': {
      on_play: function(me, forced_target) {
        me.owner.select_one(me, function() {
            return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                me.owner.deal_dmg(2, me, me.target);
              }
            );
          },
          nothing, // on select failure
          forced_target); // if forced_target is enabled then we don't make user to choose
      }
    },
    'The Mistcaller': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card.owner == me.owner) {
                e.card.add_state(inc(1), 'dmg', me);
                e.card.add_state(inc(1), 'life', me);
                e.card.current_life += 1;
              }
            }, 'draw_card', me, false, true);
            for (var i = 0; i < me.owner.hand.num_card(); i++) {
              if (me.owner.hand.card_list[i].card_data.type == 'minion') {
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
    'Buccaneer': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card.owner == me.owner && e.card.card_data.type == 'weapon') {
                e.card.add_state(inc(1), 'dmg', me);
              }
            }, 'summon', me, false, true);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Undercity Valiant': {
      on_play: function(me, bc, user_play, at) {
        if (user_play && me.owner.turn_card_play.length >= 2) {
          me.owner.select_one(me,
            function(c) {
              return true;
            },
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
    'Shado-Pan Rider': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (user_play && me.owner.turn_card_play.length >= 2 && non_bc) {
            me.add_state(inc(3), 'dmg', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Cutpurse': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.attacker == me && e.victim == me.owner.enemy.hero) {
                me.owner.hand_card('The Coin', 1);
              }
            }, 'attack', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Burgle': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            var lucky = rand(me.owner.engine.find_card_cond(function(c) {
              if (c.job == me.owner.enemy.hero.card_data.job && !c.is_token) return true;
            }), 2);
            for (var i = 0; i < 2; i++) me.owner.hand_card(lucky[i].unique, 1);
            end_spell(me);
          }
        );
      }
    },
    'Shady Dealer': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            for (var i = 0; i < me.owner.field.num_card(); i++) {
              if (me.owner.field.card_list[i].card_data.kind == 'pirate') {
                me.add_state(inc(1), 'dmg', me);
                me.add_state(inc(1), 'life', me);
                me.current_life += 1;
                break;
              }
            }
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Anub\'arak': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card == me) {
                me.owner.hand_card(me.card_data.unique, 1);
                me.owner.summon_card('Nerubian', 10);
              }
            }, 'deathrattle', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Nerubian': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Seal of Champions': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type == 'minion') return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  me.target.add_state(inc(3), 'life', me);
                  me.target.current_life += 3;
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
    'Warhorse Trainer': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.engine.add_aura(function(d, c, me) {
              if (c.owner == me.owner && c.card_data.name == 'Silver Hand Recruit') {
                return d + 1;
              }
              return d;
            }, 'dmg', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Murloc Knight': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.who == me.owner) {
                var lucky = rand(me.owner.engine.find_card_cond(function(c) {
                  if (c.kind == 'murloc' && !c.is_token) return true;
                }));
                me.owner.summon_card(lucky.unique, me.owner.field.get_pos(me));
              }
            }, 'inspire', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Competitive Spirit': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            me.owner.g_handler.add_hander(function(e, me) {
              if (e.who == me.owner && me.owner.field.num_card()) {
                for (var i = 0; i < me.owner.field.num_card(); i++) {
                  me.owner.field.card_list[i].add_state(inc(1), 'dmg', me);
                  me.owner.field.card_list[i].add_state(inc(1), 'life', me);
                  me.owner.field.card_list[i].current_life += 1;
                }
                me.status = 'destroyed';
              }
            }, 'turn_begin', me, true);
            end_spell(me);
          }
        );
      }
    },
    'Argent Lance': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            if (me.owner.joust()) {
              me.add_state(inc(1), 'life', me);
              me.current_life += 1;
            }
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Tuskarr Jouster': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            if (me.owner.joust()) {
              me.owner.heal(7, me, me.owner.hero);
            }
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Enter the Coliseum': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            var my_high, enemy_high;
            if (me.owner.field.num_card()) {
              my_high = me.owner.field.card_list[0];
              for (var i = 1; i < me.owner.field.num_card(); i++) {
                if (my_high.dmg() < me.owner.field.card_list[i].dmg()) {
                  my_high = me.owner.field.card_list[i];
                }
              }
            }
            if (me.owner.enemy.field.num_card()) {
              enemy_high = me.owner.enemy.field.card_list[0];
              for (var i = 1; i < me.owner.enemy.field.num_card(); i++) {
                if (enemy_high.dmg() < me.owner.enemy.field.card_list[i].dmg()) {
                  enemy_high = me.owner.enemy.field.card_list[i];
                }
              }
            }

            var target = me.owner.get_all_character([me.owner.hero, my_high]).concat(
              me.owner.enemy.get_all_character([me.owner.enemy.hero, enemy_high])
            );

            me.owner.instant_kill_many(me, target);
            end_spell(me);
          }
        );
      }
    },
    'Mysterious Challenger': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            for (var i = 0; i < me.owner.deck.num_card(); i++) {
              var card = me.owner.deck.card_list[i];
              if (card.card_data.is_secret) {
                for (var j = 0; j < me.owner.secret_list; j++) {
                  if (me.owner.secret_list[j].card_data.name != card.card_data.name && me.owner.secret_list.length < 5) {
                    me.owner.deck.remove_card(card);
                    me.owner.summon_card(card.card_data.unique, 1);
                    break;
                  }
                }
              }
            }
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Eadric the Pure': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            var target = me.owner.enemy.get_all_character([me.owner.enemy.hero]);
            for (var i = 0; i < target.length; i++) {
              target[i].add_state(function() {
                return 1;
              }, 'dmg', me);
            }
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Brave Archer': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.who == me.owner && me.owner.hand.num_card() == 0) {
                me.owner.deal_dmg(2, me, me.owner.enemy.hero);
              }
            }, 'inspire', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Bear Trap': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.victim == me.owner.hero && (e.attacker.card_data.type == 'minion' || e.attacker.card_data.type == 'hero') && me.owner.engine.current_player != me.owner && e.attacker.is_attacking && me.owner.field.num_card() <= 7) { // Activates only when attacking hero
                me.owner.summon_card('Bear', 10);
                me.status = 'destroyed';
              }
            }, 'take_dmg', me, true);
            end_spell(me);
          }
        );
      }
    },
    'King\'s Elekk': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            me.owner.joust(function(result, mine) {
              if (result) me.owner.hand_card(mine.card_data.unique, 1);
            });
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Powershot': {
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
    'Ram Wrangler': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            for (var i = 0; i < me.owner.field.num_card(); i++) {
              if (me.owner.field.card_list[i].card_data.kind == 'beast') {
                var lucky = rand(me.owner.engine.find_card_cond(function(c) {
                  if (c.job == 'hunter' && !c.is_token) return true;
                }));
                me.owner.summon_card(lucky.unique, at + 1);
                break;
              }
            }
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Webspinner': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card == me) {
                var lucky = rand(me.owner.engine.find_card_cond(function(c) {
                  if (c.kind == 'beast' && !c.is_token) return true;
                }));
                me.owner.hand_card(lucky.unique, 1);
              }
            }, 'deathrattle', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Ball of Spiders': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            me.owner.summon_card('Webspinner', 10);
            me.owner.summon_card('Webspinner', 10);
            me.owner.summon_card('Webspinner', 10);
            end_spell(me);
          }
        );
      }
    },
    'Lock and Load': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            me.owner.g_handler.add_handler(function(t) {
              return function(e, me) {
                if (t == me.owner.engine.current_turn) {
                  if (e.card.owner == me.owner) {
                    var lucky = rand(me.owner.engine.find_card_cond(function(c) {
                      if (c.job == 'hunter' && !c.is_token) return true;
                    }));
                    me.owner.hand_card(lucky.unique, 1);
                  }
                }
              };
            }(me.owner.engine.current_turn), 'play_card', me);
            end_spell(me);
          }
        );
      }
    },
    'Stablemaster': {
      on_play: function(me, bc, user_play, at) {
        if (user_play && me.owner.turn_card_play.length >= 2) {
          me.owner.select_one(me,
            function(c) {
              if (c.card_data.type == 'minion' && c.card_data.kind == 'beast' && c.owner == me.owner) return true;
            },
            function() {
              me.owner.play_success(me, at, function(me, non_bc, bc) {
                if (bc && me.target) {
                  me.target.is_invincible.until = me.owner.engine.current_turn;
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
    'Dreadscale': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.who == me.owner) {
                var target = me.owner.get_all_character([me.owner.hero, me])
                  .concat(me.owner.enemy.get_all_character([me.owner.enemy.hero]));

                var dmg = [];
                for (var i = 0; i < target.length; i++) {
                  dmg.push(1);
                }
                me.owner.deal_dmg_many(dmg, me, target);
              }
            }, 'turn_end', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Acidmaw': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.victim != me && e.victim.card_data.type != 'hero') {
                me.owner.instant_kill(me, e.victim);
              }
            }, 'take_dmg', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Sapling': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'AT_037': { // Living Roots
      on_play: function(me, forced_target, random_target, forced_choose, random_choose) {
        me.owner.choose_one(me, ['AT_037a', 'AT_037b'],
          function choose_success(choice, me, forced_target, random_target) {
            if (choice == 0) {
              me.owner.select_one(me, function(c) {
                  return true;
                }, function select_success(me) {
                  me.owner.play_success(me, -1,
                    function(me) {
                      if (me.target) {
                        me.owner.deal_dmg(me.spell_dmg(2), me, me.target);
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
                me.owner.summon_card('Sapling', 10);
                me.owner.summon_card('Sapling', 10);
                end_spell(me);
              });
            }
            // This choice is only for Fandral Staghelm 
            else if (choice == 2) {
              me.owner.select_one(me, function(c) {
                  return true;
                }, function select_success(me) {
                  me.owner.play_success(me, -1,
                    function(me) {
                      if (me.target) {
                        me.owner.deal_dmg(me.spell_dmg(2), me, me.target);
                        me.owner.summon_card('Sapling', 10);
                        me.owner.summon_card('Sapling', 10);
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
    'Druid of the Saber': {
      on_play: function(me, bc, user_play, at, forced_choose) {
        if (user_play) {
          me.owner.choose_one(me, ['Lion Form', 'Panther Form'], function(me, at) {
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
                      me.add_state(inc(1), 'dmg', me);
                      me.add_state(inc(1), 'life', me);
                      me.current_life += 1;

                      me.is_stealth.until = 1000;
                    }
                    end(me, non_bc, bc);
                  });
                }
                else if (choice == 2) {
                  me.owner.play_success(me, at, function(me, non_bc, bc) {
                    if (non_bc) {
                      me.add_state(inc(1), 'dmg', me);
                      me.add_state(inc(1), 'life', me);
                      me.current_life += 1;

                      me.is_stealth.until = 1000;
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
    'Wildwalker': {
      on_play: function(me, bc, user_play, at) {
        if (user_play && me.owner.turn_card_play.length >= 2) {
          me.owner.select_one(me,
            function(c) {
              if (c.card_data.type == 'minion' && c.card_data.kind == 'beast' && c.owner == me.owner) return true;
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
    'Darnassus Aspirant': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card == me) {
                me.owner.boosted_mana--;
                if (me.owner.current_mana > (me.owner.max_mana - me.owner.current_overload_mana - me.owner.boosted_mana)) {
                  me.owner.current_mana = (me.owner.max_mana - me.owner.current_overload_mana - me.owner.boosted_mana);
                }
              }
            }, 'deathrattle', me);
          }
          if (bc) {
            me.owner.boosted_mana += 1;
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Savage Combatant': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.who == me.owner) {
                me.owner.add_hero_dmg(2);
              }
            }, 'inspire', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Knight of the Wild': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      },
      on_draw: function(me) {
        me.owner.g_handler.add_handler(function(e, me) {
          if (e.card.card_data.kind == 'beast' && e.card.owner == me.owner) {
            me.add_state(inc(-1), 'mana', me);
          }
        }, 'summon', me);
      }
    },
    'Mulch': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type == 'minion') return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  me.owner.instant_kill(me, me.target);
                  var lucky = rand(me.owner.engine.find_card_cond(function(c) {
                    if (c.type == 'minion' && !c.is_token) return true;
                  }));
                  me.owner.enemy.hand_card(lucky.unique, 1);
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
    'Astral Communion': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            me.owner.boosted_mana = 10;
            while (me.owner.hand.num_card()) {
              me.owner.discard_card(me.owner.hand.card_list[0], me);
            }
            end_spell(me);
          }
        );
      }
    },
    'Aviana': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.engine.add_aura(function(m, c, me) {
              if (c.owner == me.owner && c.card_data.type == 'minion') {
                return 1;
              }
              return m;
            }, 'mana', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Wrathguard': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.victim == me) {
                me.owner.deal_dmg(e.dmg, me, me.owner.hero);
              }
            }, 'take_dmg', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Demonfuse': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type == 'minion' && c.card_data.kind == 'demon') return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  me.target.add_state(inc(3), 'dmg', me);
                  me.target.add_state(inc(3), 'life', me);
                  me.target.current_life += 3;
                  me.owner.enemy.boosted_mana += 1;
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
    'Fearsome Doomguard': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Tiny Knight of Evil': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card.owner == me.owner && e.who == me.owner) {
                me.add_state(inc(1), 'dmg', me);
                me.add_state(inc(1), 'life', me);
                me.current_life += 1;
              }
            }, 'discard', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Fist of Jaraxxus': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            var ene = rand(me.owner.get_all_character());
            me.owner.deal_dmg(me.spell_dmg(4), me, ene);
            end_spell(me);
          }
        );
      },
      on_draw: function(me) {
        me.owner.g_handler.add_handler(function(e, me) {
          if (e.card == me) {
            var ene = rand(me.owner.get_all_character());
            me.owner.deal_dmg(me.spell_dmg(4), me, ene);
          }
        }, 'discard', me);
      }
    },
    'Void Crusher': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.who == me.owner) {
                var target = [];
                if (me.owner.field.num_card()) {
                  target.push(rand(me.owner.field.card_list));
                }
                if (me.owner.enemy.field.num_card()) {
                  target.push(rand(me.owner.enemy.field.card_list));
                }
                me.owner.instant_kill_many(me, target);
              }
            }, 'inspire', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Dreadsteed': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card == me) {
                me.owner.summon_card('Dreadsteed', me.last_position);
              }
            }, 'deathrattle', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Dark Bargain': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            if (me.owner.enemy.field.num_card() >= 1) {
              var ene = rand(me.owner.enemy.field.card_list, 2);
              me.owner.instant_kill_many(me, ene);
            }
            if (me.owner.hand.num_card()) me.owner.discard_card(rand(me.owner.hand.card_list), me);
            if (me.owner.hand.num_card()) me.owner.discard_card(rand(me.owner.hand.card_list), me);
            end_spell(me);
          }
        );
      }
    },
    'Wilfred Fizzlebang': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card.owner == me.owner) {
                if (e.who && e.who.card_data.type == 'hero_power') {
                  e.card.add_state(function() {
                    return 0;
                  }, 'mana', me);
                }
              }
            }, 'draw_card', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Spellslinger': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            var lucky = rand(me.owner.engine.find_card_cond(function(c) {
              if (c.type == 'spell' && !c.is_token) return true;
            }), 4);
            me.owner.hand_card(lucky[0].unique, 1);
            me.owner.enemy.hand_card(lucky[1].unique, 1);
            me.owner.enemy.hand_card(lucky[2].unique, 1);
            me.owner.enemy.hand_card(lucky[3].unique, 1);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Dalaran Aspirant': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.who == me.owner) {
                me.owner.engine.add_aura(function(d, c, me) {
                  if (c.owner == me.owner) return d + 1;
                  return d;
                }, 'spell_dmg', me);
              }
            }, 'inspire', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Flame Lance': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            if (me.owner.enemy.field.num_card() >= 1) {
              var ene = rand(me.owner.enemy.field.card_list);
              me.owner.deal_dmg(me.spell_dmg(8), me, ene);
            }
            end_spell(me);
          }
        );
      }
    },
    'Fallen Hero': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.attacker.card_data.type == 'hero_power' && e.attacker.owner == me.owner) {
                e.attacker.dmg_given += 1;
              }
            }, 'pre_dmg', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Polymorph: Boar': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type == 'minion') return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  me.owner.transform(me, me.target, 'AT_005t')
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
    'AT_005t': { // Boar (charge)
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.add_state(null, 'charge', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Effigy': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            me.owner.g_handler.add_hander(function(e, me) {
              if (e.destroyed.owner == me.owner && me.owner.engine.current_player != me.owner) {
                var lucky = rand(me.owner.engine.find_card_cond(function(c) {
                  if (c.mana == e.destroyed.card_data.mana) return true;
                }));
                me.owner.summon_card(lucky.unique, 10);
                me.status = 'destroyed';
              }
            }, 'destroyed', me, true);
            end_spell(me);
          }
        );
      }
    },
    'Arcane Blast': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type == 'minion') return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  me.owner.deal_dmg((me.spell_dmg(1) - 1) * 2 + 1, me, me.target);
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
    'Coldarra Drake': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.engine.add_aura(function(n, c, me) {
              if (c.owner == me.owner) {
                return 100;
              }
              return n;
            }, 'hero_power_num', me);
            me.owner.update_hero_power();
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Rhonin': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card == me) {
                me.owner.hand_card('Arcane Missile', 3);
              }
            }, 'deathrattle', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Flash Heal': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  me.owner.heal(5, me, me.target);
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
    'Power Word: Glory': {
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
                      me.owner.heal(4, me, me.owner.hero);
                    }
                  }, 'attack', me, false, false, me.target);
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
    'Holy Champion': {
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
    'Wyrmrest Agent': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            for (var i = 0; i < me.owner.hand.num_card(); i++) {
              if (me.owner.hand.card_list[i].card_data.kind == 'dragon') {
                me.add_state(null, 'taunt', me);
                me.add_state(inc(1), 'life', me);
                me.current_life += 1;
                break;
              }
            }
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Convert': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if (c.card_data.type == 'minion' && c.owner != me.owner) return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  me.owner.hand_card(me.target.card_data.unique, 1);
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
    'Spawn of Shadows': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.who == me.owner) {
                var dmg = [4, 4];
                var target = [me.owner.hero, me.owner.enemy.hero];
                me.owner.deal_dmg_many(dmg, me, target);
              }
            }, 'inspire', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Confuse': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            var target = me.owner.get_all_character([me.owner.hero])
              .concat(me.owner.enemy.get_all_character([me.owner.enemy.hero]));

            for (var i = 0; i < target.length; i++) {
              me.owner.swap_life_dmg(me, target[i]);
            }
            end_spell(me);
          }
        );
      }
    },
    'Shadowfiend': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card.owner == me.owner) {
                e.card.add_state(inc(-1), 'mana', me);
              }
            }, 'draw_card', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Confessor Paletress': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.who == me.owner) {
                var lucky = rand(me.owner.engine.find_card_cond(function(c) {
                  if (c.level == 'legendary' && !c.is_token) return true;
                }));
                me.owner.summon_card(lucky.unique, me.owner.field.get_pos(me));
              }
            }, 'inspire', me);
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
