// Import the functions you need from the SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, orderBy, query, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
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

// Profile page
if (window.location.pathname.includes('profile.html')) {
    const authSection = document.getElementById('auth-section');
    const userInfo = document.getElementById('user-info');
    const usernameDisplay = document.getElementById('username-display');
    const signOutButton = document.getElementById('sign-out');
    const viewPostsButton = document.getElementById('view-posts');

    signOutButton.addEventListener('click', async () => {
        try {
            await signOut(auth);
            window.location.href = 'index.html'; // Redirect to main page
        } catch (error) {
            console.error('Error signing out: ', error);
        }
    });

    document.getElementById('sign-in').addEventListener('click', async () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error('Error signing in: ', error);
        }
    });

    document.getElementById('sign-up').addEventListener('click', async () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        try {
            await createUserWithEmailAndPassword(auth, email, password);
        } catch (error) {
            console.error('Error signing up: ', error);
        }
    });

    onAuthStateChanged(auth, user => {
        if (user) {
            authSection.style.display = 'none';
            userInfo.style.display = 'block';
            usernameDisplay.textContent = user.email.split('@')[0];
        } else {
            authSection.style.display = 'block';
            userInfo.style.display = 'none';
        }
    });

    viewPostsButton.addEventListener('click', () => {
        window.location.href = 'index.html'; // Redirect to main page
    });
}

// Main page
if (window.location.pathname.includes('index.html')) {
    const postForm = document.getElementById('post-form');
    const signOutButton = document.getElementById('sign-out');

    onAuthStateChanged(auth, user => {
        if (user) {
            postForm.style.display = 'block';
            signOutButton.style.display = 'inline';
        } else {
            postForm.style.display = 'none';
            signOutButton.style.display = 'none';
        }
    });

    document.getElementById('submit-post').addEventListener('click', async () => {
        const postContent = document.getElementById('post-content').value;
        const displayName = document.getElementById('display-name').value;
        if (postContent.trim() === '' || displayName.trim() === '') {
            alert('Post content and display name cannot be empty.');
            return;
        }

        if (auth.currentUser) {
            try {
                await addDoc(collection(db, 'posts'), {
                    content: postContent,
                    timestamp: serverTimestamp(),
                    uid: auth.currentUser.uid,
                    displayName: displayName
                });
                document.getElementById('post-content').value = '';
                document.getElementById('display-name').value = '';
                displayPosts(); // Refresh the post list
            } catch (error) {
                console.error('Error adding post: ', error);
            }
        } else {
            alert('You must be logged in to post.');
        }
    });

    document.getElementById('sign-out').addEventListener('click', async () => {
        try {
            await signOut(auth);
            window.location.href = 'profile.html'; // Redirect to profile page
        } catch (error) {
            console.error('Error signing out: ', error);
        }
    });

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
                postDiv.innerHTML = `
                    <div class="author">${post.displayName}</div>
                    <div class="content">${post.content}</div>
                    <button class="share-btn" onclick="sharePost('${doc.id}')">Share</button>
                `;
                postList.appendChild(postDiv);
            });
        } catch (error) {
            console.error('Error getting posts: ', error);
        }
    }

    function sharePost(postId) {
        const postUrl = `${window.location.origin}/posts/${postId}`;
        navigator.clipboard.writeText(postUrl).then(() => {
            alert('Post URL copied to clipboard!');
        }).catch(err => {
            console.error('Error copying URL: ', err);
        });
    }

    displayPosts(); // Load posts on page load
}

// Settings page
if (window.location.pathname.includes('settings.html')) {
    const themeSelect = document.getElementById('theme-select');

    themeSelect.addEventListener('change', () => {
        const theme = themeSelect.value;
        document.body.className = theme;
        localStorage.setItem('theme', theme);
    });

    window.addEventListener('load', () => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.body.className = savedTheme;
        themeSelect.value = savedTheme;
    });
}
