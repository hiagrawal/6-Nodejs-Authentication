const crypto = require('crypto');

const bcrypt = require('bcryptjs');

const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');

const {validationResult} = require('express-validator/check');

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
    errorMessage: message,
    oldInput: {email: '', password: ''},
    validationErrors: []
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
    errorMessage: message,
    oldInput: {email: '', password: '', confirmPassword: ''},
    validationErrors: []
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

  const errors = validationResult(req);

  if(!errors.isEmpty()){
    console.log(errors.array());
    return res.status(422).render('auth/login', {
      path: '/login',
      pageTitle: 'Login',
      errorMessage: errors.array()[0].msg,
      oldInput: {email: email, password: password},
      validationErrors:errors.array()
    });
  }

  User.findOne({email: email})
  .then(user => {
    // if(!user){
    //     req.flash('error', 'Invalid username or password');
    //     return res.redirect('/login');
    // }
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
      // req.flash('error', 'Password do not match');
      // res.redirect('/login');
      res.status(422).render('auth/login', {
        path: '/login',
        pageTitle: 'Login',
        errorMessage: 'Password do not match',
        oldInput: {email: email, password: password},
        validationErrors:[{param: 'password'}]
      });
    })
    .catch(err => console.log(err));
  })
  .catch(err => console.log(err));

};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const errors = validationResult(req);

  //422 is a status code which indicates validations have been failed and then we will render the same page
  //we will render the same signup page here and not redirect
  if(!errors.isEmpty()){
    console.log(errors.array());
    return res.status(422).render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      errorMessage: errors.array()[0].msg,
      oldInput: {email: email, password: password, confirmPassword: req.body.confirmPassword},
      validationErrors:errors.array()
    });
  }

  //we can do this email check also in the validation now instaed of doing it in the controller
  //and return a reject promise which will set the error in req object as before
  // User.findOne({email: email})
  // .then(userDoc => {
  //   if(userDoc){
  //     req.flash('error', 'Email already exists. Please pick a different one.');
  //     return res.redirect('/signup');
  //   }

  //   return bcrypt.hash(password, 12)
      bcrypt.hash(password, 12)
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
  // })
  // .catch(err => console.log(err));
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    console.log(err);
    res.redirect('/');
  });
};

exports.getReset = (req, res, next) => {
  let message = req.flash('error');
  if(message.length > 0){
    message = message[0];
  } else {
    message = null;
  }
  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
    errorMessage: message
  });
};

exports.postReset = (req, res, next) => {
  crypto.randomBytes(32, (err, buffer) => {
    if(err){
      console.log(err);
      return res.redirect('/reset');
    }
    const token = buffer.toString('hex');
    User.findOne({email: req.body.email})
    .then(user => {
      if(!user){
        req.flash('error', 'No account with that email found');
        return res.redirect('/reset');
      }
      user.resetToken = token;
      // user.resetToken = '12345';
      user.resetTokenExpiration = Date.now() + 3600000;
      return user.save();
    })
    .then(result => {
      res.redirect('/');
      console.log(req.body.email);
      return transporter.sendMail({
        to: req.body.email,
        from: 'agrawal.hina13@gmail.com',
        subject: 'Password Reset',
        html: `
          <p>You requested a password reset</p>
          <p>Click this <a href="https://localhost:3000/reset/${token}">link</a> to set a new password.</p>
        `
      })   
    })
    .then(result => {
      console.log(result);
      console.log('Email for Password Reset sent !!');
    })
    .catch(err => console.log(err));
  })
};

exports.getNewPassword = (req, res, next) => {
  const token = req.params.token;
  User.findOne({resetToken: token, resetTokenExpiration: {$gt: Date.now()}})
  .then(user => {
    let message = req.flash('error');
    if(message.length > 0){
      message = message[0];
    } else {
      message = null;
    }
    res.render('auth/new-password', {
      path: '/new-password',
      pageTitle: 'New Password',
      errorMessage: message,
      userId: user._id.toString(),
      passwordToken: token
    });
  })
  .catch(err => console.log(err));
  
};

exports.postNewPassword = (req, res, next) => {
  const newPassword  = req.body.password;
  const userId = req.body.userId;
  const token = req.body.passwordToken;
  let resetUser;

  User.findOne({resetToken: token, resetTokenExpiration: {$gt: Date.now()}, _id: userId})
  .then(user => {
    resetUser = user;
    return bcrypt.hash(newPassword, 12)
  })
  .then(hashedPassword => {
    resetUser.password = hashedPassword;
    resetUser.resetToken = undefined;
    resetUser.resetTokenExpiration = undefined;
    return resetUser.save();
  })
  .then(result => {
    res.redirect('/login');
  })
  .catch(err => console.log(err));
}
