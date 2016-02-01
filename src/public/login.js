
/*
if(token) {
  localStorage.setItem('hearth-server-token', token);
  createCookie('hearth-server-token', token)
} else {
  token = localStorage.getItem('hearth-server-token');
}

function createCookie(name,value,days) {
    if (days) {
        var date = new Date();
        date.setTime(date.getTime()+(days*24*60*60*1000));
        var expires = "; expires="+date.toGMTString();
    }
    else var expires = "";
    document.cookie = name+"="+value+expires+"; path=/";
}
function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}
*/
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
    if(data.token) {
      // Save the server issued token to local storage
      localStorage.setItem('hearth-server-token', data.token);

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
