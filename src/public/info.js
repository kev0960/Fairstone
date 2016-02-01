var token = localStorage.getItem('hearth-server-token');

// If the user does not have access-token then goes back to login page
if(!token) {
  // redirect to Home
  $(location).attr('href', '/');
}
else {
  $.ajax({
    url : '/auth',
    data  : {
      'token' : token
    },
    type : 'POST'
  }).success (function (data) {
    var d = JSON.parse(data);
    if(d.id) {
      $('#user_id').val(d.id);
      $('#user_mmr').val(d.mmr);
    } else {
      // Not a valid token!!
      // redirect to Home
      $(location).attr('href', '/');
    }
  });
}
