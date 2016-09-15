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
    'Runic Egg': {
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
    'Arcane Anomaly': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card.owner === me.owner && e.card.card_data.type == 'spell') {
                me.add_state(inc(1), 'life', me);
                me.current_life += 1;
              }
            }, 'play_card', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Pompous Thespian': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) me.add_state(null, 'taunt', me);
          end(me, non_bc, bc);
        });
      }
    },
    'Netherspite Historian': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            for (var i = 0; i < me.owner.hand.num_card(); i++) {
              if (me.owner.hand.card_list[i].card_data.kind == 'dragon') {
                var avail_list = rand(me.owner.engine.find_card_cond(function(c) {
                  if (c.kind == 'dragon' && !c.is_token) return true;
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
              break;
            }
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Pantry Spider': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            me.owner.summon_card('Cellar Spider', at + 1);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Cellar Spider': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Zoobot': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            function give_buff(kind) {
              var list = [];
              for (var i = 0; i < me.owner.field.num_card(); i++) {
                if (me.owner.field.card_list[i].card_data.kind == kind) {
                  list.push(me.owner.field.card_list[i]);
                }
              }

              if (list.length) {
                var lucky = rand(list, 1);
                lucky.add_state(inc(1), 'dmg', 1);
                lucky.add_state(inc(1), 'life', 1);
                lucky.current_life += 1;
              }
            }

            give_buff('murloc');
            give_buff('beast');
            give_buff('dragon');
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Violet Illusionist': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.engine.add_aura(function(c, me) {
              if (c == me.owner.hero && me.owner.engine.current_player == me) return true;
              return false;
            }, 'invincible', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Arcanosmith': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            me.owner.summon_card('Animated Shield', at + 1);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Animated Shield': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) me.add_state(null, 'taunt', me);
          end(me, non_bc, bc);
        });
      }
    },
    'Menagerie Magician': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            function give_buff(kind) {
              var list = [];
              for (var i = 0; i < me.owner.field.num_card(); i++) {
                if (me.owner.field.card_list[i].card_data.kind == kind) {
                  list.push(me.owner.field.card_list[i]);
                }
              }

              if (list.length) {
                var lucky = rand(list, 1);
                lucky.add_state(inc(1), 'dmg', 2);
                lucky.add_state(inc(1), 'life', 2);
                lucky.current_life += 2;
              }
            }

            give_buff('murloc');
            give_buff('beast');
            give_buff('dragon');
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Avian Watcher': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc && me.owner.secret_list.length) {
            me.add_state(inc(1), 'dmg', me);
            me.add_state(inc(1), 'life', me);
            me.add_state(null, 'taunt', me);
            me.current_life += 1;
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Moat Lurker': {
      on_play: function(me, bc, user_play, at) {
        if (user_play) {
          me.owner.select_one(me,
            function(c) {
              if (c.card_data.type == 'minion') return true;
            },
            function() {
              me.owner.play_success(me, at, function(me, non_bc, bc) {
                if (bc && me.target) {
                  me.owner.instant_kill(me, me.target);
                  me.owner.g_handler.add_handler(function(e, me, target) {
                    if (e.card == me) {
                      target.owner.summon_card(target.card_data.unique, 10);
                    }
                  }, 'deathrattle', me, false, false, me.target);
                }
                end(me, non_bc, bc);
              });
            },
            function() {},
            false
          );
        } else {
          me.owner.play_success(me, at, function(me, non_bc, bc) {
            end(me, non_bc, bc);
          });
        }
      }
    },
    'Book Wyrm': {
      on_play: function(me, bc, user_play, at) {
        var has_dragon = false;
        for (var i = 0; i < me.owner.hand.num_card(); i++) {
          if (me.owner.hand.card_list[i].card_data.kind == 'dragon') {
            has_dragon = true;
            break;
          }
        }
        if (user_play && has_dragon) {
          me.owner.select_one(me,
            function(c) {
              if (c.card_data.type == 'minion' && c.dmg() <= 3 && c.owner != me.owner) return true;
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
        } else {
          me.owner.play_success(me, at, function(me, non_bc, bc) {
            end(me, non_bc, bc);
          });
        }
      }
    },
    'Arcane Giant': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      },
      on_draw: function(me) {
        me.add_state(function(m, c) {
          var arr = me.owner.g_handler.search_legacy_queue(function(e) {
            if (e.event_type == 'play_card' && e.card.card_data.type == 'spell' &&
              e.who == me.owner) return true;
          });
          return m - arr.length;
        }, 'mana', me);
      }
    },
    'Moroes': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.who == me.owner) {
                me.owner.summon_card('Steward', at + 1);
              }
            }, 'turn_end', me);
            me.is_stealth.until = 1000;
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Steward': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Barnes': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            var list = [];
            for (var i = 0; i < me.owner.deck.num_card(); i++) {
              if (me.owner.deck.card_list[i].card_data.type == 'minion') {
                list.push(me.owner.deck.card_list[i]);
              }
            }

            if (list.length) {
              var lukcy = rand(list);
              me.owner.summon_card(lucky.card_data.unique, at + 1, false,
                function(c) {
                  c.add_state(function() {
                    return 1;
                  }, 'life', me);
                  c.current_life = 1;
                  c.add_state(function() {
                    return 1;
                  }, 'dmg', me);
                });
            }
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Prince Malchezaar': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'The Curator': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            function draw_kind(kind) {
              var list = [];
              for (var i = 0; i < me.owner.deck.num_card(); i++) {
                if (me.owner.deck.card_list[i].card_data.kind == kind) {
                  list.push(me.owner.deck.card_list[i]);
                }
              }
              if (list.length) {
                var lucky = rand(list, 1);
                me.owner.draw_card(lucky);
              }
            }

            draw_kind('dragon');
            draw_kind('murloc');
            draw_kind('beast');
          }
          if (non_bc) {
            me.add_state(null, 'taunt', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Medivh, the Guardian': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            me.owner.summon_card('Atiesh', 1);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Atiesh': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          me.owner.g_handler.add_handler(function(e, me) {
            if (e.card.owner == me.owner && e.card.card_data.type == 'spell') {
              var cost = e.card.card_data.mana;
              var lucky = rand(me.owner.engine.find_card_cond(function(c) {
                if (c.type == 'minion' && c.mana == cost && !c.is_token) return true;
              }), 1);
              me.owner.summon_card(lucky.unique, 10);
              me.owner.weapon_dec_durability(1, me);
            }
          }, 'play_card', me);
          end(me, non_bc, bc);
        });
      }
    },
    'Fool\'s Bane': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          me.add_state(function() {
            return 100;
          }, 'atk_num', me);
          end(me, non_bc, bc);
        });
      }
    },
    'Ironforge Portal': {
      on_play: function(me) {
        me.owner.play_success(me, -1, function(me, non_bc, bc) {
          me.owner.add_armor(4, me);
          var lucky = rand(me.owner.engine.find_card_cond(function(c) {
            if (c.type == 'minion' && c.mana == 4 && !c.is_token) return true;
          }), 1);
          me.owner.summon_card(lucky.unique, 10);
          end_spell(me);
        });
      }
    },
    'Protect the King!': {
      on_play: function(me) {
        me.owner.play_success(me, -1, function(me, non_bc, bc) {
          for (var i = 0; i < me.owner.enemy.field.num_card(); i++) {
            me.owner.summon_card('Pawn', 10);
          }
          end_spell(me);
        });
      }
    },
    'Pawn': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          me.add_state(null, 'taunt', me);
          end(me, non_bc, bc);
        });
      }
    },
    'Spirit Claws': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          me.add_state(function(d, c) {
            if (c.spell_dmg(1) > 1) {
              return d + 2;
            }
            return d;
          }, 'dmg', me);
          end(me, non_bc, bc);
        });
      }
    },
    'Wicked Witchdoctor': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card.owner == me.owner && e.card.card_data.type == 'spell') {
                var avail = ['Healing Totem', 'Searing Totem', 'Stoneclaw Totem', 'Wrath of Air Totem'];
                me.owner.summon_card(rand(avail), 10);
              }
            }, 'play_card', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Maelstrom Portal': {
      on_play: function(me) {
        me.owner.play_success(me, -1, function(me, non_bc, bc) {
          var target = me.owner.enemy.get_all_character([me.owner.enemy.hero]);
          var dmg = [];
          for (var i = 0; i < target.length; i++) {
            dmg.push(me.spell_dmg(1));
          }
          me.owner.deal_dmg_many(dmg, me, target);
          var lucky = rand(me.owner.engine.find_card_cond(function(c) {
            if (c.type == 'minion' && c.mana == 1 && !c.is_token) return true;
          }), 1);
          me.owner.summon_card(lucky.unique, 10);
          end_spell(me);
        });
      }
    },
    'Swashburglar': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            var lucky = rand(me.owner.engine.find_card_cond(function(c) {
              if (c.job == me.owner.enemy.player_job && !c.is_token) return true;
            }), 1);
            me.owner.hand_card(lucky.unique, 1);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Deadly Fork': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card == me) {
                me.owner.hand_card('Sharp Fork', 1);
              }
            }, 'deathrattle', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Sharp Fork': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Ethereal Peddler': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            me.owner.engine.add_aura(function(m, c, me) {
              if (c.owner == me.owner && c.card_data.job != 'neutral' &&
                c.card_data.job != me.owner.player_job) {
                return m - 2;
              }
              return m;
            }, 'mana', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Nightbane Templar': {
      on_play: function(me, bc, user_play, at) {
        if (user_play) {
          me.owner.play_success(me, at, function(me, non_bc, bc) {
            if (bc) {
              for (var i = 0; i < me.owner.hand.num_card(); i++) {
                if (me.owner.hand.card_list[i].card_data.kind == 'dragon') {
                  me.owner.summon_card('Whelp', 10);
                  me.owner.summon_card('Whelp', 10);
                  break;
                }
              }
            }
            end(me, non_bc, bc);
          });
        }
      }
    },
    'Silvermoon Portal': {
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
                  var lucky = rand(me.owner.engine.find_card_cond(function(c) {
                    if (c.type == 'minion' && c.mana == 2 && !c.is_token) return true;
                  }), 1);
                  me.owner.summon_card(lucky.unique, 10);
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
    'Ivory Knight': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            var avail_list = rand(me.owner.engine.find_card_cond(function(c) {
              if (c.type == 'spell' && !c.is_token) return true;
            }), 3);

            me.owner.choose_one(me, get_unique(avail_list), function(choice) {
                me.owner.hand_card(avail_list[choice].unique);
                me.owner.heal(avail_list[choice].mana, me, me.owner.hero);
                end(me, non_bc, bc);
              },
              nothing,
              true,
              false,
              false,
              null,
              null);
          } else {
            end(me, non_bc, bc);
          }
        });
      }
    },
    'Kindly Grandmother': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card == me) {
                me.owner.summon_card('Big Bad Wolf', me.last_position);
              }
            }, 'deathrattle', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Big Bad Wolf': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Cloaked Huntress': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.engine.add_aura(function(m, c, me) {
              if (c.card_data.is_secret && c.owner == me.owner) return 0;
              return m;
            }, 'mana', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Cat Trick': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card.owner == me.owner.enemy && e.card.card_data.type == 'spell' &&
                me.owner.engine.current_player != me.owner) {
                me.owner.summon_card('Cat in a Hat', 10);
                me.status = 'destroyed';
              }
            }, 'summon', me, true);
            end_spell(me);
          }
        );
      }
    },
    'Cat in a Hat': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.is_stealth.until = 1000;
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Enchanted Raven': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Menagerie Warden': {
      on_play: function(me, bc, user_play, at) {
        if (user_play) {
          me.owner.select_one(me,
            function(c) {
              if (c.card_data.type == 'minion' && c.card_data.kind == 'beast' &&
                c.owner == me.owner) return true;
            },
            function() {
              me.owner.play_success(me, at, function(me, non_bc, bc) {
                if (bc && me.target) {
                  me.owner.summon_card('Menagerie Warden', at + 1, false, function(c) {
                    c.owner.copy_minion(me.target, c);
                  });
                }
                end(me, non_bc, bc);
              });
            },
            function() {},
            false
          );
        } else {
          me.owner.play_success(me, at, function(me, non_bc, bc) {
            end(me, non_bc, bc);
          });
        }
      }
    },
    'Moonglade Portal': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            return true;
          }, // It can attack anything
          function select_success(me) { // on select success
            me.owner.play_success(me, -1,
              function(me) {
                if (me.target) {
                  var lucky = rand(me.owner.engine.find_card_cond(function(c) {
                    if (c.type == 'minion' && c.mana == 6 && !c.is_token) return true;
                  }), 1);
                  me.owner.summon_card(lucky.unique, 10);
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
    'Imp of Malchezaar': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card.owner == me.owner) me.owner.draw_cards(1);
            }, 'discard', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Kara Kazham!': {
      on_play: function(me, forced_target, random_target) {
        me.owner.play_success(me, -1,
          function(me) {
            me.owner.summon_card('Candle', 10);
            me.owner.summon_card('Broom', 10);
            me.owner.summon_card('Teapot', 10);
            end_spell(me);
          }
        );
      }
    },
    'Candle': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Broom': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Teapot': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      }
    },
    'Silverware Golem': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          end(me, non_bc, bc);
        });
      },
      on_draw: function(me) {
        me.owner.g_handler.add_handler(function(e, me) {
          if (e.card == me) {
            me.owner.summon_card('Silverware Golem', 10);
          }
        }, 'discard', me);
      }
    },
    'Medivh\'s Valet': {
      on_play: function(me, bc, user_play, at) {
        if (user_play && me.owner.secret_list.length) {
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
        } else {
          me.owner.play_success(me, at, function(me, non_bc, bc) {
            end(me, non_bc, bc);
          });
        }
      }
    },
    'Firelands Portal': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function() {
            return true;
          },
          function select_success(me) {
            me.owner.play_success(me, -1,
              function(me) {
                me.owner.deal_dmg(me.spell_dmg(5), me, me.target);
                var lucky = rand(me.owner.engine.find_card_cond(function(c) {
                  if (c.type == 'minion' && c.mana == 5 && !c.is_token) return true;
                }), 1);
                me.owner.summon_card(lucky.unique, 10);
                end_spell(me);
              }
            );
          },
          nothing,
          forced_target,
          random_target);
      }
    },
    'Babbling Book': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if(bc) {
            var lucky = rand(me.owner.engine.find_card_cond(function(c) {
              if (c.type == 'spell' && c.job == 'mage' && !c.is_token) return true;
            }), 1);
            me.owner.hand_card(lucky.unique, 1);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Purify': {
      on_play: function(me, forced_target, random_target) {
        me.owner.select_one(me, function(c) {
            if(c.card_data.type == 'minion' && c.owner == me.owner) return true;
          },
          function select_success(me) {
            me.owner.play_success(me, -1,
              function(me) {
                if(me.target) {
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
    'Priest of the Feast': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (non_bc) {
            me.owner.g_handler.add_handler(function(e, me) {
              if (e.card.owner === me.owner && e.card.card_data.type == 'spell') {
                me.owner.heal(3, me, me.owner.hero);
              }
            }, 'play_card', me);
          }
          end(me, non_bc, bc);
        });
      }
    },
    'Onyx Bishop': {
      on_play: function(me, bc, user_play, at) {
        me.owner.play_success(me, at, function(me, non_bc, bc) {
          if (bc) {
            var dead_ones = me.owner.search_legacy_queue(function(e) {
              if(e.event_type == 'destroyed' && e.destroyed.owner == me.owner) {
                return true;
              }
            });
            if(dead_ones.length) {
              var lucky = rand(dead_ones.length, 1);
              me.owner.summon_card(lucky.card_data.unique, at + 1);
            }
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