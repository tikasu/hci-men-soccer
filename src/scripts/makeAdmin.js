// Script to make a user an admin
const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, updateDoc, collection, getDocs } = require('firebase/firestore');

// Your Firebase configuration from .env.local
// You'll need to replace these with your actual Firebase config values
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function makeUserAdmin(email) {
  try {
    // First, find the user by email
    const usersCollection = await getDocs(collection(db, 'users'));
    let userId = null;
    
    usersCollection.forEach((doc) => {
      const userData = doc.data();
      if (userData.email === email) {
        userId = doc.id;
      }
    });
    
    if (!userId) {
      console.error(`User with email ${email} not found`);
      return;
    }
    
    // Update the user's role to admin
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { 
      role: 'admin',
      active: true // Ensure the user is active
    });
    
    console.log(`User ${email} has been made an admin successfully!`);
  } catch (error) {
    console.error('Error making user admin:', error);
  }
}

// Get the email from command line arguments
const email = process.argv[2];

if (!email) {
  console.error('Please provide an email address');
  process.exit(1);
}

makeUserAdmin(email)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 