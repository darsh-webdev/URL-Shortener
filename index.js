require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const shortId = require("shortid");
const validUrl = require("valid-url");

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: false }));

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.get("/", function (req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

// Database Connection
const uri = process.env.MONGO_URI;
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

// Database Schema
const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: String,
});

const URL = mongoose.model("URL", urlSchema);

// Your first API endpoint
app.get("/api/hello", function (req, res) {
  res.json({ greeting: "hello API" });
});

// API Routes

app.post("/api/shorturl", async (req, res) => {
  const url = req.body.url;
  const urlCode = shortId.generate();

  if (!validUrl.isWebUri(url)) {
    res.json({
      error: "invalid url",
    });
  } else {
    try {
      let findUrl = await URL.findOne({
        original_url: url,
      });

      if (findUrl) {
        res.json({
          original_url: findUrl.original_url,
          short_url: findUrl.short_url,
        });
      } else {
        findUrl = new URL({
          original_url: url,
          short_url: urlCode,
        });
        await findUrl.save();
        res.json({
          original_url: findUrl.original_url,
          short_url: findUrl.short_url,
        });
      }
    } catch (err) {
      console.error(err);
      res.json("Server error");
    }
  }
});

app.get("/api/shorturl/:short_url?", async (req, res) => {
  try {
    const url = req.params.short_url;
    const foundUrl = await URL.findOne({
      short_url: url,
    });

    if (foundUrl) {
      return res.redirect(foundUrl.original_url);
    } else {
      return res.json("No URL found");
    }
  } catch (err) {
    console.error(err);
    res.json("Server error");
  }
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
