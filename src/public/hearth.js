// Whenever the size of the screen changes we have to make sure
// that the canvas fills the entire screen
$(window).on('resize', function() {
  $('#world').width($(window).width())
  $('#world').height($(window).width())
})

function Card (id) {
  this.id = id
  this.default_hp = 0;
  this.default_dmg = 0;
  this.default_mana = 0;
}
function CardContainer(o) {
  this.card_list = [];
  this.selected_card = null;
  this.o = o;
}

var my_hand = new CardContainer($('#player-card-containter'))
var enemy_hand = new CardContainer($('#enemy-card-containter'))
