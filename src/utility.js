module.exports = {
  rand_select : function (arr, n) {
    console.log(arr);
    var temp = arr.slice();

    var result = [];
    for(var i = 0; i < n; i ++) {
      if(temp.length) {
        var x = Math.floor(Math.random() * temp.length);
        result.push(temp[x]);

        temp.splice(x, 1);
      }
    }
    return result;
  }
}
