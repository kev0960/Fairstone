var data = {
  "Murloc Raider": {
    "type": "minion",
    "level": "common",
    "job": "neutral",
    "kind": "murloc",
    "info": [1, 2, 1],
    "kor": "멀록 약탈꾼"
  },
  "River Crocolisk": {
    "type": "minion",
    "level": "common",
    "job": "neutral",
    "kind": "beast",
    "info": [2, 2, 3],
    "kor": "민물 악어"
  },
  "Magma Rager": {
    "type": "minion",
    "level": "common",
    "job": "neutral",
    "kind": "common",
    "info": [3, 5, 1],
    "kor": "용암 광전사"
  },
  "Emperor Thaurissan": {
    "type": "minion",
    "level": "legendary",
    "job": "neutral",
    "kind": "common",
    "info": [6, 5, 5],
    "kor": "제왕 타우릿산"
  },
  "War Golem": {
    "type": "minion",
    "level": "common",
    "job": "neutral",
    "kind": "common",
    "info": [7, 7, 7],
    "kor": "전쟁 골렘"
  },
  "Druid of the Claw": {
    "type": "minion",
    "level": "rare",
    "job": "druid",
    "kind": "common",
    "info": [5, 4, 4],
    "kor": "발톱의 드루이드"
  },
  "Fireball": {
    "type": "spell",
    "level": "common",
    "job": "mage",
    "kind": "common",
    "info": [4, 0, 0],
    "kor": "화염구"
  },
  "Noble Sacrifice": {
    "type": "spell",
    "level": "common",
    "job": "paladin",
    "kind": "common",
    "info": [1, 0, 0],
    "kor": "고귀한 희생"
  }
}
module.exports = {
  load_card: function(name) {
    var card = data[name];
    return [name, card.type, card.level, card.job, card.info[0], card.info[1], card.info[2], card.kind];
  }
}
