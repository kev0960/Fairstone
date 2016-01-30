var token = "#{token}";
if(token) {
  localStorage.setItem('hearth-server-token', JSON.stringify(token));
} else {
  token = localStorage.getItem('hearth-server-token');
}
