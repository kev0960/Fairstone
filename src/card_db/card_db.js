// 여기서는 Basic set 의 카드들만 다룬다.
var data = {
  "The Coin": {
    "type": "spell",
    "level": "token",
    "job": "neutral",
    "kind": "",
    "info": [0, 0, 0],
    "kor": "동전 한 닢"
  },
  "Murloc Scout": {
    "type": "minion",
    "level": "token",
    "job": "neutral",
    "kind": "murloc",
    "info": [0, 1, 1],
    "kor": "멀록 정찰병"
  },
  "Frog": {
    "type": "minion",
    "level": "token",
    "job": "neutral",
    "kind": "beast",
    "info": [0, 0, 2],
    "kor": "개구리"
  },
  "Stonetusk Boar": {
    "type": "minion",
    "level": "common",
    "job": "neutral",
    "kind": "beast",
    "info": [1, 1, 1],
    "kor": "돌엄니 멧돼지"
  },
  "Murloc Raider": {
    "type": "minion",
    "level": "common",
    "job": "neutral",
    "kind": "murloc",
    "info": [1, 2, 1],
    "kor": "멀록 약탈꾼"
  },
  "Voodoo Doctor": {
    "type": "minion",
    "level": "common",
    "job": "neutral",
    "kind": "",
    "info": [1, 2, 1],
    "kor": "부두교 의술사"
  },
  "Grimscale Oracle": {
    "type": "minion",
    "level": "common",
    "job": "neutral",
    "kind": "murloc",
    "info": [1, 1, 1],
    "kor": "성난비늘 수련사"
  },
  "Elven Archer": {
    "type": "minion",
    "level": "common",
    "job": "neutral",
    "kind": "",
    "info": [1, 1, 1],
    "kor": "엘프 궁수"
  },
  "Goldshire Footman": {
    "type": "minion",
    "level": "common",
    "job": "neutral",
    "kind": "",
    "info": [1, 1, 2],
    "kor": "황금골 보병"
  },
  "Leper Gnome": {
    "type": "minion",
    "level": "common",
    "job": "neutral",
    "kind": "",
    "info": [1, 2, 1],
    "kor": "오염된 노움"
  },
  "Abusive Sergeant": {
    "type": "minion",
    "level": "common",
    "job": "neutral",
    "kind": "",
    "info": [1, 2, 1],
    "kor": "가혹한 하사관"
  },
  "Murloc Tidehunter": {
    "type": "minion",
    "level": "common",
    "job": "neutral",
    "kind": "murloc",
    "info": [2, 2, 1],
    "kor": "멀록 바다사냥꾼"
  },
  "River Crocolisk": {
    "type": "minion",
    "level": "common",
    "job": "neutral",
    "kind": "beast",
    "info": [2, 2, 3],
    "kor": "민물 악어"
  },
  "Bloodfen Raptor": {
    "type": "minion",
    "level": "common",
    "job": "neutral",
    "kind": "beast",
    "info": [2, 3, 2],
    "kor": "붉은늪지랩터"
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
