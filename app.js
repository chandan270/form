require('dotenv').config();
const express=require("express");
const ejs=require("ejs");
const mongoose=require("mongoose");
const session=require("express-session");
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");

const URI = process.env.URI;
mongoose.connect(URI,{useNewUrlParser:true,useUnifiedTopology: true});
mongoose.set("useCreateIndex",true);
const app=express();

var questions=[];
var id=0;
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



const formSchema = new mongoose.Schema({
    questions:[String],
    answers:[String]
})

const userSchema=new mongoose.Schema({
    username:String,
    password:String,
    forms:[formSchema]
});

userSchema.plugin(passportLocalMongoose);

const User=mongoose.model("User",userSchema);
const Form=mongoose.model("Form",formSchema);

passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/",function(req,res){

    if(req.isAuthenticated())
    {
        User.findById(req.user.id,function(err,foundUser){

            if(err)
            console.log(err);
            else
            if(foundUser)
            {
                var forms=[];
                for(var i=0;i<foundUser.forms.length;i++)
                {
                    forms.push(foundUser.forms[i].id);
                }
                res.render("home",{forms:forms,l:foundUser.forms.length});
            }

        });
    }
    else
    res.redirect("/login");

});

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
                    if(id!=0)
                    {
                        const existingForm=foundUser.forms.id(id);
                        res.render("form",{questions:existingForm.questions,uniqueuser:req.user.id,uniqueform:id});
                    }
                    else
                    res.render("form",{questions:questions,uniqueuser:req.user.id,uniqueform:id});
                    
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
                if(id==0)
                {
                    const newForm=new Form;
                    id=newForm.id;
                    foundUser.forms.push(newForm);
                }
                
                var existingForm=foundUser.forms.id(id);
                console.log(typeof(existingForm.questions));
                existingForm.questions.push(req.body.question);
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
                var existingForm=foundUser.forms.id(id);
                existingForm.questions.pull(req.body.delete);
                foundUser.save(function(){
                    res.redirect("/form");
                });
            }
        }

    });

});

app.get("/createForm/:uniqueuser/:uniqueform",function(req,res){

    
    User.findById(req.params.uniqueuser,function(err,foundUser){

        if(err)
        console.log(err);
        else
        {
            if(foundUser)
            {
                var existingForm=foundUser.forms.id(req.params.uniqueform);
                res.render("createform",{questions:existingForm.questions,uniqueuser:req.params.uniqueuser,uniqueform:req.params.uniqueform});
            }
        }

    });
    
    

});

app.post("/createForm",function(req,res){

    res.redirect("/createForm/"+req.user.id+"/"+id);

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
                res.redirect("/");
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
                res.redirect("/");
            });
        }
    });

});

app.post("/storeresponses/:uniqueuser/:uniqueform",function(req,res){

    User.findById(req.params.uniqueuser,function(err,foundUser){

        if(err)
        console.log(err);
        else
        {
            if(foundUser)
            {
                var existingForm=foundUser.forms.id(req.params.uniqueform);
                for(var i=0;i<existingForm.questions.length;i++)
                {
                    var s="answers"+i;
                    console.log(req.body[s]);
                    
                    existingForm.answers.push(req.body[s]);
                }
                foundUser.save(function(){
                    res.render("success");
                });

            }
        }

    });

});

app.get("/responses/:uniqueform",function(req,res){

    User.findById(req.user.id,function(err,foundUser){

        if(err)
        console.log(err);
        else
        {
            if(foundUser)
            {
                
                var existingForm=foundUser.forms.id(req.params.uniqueform);
                console.log(existingForm.answers);
                res.render("responses",{questions:existingForm.questions,answers:existingForm.answers});
            }
        }

    });

});

app.post("/responses/:uniqueform",function(req,res){

    res.redirect("/responses/"+req.params.uniqueform);

});

app.get("/logout",function(req,res){

    req.logout();
    res.redirect("/login");

});


const host = '0.0.0.0';
const port = process.env.PORT || 3000;

app.listen(port, host, function() {
    console.log("Server started.......");
});