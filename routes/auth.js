const express = require('express');
const {check, body} = require('express-validator/check'); 
//can check all files methods at 
//https://github.com/express-validator/express-validator/tree/56518106696e0c4a87a458c097ebca02be534f5c

const authController = require('../controllers/auth');

const router = express.Router();

router.get('/login', authController.getLogin);

router.get('/signup', authController.getSignup);

router.post('/login', authController.postLogin);

//will add a 'validation middleware' on signup, so it will check for form input controls and if error will add it in req object 
//that we can access in postSignUp controller method uisng 'validationResult' method provided by 'express-validator' pkg
//the names inside validation middleware check method is the form control name on signup.ejs page/view
//can use inbuilt validators or can give custom validations using 'custom' method which takes a method
//can group all checks in array, although this is completely optional. 
//But giving in array just indicates that all inside checks  middleware are related to validations
//body is another way to check, can use 'check' also but to show different params using 'body'
//can add custom messages for each of the validator using withMessage or if common for all, can given in body method only as second paramter
router.post(
'/signup',
[ 
    check('email')
    .isEmail()
    .withMessage('Please enter a valid email')
    .custom((value, {req}) => {
        if(value === 'test@test.com'){
            throw new Error('This email address is forbidden');
        }
        return true;
    }),

    // body('password')
    // .isLength({min:5})
    // .withMessage('Please enter a password with atleast 5 characters')
    // .isAlphanumeric()
    // .withMessage('Please enter a password with only numbers and text')

    body('password', 'Please enter a password with only numbers and text and atleast 5 characters.')
    .isLength({min:5})
    .isAlphanumeric()
],

authController.postSignup
);


router.post('/logout', authController.postLogout);

router.get('/reset', authController.getReset);

router.post('/reset', authController.postReset);

router.get('/reset/:token', authController.getNewPassword);

router.post('/new-password', authController.postNewPassword);

module.exports = router;