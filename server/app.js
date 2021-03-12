const express = require('express');
const path = require('path');
const utils = require('./lib/hashUtils');
const partials = require('express-partials');
const bodyParser = require('body-parser');
const Auth = require('./middleware/auth');
const models = require('./models');
const cookieParser = require('./middleware/cookieParser');

const app = express();

app.set('views', `${__dirname}/views`);
app.set('view engine', 'ejs');
app.use(partials());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
app.use(cookieParser);
app.use(Auth.createSession);

app.get('/',
  (req, res) => {
    app.verifyLogin(req, res)
      .then(() => {
        res.render('index');
      })
      .catch(() => {
        res.redirect('/login');
      });
  });

app.get('/create',
  (req, res) => {
    app.verifyLogin(req, res)
      .then(() => {
        res.render('index');
      })
      .catch(() => {
        res.redirect('/login');
      });
  });

app.get('/links',
  (req, res, next) => {
    app.verifyLogin(req, res)
      .then(() => {
        models.Links.getAll()
          .then(links => {
            res.status(200).send(links);
          })
          .error(error => {
            res.status(500).send(error);
          });
      })
      .catch(() => {
        res.redirect('/login');
      });
  });

app.post('/signup',
  (req, res, next) =>{
    var username = req.body.username;
    models.Users.get({username: username})
      .then(data => {
        if (data) {
          res.redirect('/signup');
        } else {
          models.Users.create(req.body)
            .then(() => {
              app.verifySession(req, res)
                .then(() => {
                  res.redirect('/');
                });
            });
        }
      });
  }
);

app.get('/login', (req, res) => {
  res.render('login');
});

app.post('/login',
  (req, res, next) => {
    let username = req.body.username;
    let password = req.body.password;
    models.Users.get({username: username})
      .then((data) => {
        if (data) {
          if (models.Users.compare(password, data.password, data.salt)) {
            app.verifySession(req, res)
              .then(() => {
                res.redirect('/');
              });
          } else {
            res.redirect('/login');
          }
        } else {
          res.redirect('/login');
        }
      });
  }
);

app.get('/logout', (req, res, next) => {
  models.Sessions.delete({hash: req.session.hash})
    .then(() => {
      delete req.session;
      // req.body.username = null;
      // req.body.password = null;
      res.cookie('shortlyid', null);
      res.redirect('/login');
    });
});

app.post('/links',
  (req, res, next) => {
    var url = req.body.url;
    if (!models.Links.isValidUrl(url)) {
      // send back a 404 if link is not valid
      return res.sendStatus(404);
    }

    return models.Links.get({ url })
      .then(link => {
        if (link) {
          throw link;
        }
        return models.Links.getUrlTitle(url);
      })
      .then(title => {
        return models.Links.create({
          url: url,
          title: title,
          baseUrl: req.headers.origin
        });
      })
      .then(results => {
        return models.Links.get({ id: results.insertId });
      })
      .then(link => {
        throw link;
      })
      .error(error => {
        res.status(500).send(error);
      })
      .catch(link => {
        res.status(200).send(link);
      });
  });

/************************************************************/
// Write your authentication routes here
/************************************************************/

//once user signsup or logins in
//modify session table to have userid for the associated session.hash
//modify res.session.userid for userid

app.verifySession = function(req, res, next) {
  return new Promise((resolve, reject) => {
    let user = req.body.username;
    //look up username on usertable
    models.Users.get({username: user})
      .then((userInfo) => {
        //update session table w request session info
        models.Sessions.update({hash: req.session.hash}, {userId: userInfo.id})
          .then(() => {
            req.session.userId = userInfo.id;
            resolve();
            //res.redirect(next);
          });
      });
  });
};

app.verifyLogin = function(req, res, next) {
  return new Promise((resolve, reject) => {
    if (req.session.userId) {
      resolve();
    } else {
      reject();
    }
  });
};

/************************************************************/
// Handle the code parameter route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/:code', (req, res, next) => {

  return models.Links.get({ code: req.params.code })
    .tap(link => {

      if (!link) {
        throw new Error('Link does not exist');
      }
      return models.Clicks.create({ linkId: link.id });
    })
    .tap(link => {
      return models.Links.update(link, { visits: link.visits + 1 });
    })
    .then(({ url }) => {
      res.redirect(url);
    })
    .error(error => {
      res.status(500).send(error);
      // res.status(500);
      // res.redirect('/');
    })
    .catch(() => {
      res.redirect('/');
    });
});

module.exports = app;
