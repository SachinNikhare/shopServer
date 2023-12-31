let express = require("express");
let app  = express();
app.use(express.json());
app.use(function(req,res,next){
    res.header("Access-Control-Allow-Origin","*");
    res.header(
        "Access-Control-Allow-Methods",
        "GET, POST, OPTIONS, PUT, PATCH, DELETE, HEAD"
    );
    res.header(
        "Access-Control-Allow-Headers",
        "Origin, X-Requested-With, Content-Type, Accept"
    );
    next();
});
const port = process.env.PORT || 2410;
app.listen(port, ()=>console.log(`Node app listening on port ${port}!`));

let {shopData} = require("./shopData.js");
let fs = require("fs");
let fname = "shops.json";

//This function helps to reset the data.
app.get("/reset",function(req,res){
    let data = JSON.stringify(shopData);
    fs.writeFile(fname,data,function(err){
        if(err) res.status(404).send(err);
        else res.send("Data in file is reset")
    })
})


//GET /shops – to get the shopId and shopName of all the shops
app.get("/shops",function(req,res){
    fs.readFile(fname,"utf8",function(err,data){
        if(err) res.status(404).send(err);
        else{
            let shopData = JSON.parse(data);
            shopData = shopData.shops.map(s=>({shopId:s.shopId,name:s.name}));
            res.send(shopData);
        }
    })
})

//GET /purchases/shops/:id – to get the purchases of the specified shop
//GET /purchases/products/:id – to get the purchases of the specified product
app.get("/purchases/:filterby/:id",function(req,res){
    const filterby = req.params.filterby;
    const id = +req.params.id;
    fs.readFile(fname,"utf8",function(err,data){
        if(err) res.status(404).send(err);
        else{
            let shopData = JSON.parse(data);
            purchasedata = shopData.purchases.map(p=>({shopId: p.shopId,productid: p.productid,quantity: p.quantity,price: p.price}));
            if(filterby=="shops"){
                purchasedata = purchasedata.filter(p=>p.shopId==id)
            }
            if(filterby=="products"){
                purchasedata = purchasedata.filter(p=>p.productid==id);
            }
            res.send(purchasedata);
        }
    })
})


app.get("/totalPurchase/:filterby/:id",function(req,res){
    const filterby = req.params.filterby;
    const id = +req.params.id;
    fs.readFile(fname,"utf8",function(err,data){
        if(err) res.status(404).send(err);
        else{
            let shopData = JSON.parse(data);
            let count;
            let filterdata = [];
            purchasedata = shopData.purchases.map(p=>({shopId: p.shopId,productid: p.productid,quantity: p.quantity,price: p.price}));
            if(filterby=="shop"){
                purchasedata = purchasedata.filter(p=>p.shopId==id)
                for(let i=0;i<purchasedata.length;i++){
                    let exist = filterdata.find(f=>f.productid==purchasedata[i].productid);
                    if(!exist){
                        let quantity = purchasedata.reduce((acc,curr)=>(curr.productid==purchasedata[i].productid?acc+curr.quantity:acc),0)
                        filterdata.push({productid:purchasedata[i].productid,quantity:quantity})
                    }
                }
            }
            if(filterby=="product"){
                purchasedata = purchasedata.filter(p=>p.productid==id)
                for(let i=0;i<purchasedata.length;i++){
                    let exist = filterdata.find(f=>f.shopId==purchasedata[i].shopId);
                    if(!exist){
                        let quantity = purchasedata.reduce((acc,curr)=>(curr.shopId==purchasedata[i].shopId?acc+curr.quantity:acc),0);
                        filterdata.push({shopId:purchasedata[i].shopId,quantity:quantity})
                    }
                }
            }
            count = JSON.stringify(filterdata);
            console.log(filterdata);
            res.send(filterdata);
        }
    })
})



//GET /purchases - to get the shopId, productid, quantity, price of all the purchases AND,
//GET /purchases?shop=st1&product=pr1&sort=QtyAsc,QtyDesc,ValueAsc,ValueDesc
app.get("/purchases",function(req,res){
    const {shop="", product=[], sort=""} = req.query;
    fs.readFile(fname,"utf8",function(err,data){
        if(err) res.status(404).send(err);
        else{
            let shopData = JSON.parse(data);
            purchasedata = shopData.purchases.map(p=>({shopId: p.shopId,productid: p.productid,quantity: p.quantity,price: p.price}));
            if(shop){
                purchasedata = purchasedata.filter(p=>p.shopId==shop);
            }
            if(product.length>0){
                purchasedata = purchasedata.filter(p=>product.includes(p.productid));
            }
            if(sort=="QtyAsc"){
                purchasedata.sort((n1,n2)=>n1.quantity-n2.quantity);
            }
            if(sort=="QtyDesc"){
                purchasedata.sort((n1,n2)=>n2.quantity-n1.quantity);
            }
            if(sort=="ValueAsc"){
                purchasedata.sort((n1,n2)=>(n1.quantity*n1.price)-(n2.quantity*n2.price));
            }
            if(sort=="ValueDesc"){
                purchasedata.sort((n1,n2)=>(n2.quantity*n2.price)-(n1.quantity*n1.price));
            }
            console.log("PURCHAESE DATA",purchasedata);
            res.send(purchasedata);
        }
    })
})

//POST /shops – to create a new shop. shopId is generated by the node server
app.post("/shops",function(req,res){
    let body = req.body;
    fs.readFile(fname,"utf8",function(err,data){
        if(err) res.status(404).send(err);
        else{
            let shopsData = JSON.parse(data);
            let maxshopid = shopsData.shops.reduce((acc,curr)=>(curr.shopId>acc?curr.shopId:acc),0);
            let newid = maxshopid+1;
            let newshops = {shopId:newid,...body};
            shopData.shops.push(newshops);
            let data1 = JSON.stringify(shopData);
            fs.writeFile(fname,data1,function(err){
                if(err) res.status(404).send(err);
                else res.send(newshops);
            });
        }
    })
})

//GET /products – to get the productId, productName, category, description of all the products
app.get("/products",function(req,res){
    fs.readFile(fname,"utf8",function(err,data){
        if(err) res.status(404).send(err);
        else{
            let shopData = JSON.parse(data);
            shopData = shopData.products;
            res.send(shopData);
        }
    })
})

//POST /products – to create a new product. productId is generated by the node server. Note that all the fields in the sample body are text fields.
app.post("/products",function(req,res){
    let body = req.body;
    fs.readFile(fname,"utf8",function(err,data){
        if(err) res.status(404).send(err);
        else{
            let shopsData = JSON.parse(data);
            let maxproductid = shopData.products.reduce((acc,curr)=>(curr.productId>acc?curr.productId:acc),0);
            let newid = maxproductid + 1;
            let newproduct = {productId:newid,...body};
            shopData.products.push(newproduct);
            let data1 = JSON.stringify(shopData);
            fs.writeFile(fname,data1,function(err){
                if(err) res.status(404).send(err);
                else res.send(newproduct);
            })
        }
    })
})


//POST /purchases – to create a new purchase. purchaseId is generated by the node server.
app.post("/purchases",function(req,res){
    let body = req.body;
    fs.readFile(fname,"utf8",function(err,data){
        if(err) res.status(404).send(err);
        else{
            let shopData = JSON.parse(data);
            let maxpurchaseid = shopData.purchases.reduce((acc,curr)=>(curr.purchaseId>acc?curr.purchaseId:acc),0);
            let newid = maxpurchaseid+1;
            let newpurchase = {purchaseId:newid,...body};
            shopData.purchases.push(newpurchase);
            let data1 = JSON.stringify(shopData);
            fs.writeFile(fname,data1,function(err){
                if(err) res.status(404).send(err);
                else res.send(newpurchase);
            })
        }
    })
})


//PUT /products/:id – to update the details of a product. Note that productid and productName cannot be changed.
app.put("/products/:id", function(req, res) {
    let body = req.body;
    let id = +req.params.id;
    fs.readFile(fname, "utf8", function(err, data) {
      if (err) {
        res.status(404).send(err);
      } else {
        let shopData = JSON.parse(data);
        let index = shopData.products.findIndex(pt => pt.productId === id);
        if (index >= 0) {
            shopData.products[index].category = body.category;
            shopData.products[index].description = body.description;
            updatedProduct = shopData.products[index];
          let newData = JSON.stringify(shopData);
          fs.writeFile(fname, newData, function(err) {
            if (err) {
              res.status(404).send(err);
            } else {
              res.send(updatedProduct);
            }
          });
        } else {
          res.status(404).send("No Product Found");
        }
      }
    });
  });