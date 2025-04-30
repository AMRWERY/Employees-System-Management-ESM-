import { initializeApp } from "firebase/app";

import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDuhZ9Z3Ks0wjfBIP-CCHOXSdmsxmJ_7tQ",
  authDomain: "test-e1a5c.firebaseapp.com",
  databaseURL: "https://test-e1a5c-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "test-e1a5c",
  storageBucket: "test-e1a5c.appspot.com",
  messagingSenderId: "809022388111",
  appId: "1:809022388111:web:017e9a77aefddf60cebdfa"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
