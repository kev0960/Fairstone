var data = {
  "Emperor Thaurissan" : {
    "type" : "minion",
    "level" : "legendary",
    "job" : "neutral",
    "info" : [6, 5, 5],
    "kor" : "제왕 타우릿산"
  },
  "War Golem" : {
    "type" : "minion",
    "level" : "common",
    "job" : "neutral",
    "info" : [7, 7, 7],
    "kor" : "전쟁 골렘"
  },
  "Druid of the Claw" : {
    "type" : "minion",
    "level" : "rare",
    "job" : "druid",
    "info" : [5, 4, 4],
    "kor" : "발톱의 드루이드"
  },
  "Fireball" : {
    "type" : "spell",
    "level" : "common",
    "job" : "mage",
    "info" : [4, 0, 0],
    "kor" : "화염구"
  },
  "Noble Sacrifice" : {
    "type" : "spell",
    "level" : "common",
    "job" : "paladin",
    "info" : [1, 0, 0],
    "kor" : "고귀한 희생"
  }
}
module.exports = {
  load_card : function(name) {
    var card = data[name];
    return [name, card.type, card.level, card.job, card.info[0], card.info[1], card.info[2]];
  }
}
