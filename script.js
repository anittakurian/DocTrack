import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
    // TODO: Add SDKs for Firebase products that you want to use

document.addEventListener('DOMContentLoaded', () => {

    function showDoctorLogin() {
        document.getElementById('doctorLogin').style.display = 'block';
        document.getElementById('adminLogin').style.display = 'none';
    }

    function showAdminLogin() {
        document.getElementById('doctorLogin').style.display = 'none';
        document.getElementById('adminLogin').style.display = 'block';
    }


    
    // https://firebase.google.com/docs/web/setup#available-libraries

    // Your web app's Firebase configuration
    // Import the Firebase SDK modules
    // import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
    // import { getDatabase } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
    // import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

    // Your Firebase configuration
    const firebaseConfig = {
        apiKey: "YOUR_API_KEY",
        authDomain: "YOUR_AUTH_DOMAIN",
        projectId: "YOUR_PROJECT_ID",
        storageBucket: "YOUR_STORAGE_BUCKET",
        messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
        appId: "YOUR_APP_ID"
    };

    // Initialize Firebase
    const firebaseApp = initializeApp(firebaseConfig);

    // Get a reference to the Firebase services you need
    const database = getDatabase(firebaseApp);
    const auth = getAuth(firebaseApp);


    // Function to handle login form submission
    function handleLoginFormSubmit(event) {
        event.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        signInWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                // Signed in
                const user = userCredential.user;
                console.log('User logged in:', user);
                // Redirect to dashboard or perform other actions
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                console.error('Login error:', errorMessage);
                // Display error message to the user
                alert(errorMessage);
            });
    }

    // Add event listener to the login form
    document.getElementById('doctorLoginForm').addEventListener('submit', handleLoginFormSubmit);





    // Doctor Login Form Submission
    document.getElementById('doctorLoginForm').addEventListener('submit', function (event) {
        event.preventDefault();
        const doctorId = document.getElementById('doctorMailId').value;
        const doctorPassword = document.getElementById('doctorPassword').value;

        // Sign in with Firebase Authentication
        firebase.auth().signInWithEmailAndPassword(doctorId, doctorPassword)
            .then((userCredential) => {
                // Signed in
                const user = userCredential.user;
                // Redirect to doctor dashboard page
                window.location.href = "doctor.html";
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                console.log(errorMessage);
                alert(errorMessage);
            });
    });

    // Admin Login Form Submission
    document.getElementById('adminLoginForm').addEventListener('submit', function (event) {
        event.preventDefault();
        const adminId = document.getElementById('adminId').value;
        const adminPassword = document.getElementById('adminPassword').value;

        // Sign in with Firebase Authentication
        firebase.auth().signInWithEmailAndPassword(adminId, adminPassword)
            .then((userCredential) => {
                // Signed in
                const user = userCredential.user;
                // Redirect to admin dashboard page
                window.location.href = "admin_dashboard.html";
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                console.log(errorMessage);
                alert(errorMessage);
            });
    });


});
