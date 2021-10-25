const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');

const errorController = require('./controllers/error');
const User = require('./models/user');

const MONGODB_URI ='mongodb+srv://MongoDbUser:MongoDbUser@cluster0.kij6e.mongodb.net/shopAuthentication?retryWrites=true&w=majority';

const app = express();
const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: 'sessions'
});
const csrfProtection = csrf();

app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');

app.use(bodyParser.urlencoded({ extended: false }));

//first we initialize the multer method and then define how many files we are expecting single or multiple 
//and then give the field name which has file type of value which in our case is 'image' which is the name of that field 
//app.use(multer().single('image'));

// By Default, it saves the data in buffer, to fix this, we can add property 'dest:images'
// so it converts buffer in memory into binary data and store in automatic created images folder 
//with the dynamically generated 'filename' name to the image
//app.use(multer({dest: 'images'}).single('image'));

//now we need to add .png or whatever image extension to make it readable and give it proper name
//for this we can use 'storage' option
const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'images'); //first paramter is error which we are not setting and giving it to null, second is destination name
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); //first paramter is error, second is filename. TO make it unique, we can add date to it
  }
})
app.use(multer({storage: fileStorage}).single('image'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(
  session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    store: store
  })
);
app.use(csrfProtection);
app.use(flash());

app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  //throw new Error(err); 
  //if it is outside of async call, then can use throw new Error to go to error middleware
  User.findById(req.session.user._id)
    .then(user => {
      if(!user){
        return next();
      }
      req.user = user;
      next();
    })
    .catch(err => {
      //throw new Error(err); 
      //Here throw new Error will not serve any purpose as to reach to the error handling middlware, next HAS to be called
      //since this is in an async call (using then and catch)
      next(new Error(err));
    });
});

app.use((req,res,next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
})

app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get('/500', errorController.get500);

app.use(errorController.get404);

//This is a special middleware which takes 4 argumnets: error, req, res, next 
//which indicates that this is a error handling middlware
app.use((error, req, res, next) => {
  //res.status(error.httpStatusCode).render(...); This is how we can access the httpStatusCode paramter passed in error object
  res.redirect('/500');
})

mongoose
  .connect(MONGODB_URI)
  .then(result => {
    // User.findOne().then(user => {
    //   if (!user) {
    //     const user = new User({
    //       email: 'test@test.com',
    //       password: '12345',
    //       cart: {
    //         items: []
    //       }
    //     });
    //     user.save();
    //   }
    // });
    app.listen(3000);
  })
  .catch(err => {
    console.log(err);
  });
