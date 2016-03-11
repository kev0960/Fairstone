// Whenever the size of the screen changes we have to make sure
// that the canvas fills the entire screen
$(window).on('resize', function() {
  $('#world').width($(window).width())
  $('#world').height($(window).width())
})

function Card (id) {
  this.id = id
  this.card_draw = null;
  this.card_type = '';

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

  return true;
}
CardContainer.prototype.on_selection_end = function(selected) {
  // if card is dropped on my field
  if(-250 < this.selected_card.offsetTop && this.selected_card.offsetTop < -400) {
    hearth_client.play_card($(this.selected_card.id));
  }

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
  this.match_token = localStorage.getItem('hearth-match-token');
  this.user_id = localStorage.getItem('hearth-user-id');

  // Create a connection between client and match server (tell them that I JOINED!!)
  this.socket = io.connect('/match/' + this.match_token);

  // Send my Inforamation through socket
  // 나중에 생성된 webtoken 을 보내서 인증받는 방식으로 바꿔야함
  this.socket.emit('player-info', {match_token : this.match_token, user_id : this.user_id});

  console.log('[Match] Received player info ' , this.user_id);

  this.success = null;
  this.fail = null;

  // Receiving hearht-event
  this.socket.on('hearth-event', function (data) {
    console.log('Received' + data + ' Event!');
    if(data.event_type == 'play_card') {

    }
    if(data.event_type == 'summon') {
    }
  });

  this.socket.on('choose-starting-cards', function (data) {
    var card_list = data.cards;
    for(var i = 0; i < card_list.length; i ++) {
      console.log(card_list[i]);
    }
  })
}
HearthClient.prototype.init = function () {
}
HearthClient.prototype.play_card = function (card_selector, success) {
  var card_id = card_selector.selector;
  var id = parseInt(card_id.substr(4));

  this.socket.emit('hearth-user-play-card', {token : token, card_id : id});
}
var hearth_client = new HearthClient();
