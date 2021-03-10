const models = require('../models');

const parseCookies = (req, res, next) => {
  var cookieString = req.headers.cookie;
  var cookieObj = {};

  if (cookieString) {
    var arr = cookieString.split('; ');
    for (var i = 0; i < arr.length; i++) {
      var arrTwo = arr[i].split('=');
      var key = arrTwo[0];
      var val = arrTwo[1];
      cookieObj[key] = val;
    }
  }
  req.cookies = cookieObj;
  next();
};

module.exports = parseCookies;