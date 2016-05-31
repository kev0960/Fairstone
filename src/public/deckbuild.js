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

  $('.select-job').click(function() {
    current_job = $(this).text();
    $('#job-cards').css('display', 'inherit');
    $('#job-name').text(current_job);
    
    current_page_job = 0;
    show_job_card_image();
  });

  $('#next-neutral').click(function() {
    current_page_neutral++;
    $('#back-neutral').show();
    
    show_neutral_card_image();
  });
  $('#back-neutral').click(function() {
    current_page_neutral--;
    if (current_page_neutral < 0) current_page_neutral = 0
    
    if(current_page_neutral == 0) {
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
    
    if(current_page_job == 0) {
      $('#back-job').hide();
    }
    
    show_job_card_image();
  });

  function show_neutral_card_image() {
    var cards = $('.neutral-card-image');
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
          }
        };
      }(i));
    }
  }

  function show_job_card_image() {
    var cards = $('.job-card-image');
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
          }
        };
      }(i));
    }
  }

  $('#neutral-cards').click(show_neutral_card_image);
  $('#job-cards').click(show_job_card_image);

  show_neutral_card_image();
});
