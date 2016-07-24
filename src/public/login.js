$('#loginBtn').click(function() {
  var user_id = $('#inputMail').val();
  var password = $('#inputPassword').val();
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

      // redirect to Home
      $(location).attr('href', '/');
    }
    else {
      // Empty the form inputs
      $('#inputMail').val('');
      $('#inputPassword').val('');
      $('#loginfail').show();
    }
  });
})
