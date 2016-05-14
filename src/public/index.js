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
      if(d.id) {
        $('#userInfo').text('Hi, ' + d.id);
        $('#userInfo').attr('href', '/info');
        $('#userSignin').hide();
      } else {
        $('#userLogin').text('Log in');
        $('#userLogin').attr('href', '/login');
        $('#userSignin').text('Sign Up!');
        $('#userSignin').attr('href', '/signup');
      }
    });
  } else {
    $('#userLogin').text('Log in');
    $('#userLogin').attr('href', '/login');
    $('#userSignin').text('Sign Up!');
    $('#userSignin').attr('href', '/signup');
  }
});
