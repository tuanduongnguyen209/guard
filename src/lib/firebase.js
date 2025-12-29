import { initializeApp } from 'firebase/app';
import { getFirestore, initializeFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyCmBFrEt1lxzsikPM6c5qgJiy5hcLdmRas",
    authDomain: "guard-d6c77.firebaseapp.com",
    projectId: "guard-d6c77",
    storageBucket: "guard-d6c77.firebasestorage.app",
    messagingSenderId: "543378495814",
    appId: "1:543378495814:web:504303c5b1f1368bd9ed47",
    measurementId: "G-D47XRWQB1T"
};

const app = initializeApp(firebaseConfig);
// Force long polling to bypass network restrictions (common cause of 'offline' error in some envs)
export const db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
});
// export const db = getFirestore(app);
// Hardcoded user for this MVP/Personal tool
export const userId = 'default_user'; 
