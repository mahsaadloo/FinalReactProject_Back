const express = require('express');
const app = express();
const cors = require('cors');
const appRoot = require('app-root-path');
const {parsed:{DB_URI,PORT}} = require('dotenv').config({ path: appRoot + "/.env" });
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fileUpload = require('express-fileupload');

app.use(express.json());
app.use(express.urlencoded({extended: true}))
app.use(cors( { origin: '*' } ));
app.use(fileUpload({ createParentPath: true }));
app.use(express.static(appRoot + ("/static")));

const mongoose = require('mongoose');
mongoose.connect(DB_URI).then(()=>{
    console.log("connected")
}).catch((err)=>{
    console.log(err,'err')
});

const SetProfileModel = mongoose.model("SetProfile", {
    fullName: String,
    nickName: String,
    birth: String,
    email: String,
    gender: String,
    file: String,
    password: String
});

app.post('/SetProfile', async (req, res) => {
    if(!req.files?.file) return null;
    const fileAddress = '/uploads/' + req.files?.file?.md5 + req.files?.file?.name; 
    req.files.file.mv(appRoot + '/static/' + fileAddress);
    const setProfile = new SetProfileModel({...req.body, file:fileAddress});
    // user.save().then((resp) => {
    //     res.status(201).json({msg: "OK", resp})
    // });
    await setProfile.save().then((resp) => {
        res.status(201).json({msg: "Successful", resp})
    })
});

app.post('/SetPassword', async (req, res) => {
    const hashedPassword = await bcrypt.hash(req.body.password, 10)
    const overrideUser = {...req.body, password: hashedPassword }
    const setProfile = SetProfileModel(overrideUser);
    await setProfile.save().then((resp) => {
        res.status(201).json({msg: "OK", resp})
    })
})

app.get('/ShowProfile/:id', async (req, res) => {
    const profile = await SetProfileModel.findById(req.params.id);
    res.status(200).json({ data: profile })
});

app.post('/Login', async (req, res) => {
    const user = await SetProfileModel.findOne({ email: req.body.email });
    if(!user) return res.status(400).json({msg: "User Not Found!"})
    const password = req.body.password;
    const correctPassword = await bcrypt.compare(password, user.password);
    if(!correctPassword) return res.status(400).json({msg: "User Not Found!"});
    const token = jwt.sign({ id : user._id }, process.env.JWT_SECRET );
    res.status(200).json({token})
});

app.get('/Home', async (req, res) => {
    if(!req.headers.authorization) return res.status(401).json({msg: " UNAUTHORIZED"})
    const isValidUser = await jwt.verify(req.headers.authorization, process.env.JWT_SECRET);
    if(!isValidUser) return res.status(401).json({msg: "UNAUTHORIZED"})

    const profile = await SetProfileModel.findById(id);
    res.status(200).json({ data: profile })
});

app.listen(PORT , () => { console.log(`example ${PORT||3001}`)})