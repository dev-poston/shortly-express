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

  //if there is a cookie on the request
  let hash = req.cookies.shortlyid;
  console.log(req.body)
  if (hash) {
    // go look up if that hash is already on the sessions tables
    models.Sessions.get({ hash: hash })
      .then((session) => {
        // if session already exsists, set the hash on the request sessions obj
        // set cookies on the response cookie obj
        if (session) {
          session['hash'] = hash;
          req.session = session;
          res.cookie('shortlyid', hash);
          next();
        } else {
          //if the session doesnt exsist, create a new session with rand hash
          models.Sessions.create()
            .then((data) => {
              //look up session, attach user info if userid is present
              //set the located hash on the request session, set cookies response with the same hash
              models.Sessions.get({ id: data.insertId })
                .then((hashVal) => {
                  req.session = hashVal;
                  res.cookie('shortlyid', req.session.hash);
                  next();
                });
            });
        }
      });
  } else {
    //if no hash is found on the request, create a session
    models.Sessions.create()
      .then((data) => {
        //look up session, attach user info if userid is present
        //set the located hash on the request session, set cookies response with the same hash
        models.Sessions.get({id: data.insertId})
          .then((hashVal) => {
            req.session = hashVal;
            res.cookie('shortlyid', req.session.hash);
            next();
          });
      });
  }

};

/************************************************************/
// Add additional authentication middleware functions below
/************************************************************/

