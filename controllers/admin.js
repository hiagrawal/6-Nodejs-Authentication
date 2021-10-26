const mongoose = require('mongoose');

const fileHelper = require('../util/file');

const {validationResult} = require('express-validator/check');

const Product = require('../models/product');

exports.getAddProduct = (req, res, next) => {
  console.log('rendering');
  if(!req.session.isLoggedIn){
    return res.redirect('/login');
  }
  res.render('admin/edit-product', {
    pageTitle: 'Add Product',
    path: '/admin/add-product',
    editing: false,
    errorMessage: null,
    hasError: false,
    validationErrors: []
  });
};

exports.postAddProduct = (req, res, next) => {
  //console.log('inside post');
  //console.log(req);
  //when we console req, we can see that it saves the image in 'file' object and text types in 'body' object
  const title = req.body.title;
  //const imageUrl = req.body.imageUrl;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;
  console.log(image);
  // we see that it saves the data in buffer, to fix this, we can add property 'dest:images'
  // so it converts buffer in memory into binary data in path field and store in automatic created images folder
  //so now, image is a file object
  // {
  //   fieldname: 'image',
  //   originalname: 'white-vest.png',
  //   encoding: '7bit',
  //   mimetype: 'image/png',
  //   destination: 'images',
  //   filename: 'white-vest.png',
  //   path: 'images\\white-vest.png',
  //   size: 61140
  // }

  if(!image){
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      errorMessage: 'Attached image type should be png, jpg or jpeg only',
      product: {title, price, description},
      hasError: true,
      validationErrors: []
    });
  }
  const errors = validationResult(req);

  if(!errors.isEmpty()){
    console.log(errors.array());
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Add Product',
      path: '/admin/add-product',
      editing: false,
      errorMessage: errors.array()[0].msg,
      product: {title, price, description},
      hasError: true,
      validationErrors: errors.array()
    });
  }

  //storing and retrieving file from the database is not a good solution since it is very heavy
  //but we need to store something in db for image option so we can store the image file object path 
  const imageUrl = image.path;

  const product = new Product({
    //_id: new mongoose.Types.ObjectId('617026346ea0331f04ab6a5f'), //manually giving this to throw an error to check catch block functionality
    title: title,
    price: price,
    description: description,
    imageUrl: imageUrl,
    userId: req.user
  });
  product
    .save()
    .then(result => {
      // console.log(result);
      console.log('Created Product');
      res.redirect('/admin/products');
    })
    .catch(err => {
      //console.log(err);
      //res.redirect('/500');
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error); //skips all other middleware and goes to the error handling middleware
    });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect('/');
  }
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      //throw new Error('Throwing dummy error to check catch block');
      if (!product) {
        return res.redirect('/');
      }
      res.render('admin/edit-product', {
        pageTitle: 'Edit Product',
        path: '/admin/edit-product',
        editing: editMode,
        product: product,
        errorMessage: null,
        hasError: true,
        validationErrors: []

      });
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500; // this is just to show that we can pass some extra info as well with the error object 
      //that we can use in the expressjs error handling middleware
      return next(error); //skips all other middleware and goes to the error handling middleware
    });
};

//Added authorization to edit only if userId matches with the current logged in user
exports.postEditProduct = (req, res, next) => {
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  // const updatedImageUrl = req.body.imageUrl;
  const image = req.file;
  const updatedDesc = req.body.description;

  const errors = validationResult(req);

  if(!errors.isEmpty()){
    console.log(errors.array());
    return res.status(422).render('admin/edit-product', {
      pageTitle: 'Edit Product',
      path: '/admin/edit-product',
      editing: true,
      errorMessage: errors.array()[0].msg,
      product: {title: updatedTitle, imageUrl: updatedImageUrl, price: updatedPrice, description: updatedDesc, _id: prodId},
      hasError: true,
      validationErrors: errors.array()
    });
  }


  Product.findById(prodId)
    .then(product => {
      if(product.userId.toString() !== req.user._id.toString()){
        return res.redirect('/');
      }
      product.title = updatedTitle;
      product.price = updatedPrice;
      product.description = updatedDesc;
      if(image){
        fileHelper.deleteFile(product.imageUrl);
        product.imageUrl = image.path;
      }
      return product.save()
      .then(result => {
        console.log('UPDATED PRODUCT!');
        res.redirect('/admin/products');
      });
    })
    .catch(err => console.log(err));
};

//Added Authorization to only display those products which are added by him
exports.getProducts = (req, res, next) => {
    //Product.find()
    Product.find({userId: req.user._id})
    // .select('title price -_id')
    // .populate('userId', 'name')
    .then(products => {
      console.log(products);
      res.render('admin/products', {
        prods: products,
        pageTitle: 'Admin Products',
        path: '/admin/products'
      });
    })
    .catch(err => console.log(err));
};

//Added authorization to delete only if userId matches with the current logged in user
exports.postDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  // Product.findByIdAndRemove(prodId)
    // Product.deleteOne({_id: prodId, userId: req.user._id})
    // .then(() => {
    //   console.log('DESTROYED PRODUCT');
    //   res.redirect('/admin/products');
    // })
    // .catch(err => console.log(err));

    //we will find the product and then delete the image also if deleting the product
    Product.findById(prodId)
    .then(product => {
      if(!product){
        return next(new Error('Product not Found!'));
      }
      fileHelper.deleteFile(product.imageUrl);
      return Product.deleteOne({_id: prodId, userId: req.user._id})
    })
    .then(() => {
        console.log('DESTROYED PRODUCT');
        res.redirect('/admin/products');
      })
    .catch(err => {
      return next(new Error(err));
    })
};

exports.deleteProduct = (req, res, next) => {
  const prodId = req.params.productId;
    Product.findById(prodId)
    .then(product => {
      if(!product){
        return next(new Error('Product not Found!'));
      }
      fileHelper.deleteFile(product.imageUrl);
      return Product.deleteOne({_id: prodId, userId: req.user._id})
    })
    .then(() => {
        console.log('DESTROYED PRODUCT');
        //now instead of returning complete html page, we will return json data
        //res.redirect('/admin/products');

        //json data can be returned by using json mehod provided by expressjs. 
        //we just need to pass normal data/normal object and express will convert it into json when used json method
        res.status('200').json({message: 'Success!'});
      })
    .catch(err => {
      res.status('500').json({message: 'Deleting product failed.'});
    })
};

