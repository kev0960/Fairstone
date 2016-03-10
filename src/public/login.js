$('#login-btn').click(function() {
  var user_id = $('#user-id').val();
  var password = $('#password').val();
  $.ajax({
    url : '/login',
    data : {
      user_id : user_id,
      password : password
    },
    type : 'POST'
  }).success (function (data) {
    console.log('data ', data)
    var d = JSON.parse(data);
    if(d.token) {
      // Save the server issued token to local storage
      localStorage.setItem('hearth-server-token', d.token);
      localStorage.setItem('hearth-user-id', d.user_id);

      // redirect to Home
      $(location).attr('href', '/');
    }
    else {
      // Empty the form inputs
      $('#user-id').val('');
      $('#password').val('');
    }
  });
})
