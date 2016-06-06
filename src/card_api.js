const unirest = require('unirest');

function HearthAPI() {
  this.card_db = [];
  this.get_card_db();

  this.implemented_list = [];
}
HearthAPI.prototype.get_card_db = function() {
  function is_secret(m) {
    // console.log(m)
    if (m) {
      for (var i = 0; i < m.length; i++) {
        if (m[i].name == 'Secret') {
          return true;
        }
      }
    }
    return false;
  }

  function get_property(m) {
    var x = [];
    if (m) {
      for (var i = 0; i < m.length; i++) {
        x.push(m[i].name.toLowerCase());
      }
    }
    return x;
  }
  
  unirest.get("https://omgvamp-hearthstone-v1.p.mashape.com/cards").header("X-Mashape-Key", "nPCuh0xMwxmshf9ZGfRS2p3lF7Jip1pJbjYjsn67kOlM4TTr7j").end(function(result) {
    const card_name = require('./card_db/all_cards');

    var data = result.body;
    var collection;

    // JSON File Format
    // { name, cardSet, type, faction (호드인지 얼라인지, 중립인지), rarity, race, cost, attack, health, playerClass, img }
    // rarity : Free, Common, Rare, Epic, Legendary
    for (collection in data) {
      console.log(collection, data[collection].length);

      if (collection === 'Debug' || collection === 'Tavern Brawl' || collection === 'Missions') continue;
      for (var i = 0; i < data[collection].length; i++) {
        if (!data[collection][i].name) continue;

        var t = data[collection][i].type;
        if (t === 'Minion' || t === 'Weapon' || t === 'Spell' || t === 'Hero Power') {
          var c = data[collection][i];

          if (!c.cost) {
            c.cost = 0;
          }

          if (!c.durability) {
            c.durability = 0;
          }

          hearth_api.card_db.push({
            name: c.name.replace('\\', ''),
            type: (c.type.toLowerCase() === 'hero power' ? 'hero_power' : c.type.toLowerCase() ),
            level: (c.rarity ? c.rarity.toLowerCase() : null),
            kind: (c.race ? c.race.toLowerCase() : null),
            job: (c.playerClass ? c.playerClass.toLowerCase() : 'neutral'),
            img: c.img,
            info: [c.cost, (c.attack ? c.attack : 0), (c.health ? c.health : c.durability)],
            unique: c.cardId,
            is_token: (c.collectible ? false : true),
            'is_secret': is_secret(c.mechanics),
            is_implemented: false,
            mech : get_property(c.mechanics)
          });
        }
      }
    }
    console.log('Done downloading ..');
  });
}
HearthAPI.prototype.chk_not_found = function(name) {
  var not_found = {
    'Dagger': {
      type: 'weapon',
      level: 'basic',
      job: 'rogue',
      info: [0, 1, 2]
    }
  }
}
var hearth_api = new HearthAPI();
var implemented_chk = false;

module.exports = {
  get_db: hearth_api.get_card_db,
  load_card: function(name) {
    var card = null;
    var search = name;

    if (name === 'Wrath') search = 'EX1_154';
    else if (name === 'Nourish') search = 'EX1_164';
    else if (name === 'Starfall') search = 'NEW1_007';
    else if (name === 'Raven Idol') search = 'LOE_115';
    else if (name === 'Druid of the Claw') search = 'EX1_165';
    else if (name === 'Living Roots') search = 'AT_037';

    for (var i = 0; i < hearth_api.card_db.length; i++) {
      if (hearth_api.card_db[i].name == search || hearth_api.card_db[i].unique == search) {
        card = hearth_api.card_db[i];
        break;
      }
    }

    // Check for the unregistered ones
    if (!card) card = hearth_api.chk_not_found(search);

    if (!card) {
      console.log('Card :: ', name, ' is not found!');
      return;
    }
    //console.log(card, " with ", name, ' db size : ', hearth_api.card_db.length);
    return [name, card.type, card.level, card.job, card.info[0], card.info[1], card.info[2], card.kind, card.is_token, card.is_secret, card.img, card.unique, card.mech];
  },
  to_arr: function(card) {
    return [card.name, card.type, card.level, card.job, card.info[0], card.info[1], card.info[2], card.kind, card.is_token, card.is_secret, card.img, card.unique, card.mech];
  },
  get_name: function(id) {
    for (var i = 0; i < hearth_api.card_db.length; i++) {
      if (hearth_api.card_db[i].unique == id) return hearth_api.card_db[i].name;
    }
  },
  init_implemented: function(arr) {
    if (implemented_chk) return;
    console.log('db size : ', hearth_api.card_db.length);
    for (var i = 0; i < hearth_api.card_db.length; i++) {
      var c = hearth_api.card_db[i];
      for (var j = 0; j < arr.length; j++) {
        if (arr[j] == c.name || arr[j] == c.unique) {
          arr[j].is_implemented = true;
          hearth_api.implemented_list.push(c);
          break;
        }
      }
    }
    implemented_chk = true;
  },
  chk_implemented: function(unique) {
    console.log('db size : ', hearth_api.card_db.length)
    for (var i = 0; i < hearth_api.card_db.length; i++) {
      if (hearth_api.card_db[i].unique == unique) return hearth_api.card_db[i].is_implemented;
    }
  },
  get_implemented_list: function() {
    return hearth_api.implemented_list;
  }
};