import * as firebase from 'firebase/app';
import 'firebase/database';
require('dotenv/config');

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: 'spotify-express-login.firebaseapp.com',
  databaseURL: 'https://spotify-express-login.firebaseio.com',
  projectId: 'spotify-express-login',
  storageBucket: 'spotify-express-login.appspot.com',
  messagingSenderId: '1039559366086',
  appId: '1:1039559366086:web:66d3eaae2b495256cccec7',
  measurementId: 'G-83VM4VY6WS',
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
// Get a reference to the database service
export const db = firebase.database();
