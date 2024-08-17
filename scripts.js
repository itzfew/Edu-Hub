import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, orderBy, query, serverTimestamp, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-analytics.js";

// Firebase configuration
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

// Profile page logic
if (window.location.pathname.includes('profile.html')) {
    const authSection = document.getElementById('auth-section');
    const userInfo = document.getElementById('user-info');
    const usernameDisplay = document.getElementById('username-display');
    const signOutButton = document.getElementById('sign-out');
    const viewPostsButton = document.getElementById('view-posts');

    signOutButton.addEventListener('click', async () => {
        try {
            await signOut(auth);
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Error signing out: ', error);
        }
    });

    document.getElementById('sign-in').addEventListener('click', async () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        try {
            await signInWithEmailAndPassword(auth, email, password);
            alert('Welcome back!');
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Error signing in: ', error);
        }
    });

    document.getElementById('sign-up').addEventListener('click', async () => {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            alert('Welcome to Ind Edu!');
            window.location.href = 'profile.html';
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
        window.location.href = 'index.html';
    });
}

// Main index page logic
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
                displayPosts();
                alert('Post added successfully!');
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
            window.location.href = 'profile.html';
        } catch (error) {
            console.error('Error signing out: ', error);
        }
    });

    // Function to display posts
async function displayPosts() {
    const postList = document.getElementById('post-list');
    postList.innerHTML = ''; // Clear existing posts

    try {
        const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach(doc => {
            const post = doc.data();
            const postDiv = document.createElement('div');
            postDiv.classList.add('post');

            // Check if display name includes "verify"
            const isVerified = post.displayName.toLowerCase().includes('verify');
            // Remove "verify" from display name
            const cleanDisplayName = post.displayName.replace(/verify/i, '').trim();
            
            postDiv.innerHTML = `
                <div class="author">
                    ${cleanDisplayName} ${isVerified ? '<i class="fa fa-check-circle verified"></i> Verified' : ''}
                </div>
                <div class="content">${post.content}</div>
                <div class="timestamp">Posted on ${post.timestamp.toDate().toLocaleString()}</div>
                <div class="actions">
                    <button class="share-btn" onclick="sharePost('${doc.id}')"><i class="fa fa-share"></i> Share</button>
                    ${auth.currentUser && auth.currentUser.uid === post.uid ? `
                        <button class="edit-btn" onclick="editPost('${doc.id}', '${post.content}')"><i class="fa fa-edit"></i> Edit</button>
                        <button class="delete-btn" onclick="deletePost('${doc.id}')"><i class="fa fa-trash"></i> Delete</button>
                    ` : ''}
                </div>
            `;
            postList.appendChild(postDiv);
        });
    } catch (error) {
        console.error('Error getting posts: ', error);
    }
}

// Function to share a post
function sharePost(postId) {
    const postUrl = `${window.location.origin}/posts/${postId}`;
    console.log(postUrl); // Debugging: Check if URL is correct

    navigator.clipboard.writeText(postUrl).then(() => {
        alert('Post URL copied to clipboard!');
    }).catch(err => {
        console.error('Error copying URL: ', err);
    });
}

// Initialize display of posts
displayPosts();


    window.editPost = async function(postId, currentContent) {
        const newContent = prompt('Edit your post:', currentContent);
        if (newContent !== null && newContent.trim() !== '') {
            try {
                const postRef = doc(db, 'posts', postId);
                await updateDoc(postRef, {
                    content: newContent
                });
                displayPosts();
            } catch (error) {
                console.error('Error updating post: ', error);
            }
        }
    };

    window.deletePost = async function(postId) {
        if (confirm('Are you sure you want to delete this post?')) {
            try {
                await deleteDoc(doc(db, 'posts', postId));
                displayPosts();
            } catch (error) {
                console.error('Error deleting post: ', error);
            }
        }
    };

    

// Settings page logic
if (window.location.pathname.includes('settings.html')) {
    const themeSelect = document.getElementById('theme-select');
    const fontSizeSelect = document.getElementById('font-size');

    themeSelect.addEventListener('change', () => {
        const theme = themeSelect.value;
        document.body.className = theme;
        localStorage.setItem('theme', theme);
    });

    fontSizeSelect.addEventListener('change', () => {
        const fontSize = fontSizeSelect.value;
        document.body.style.fontSize = fontSize === 'small' ? '14px' :
            fontSize === 'medium' ? '16px' : '18px';
        localStorage.setItem('fontSize', fontSize);
    });

    window.addEventListener('load', () => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        const savedFontSize = localStorage.getItem('fontSize') || 'medium';
        document.body.className = savedTheme;
        themeSelect.value = savedTheme;
        document.body.style.fontSize = savedFontSize === 'small' ? '14px' :
            savedFontSize === 'medium' ? '16px' : '18px';
        fontSizeSelect.value = savedFontSize;
    });
}
