const bcrypt = require('bcryptjs');

const User = require('../models/user');

exports.getLogin = (req, res, next) => {
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    errorMessage: req.flash('error')
  });
};

exports.getSignup = (req, res, next) => {
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup'
  });
};

exports.postLogin = (req, res, next) => {
  // User.findById('616581363c064e37249e5162')
  //   .then(user => {
  //     req.session.isLoggedIn = true;
  //     req.session.user = user;
  //     req.session.save(err => {
  //       console.log(err);
  //       res.redirect('/');
  //     });
  //   })
  //   .catch(err => console.log(err));

  const email = req.body.email;
  const password = req.body.password;
  User.findOne({email: email})
  .then(user => {
    if(!user){
        req.flash('error', 'Invalid username or password');
        return res.redirect('/login');
    }
    bcrypt.compare(password, user.password)
    .then(doMatch => {
      if(doMatch){
        req.session.isLoggedIn = true;
        req.session.user = user;
        return req.session.save(err => {
          console.log(err);
          res.redirect('/');
        });
      }
      return res.redirect('/login');
    })
    .catch(err => console.log(err));
  })
  .catch(err => console.log(err));



};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const confirmPassword = req.body.confirmPassword;

  User.findOne({email: email})
  .then(userDoc => {
    if(userDoc){
      return res.redirect('/signup');
    }
    return bcrypt.hash(password, 12)
      .then(hashedPassword => {
        const user = new User({
          email: email,
          password: hashedPassword,
          cart: {items: []}
        })
        return user.save();
      })
      .then(result => {
        res.redirect('/login');      
      }); 
  })
  .catch(err => console.log(err));
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err);
    res.redirect('/');
  });
};
