const path = require('path');

const express = require('express');
const {body} = require('express-validator/check');

const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

// /admin/add-product => GET
router.get('/add-product', isAuth, adminController.getAddProduct);

// /admin/products => GET
router.get('/products', isAuth, adminController.getProducts);

// /admin/add-product => POST
//since imageUrl is not a url now. Instaed we have made this a file Upload so we can remove this check here
router.post('/add-product', [
    body('title', 'Enter valid title').isString().isLength({min:5}).trim(),
    // body('imageUrl', 'Enter valid Image').isURL(),
    body('price', 'Enter valid price').isFloat(),
    body('description', 'Enter valid description').isLength({min: 5, max: 400}).trim()
] , isAuth, adminController.postAddProduct);

router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);

router.post('/edit-product', [
    body('title', 'Enter valid title').isString().isLength({min:5}).trim(),
    // body('imageUrl', 'Enter valid Image').isURL(),
    body('price', 'Enter valid price').isFloat(),
    body('description', 'Enter valid description').isLength({min: 5, max: 400}).trim()
] , isAuth, adminController.postEditProduct);

router.post('/delete-product', isAuth, adminController.postDeleteProduct);

//this is new route added for async request when calling using fetch method from clien side js
router.delete('/product/:productId', isAuth, adminController.deleteProduct);

module.exports = router;
