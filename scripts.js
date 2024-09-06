import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, orderBy, query, serverTimestamp, doc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-analytics.js";

// Initialize Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAJVzWcSVu7nW-069bext5W6Nizx4sfxIA",
    authDomain: "edu-hub-c81b5.firebaseapp.com",
    databaseURL: "https://edu-hub-c81b5-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "edu-hub-c81b5",
    storageBucket: "edu-hub-c81b5.appspot.com",
    messagingSenderId: "560742513136",
    appId: "1:560742513136:web:102edd272982704fdb8535",
    measurementId: "G-78TC8XTPF7"
};
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);
const auth = getAuth(app);

// Modal handling
const modal = document.getElementById('auth-modal');
const closeModal = document.querySelector('.modal .close');
const modalSignInButton = document.getElementById('modal-sign-in');
const modalSignUpButton = document.getElementById('modal-sign-up');
const modalEmailInput = document.getElementById('modal-email');
const modalPasswordInput = document.getElementById('modal-password');

// Show modal
function showModal() {
    modal.style.display = 'block';
}

// Hide modal
function hideModal() {
    modal.style.display = 'none';
}

closeModal.onclick = hideModal;

// Sign in
modalSignInButton.addEventListener('click', async () => {
    const email = modalEmailInput.value;
    const password = modalPasswordInput.value;
    try {
        await signInWithEmailAndPassword(auth, email, password);
        hideModal();
        displayPosts();
    } catch (error) {
        console.error('Error signing in: ', error);
    }
});

// Sign up
modalSignUpButton.addEventListener('click', async () => {
    const email = modalEmailInput.value;
    const password = modalPasswordInput.value;
    try {
        await createUserWithEmailAndPassword(auth, email, password);
        hideModal();
        displayPosts();
    } catch (error) {
        console.error('Error signing up: ', error);
    }
});

// Main index page logic
if (window.location.pathname.includes('index.html')) {
    const postForm = document.getElementById('post-section');
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
        if (!auth.currentUser) {
            showModal();
            return;
        }

        const postContent = document.getElementById('post-content').value;
        const displayName = document.getElementById('display-name').value;
        if (postContent.trim() === '' || displayName.trim() === '') {
            alert('Post content and display name cannot be empty.');
            return;
        }

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
    });

    document.getElementById('sign-out').addEventListener('click', async () => {
        try {
            await signOut(auth);
            window.location.href = 'profile.html';
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
            querySnapshot.forEach(async doc => {
                const post = doc.data();
                const postId = doc.id;
                const postDiv = document.createElement('div');
                postDiv.classList.add('post');

                // Format timestamp
                const timestamp = post.timestamp.toDate();
                const formattedDate = timestamp.toLocaleString('en-US', { 
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', 
                    hour: 'numeric', minute: 'numeric', second: 'numeric', timeZoneName: 'short' 
                });

                // Check if display name includes "verify"
                const isVerified = post.displayName.toLowerCase().includes('verify');
                // Remove "verify" from display name
                const cleanDisplayName = post.displayName.replace(/verify/i, '').trim();
                
                postDiv.innerHTML = `
                    <div class="author">
                        <img src="default-profile-pic.jpg" alt="Profile Picture" class="profile-pic" />
                        ${cleanDisplayName} ${isVerified ? '<i class="fa fa-check-circle verified"></i> Verified' : ''}
                    </div>
                    <div class="content">${post.content}</div>
                    <div class="date">Published on: ${formattedDate}</div>
                    <div class="actions">
                        <button class="share-btn" onclick="sharePost('${postId}')"><i class="fa fa-share"></i> Share</button>
                        ${auth.currentUser && auth.currentUser.uid === post.uid ? `
                            <button class="edit-btn" onclick="editPost('${postId}', '${post.content}')"><i class="fa fa-edit"></i> Edit</button>
                            <button class="delete-btn" onclick="deletePost('${postId}')"><i class="fa fa-trash"></i> Delete</button>
                        ` : ''}
                        <button class="toggle-replies-btn" onclick="toggleReplies('${postId}')"><i class="fa fa-comment"></i> Replies</button>
                        <textarea id="reply-content-${postId}" placeholder="Write a reply..."></textarea>
                        <button onclick="addReply('${postId}')">Add Reply</button>
                    </div>
                    <div id="replies-${postId}" class="replies">
                        <!-- Replies will be dynamically loaded here -->
                    </div>
                `;
                postList.appendChild(postDiv);
                displayReplies(postId);
            });
        } catch (error) {
            console.error('Error getting posts: ', error);
        }
    }

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

    window.addReply = async function(postId) {
        const replyContent = document.getElementById(`reply-content-${postId}`).value;
        if (replyContent.trim() === '') {
            alert('Reply content cannot be empty.');
            return;
        }

        if (auth.currentUser) {
            try {
                await addDoc(collection(db, `posts/${postId}/replies`), {
                    content: replyContent,
                    timestamp: serverTimestamp(),
                    uid: auth.currentUser.uid,
                    displayName: auth.currentUser.email.split('@')[0] // Using email as default display name
                });
                document.getElementById(`reply-content-${postId}`).value = '';
                displayReplies(postId);
            } catch (error) {
                console.error('Error adding reply: ', error);
            }
        } else {
            showModal();
        }
    };

    async function displayReplies(postId) {
        const repliesList = document.getElementById(`replies-${postId}`);
        repliesList.innerHTML = '';

        try {
            const q = query(collection(db, `posts/${postId}/replies`), orderBy('timestamp', 'asc'));
            const querySnapshot = await getDocs(q);
            const replies = querySnapshot.docs.map(doc => doc.data());

            // Display the first 2 replies
            replies.slice(0, 2).forEach(reply => {
                const replyDiv = document.createElement('div');
                replyDiv.classList.add('reply');

                // Format timestamp
                const timestamp = reply.timestamp.toDate();
                const formattedDate = timestamp.toLocaleString('en-US', { 
                    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', 
                    hour: 'numeric', minute: 'numeric', second: 'numeric', timeZoneName: 'short' 
                });

                replyDiv.innerHTML = `
                    <div class="reply-author">
                        ${reply.displayName}
                    </div>
                    <div class="reply-content">${reply.content}</div>
                    <div class="reply-date">Replied on: ${formattedDate}</div>
                `;
                repliesList.appendChild(replyDiv);
            });

            if (replies.length > 2) {
                const showMoreButton = document.createElement('button');
                showMoreButton.textContent = 'Show More Replies';
                showMoreButton.onclick = () => {
                    replies.slice(2).forEach(reply => {
                        const replyDiv = document.createElement('div');
                        replyDiv.classList.add('reply');

                        // Format timestamp
                        const timestamp = reply.timestamp.toDate();
                        const formattedDate = timestamp.toLocaleString('en-US', { 
                            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', 
                            hour: 'numeric', minute: 'numeric', second: 'numeric', timeZoneName: 'short' 
                        });

                        replyDiv.innerHTML = `
                            <div class="reply-author">
                                ${reply.displayName}
                            </div>
                            <div class="reply-content">${reply.content}</div>
                            <div class="reply-date">Replied on: ${formattedDate}</div>
                        `;
                        repliesList.appendChild(replyDiv);
                    });
                    showMoreButton.style.display = 'none';
                };
                repliesList.appendChild(showMoreButton);
            }

            repliesList.style.display = 'block';
        } catch (error) {
            console.error('Error getting replies: ', error);
        }
    }

    window.toggleReplies = function(postId) {
        const repliesList = document.getElementById(`replies-${postId}`);
        const isVisible = repliesList.style.display === 'block';
        repliesList.style.display = isVisible ? 'none' : 'block';

        if (!isVisible) {
            displayReplies(postId);
        }
    };

    displayPosts();
}
