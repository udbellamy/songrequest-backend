require('dotenv').config({ path: '../.env' });

const mongoose = require("mongoose");
const express = require("express");
const bodyParser = require("body-parser");
const logger = require("morgan");
const Queue = require("./schema-queue");
const SongList = require("./schema-songlist");

const API_PORT = process.env.PORT || 3001;
const app = express();
const router = express.Router();

const dbRoute = `mongodb://${process.env.DATABASE_USERNAME}:${process.env.DATABASE_PASSWORD}@${process.env.DATABASE_HOST}:${process.env.DATABASE_PORT}/${process.env.DATABASE_NAME}`;



// connects our back end code with the database
mongoose.connect(
  dbRoute,
  { useNewUrlParser: true }
);

let db = mongoose.connection;

db.once("open", () => console.log("connected to the database"));

// checks if connection with the database is successful
db.on("error", console.error.bind(console, "MongoDB connection error:"));

// (optional) only made for logging and
// bodyParser, parses the request body to be a readable json format
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(logger("dev"));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", '*');
  res.header("Access-Control-Allow-Credentials", true);
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header("Access-Control-Allow-Headers", 'Origin,X-Requested-With,Content-Type,Accept,content-type,application/json,XMLHttpRequest');
  next();
});

// this is our get method
// this method fetches all available data in our database
// router.get("/getSongList", (req, res) => {
//   SongList.find( {}, (err, SongList) => {
//     if (err) return res.json({ success: false, error: err });
//     return res.json({ success: true, SongList: SongList });
//   });
// });

router.get("/getSongList", (req, res) => {
  // let newSongList = new SongList({});
  //     newSongList.save();
  SongList.find({}, {"artist": 1, "song": 1, "inqueue": 1}, (err, SongList) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true, SongList: SongList });
  });
});

router.get("/getQueue", (req, res) => {
  Queue.find({}, {"artist": 1, "song": 1, "user": 1, "link": 1}, (err, Queue) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true, Queue: Queue });
  });
});

router.get("/searchSongs", (req, res) => {
  artist = req.query.artist
  song = req.query.song
  SongList.find({ $and:[ {'artist': { '$regex' : artist, '$options' : 'i' }}, {'song': { '$regex' : song, '$options' : 'i' } } ]}, {"artist": 1, "song": 1, "inqueue": 1}, (err, SongList) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true, SongList: SongList });
  });
});

router.get("/getSongById", (req, res) => {
  _id = req.query._id
  SongList.findById(_id, 'artist song', { lean: true }, (err, Song) => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true, Song: Song });
  });
});

router.delete("/deleteSongById", (req, res) => {
  _id = req.query._id
  Queue.findByIdAndDelete(_id, (err, res) => {
    if (err) return res.json({ success: false, error: err });
  });
});

// this is our update method
// this method overwrites existing data in our database
router.post("/postSongToQueue", (req, res) => {
  let songToQueue = new Queue();
  user = req.query.user
  artist = req.query.artist
  song = req.query.song

  songToQueue.artist=artist
  songToQueue.song=song
  songToQueue.user=user
  songToQueue.link=""
  songToQueue.save(err => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true });
  });
});

// this is our create method
// this method adds new data in our database
router.post("/putData", (req, res) => {
  let data = new Data();

  const { trigramme, irt, buildStatus, queueNumber, jobNumber } = req.body;
  console.log(req.body)

  if (!trigramme || !irt || !buildStatus) {
    return res.json({
      success: false,
      error: "INVALID INPUTS"
    });
  }
  data.trigramme = trigramme;
  data.irt = irt;
  data.buildStatus = buildStatus;
  data.queueNumber = queueNumber;
  data.jobumber = jobNumber;
  data.save(err => {
    if (err) return res.json({ success: false, error: err });
    return res.json({ success: true });
  });
});

// append /api for our http requests
app.use("/api", router);

// launch our backend into a port
app.listen(API_PORT, () => console.log(`LISTENING ON PORT ${API_PORT}`));