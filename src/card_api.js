const unirest = require('unirest');

function HearthAPI() {
  this.card_db = [];
  this.get_card_db();
}
HearthAPI.prototype.get_card_db = function() {
  function is_secret(m) {
   // console.log(m)
    if(m) {
      for(var i = 0; i < m.length; i ++) {
        if(m[i].name == 'Secret') { 
          return true;
        }
      }
    }
    return false; 
  }
  unirest.get("https://omgvamp-hearthstone-v1.p.mashape.com/cards").header("X-Mashape-Key", "nPCuh0xMwxmshf9ZGfRS2p3lF7Jip1pJbjYjsn67kOlM4TTr7j").end(function(result) {
    var data = result.body;
    var collection;

    // JSON File Format
    // { name, cardSet, type, faction (호드인지 얼라인지, 중립인지), rarity, race, cost, attack, health, playerClass, img }
    // rarity : Free, Common, Rare, Epic, Legendary
    for (collection in data) {
      console.log(collection, data[collection].length);

      if (collection == 'Debug' || collection == 'Tavern Brawl' || collection == 'Missions') continue;
      for (var i = 0; i < data[collection].length; i++) {
        if (!data[collection][i].name) continue;

        var t = data[collection][i].type;
        if (t == 'Minion' || t == 'Weapon' || t == 'Spell' || t == 'Hero Power') {
          var c = data[collection][i];
          hearth_api.card_db.push({
              name : c.name.replace('\\', ''),
              type: c.type.toLowerCase(),
              level: (c.rarity ? c.rarity.toLowerCase() : null),
              kind: (c.race ? c.race.toLowerCase() : null),
              job: (c.playerClass ? c.playerClass.toLowerCase() : null),
              img: c.img,
              info: [(c.cost ? c.cost : c.durability), (c.attack ? c.attack : 0), (c.health ? c.health : 0)],
              unique : c.cardId,
              is_token : (c.collectible ? false : true),
              'is_secret' : is_secret(c.mechanics)
          });
          if(is_secret(c.mechanics)) console.log('Secret :: ', c.name);
        }
      }
    }
    console.log('Done downloading ..');
  });
}
HearthAPI.prototype.chk_not_found = function(name) {
  var not_found = {
    'Dagger' : {
      type : 'weapon',
      level : 'basic',
      job : 'rogue',
      info : [0, 1, 2]
    }
  }
}
var hearth_api = new HearthAPI();

module.exports = {
  get_db: hearth_api.get_card_db,
  load_card: function(name) {
    var card = null;
    for (var i = 0; i < hearth_api.card_db.length; i++) {
      if (hearth_api.card_db[i].name == name) {
        card = hearth_api.card_db[i];
        break;
      }
    }
    
    // Check for the unregistered ones
    if(!card) card = hearth_api.chk_not_found(name);
    
    if(!card) {
      console.log('Card :: ' , name, ' is not found!');
      return ;
    }
    console.log(card, " with ", name, ' db size : ', hearth_api.card_db.length);
    return [name, card.type, card.level, card.job, card.info[0], card.info[1], card.info[2], card.kind, card.is_token, card.is_secret];
  }
};