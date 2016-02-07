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

var token = localStorage.getItem('hearth-server-token')

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
  }, this.x, this.y, this.on_selection.bind(this), this.on_selection_end.bind(this));
  $('#' + card_id).mouseover(this.on_hover).mouseleave(this.position_cards.bind(this));

  this.position_cards();
}
CardContainer.prototype.make_card_first = function (c) {
  this.o.append(c); // make c to be first div element
}
CardContainer.prototype.on_hover = function() {
  $(this).css({'-webkit-transform' : 'rotate('+ 0 +'deg)',
               '-moz-transform' : 'rotate('+ 0 +'deg)',
               '-ms-transform' : 'rotate('+ 0 +'deg)',
               'transform' : 'rotate('+ 0 +'deg)'});
  $(this).css('transform', 'scale(1.5)')
  my_hand.make_card_first($(this))
}
CardContainer.prototype.on_selection = function(selected) {
  this.selected_card = selected;
}
CardContainer.prototype.on_selection_end = function(selected) {
  // if card is dropped on my field zone
  if(this.selected_card.position().top )

  // When things are good
  // TODO do something

  // When things goes wrong
  // card goes back to the hand
  this.position_cards();
}
CardContainer.prototype.position_cards = function () {
  // Set rotation
  var loc_center = $(window).width() / 2 - this.x;
  for(var i = 0; i < this.card_list.length; i ++) {
    var card_id = '#card' + this.card_list[i].id;
    var deg = -30 + (60 / (this.card_list.length)) * i;

    var loc_x = loc_center - (this.card_list.length / 2) * 100 + i * 100;
    $(card_id).css({'-webkit-transform' : 'rotate('+ deg +'deg)',
                 '-moz-transform' : 'rotate('+ deg +'deg)',
                 '-ms-transform' : 'rotate('+ deg +'deg)',
                 'transform' : 'rotate('+ deg +'deg)'})
    $(card_id).css('left', loc_x)
    $(card_id).css('top', 0)

    this.card_list[i].card_draw.mouse.x = this.x + loc_x;
    this.card_list[i].card_draw.mouse.y = this.y;
    this.o.append($(card_id))
  }
}
var my_hand = new CardContainer($('#player-card-container'))
var enemy_hand = new CardContainer($('#enemy-card-container'))

var init = (function() {
  my_hand.add_card (new Card(1));
  my_hand.add_card (new Card(2));
  my_hand.add_card (new Card(3));
  my_hand.add_card (new Card(4));
  my_hand.add_card (new Card(5));
  my_hand.add_card (new Card(6));
});

window.onload = init;

function HearthClient() {
  this.socket = io.connect();

  // Receiving hearht-event
  this.socket.on('hearth-event', function (data) {
    console.log('Received' + data + ' Event!')
  })
}
UIManager.prototype.init = function () {
}
UIManager.prototype.play_card = function (card) {
  this.socket.emit('hearth-user-play-card', {card_id : card.id});
}
var hearth_client = new HearthClient();
