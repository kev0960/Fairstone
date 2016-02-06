// Whenever the size of the screen changes we have to make sure
// that the canvas fills the entire screen
$(window).on('resize', function() {
  $('#world').width($(window).width())
  $('#world').height($(window).width())
})

function Card (id) {
  this.id = id
  this.card_draw = null;

  this.default_hp = 0;
  this.default_dmg = 0;
  this.default_mana = 0;

  this.hp = 0;
  this.dmg = 0;
  this.mana = 0;
}
function CardContainer(o) {
  this.card_list = [];
  this.selected_card = null;
  this.o = o; // card-container element

  this.x = o.position().left;
  this.y = o.position().top;
}
CardContainer.prototype.add_card = function (card) {
  this.card_list.push (card);

  var card_id = 'card' + card.id;
  this.o.append ("<div class='card' id='" + card_id + "'></div>");
  card.card_draw = new CardDraw(document.getElementById(card_id), {
    sensibility: 6, //sensibility to the mouse velocity
    rotateLimit: 60, //card rotate limite
    speed: 6, //card rotation speed
    scaling: true
  });

  this.position_cards();
}

CardContainer.prototype.position_cards = function () {
  // Set rotation
  for(var i = 0; i < this.card_list.length; i ++) {
    var card_id = '#card' + this.card_list[i].id;
    var deg = -30 + (60 / (this.card_list.length)) * i;
    $(card_id).css({'-webkit-transform' : 'rotate('+ deg +'deg)',
                 '-moz-transform' : 'rotate('+ deg +'deg)',
                 '-ms-transform' : 'rotate('+ deg +'deg)',
                 'transform' : 'rotate('+ deg +'deg)'})
    $(card_id).css('left', this.x + i * 20)
    $(card_id).css('top', this.y)
  }
}
var my_hand = new CardContainer($('#player-card-containter'))
var enemy_hand = new CardContainer($('#enemy-card-container'))

var init = (function() {
  my_hand.add_card (new Card(1));
  my_hand.add_card (new Card(2));
});
window.onload = init;
