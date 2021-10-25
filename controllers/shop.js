const fs = require('fs');
const path = require('path');

const pdfDocument = require('pdfkit');

const Product = require('../models/product');
const Order = require('../models/order');

exports.getProducts = (req, res, next) => {
  Product.find()
    .then(products => {
      console.log(products);
      res.render('shop/product-list', {
        prods: products,
        pageTitle: 'All Products',
        path: '/products'
      });
    })
    .catch(err => {
      console.log(err);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then(product => {
      res.render('shop/product-detail', {
        product: product,
        pageTitle: product.title,
        path: '/products'
      });
    })
    .catch(err => console.log(err));
};

exports.getIndex = (req, res, next) => {
  Product.find()
    .then(products => {
      res.render('shop/index', {
        prods: products,
        pageTitle: 'Shop',
        path: '/'
      });
    })
    .catch(err => {
      console.log(err);
    });
};

exports.getCart = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items;
      res.render('shop/cart', {
        path: '/cart',
        pageTitle: 'Your Cart',
        products: products
      });
    })
    .catch(err => console.log(err));
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then(product => {
      return req.user.addToCart(product);
    })
    .then(result => {
      console.log(result);
      res.redirect('/cart');
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then(result => {
      res.redirect('/cart');
    })
    .catch(err => console.log(err));
};

exports.postOrder = (req, res, next) => {
  req.user
    .populate('cart.items.productId')
    .execPopulate()
    .then(user => {
      const products = user.cart.items.map(i => {
        return { quantity: i.quantity, product: { ...i.productId._doc } };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user
        },
        products: products
      });
      return order.save();
    })
    .then(result => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect('/orders');
    })
    .catch(err => console.log(err));
};

exports.getOrders = (req, res, next) => {
  Order.find({ 'user.userId': req.user._id })
    .then(orders => {
      res.render('shop/orders', {
        path: '/orders',
        pageTitle: 'Your Orders',
        orders: orders
      });
    })
    .catch(err => console.log(err));
};

exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;

  //Access to file should be allowed only when logged in user has created the order
  Order.findById(orderId)
  .then(order => {
    if(!order){
      return next(new Error('No order Found.'));
    }
    if(order.user.userId.toString() !== req.user._id.toString()){
      return next(new Error('Unauthorized'));
    }
    const invoiceName = 'invoice-' + orderId + '.pdf';
    const invoicePath = path.join('data', 'invoices', invoiceName)

    //to send the response, we are reading the file, if we read like this, node will read the entire file in memory and 
    //then will return it, which is obviously not a good idea since it will take a lot of time, memory, may go out of memory flow also
    //if bigger file or if multiple file requests which will be there in real time
    // fs.readFile(invoicePath, (err, data) => {
    //   if(err){
    //     return next(err);
    //   }
    //   //this will set it to extension pdf
    //   res.setHeader('Content-Type', 'application/pdf');
    //   //this will download the file as attachment
    //   //res.setHeader('Content-Disposition', 'attachment;filename="'+ invoiceName +'"');
    //   //this will open it inline in the browser
    //   res.setHeader('Content-Disposition', 'inline;filename="'+ invoiceName +'"');
    //   res.send(data);
    // });

    //so instead of reading all together which takes a lot of time and memory, we will read in chunks and streams of data
    //and write it in chunks in res object. and then it will be created on the fly in the browser which fetching all streams of data
    //and concatenating it
    // const file = fs.createReadStream(invoicePath);
    // res.setHeader('Content-Type', 'application/pdf');
    // res.setHeader('Content-Disposition', 'inline;filename="'+ invoiceName +'"');
    // file.pipe(res);

    //Till now, we are reading the data from the dummy pdf file we just added
    //However, we will have to craete the pdf file on the order data and write it to the file stream as well as serve it to the server
    //for this, we will use pdfkit which creates pdf on the file
    const pdfDoc = new pdfDocument();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline;filename="'+ invoiceName +'"');
    pdfDoc.pipe(fs.createWriteStream(invoicePath)); //so we will write it to the file
    pdfDoc.pipe(res); //as well as serve it to the server

    //Now will start writing to file
    //pdfDoc.text('Hello World!');

    pdfDoc.fontSize(26).text('Invoice', {
      underline: true
    })
    pdfDoc.text('---------------------------');
    let totalPrice = 0;
    order.products.forEach(prod => {
      totalPrice += prod.quantity * prod.product.price;
      pdfDoc.fontSize(14).text(prod.product.title + '-' + prod.quantity + 'x' + '$' + prod.product.price);
    });
    pdfDoc.text('---------------------------');
    pdfDoc.fontSize(20).text('Total Price: $' + totalPrice);

    pdfDoc.end(); //end will indicate that it is end od document and it has finished writing

  })
  .catch(err => {
    return next(new Error(err));
  });
}
