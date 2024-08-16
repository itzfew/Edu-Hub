// Import the functions you need from the SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, orderBy, query, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-analytics.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDLKPOqok8VS3gR4TAEGCEH4IEJL8kKpvw",
  authDomain: "ind-edu-f63b0.firebaseapp.com",
  projectId: "ind-edu-f63b0",
  storageBucket: "ind-edu-f63b0.appspot.com",
  messagingSenderId: "405906160405",
  appId: "1:405906160405:web:7040d4f0118fa01d13071c",
  measurementId: "G-EPQM943Y2V"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

// Sign In
document.getElementById('sign-in').addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        console.error('Error signing in: ', error);
    }
});

// Sign Up
document.getElementById('sign-up').addEventListener('click', async () => {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    try {
        await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
        console.error('Error signing up: ', error);
    }
});

// Sign Out
document.getElementById('sign-out').addEventListener('click', async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error('Error signing out: ', error);
    }
});

// Add a Post
document.getElementById('submit-post').addEventListener('click', async () => {
    const postContent = document.getElementById('post-content').value;
    if (postContent.trim() === '') {
        alert('Post content cannot be empty.');
        return;
    }

    if (auth.currentUser) {
        try {
            await addDoc(collection(db, 'posts'), {
                content: postContent,
                timestamp: serverTimestamp(),
                uid: auth.currentUser.uid
            });
            document.getElementById('post-content').value = '';
            displayPosts(); // Refresh the post list
        } catch (error) {
            console.error('Error adding post: ', error);
        }
    } else {
        alert('You must be logged in to post.');
    }
});

// Display Posts
async function displayPosts() {
    const postList = document.getElementById('post-list');
    postList.innerHTML = '';

    try {
        const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(doc => {
            const post = doc.data();
            const postDiv = document.createElement('div');
            postDiv.classList.add('post');
            postDiv.textContent = post.content;
            postList.appendChild(postDiv);
        });
    } catch (error) {
        console.error('Error getting posts: ', error);
    }
}

// Load posts on page load
displayPosts();
