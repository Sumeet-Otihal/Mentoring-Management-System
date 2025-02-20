document.addEventListener('DOMContentLoaded', function () {
    // Fetch and display mentor details
    fetch('/get-mentor-details')
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch mentor details');
            return response.json();
        })
        .then(data => {
            document.getElementById('mentorID').textContent = data.id;
            document.getElementById('mentorSSN').textContent = data.ssn;
            document.getElementById('mentorName').textContent = data.name;
            document.getElementById('mentorBranch').textContent = data.branch;
            document.getElementById('mentorContact').textContent = data.contact;
            document.getElementById('mentorEmail').textContent = data.email;
            document.getElementById('mentorAddress').textContent = data.address;

            document.getElementById('mentorUsername').textContent = data.username;
            document.getElementById('mentorPassword').textContent = '******'; // Mask password display
        })
        .catch(error => console.error('Error fetching mentor details:', error));

    // Fetch and display mentees list
    fetch('/get-mentees')
    .then(response => response.json())
    .then(data => {
        const menteeList = document.getElementById('menteeList');
        menteeList.innerHTML = ''; // Clear existing list

        data.forEach(student => {
            const card = document.createElement('div');
            card.className = 'student-card';
            card.innerHTML = `
                <h3>${student.name}</h3>
                <p>View Details</p>
            `;
            card.addEventListener('click', () => {
                window.location.href = `/student/${student.id}`;
            });
            menteeList.appendChild(card);
        });
    });


    /// ---------- Mentor Credentials Edit ----------
  
    const editMentorCredentialsButton = document.getElementById('editMentorCredentials');
    const saveMentorCredentialsButton = document.getElementById('saveMentorCredentials');
    const cancelMentorEditButton = document.getElementById('cancelMentorEdit');

    const mentorCredentialsDisplay = document.getElementById('mentorCredentialsDisplay');
    const mentorCredentialsEdit = document.getElementById('mentorCredentialsEdit');
    const mentorUsernameDisplay = document.getElementById('mentorUsername');
    const editMentorUsernameInput = document.getElementById('editMentorUsername');
    const editMentorPasswordInput = document.getElementById('editMentorPassword');

    // Event listeners for mentor details editing
document.getElementById('editDetailsButton').addEventListener('click', () => toggleEdit(true));
document.getElementById('cancelEditButton').addEventListener('click', () => toggleEdit(false));
document.getElementById('saveDetailsButton').addEventListener('click', saveMentorDetails);

// Capitalize function to ensure proper ID concatenation
function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Toggle edit mode for mentor details
function toggleEdit(editMode) {
    const elements = ['mentorSSN', 'mentorName', 'mentorBranch', 'mentorContact', 'mentorEmail', 'mentorAddress'];
    elements.forEach(id => {
        // Display the appropriate elements based on the edit mode
        document.getElementById(id).style.display = editMode ? 'none' : 'inline';
        const editElement = document.getElementById('edit' + capitalize(id));
        if (editElement) {
            editElement.style.display = editMode ? 'inline' : 'none';
        }
    });
    // Toggle buttons for edit/save/cancel
    toggleButtons('editDetailsButton', ['saveDetailsButton', 'cancelEditButton'], editMode);
}

// Function to toggle visibility of buttons
function toggleButtons(editButtonId, toggleButtonIds, editMode) {
    document.getElementById(editButtonId).style.display = editMode ? 'none' : 'inline';
    toggleButtonIds.forEach(buttonId => {
        document.getElementById(buttonId).style.display = editMode ? 'inline' : 'none';
    });
}

// Save mentor details and send updated data to the server
function saveMentorDetails() {
    const mentorID = document.getElementById('editMentorID').value;
    const mentorSSN = document.getElementById('editMentorSSN').value; // Include SSN here
    const name = document.getElementById('editMentorName').value;
    const branch = document.getElementById('editMentorBranch').value;
    const contact = document.getElementById('editMentorContact').value;
    const email = document.getElementById('editMentorEmail').value;
    const address = document.getElementById('editMentorAddress').value;

    fetch('/update_mentor_details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mentorID, mentorSSN, name, branch, contact, email, address }), // Include mentorSSN in the request
    })
        .then(response => {
            if (!response.ok) throw new Error('Failed to update mentor details');
            return response.json();
        })
        .then(data => {
            if (data.success) {
                alert('Mentor details updated successfully!');
                toggleEdit(false);
                updateDisplayDetails({ mentorID, mentorSSN, name, branch, contact, email, address }); // Pass updated SSN
            } else {
                alert('Failed to update mentor details. Please try again.');
            }
        })
        .catch(error => {
            console.error('Error updating mentor details:', error);
            alert('An error occurred while updating mentor details. Please try again later.');
        });
}


// Update displayed mentor details after successful save
function updateDisplayDetails({ mentorID, mentorSSN, name, branch, contact, email, address }) {
    document.getElementById('mentorID').textContent = mentorID;
    document.getElementById('mentorSSN').textContent = mentorSSN;
    document.getElementById('mentorName').textContent = name;
    document.getElementById('mentorBranch').textContent = branch;
    document.getElementById('mentorContact').textContent = contact;
    document.getElementById('mentorEmail').textContent = email;
    document.getElementById('mentorAddress').textContent = address;
}


// Show input fields for editing credentials
editMentorCredentialsButton.addEventListener('click', () => {
    mentorCredentialsDisplay.style.display = 'none';
    mentorCredentialsEdit.style.display = 'block';

    editMentorCredentialsButton.style.display = 'none'; // Hide "Edit" button
    saveMentorCredentialsButton.style.display = 'inline'; // Show "Save" button
    cancelMentorEditButton.style.display = 'inline'; // Show "Cancel" button

    editMentorUsernameInput.value = mentorUsernameDisplay.textContent;
    editMentorPasswordInput.value = ''; // Clear password field when editing
});


// Save edited credentials
saveMentorCredentialsButton.addEventListener('click', async () => {
    const newUsername = editMentorUsernameInput.value.trim();
    const newPassword = editMentorPasswordInput.value.trim();

    if (newUsername && newPassword) {
        try {
            const response = await fetch('/update_mentor_credentials', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: newUsername, password: newPassword })
            });

            const data = await response.json();

            if (data.success) {
                mentorUsernameDisplay.textContent = newUsername;
                alert(data.message || "Mentor credentials updated successfully!");
                location.reload(); // Reload the page to see updated credentials
            } else {
                alert(data.message || "Failed to update mentor credentials.");
            }
        } catch (error) {
            console.error('Error:', error);
            alert("An error occurred while updating mentor credentials.");
        }
    } else {
        alert("Please enter both a valid username and password.");
    }

    mentorCredentialsDisplay.style.display = 'block';
    mentorCredentialsEdit.style.display = 'none';
});

// Cancel editing credentials
cancelMentorEditButton.addEventListener('click', () => {
    mentorCredentialsDisplay.style.display = 'block';
    mentorCredentialsEdit.style.display = 'none';

    editMentorCredentialsButton.style.display = 'inline'; // Show "Edit" button
    saveMentorCredentialsButton.style.display = 'none'; // Hide "Save" button
    cancelMentorEditButton.style.display = 'none'; // Hide "Cancel" button
});


    // Navigation
    document.getElementById('backButton').addEventListener('click', () => {
        if (confirm("Are you sure you want to return to the login page?")) {
            window.location.href = '/';
        }
    });
});
