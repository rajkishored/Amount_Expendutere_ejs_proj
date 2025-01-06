import express from "express"

import bodyParser from "body-parser";
import pg from "pg"
import bcryptjs from "bcryptjs";
import env from "dotenv";
import axios from "axios";
import session from "express-session";

env.config();
const salt_rounds=5;
const app=express();
const port=3000;

// app.use(
//   session({
//     secret: process.env.SESSION_SECRET
//     ,
//     resave: false,
//     saveUninitialized: true,
//   })
// );


const db=new pg.Client({

 host:process.env.PG_HOST,
 database:process.env.PG_DATABASE,
 user:process.env.PG_USER,
 password:process.env.PG_PASSWORD,
 connectionString: process.env.DATABASE_URL,
 port:5432,
 ssl: { rejectUnauthorized: false },


});
db.connect((err) => {
    if (err) {
      console.error("Error connecting to the database:", err.stack);
    } else {
      console.log("Connected to the database successfully!");
    }
  });




app.use(express.static("public"))
app.use(bodyParser.urlencoded({extended:true}))



var id=0;

app.get("/",(req,res)=>{
     
    res.render("index.ejs")
})


app.get("/register",(req,res)=>{

    res.render("register.ejs")
})

app.get("/login",(req,res)=>{
    res.render("login.ejs",{
        message:"no"
    })
   
})

 //login
 app.post("/logpost", async (req, res) => {
    const namee = req.body.username;
    const password = req.body.psw;
  
    // Define the regex for a valid email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
    // Check if the email format is valid
    if (!emailRegex.test(namee)) {
      return res.send("Please enter a valid email address (e.g., xxx@gmail.com).");
    }
  
    try {
      // Fetch user details from the database based on the email
      const result = await db.query("SELECT * FROM users WHERE email=$1", [namee]);
  
      // Check if user exists
      if (result.rows.length >= 1) {
        console.log(result.rows[0].password);
        id=result.rows[0].id;
  
        // Compare entered password with hashed password from the database
        bcryptjs.compare(password, result.rows[0].password, (err, isMatch) => {
          if (err) {
            console.error("Error during password comparison:", err);
           
          }
  
          if (isMatch) {
          
            totao_amount(res);
          } else {
            res.send("Wrong password.");
          }
        });
      } else {
        res.send("User not registered or Wrong fromate.");
      }
    } catch (err) {
      console.error("Database error:", err);
      
    }
  });
  

//register
app.post("/regpost", async(req,res)=>{
    
    const rmail= req.body.remail;
    const rpassword=req.body.rpsw;

      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  
   
    if (!emailRegex.test(rmail)) {
      return res.send("Please enter a valid email address (e.g., xxx@gmail.com).");
    }

    try{

    const result=await db.query("select * from users where email=$1",[rmail]);
      
     const data=result.rows[0];
     
    console.log(result.rows.length)

     if(result.rows.length>=1){

        res.send("email already exist");
     }
     else{
        
        bcryptjs.hash(rpassword,salt_rounds,async(err,hash)=>{
            if(err){
                res.send(err.stack)
            }  
            
            else{  
                
                const hashedpass=hash;
            console.log(hashedpass)

      const insert=await db.query("insert into users (email,password) values($1,$2) returning*",[rmail,hashedpass])
      
        
        if(insert.rows.length>0){
           
             res.render("login.ejs",{
                message:"login to continue"
             })

        }
        else{
            res.send("retry");
        }
      } })
      

     }
     
     
    }
    catch(err)
    {
       console.log(err.stack) 
       
    }
})


// home pageee

app.post("/add",async (req,res)=>{

   const reason=req.body.reson;
   const amount=req.body.amount;

    var day= new Date().getDate();
    var month=new Date().getMonth()+1;
    var year=new Date().getFullYear();

    if(reason.length>2 && amount.length>0){
        console.log("hello")
   
    const adddata=await db.query("insert into  expenses (reason,amount,day,month,year,userid) values ($1,$2,$3,$4,$5,$6) returning*",[reason,amount,day,month,year,id])
    console.log(adddata.rows);
    if(adddata.rows.length>0){
        totao_amount(res);
    }
    else{
        res.render("enter elements to add");
    }}
    else{
        res.send("fill the details to add");
    }
})
 app.post("/delete",async (req,res)=>{
   
    console.log("id"+req.body.resdel);
   const d= await db.query("delete from expenses where eid=$1 ",[req.body.resdel])
  
        totao_amount(res);


 })


//render home function
async function totao_amount(res){

    const amo=await db.query("select * from expenses join users on expenses.userid=users.id where userid=$1",[id]);
    const total=await db.query("select sum(amount) from expenses where userid=$1 ",[id])
   
        res.render("home.ejs",{
           
               fulldata:amo.rows,
               t_amount:total.rows[0].sum
    
            })

   }


   //detailed 

   app.post("/detail",async(req,res)=>{
    
    var api=""
    //api
    try{
     api=await axios.get("https://zenquotes.io/api/random/");
       console.log(api.data[0].q)
   
  
        res.render("details.ejs",{
          data:"enter", 
          tamount:"empty" ,
          secret:api.data[0].q
        })
       
   
}
catch(err){
    console.log(err.stack)
    res.render("details.ejs",{
        data:"enter", 
        tamount:"empty" ,
        secret:"Haha"
      })

  }
})

   app.post("/search",async(req,res)=>{
    let fdate=req.body.fdate;
    let ldate=req.body.ldate;
    console.log(fdate+"   "+ldate)

    let fyear=fdate.substring(0,4)
    let fmonth=fdate.substring(5,7)
    let fday=fdate.substring(8,)
    let lyear=ldate.substring(0,4)
    let lmonth=ldate.substring(5,7)
    let lday=ldate.substring(8,)

    console.log(fday+"/"+fmonth+"/"+fyear);
       if(fyear.length>0 & fday.length>0 & fmonth.length>0 & lyear.length>0 & lday.length>0 & lmonth.length>0){
     var data=await db.query("select * from users join expenses on users.id = expenses.userid where userid=$5 and  day between $1 and $2  and month between $3 and $4",[fday,lday,fmonth,lmonth,id]);
        console.log(data.rows);
        
     var amt=await db.query("select sum(amount) from users join expenses on users.id = expenses.userid where userid=$5 and  day between $1 and $2  and month between $3 and $4",[fday,lday,fmonth,lmonth,id]);

     if(data.rows.length>0){

        res.render("details.ejs",{
            data:data.rows,
            tamount:amt.rows[0].sum
        })

     }
     else{
        res.send("enter details to search");
     }
    }
    else{
        res.send("enter details")
    }

   })









app.listen(port,()=>{
    console.log("server running at port"+port)
})







// <!-- <%   var reson;
// var amount ;
//  var data;

// fulldata..forEach(x => {
// reson=x.reason;
// amount=x.amount;
// data=x.day;




// });       %> -->