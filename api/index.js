const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./models/User.js");
const Place = require("./models/Place.js");
const Booking = require("./models/Booking.js");
const cookieParser = require("cookie-parser");
const imageDownloader = require("image-downloader");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");
const multer = require("multer");
const mime = require("mime-types");

require("dotenv").config();
const app = express();

const bucket = "hotel-booking-app";
const bcryptSalt = bcrypt.genSaltSync(10);
const jwtSecret = "fmkojorifkoijgmogij";

app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(__dirname + "/uploads"));
app.use(
  cors({
    credentials: true,
    origin: "http://localhost:5173",
  })
);

async function uploadToS3(path, originalFilename, mimetype) {
  const client = new S3Client({
    region: "us-east-1",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    },
  });
  const parts = originalFilename.split(".");
  const ext = parts[parts.length - 1];
  const newFilename = Date.now() + "." + ext;
  const data = await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Body: fs.readFileSync(path),
      Key: newFilename,
      ContentType: mimetype,
      ACL: "public-read",
    })
  );
  return `https://${bucket}.s3.amazonaws.com/${newFilename}`;
}

function getUserDataFromReq(req) {
  return new Promise((resolve, reject) => {
    jwt.verify(req.cookies.token, jwtSecret, {}, async (err, userData) => {
      if (err) throw err;
      resolve(userData);
    });
  });
}

app.get("/test", (req, res) => {
  mongoose.connect(process.env.MONGO_URL);
  res.json("tesk ok");
});

// first API
app.post("/register", async (req, res) => {
  mongoose.connect(process.env.MONGO_URL);
  const { name, email, password } = req.body;
  const isEmailPresent = await User.findOne({ email });

  if (isEmailPresent) {
    return res.json("email already present");
  }

  try {
    const userDoc = await User.create({
      name,
      email,
      password: bcrypt.hashSync(password, bcryptSalt),
    });
    res.json(userDoc);
  } catch (e) {
    res.status(422).json(e);
  }
});

// second Api
app.post("/login", async (req, res) => {
  mongoose.connect(process.env.MONGO_URL);
  const { email, password } = req.body;
  const userDoc = await User.findOne({ email });

  if (userDoc) {
    const passOk = bcrypt.compareSync(password, userDoc.password);
    if (passOk) {
      jwt.sign(
        { email: userDoc.email, id: userDoc._id },
        jwtSecret,
        {},
        (err, token) => {
          if (err) throw err;
          res.cookie("token", token).json(userDoc);
        }
      );
    } else {
      res.status(422).json("pass not ok");
    }
  } else {
    res.json("Not found");
  }
});

// Third API
app.get("/profile", (req, res) => {
  mongoose.connect(process.env.MONGO_URL);
  const { token } = req.cookies;
  if (token) {
    jwt.verify(token, jwtSecret, {}, async (err, userData) => {
      if (err) throw err;
      const { name, email, _id } = await User.findById(userData.id);
      res.json({ name, email, _id });
    });
  } else {
    res.json(null);
  }
});

// Fourth API
app.post("/logout", (req, res) => {
  mongoose.connect(process.env.MONGO_URL);
  res.cookie("token", "").json(true);
});

// Fifth API
app.post("/upload-by-link", async (req, res) => {
  mongoose.connect(process.env.MONGO_URL);
  const { link } = req.body;
  const newName = "photo" + Date.now() + ".jpg";
  await imageDownloader.image({
    url: link,
    dest: "/tmp/" + newName,
  });
  const url = await uploadToS3(
    "/tmp/ " + newName,
    newName,
    mime.lookup("/tmp/" + newName)
  );
  res.json(url);
});

// Sixth API

const photosMiddleware = multer({ dest: "/tmp" });
app.post("/upload", photosMiddleware.array("photos", 100), async (req, res) => {
  mongoose.connect(process.env.MONGO_URL);
  const uploadedFiles = [];
  for (let i = 0; i < req.files.length; i++) {
    const { path, originalname, mimetype } = req.files[i];
    const url = await uploadToS3(path, originalname, mimetype);
    uploadedFiles.push(url);
  }
  res.json(uploadedFiles);
});

// Seventh API
app.post("/places", async (req, res) => {
  mongoose.connect(process.env.MONGO_URL);
  const { token } = req.cookies;
  const {
    title,
    address,
    addedPhotos,
    description,
    price,
    perks,
    extraInfo,
    checkIn,
    checkOut,
    maxGuests,
  } = req.body;
  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    if (err) throw err;
    const placeDoc = await Place.create({
      owner: userData.id,
      price,
      title,
      address,
      photos: addedPhotos,
      description,
      perks,
      extraInfo,
      checkIn,
      checkOut,
      maxGuests,
      price,
    });
    res.json(placeDoc);
  });
});

// Eighth API
app.get("/user-places", (req, res) => {
  mongoose.connect(process.env.MONGO_URL);
  const { token } = req.cookies;
  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    const { id } = userData;
    res.json(await Place.find({ owner: id }));
  });
});

// Ninth API
app.get("/places/:id", async (req, res) => {
  mongoose.connect(process.env.MONGO_URL);
  const { id } = req.params;
  res.json(await Place.findById(id));
});

// Tenth API
app.put("/places", async (req, res) => {
  mongoose.connect(process.env.MONGO_URL);
  const { token } = req.cookies;
  const {
    id,
    title,
    address,
    addedPhotos,
    description,
    perks,
    extraInfo,
    checkIn,
    checkOut,
    maxGuests,
    price,
  } = req.body;
  jwt.verify(token, jwtSecret, {}, async (err, userData) => {
    if (err) throw err;
    const placeDoc = await Place.findById(id);
    if (userData.id === placeDoc.owner.toString()) {
      placeDoc.set({
        title,
        address,
        photos: addedPhotos,
        description,
        perks,
        extraInfo,
        checkIn,
        checkOut,
        maxGuests,
        price,
      });
      await placeDoc.save();
      res.json("ok");
    }
  });
});

// Eleventh API
app.get("/places", async (req, res) => {
  mongoose.connect(process.env.MONGO_URL);
  res.json(await Place.find());
});

//  Twelfth API
app.post("/bookings", async (req, res) => {
  mongoose.connect(process.env.MONGO_URL);
  const userData = await getUserDataFromReq(req);
  const { place, checkIn, checkOut, numberOfGuests, name, phone, price } =
    req.body;
  await Booking.create({
    place,
    checkIn,
    checkOut,
    numberOfGuests,
    name,
    phone,
    price,
    user: userData.id,
  })
    .then((doc) => {
      res.json(doc);
    })
    .catch((err) => {
      throw err;
    });
});

// thirteenth API
app.get("/bookings", async (req, res) => {
  mongoose.connect(process.env.MONGO_URL);
  const userData = await getUserDataFromReq(req);
  res.json(await Booking.find({ user: userData.id }).populate("place"));
});

app.listen(4000);
