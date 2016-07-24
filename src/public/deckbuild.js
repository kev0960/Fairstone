var token = localStorage.getItem('hearth-server-token');

$(document).ready(function() {
  if (token) {
    // Send a user token through AJAX to get a verification
    $.ajax({
      url: '/auth',
      data: {
        'token': token
      },
      type: 'POST'
    }).success(function(data) {
      var d = JSON.parse(data);
      if (d.id) {
        $('#userInfo').text('Hi, ' + d.id);
        $('#userInfo').attr('href', '/info');
        $('#userSignin').hide();
      }
      else {
        $('#userLogin').text('Log in');
        $('#userLogin').attr('href', '/login');
        $('#userSignin').text('Sign Up!');
        $('#userSignin').attr('href', '/signup');
      }
    });
  }
  else {
    $('#userLogin').text('Log in');
    $('#userLogin').attr('href', '/login');
    $('#userSignin').text('Sign Up!');
    $('#userSignin').attr('href', '/signup');
  }

  var current_job = "";
  var current_page_neutral = 0;
  var current_page_job = 0;

  var current_page_card = [null, null, null, null, null, null];

  $('.select-job').click(function() {
    current_job = $(this).text();
    
    $('.select-job').css('background-color', '');
    $(this).css('background-color', 'rgba(207, 218, 108, 0.56)');
    
    //$('.select-job').css('border', 'none');
   // $(this).css('border', 'solid');
    
    $('#job-cards').css('display', 'inherit');
    $('#job-name').text(current_job);

    current_page_job = 0;
    show_job_card_image();
    $('#back-job').hide();
  });

  $('#next-neutral').click(function() {
    current_page_neutral++;
    $('#back-neutral').show();

    show_neutral_card_image();
  });
  $('#back-neutral').click(function() {
    current_page_neutral--;
    if (current_page_neutral < 0) current_page_neutral = 0

    if (current_page_neutral == 0) {
      $('#back-neutral').hide();
    }

    show_neutral_card_image();
  });

  $('#next-job').click(function() {
    current_page_job++;
    $('#back-job').show();

    show_job_card_image();
  });
  $('#back-job').click(function() {
    current_page_job--;
    if (current_page_job < 0) current_page_job = 0

    if (current_page_job == 0) {
      $('#back-job').hide();
    }

    show_job_card_image();
  });

  var card_selected = null;

  $('.card-image').click(function() {
    var index = $(this).parent().prevAll().length;
    card_selected = current_page_card[index];

    $('#img-card-chosen').show();
    $('#img-card-chosen').attr('src', card_selected.img_url)
    add_card_to_deck(card_selected);
    draw_mana_curve();
    show_deck_list();
  })

  $('#img-card-chosen').hide();

  $(function() {
    $("[data-hide]").on("click", function() {
      $(this).closest("." + $(this).attr("data-hide")).hide();
    });
  });

  var current_deck = [];

  function add_card_to_deck(c) {
    var total_cards = 0;
    for (var i = 0; i < current_deck.length; i++) {
      total_cards += current_deck[i].num;
    }
    if (total_cards >= 30) {
      $('#num-card-exceed').show();
      return;
    }
    else {
      $('#num-card-exceed').hide();
    }

    for (var i = 0; i < current_deck.length; i++) {
      if (current_deck[i].name == c.name) {
        current_deck[i].num++;
        if (current_deck[i].num > 2) current_deck[i].num = 2;

        return;
      }
    }
    current_deck.push({
      name: c.name,
      num: 1,
      info: c.info,
      job: c.job
    });
  }

  function draw_mana_curve() {
    var largest = 0;
    var mana = [0, 0, 0, 0, 0, 0, 0, 0];
    for (var i = 0; i < current_deck.length; i++) {
      if (current_deck[i].info[0] >= 7) mana[7] += current_deck[i].num;
      else {
        mana[current_deck[i].info[0]] += current_deck[i].num;
      }
    }

    for (var i = 0; i < 7; i++) {
      if (mana[i] > largest) largest = mana[i];
    }

    if (largest <= 10) largest = 0;

    var bar_list = $('.progress-bar');
    for (var i = 0; i < bar_list.length; i++) {
      $(bar_list[i]).css('width', (largest === 0 ? (mana[i] * 10) : (mana[i] * 100) / largest) + '%');
      if (mana[i] != 0) {
        $(bar_list[i]).text(mana[i]);
      }
    }
  }

  function show_deck_list() {
    current_deck.sort(function (a, b) {
      if (a.info[0] < b.info[0]) {
        return -1;
      }
      else if (a.info[0] > b.info[0]) {
        return 1;
      }
      else {
        if (a.name < b.name) return -1;
        return 1;
      }
    });
    var html_str = '<div class="list-group">';
    for (var i = 0; i < current_deck.length; i++) {
      html_str += ('<button class="list-group-item">' + current_deck[i].name + '<span class="num-card">&times;' + current_deck[i].num + '</span><span class="mana-info">' + current_deck[i].info[0] + '</span></button>');
    }
    html_str += '</div>';

    $('#deck-list').html(html_str);

    var mismatch_found = false;
    for (var i = 0; i < current_deck.length; i++) {
      if (current_deck[i].job != 'neutral' && current_deck[i].job != current_job.toLowerCase()) {
        $($('.list-group-item')[i]).css('background-color', 'rgba(247, 56, 56, 0.59)');
        mismatch_found = true;
      }
      else {
        $($('.list-group-item')[i]).css('background-color', '');
      }
    }
    if (mismatch_found) {
      $('#diff-card-jobs').show();
    }
    else {
      $('#diff-card-jobs').hide();
    }
  }

  $('#deck-list').on('click', '.list-group-item', function() {
    var card = current_deck[$(this).prevAll().length];

    card.num--;
    if (card.num == 0) {
      current_deck.splice($(this).prevAll().length, 1);
    }

    draw_mana_curve();
    show_deck_list();
  });

  function show_neutral_card_image() {
    var cards = $('.neutral-card');
    for (var i = 0; i < cards.length; i++) {
      $.ajax({
        url: '/deckbuild/neutral/' + (current_page_neutral * 6 + i),
        data: {
          'token': token
        },
        type: 'POST'
      }).success(function(i) {
        return function(data) {
          var d = JSON.parse(data);
          if (d.img_url) {
            cards[i].src = d.img_url;
            current_page_card[i] = d;
          }
        };
      }(i));
    }
  }

  function show_job_card_image() {
    var cards = $('.job-card');
    for (var i = 0; i < cards.length; i++) {
      $.ajax({
        url: '/deckbuild/' + current_job.toLowerCase() + '/' + (current_page_job * 6 + i),
        data: {
          'token': token
        },
        type: 'POST'
      }).success(function(i) {
        return function(data) {
          var d = JSON.parse(data);
          if (d.img_url) {
            cards[i].src = d.img_url;
            current_page_card[i] = d;
          }
        };
      }(i));
    }
  }

  $('#neutral-cards').click(show_neutral_card_image);
  $('#job-cards').click(show_job_card_image);

  function deck_build_done() {
    var total_cards = 0;
    for (var i = 0; i < current_deck.length; i++) {
      total_cards += current_deck[i].num;
    }
    
    if(total_cards != 30) {
      $('#not-enough-card').show();
      return;
    }
    
    var mismatch_found = false;
    for (var i = 0; i < current_deck.length; i++) {
      if (current_deck[i].job != 'neutral' && current_deck[i].job != current_job.toLowerCase()) {
        $($('.list-group-item')[i]).css('background-color', 'rgba(247, 56, 56, 0.59)');
        mismatch_found = true;
      }
      else {
        $($('.list-group-item')[i]).css('background-color', '');
      }
    }
    if (mismatch_found) {
      $('#diff-card-jobs').show();
      return;
    }
    else {
      $('#diff-card-jobs').hide();
    }
    
    $.ajax({
        url: '/deckbuild/done',
        data: {
          'token': token,
          'job' : current_job,
          'current_deck' : JSON.stringify(current_deck),
          'deck_name' : $('#deck-name-input').val()
        },
        type: 'POST'
      }).success(function(data) {
          var d = JSON.parse(data);
          if (d.result != 'fail') {
            console.log('Deck building is successful');
          }
      })
  }
  $('#deck-build-done').click(deck_build_done);
  $('#deck-name-input').keypress(function(e){
    if(e.which == 13){
        $(this).blur();    
    }
});
  show_neutral_card_image();
});
