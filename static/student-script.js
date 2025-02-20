document.addEventListener('DOMContentLoaded', function () {
    const studentID = document.getElementById('studentID')?.textContent.trim();

    if (!studentID) {
        console.error("Student ID is missing or not defined.");
        return;
    }

    // Check if the current user is a student
    const userRole = sessionStorage.getItem('userRole');  // Assume this is set when login succeeds

    if (userRole === 'STUDENT') {
        // Hide the back button for students
        const backButton = document.getElementById('backButton');
        if (backButton) {
            backButton.style.display = 'none';  // Hide the button
        }
    }

    // Fetch and display student details
    fetch('/get-student-details?id=' + studentID)
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then((data) => {
            console.log('Fetched student details:', data);

            const detailFields = [
                'studentID','StudentUSN', 'studentName', 'studentBatch', 'studentBranch',
                'studentMentor', 'studentContact', 'studentEmail', 'studentAddress',
                'studentDOB', 'studentBGroup', 'studentHobbies',
                'studentFName', 'studentFContact', 'studentMName', 'studentMContact'
            ];

            // Populate the fields
            detailFields.forEach((field) => {
                const spanElement = document.getElementById(field);
                const inputElement = document.getElementById('edit' + field.charAt(0).toUpperCase() + field.slice(1));
                const fieldValue = data[field] ?? '';

                if (spanElement) {
                    spanElement.textContent = fieldValue || 'Not Set';
                }
                if (inputElement) {
                    inputElement.value = fieldValue;
                }
            });

            // Populate credentials section
            const username = data.credentials?.username || "Not Set";
            const password = data.credentials?.password || "";

            document.getElementById('studentUsername').textContent = username;
            document.getElementById('editStudentUsername').value = username;

            document.getElementById('studentPassword').textContent = password ? "******" : "Not Set";
            document.getElementById('editStudentPassword').value = password;

            console.log('Fields and credentials populated successfully.');
        })
        .catch((err) => {
            console.error('Failed to fetch student details:', err);
        });

    // Helper functions
    function toggleDetailsEdit(editMode) {
        const detailFields = [
            'StudentUSN', 'studentName', 'studentBatch', 'studentBranch',
            'studentMentor', 'studentContact', 'studentEmail', 'studentAddress',
            'studentDOB', 'studentBGroup', 'studentHobbies',
            'studentFName', 'studentFContact', 'studentMName', 'studentMContact'
        ];
    
        detailFields.forEach((id) => {
            const span = document.getElementById(id);
            const input = document.getElementById('edit' + id.charAt(0).toUpperCase() + id.slice(1));
            if (span && input) {
                span.style.display = editMode ? 'none' : 'inline';
                input.style.display = editMode ? 'inline' : 'none';
            } else {
                console.warn(`Missing span or input for ID: ${id}`);
            }
        });
    
        document.getElementById('editDetailsButton').style.display = editMode ? 'none' : 'inline';
        document.getElementById('saveDetailsButton').style.display = editMode ? 'inline' : 'none';
        document.getElementById('cancelEditButton').style.display = editMode ? 'inline' : 'none';
    }
    

    document.getElementById('editDetailsButton').addEventListener('click', () => {
        console.log('Edit button clicked');
        toggleDetailsEdit(true);
    });
    
    document.getElementById('cancelEditButton').addEventListener('click', () => {
        console.log('Cancel button clicked');
        toggleDetailsEdit(false);
    });

    function toggleCredentialsEdit(editMode) {
        const usernameSpan = document.getElementById('studentUsername');
        const usernameInput = document.getElementById('editStudentUsername');
        const passwordSpan = document.getElementById('studentPassword');
        const passwordInput = document.getElementById('editStudentPassword');
    
        usernameSpan.style.display = editMode ? 'none' : 'inline';
        usernameInput.style.display = editMode ? 'inline' : 'none';
        passwordSpan.style.display = editMode ? 'none' : 'inline';
        passwordInput.style.display = editMode ? 'inline' : 'none';
    
        document.getElementById('editCredentialsButton').style.display = editMode ? 'none' : 'inline-block';
        document.getElementById('saveCredentialsButton').style.display = editMode ? 'inline-block' : 'none';
        document.getElementById('cancelCredentialsButton').style.display = editMode ? 'inline-block' : 'none';
    }
    

    // Event listeners for details
    document.getElementById('editDetailsButton').addEventListener('click', () => toggleDetailsEdit(true));
    document.getElementById('cancelEditButton').addEventListener('click', () => toggleDetailsEdit(false));
    document.getElementById('saveDetailsButton').addEventListener('click', () => {
        const updatedDetails = {
            id: document.getElementById('editStudentID').value, // Hidden field for backend
            usn: document.getElementById('editStudentUSN').value, // Visible to user
            name: document.getElementById('editStudentName').value,
            batch: document.getElementById('editStudentBatch').value,
            branch: document.getElementById('editStudentBranch').value,
            mentor_name: document.getElementById('editStudentMentor').value,
            contact: document.getElementById('editStudentContact').value,
            email: document.getElementById('editStudentEmail').value,
            address: document.getElementById('editStudentAddress').value,
            dob: document.getElementById('editStudentDOB').value,
            blood_group: document.getElementById('editStudentBGroup').value,
            hobbies: document.getElementById('editStudentHobbies').value,
            father_name: document.getElementById('editStudentFName').value,
            father_contact: document.getElementById('editStudentFContact').value,
            mother_name: document.getElementById('editStudentMName').value,
            mother_contact: document.getElementById('editStudentMContact').value,
        };
    
        fetch('/update-student-details', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedDetails),
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    alert('Details updated successfully!');
                    location.reload();
                } else {
                    alert('Failed to update details. ' + (data.message || ''));
                }
            })
            .catch(error => {
                console.error('Error updating student details:', error);
                alert('An error occurred while updating student details.');
            });
    });
     

    // Credentials event listeners
    document.getElementById('editCredentialsButton').addEventListener('click', () => toggleCredentialsEdit(true));
    document.getElementById('cancelCredentialsButton').addEventListener('click', () => toggleCredentialsEdit(false));
    document.getElementById('saveCredentialsButton').addEventListener('click', () => {
        const usn = document.getElementById('StudentUSN').textContent.trim();
        const studentID = document.getElementById('studentID').textContent.trim();
        const password = document.getElementById('editStudentPassword').value;

        if (!password) {
            alert("Password is required.");
            return;
        }

        fetch('/update-student-credentials', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: usn, password, student_id: studentID }),
        })
            .then(response => {
                if (!response.ok) {
                    console.error('Server responded with:', response.status, response.statusText);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    alert('Credentials updated successfully!');
                    location.reload();
                } else {
                    alert('Failed to update credentials: ' + data.message);
                }
            })
            .catch(error => console.error('Error updating student credentials:', error));
        
    });

    // Navigation buttons
    document.getElementById('backButton').addEventListener('click', () => {
        if (confirm("Are you sure you want to return to the Mentor page?")) {
            window.location.href = '/staff';
        }
    });

    document.getElementById('academicButton').addEventListener('click', () => {
        const studentId = document.body.getAttribute('data-student-id'); // Fetch student ID from body tag
        if (confirm("Move to Academic Details and Other Activities?")) {
            if (studentId) {
                window.location.href = `/marks/${studentId}`; // Pass the student ID dynamically
            } else {
                alert('Student ID is missing!');
            }
        }
    });    
    
});
