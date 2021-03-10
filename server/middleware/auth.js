const models = require('../models');
const Promise = require('bluebird');

module.exports.createSession = (req, res, next) => {
  //no cookies => generate session
    //a generated session should create/append a hash to the res
  //cookie => check for validity
      //validity
        //check session table for req.cookies.shortlyid
      //creating an object with the username and userId from session table corresponding to that has
      //append object to res
    //invalid => delete cookie and session???
  let hash = req.cookies.shortlyid;
  if ( hash ) {
    models.Sessions.get({hash: hash})
    .then((sessionHash) => {

    })
  }

};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

