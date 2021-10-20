const bcrypt = require('bcryptjs');

const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');

const User = require('../models/user');

const transporter = nodemailer.createTransport(sendgridTransport({
  auth: {
    api_key: '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'
  }
}))


//it returns an empty array and hence error msg is never null
//to avoid this, can check the length manually and assign it to null if length is leass than 0
exports.getLogin = (req, res, next) => {
  let message = req.flash('error');
  if(message.length > 0){
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    errorMessage: message
  });
};

exports.getSignup = (req, res, next) => {
  let message = req.flash('error');
  if(message.length > 0){
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    errorMessage: message
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
      req.flash('error', 'Password do not match');
      res.redirect('/login');
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
      req.flash('error', 'Email already exists. Please pick a different one.');
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
        return transporter.sendMail({
          to: email,
          from: 'agrawal.hina13@gmail.com',
          subject: 'Signup Succeeded!',
          html: '<h1>You successfully signed up!</h1>'
        })   
      })
      .then(result => {
        console.log(result);
        console.log('Email sent successfully');
      })
      .catch(err => console.log(err)); 
  })
  .catch(err => console.log(err));
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err);
    res.redirect('/');
  });
};
