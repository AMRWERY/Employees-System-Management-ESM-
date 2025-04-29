import { initializeApp } from "firebase/app";

import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBTlIUxtXq-f0_ADqT2UsK4mZlz8GFyQMQ",
  authDomain: "todo-362dc.firebaseapp.com",
  projectId: "todo-362dc",
  storageBucket: "todo-362dc.appspot.com",
  messagingSenderId: "532045916013",
  appId: "1:532045916013:web:e6fe2436225403804a5c64",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
