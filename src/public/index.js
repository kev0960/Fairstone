var token = localStorage.getItem('hearth-server-token');

$(document).ready(function() {
  if(token) {
    // Send a user token through AJAX to get a verification
    $.ajax({
      url : '/auth',
      data  : {
        'token' : token
      },
      type : 'POST'
    }).success (function (data) {
      var d = JSON.parse(data);
      if(d.user_id) {
        $('#headerLeft').text('Hi,' + d.user_id);
        $('#headerLeft').attr('href', '/info');
        $('#headerRight').hide();
      } else {
        $('#headerLeft').text('Log in');
        $('#headerLeft').attr('href', '/login');
        $('#headerRight').text('Sign Up!');
        $('#headerRight').attr('href', '/signup');
      }
    });
  } else {
    $('#headerLeft').text('Log in');
    $('#headerLeft').attr('href', '/login');
    $('#headerRight').text('Sign Up!');
    $('#headerRight').attr('href', '/signup');
  }
});
