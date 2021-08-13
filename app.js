const express=require("express");
const ejs=require("ejs");
const mongoose=require("mongoose");
const session=require("express-session");
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");
mongoose.connect('mongodb://localhost:27017/formDB', {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set("useCreateIndex",true);
const app=express();

var questions=[];

app.use(express.static("public"));
app.set('view engine','ejs');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(session({
    secret:"thisismysecretstring.",
    resave:false,
    saveUninitialized:false
}));

app.use(passport.initialize());

app.use(passport.session());

const userSchema=new mongoose.Schema({
    username:String,
    password:String,
    questions:[String]
});

userSchema.plugin(passportLocalMongoose);

const User=mongoose.model("User",userSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/form",function(req,res){
    if(req.isAuthenticated())
    {
        User.findById(req.user.id,function(err,foundUser){

            if(err)
            console.log(err);
            else
            {
                if(foundUser)
                {
                    res.render("form",{questions:foundUser.questions});
                }
            }
    
        });
    }
    
    else
    res.redirect("/login");
});

app.post("/form",function(req,res){

    User.findById(req.user.id,function(err,foundUser){

        if(err)
        console.log(err);
        else
        {
            if(foundUser)
            {
                foundUser.questions.push(req.body.question);
                foundUser.save(function(){

                    res.redirect("/form");

                });
            }
        }

    });
    

});

app.post("/deleteQuery",function(req,res){

    User.findById(req.user.id,function(err,foundUser){
        
        if(err)
        console.log(err);
        else
        {
            if(foundUser)
            {
                foundUser.questions.pull(req.body.delete);
                foundUser.save(function(){
                    res.redirect("/form");
                });
            }
        }

    });

});

app.get("/createForm",function(req,res){

    if(req.isAuthenticated())
    {
        User.findById(req.user.id,function(err,foundUser){

            if(err)
            console.log(err);
            else
            {
                if(foundUser)
                {
                    res.render("createform",{questions:foundUser.questions});
                }
            }
    
        });
    }
    
    else
    res.redirect("/login");

});

app.post("/createForm",function(req,res){

    res.redirect("/createForm");

});

app.get("/register",function(req,res){
    res.render("register");
});

app.post("/register",function(req,res){

    User.register({username:req.body.username},req.body.password,function(err,user){

        if(err)
        {
            console.log(err);
            res.redirect("/register");
        }
        else
        {
            passport.authenticate("local")(req,res,function(){
                res.redirect("/form");
            });
        }

    });
});

app.get("/login",function(req,res){
    res.render("login");
});

app.post("/login",function(req,res){
    
    const user=new User({
        username:req.body.username,
        password:req.body.password
    });

    req.login(user,function(err){
        if(err)
        console.log(err);
        else
        {
            passport.authenticate("local")(req,res,function(){
                res.redirect("/form");
            });
        }
    });

});



app.listen(3000);