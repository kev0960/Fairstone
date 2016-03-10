data = {
  "제왕 타우릿산" : {
    "type" : "minion",
    "level" : "legendary",
    "job" : "common",
    "info" : [6, 5, 5]
  },
  "발톱의 드루이드" : {
    "type" : "minion",
    "level" : "rare",
    "job" : "druid",
    "info" : [5, 4, 4]
  },
  "화염구" : {
    "type" : "spell",
    "level" : "common",
    "job" : "mage",
    "info" : [4, 0, 0]
  },
  "고귀한 희생" : {
    "type" : "spell",
    "level" : "common",
    "job" : "paladin",
    "info" : [1, 0, 0]
  }
}
module.exports = {
  load_card : function(name) {
    var card = data[name];
    return [name, card.level, card.type, card.job, card.info[0], card.info[1], card.info[2]];
  }
}
