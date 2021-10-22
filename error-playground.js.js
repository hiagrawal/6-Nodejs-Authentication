//run this file using 'node error-playground.js' and see how is it behaving 

const sum = (a,b) => {
  if(a && b ){
    return a+b;
  }
  throw new Error('Invalid arguments');
}

//console.log(sum(1)); //this will throw exception and will stop further exceution
//console.log('Lets see if this gets logged'); //this will not be logged as it will stop executing

//so we can catch the thrown error so we can handle it accordingly

try{
  console.log(sum(1));
}catch (error){ //here we are catching the exception so execution will not get stopped
  console.log('Error Occured');
  console.log(error);
}
console.log('Further execution'); //and even if there is error, we are catching and hence further code will continue executing


