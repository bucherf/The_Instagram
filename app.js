var express = require('express')
var session = require('express-session');
var bcrypt = require('bcryptjs');
var app = express();
var bodyParser = require('body-parser');
//var  = require('connect-mongo');
var mongoose = require('mongoose');

var fs = require('fs');
var path = require('path');
require('dotenv/config');

app.use(express.static(__dirname));

app.use(
    session({
        secret: bcrypt.genSaltSync(10),
        resave: true,
        saveUninitialized: true
    })
);

var modelRole = require('./model/role');
var modelImage = require('./model/image').Image;
var modelUser = require('./model/user');

mongoose.connect('mongodb://localhost/instagrammy',
	{ useNewUrlParser: true, useUnifiedTopology: true }, err => {
		console.log('connected to  mongodb://localhost/instagrammy')
	});



app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())



app.set("view engine", "ejs");


var multer = require('multer');


var storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, 'uploads')
	},
	filename: (req, file, cb) => {
		cb(null, file.fieldname + '-' + Date.now())
	}
});

var upload = multer({ storage: storage });

app.get('/', (req, res) => {
    res.render(path.join(__dirname, 'views/welcome'));
});

app.get('/loginView', (req, res) => {
    res.render(path.join(__dirname, 'views/login'));
});

app.get('/register', (req, res) => {
    res.render(path.join(__dirname, 'views/register'));
});

app.post('/home', (req, res) => {
    res.render(path.join(__dirname, 'views/home'));
});
app.get('/home', (req, res) => {
    res.render(path.join(__dirname, 'views/home'));
});

app.get('/profile', (req, res) => {
    modelUser.findOne({'_id': req.session.userid}, (error, user)=>{
        console.log(user)
        res.render(path.join(__dirname, 'views/profile'), { user })
})});

app.get('/image/create', (req, res) => {
    res.render(path.join(__dirname, 'views/image_create'));
});

app.get('/image_display', (req, res) => {
    res.render(path.join(__dirname, 'views/image_display'));
});

app.get('/search', (req, res) => {
    res.render(path.join(__dirname, 'views/search'));
});


//register
app.post('/register', upload.single('profilPicutre'), (req, res) => {
    console.log(req.body);

	var userObj = {
		username: req.body.username,
		password: req.body.password,
        profilPicture:
        {
            data: fs.readFileSync(path.join(__dirname + "/uploads/" + req.file.filename)),
            contentType: "image/png"
        }
	}

	modelUser.create(userObj, (err) => {
		if (err) {
			console.log(err);
		}
		else {
			res.redirect('/');
		}
	});
});

//login
app.post('/login', async (req, res) => {

	let user = await modelUser.findOne({ username: req.body.username});

	if (user){
        if(user.password == req.body.password){
			req.session.userid = user.id;
			req.session.username = user.username;
			console.log(req.session.userid);
			console.log(req.session.username);

			let images = await modelImage.find({userID: req.session.userid}).exec();

			res.redirect('/home');
        }else{res.redirect('/loginView')}
	} else {
		res.status(200).send("Not an existing user")
	}
	}
);

//upload image
app.post('/create_image', upload.single('image') , (req, res, next) => {
    const imageValidation = ['image/gif', 'image/jgp', 'image/jpeg', 'image/png'];
    const File = req.file.mimetype;

    if(!imageValidation.includes(File)) {
        res.status(500).send('This file cannot be uploaded!', { message: 'File type is wrong' });
        return;
    }

    var obj = {
        title: req.body.title,
        caption: req.body.caption,
        image: {
            data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename)),
            contentType: 'image/png'
        }
    }

    modelImage.create(obj, (err, item) => {
        if(err) {
            console.error(err);
            res.status(500).send('An error occurred', err);
        } else {
            res.redirect('/home');
        }
    });
});

//delete image
app.post('/image/delete', (req, res) => {
    modelImage.deleteOne({ _id: req.body.id }, (error) => {
        if(error) {
            console.error(error);
            res.status(500).send('An error occurred', error);
        } else {
            res.redirect('/image/display');
        }
    });
});

//display images
app.get('/image/display', (req, res) => {
    modelImage.find({}, (error, items) => {
        if(error) {
            console.error(error);
            res.status(500).send('An error occurred', error);
        } else {
            modelUser.findOne({'_id': req.session.userid}, (error, user)=>{
                console.log(user)
                res.render(path.join(__dirname, 'views/image_display'), { items, user })
            })
            
        }
    });
});

//like image
app.post('/image/like',(req,res) => {
	modelImage.findOneAndUpdate({_id:req.body.id},{$inc : {'likes':1} }, (error) => {
		if (error)
		{
			throw error
		}
		else
		{
			res.redirect('/image/display')
		}
	})
});


//edit profile
app.post('/changeProfilePicture', upload.single('image') , (req, res) => {

    modelUser.findOneAndUpdate(
        { _id: req.session.userid }, 
        { image: {data: fs.readFileSync(path.join(__dirname + '/uploads/' + req.file.filename))} },
        (error, item) => {
            if(error) {
                console.error(error);
                res.status(500).send('An error occurred', error); 
            } else {
                res.redirect('/home');
            }
        })
});

//search
app.post('/search', async(req, res, next) => {

	req.session.searchTerm = req.body.userInput;
	let searchTerm = req.body.userInput;

	console.log(typeof req.session.searchTerm);
	console.log(searchTerm);
	console.log(req.body); 

	let searchUsers = await modelUser.find({username: { $regex:  searchTerm, $options: "i"}});


	res.render('userSearch', {foundUsers: searchUsers});
})

var port = process.env.PORT || '3333';
app.listen(port, err => {
    if(err)
        throw err
    console.log('Server listening on port', port);
});