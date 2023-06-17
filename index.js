const express = require("express");
const app = express();
const cors = require("cors");
app.use(express.json());
const Agora = require("agora-access-token");
const bodyParser = require('body-parser');
var APP_ID = "ca4c49f8e0774aa3b387f652fb6f6c05";
var APP_CERTIFICATE = "408aff3fd3044531ba832083fbbf59b4";
// Middleware to parse the request body
app.use(bodyParser.json());

const corsOptions = {
  origin: process.env.ORIGIN_URL, // Replace with the origin of your frontend application
  credentials: true,
};
app.use(cors(corsOptions));


const nocahe = (req, res, next) => {
res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
res.header("Expires", "-1");
res.header("Pragma", "no-cache");
next();
}

const generateAccessToken = (req, res) => {
res.header("Access-Control-Allow-Origin", "*");
  const { channel, uid } = req.query;

if(!channel || !uid) return res.status(400).json({ error: "channel and uid are required" })
let role = Agora.RtcRole.SUBSCRIBER;
if(req.query.role === "publisher") role = Agora.RtcRole.PUBLISHER;
//   const role = req.body.isPublisher ? Agora.RtcRole.PUBLISHER : Agora.RtcRole.SUBSCRIBER;

  const expirationTimeInSeconds = 3600;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  // Perform necessary operations with the channel and uid values
  // For example, generate an access token based on the provided information
  const accessToken = Agora.RtcTokenBuilder.buildTokenWithUid(APP_ID, APP_CERTIFICATE, channel, uid, role, privilegeExpiredTs);

  // Prepare the options object with the required data
  const options = {
    appId: APP_ID, // Replace with your actual App ID
    token: accessToken,

  };

  // Send the options object as a response
  res.json(options);
}


app.get("/access_token",nocahe, generateAccessToken);
app.post("/rtctoken", (req, res) => {
  // Generate Token Here
});

app.get("/", (req, res) => res.send("Agora Auth Token Server"));

const port = process.env.PORT || 5173;
app.listen(port, () => console.log(`Agora Auth Token Server listening at Port ${port}`));