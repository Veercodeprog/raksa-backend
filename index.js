require('dotenv').config();

const express = require("express");
const app = express();
const cors = require("cors");
app.use(express.json());
const Agora = require("agora-access-token");
const bodyParser = require('body-parser');
var admin = require("firebase-admin");
const functions = require("firebase-functions");
const {
  initializeApp,
  applicationDefault,
  cert,
} = require("firebase-admin/app");
const {
  getFirestore,
  Timestamp,
  FieldValue,
  Filter,
} = require("firebase-admin/firestore");
var APP_ID = "ca4c49f8e0774aa3b387f652fb6f6c05";
var APP_CERTIFICATE = "408aff3fd3044531ba832083fbbf59b4";
// Middleware to parse the request body
app.use(bodyParser.json());
const serviceAccount = require(process.env.SERVICE_ACCOUNT_PATH);


// const firebase_app = initializeApp();
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = getFirestore();
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
// Define the route for setting custom user registration claims
app.post('/setCustomClaims', async (req, res) => {
  try {
    const { phoneNumber, name, gender, birthDate, role } = req.body;

    // Create a Firestore document reference using the phone number as the ID
    const userRef = admin.firestore().collection('users').doc(phoneNumber);

    // Set the custom claims
    // await admin.auth().setCustomUserClaims(phoneNumber, { name, gender, birthDate, role });

    // Store additional user info in Firestore
    await userRef.set({ name, gender, birthDate, role });

    res.status(200).json({ message: 'Custom claims and user info stored successfully' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'An error occurred while setting custom claims' });
  }
});
app.get('/checkPhoneNumberRegistered', async (req, res) => {
  const { phoneNumber } = req.query;
console.log("phonenumber:",phoneNumber)
const number = `+${phoneNumber.replace(/\s/g, "")}`;
console.log("number:", number);

  try {
    const userRecord = await admin.auth().getUserByPhoneNumber(number);
    // User with the phone number already exists
    console.log('User with phone number exists:', userRecord.toJSON());
    res.json({ exists: true });
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      // User with the phone number does not exist
      console.log('User with phone number does not exist');
      res.json({ exists: false });
    } else {
      console.log('Error checking phone number:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});
const generateAccessToken = (req, res) => {
res.header("Access-Control-Allow-Origin", "*");
  const { channel, uid } = req.query;
console.log("uid:",uid)
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
const generateAccessTokenChat = (req, res) => {
res.header("Access-Control-Allow-Origin", "*");
  const {  userAccount } = req.query;

var APP_ID_CHAT = "8f57fcb21dc34d64914372aecdfbd0f4";
var APP_CERTIFICATE_CHAT = "3e4ed703e34f45918463146054761bb0";
if( !userAccount) return res.status(400).json({ error: "channel and uid are required" })
let role = Agora.RtmRole.SUBSCRIBER;
if(req.query.role === "publisher") role = Agora.RtmRole.PUBLISHER;
//   const role = req.body.isPublisher ? Agora.RtcRole.PUBLISHER : Agora.RtcRole.SUBSCRIBER;

  const expirationTimeInSeconds = 3600;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  // Perform necessary operations with the channel and uid values
  // For example, generate an access token based on the provided in formation

  const accessToken = Agora.RtmTokenBuilder.buildToken(APP_ID, APP_CERTIFICATE,  userAccount, role, privilegeExpiredTs);
  // Prepare the options object with the required data
  const options = {
    appId: APP_ID, // Replace with your actual App ID
    token: accessToken,

  };

  // Send the options object as a response
  res.json(options);
}

app.get("/access_token",nocahe, generateAccessToken);
app.get("/access_token_chat",nocahe, generateAccessTokenChat);
app.post("/rtctoken", (req, res) => {
  // Generate Token Here
});

app.get("/", (req, res) => res.send("Agora Auth Token Server"));

const port = process.env.PORT || 5173;
app.listen(port, () => console.log(`Agora Auth Token Server listening at Port ${port}`));