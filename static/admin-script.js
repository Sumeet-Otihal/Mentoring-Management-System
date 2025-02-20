document.addEventListener('DOMContentLoaded', function () {
    // ---------- Admin Credentials Edit ----------
    const editAdminCredentialsButton = document.getElementById('editAdminCredentials');
    const saveAdminCredentialsButton = document.getElementById('saveAdminCredentials');
    const cancelEditCredentialsButton = document.getElementById('cancelEditCredentials');

    const adminCredentialsDisplay = document.getElementById('adminCredentialsDisplay');
    const adminCredentialsEdit = document.getElementById('adminCredentialsEdit');
    const adminUsernameDisplay = document.getElementById('adminUsernameDisplay');
    const adminUsernameInput = document.getElementById('adminUsernameInput');
    const adminPasswordInput = document.getElementById('adminPasswordInput');

    // Show input fields for editing credentials
    editAdminCredentialsButton.addEventListener('click', () => {
        adminCredentialsDisplay.style.display = 'none';
        adminCredentialsEdit.style.display = 'block';
        adminUsernameInput.value = adminUsernameDisplay.textContent;
        adminPasswordInput.value = '';
    });

    // Save edited credentials
    saveAdminCredentialsButton.addEventListener('click', async () => {
    const newUsername = adminUsernameInput.value.trim();
    const newPassword = adminPasswordInput.value.trim();

    if (newUsername && newPassword) {
        try {
            const response = await fetch('/update-admin-credentials', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: newUsername, password: newPassword })
            });

            const data = await response.json();

            if (data.success) {
                adminUsernameDisplay.textContent = newUsername;
                alert(data.message || "Credentials updated successfully!");
                location.reload(); // Reload the page to see updated credentials
            } else {
                alert(data.message || "Failed to update credentials.");
            }
        } catch (error) {
            console.error('Error:', error);
            alert("An error occurred while updating credentials.");
        }
    } else {
        alert("Please enter both a valid username and password.");
    }
    adminCredentialsDisplay.style.display = 'block';
    adminCredentialsEdit.style.display = 'none';
});


    // Cancel editing credentials
    cancelEditCredentialsButton.addEventListener('click', () => {
        adminCredentialsDisplay.style.display = 'block';
        adminCredentialsEdit.style.display = 'none';
    });

    // ---------- Student Management ----------
    const addStudentButton = document.getElementById('addStudent');
    const studentNameInput = document.getElementById('studentNameInput');
    const saveStudentButton = document.getElementById('saveStudent');
    const cancelStudentButton = document.getElementById('cancelStudent');
    const studentsList = document.getElementById('studentsList');
    const studentCount = document.getElementById('studentCount');

    addStudentButton.addEventListener('click', () => {
        studentNameInput.style.display = 'block';
        saveStudentButton.style.display = 'block';
        cancelStudentButton.style.display = 'block';
        studentNameInput.focus();
    });

    saveStudentButton.addEventListener('click', () => {
        const studentName = studentNameInput.value.trim();
        if (studentName) {
            const studentItem = document.createElement('p');
            studentItem.textContent = studentName;
            studentsList.appendChild(studentItem);
            studentCount.textContent = studentsList.children.length;
            studentNameInput.value = '';
            studentNameInput.style.display = 'none';
            saveStudentButton.style.display = 'none';
            cancelStudentButton.style.display = 'none';
        } else {
            alert("Please enter a valid student name.");
        }
    });

    cancelStudentButton.addEventListener('click', () => {
        studentNameInput.value = '';
        studentNameInput.style.display = 'none';
        saveStudentButton.style.display = 'none';
        cancelStudentButton.style.display = 'none';
    });

    // Load students from file
    document.getElementById('studentFileInput').addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) {
            alert("No file selected.");
            return;
        }
    
        const fileExtension = file.name.split('.').pop().toLowerCase();
    
        if (fileExtension === "txt") {
            const reader = new FileReader();
            reader.onload = (e) => {
                const names = e.target.result.split('\n').filter(name => name.trim());
                studentsList.innerHTML = names.map(name => `<p>${name}</p>`).join('');
                studentCount.textContent = names.length;
            };
            reader.readAsText(file);
        } else if (fileExtension === "xls" || fileExtension === "xlsx") {
            const reader = new FileReader();
            reader.onload = (e) => {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0]; // Use the first sheet
                const sheet = workbook.Sheets[sheetName];
                const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // Convert sheet to a 2D array
                const names = rows.map(row => row[0]).filter(name => name); // Assume names are in the first column
                studentsList.innerHTML = names.map(name => `<p>${name}</p>`).join('');
                studentCount.textContent = names.length;
            };
            reader.readAsArrayBuffer(file);
        } else {
            alert("Invalid file format. Please upload a TXT or Excel file.");
        }
    });
    

    // ---------- Mentor Management ----------
    const addMentorButton = document.getElementById('addMentor');
    const mentorNameInput = document.getElementById('mentorNameInput');
    const saveMentorButton = document.getElementById('saveMentor');
    const cancelMentorButton = document.getElementById('cancelMentor');
    const mentorsList = document.getElementById('mentorsList');
    const mentorCount = document.getElementById('mentorCount');

    addMentorButton.addEventListener('click', () => {
        mentorNameInput.style.display = 'block';
        saveMentorButton.style.display = 'block';
        cancelMentorButton.style.display = 'block';
        mentorNameInput.focus();
    });

    saveMentorButton.addEventListener('click', () => {
        const mentorName = mentorNameInput.value.trim();
        if (mentorName) {
            const mentorItem = document.createElement('p');
            mentorItem.textContent = mentorName;
            mentorsList.appendChild(mentorItem);
            mentorCount.textContent = mentorsList.children.length;
            mentorNameInput.value = '';
            mentorNameInput.style.display = 'none';
            saveMentorButton.style.display = 'none';
            cancelMentorButton.style.display = 'none';
        } else {
            alert("Please enter a valid mentor name.");
        }
    });

    cancelMentorButton.addEventListener('click', () => {
        mentorNameInput.value = '';
        mentorNameInput.style.display = 'none';
        saveMentorButton.style.display = 'none';
        cancelMentorButton.style.display = 'none';
    });

    // Load mentors from file
    document.getElementById('mentorFileInput').addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (!file) {
            alert("No file selected.");
            return;
        }
    
        const fileExtension = file.name.split('.').pop().toLowerCase();
    
        if (fileExtension === "txt") {
            const reader = new FileReader();
            reader.onload = (e) => {
                const names = e.target.result.split('\n').filter(name => name.trim());
                mentorsList.innerHTML = names.map(name => `<p>${name}</p>`).join('');
                mentorCount.textContent = names.length;
            };
            reader.readAsText(file);
        } else if (fileExtension === "xls" || fileExtension === "xlsx") {
            const reader = new FileReader();
            reader.onload = (e) => {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0]; // Use the first sheet
                const sheet = workbook.Sheets[sheetName];
                const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // Convert sheet to a 2D array
                const names = rows.map(row => row[0]).filter(name => name); // Assume names are in the first column
                mentorsList.innerHTML = names.map(name => `<p>${name}</p>`).join('');
                mentorCount.textContent = names.length;
            };
            reader.readAsArrayBuffer(file);
        } else {
            alert("Invalid file format. Please upload a TXT or Excel file.");
        }
    });
    

    // ---------- Admin Details Edit ----------
    const editAdminDetailsButton = document.getElementById('editAdminDetails');
    const saveAdminDetailsButton = document.getElementById('saveAdminDetails');
    const cancelEditDetailsButton = document.getElementById('cancelEditDetails');
    const adminDetailsDisplay = document.getElementById('adminDetailsDisplay');
    const adminDetailsEdit = document.getElementById('adminDetailsEdit');

    editAdminDetailsButton.addEventListener('click', () => {
        adminDetailsDisplay.style.display = 'none';
        adminDetailsEdit.style.display = 'block';
        // Pre-fill current details in the input fields
        document.getElementById("adminName").value = document.getElementById("adminNameDisplay").textContent;
        document.getElementById("adminSSN").value = document.getElementById("adminSSNDisplay").textContent;
        document.getElementById("adminDesignation").value = document.getElementById("adminDesignationDisplay").textContent;
        document.getElementById("adminDOB").value = document.getElementById("adminDOBDisplay").textContent;
        document.getElementById("adminContact").value = document.getElementById("adminContactDisplay").textContent;
        document.getElementById("adminAddress").value = document.getElementById("adminAddressDisplay").textContent;
    });

    // Save updated admin details
    saveAdminDetailsButton.addEventListener('click', async () => {
        const data = {
            name: document.getElementById("adminName").value,
            ssn: document.getElementById("adminSSN").value,
            designation: document.getElementById("adminDesignation").value,
            dob: document.getElementById("adminDOB").value,
            contact: document.getElementById("adminContact").value,
            address: document.getElementById("adminAddress").value
        };
    
        try {
            const response = await fetch('/update-admin-details', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            if (result.success) {
                alert(result.message || "Admin details updated successfully!");
                location.reload();  // Reload the page to see updated details
            } else {
                alert(result.message || "Failed to update admin details.");
            }
        } catch (error) {
            console.error('Error:', error);
            alert("An error occurred while updating admin details.");
        }
    });
    

    // Cancel editing admin details
    cancelEditDetailsButton.addEventListener('click', () => {
        adminDetailsDisplay.style.display = 'block';
        adminDetailsEdit.style.display = 'none';
    });


    // Save Admin Details
    document.getElementById('saveAdminDetails').addEventListener('click', () => {
    fetch('/update-admin-details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: document.getElementById('adminName').value,
            ssn: document.getElementById('adminSSN').value,
            designation: document.getElementById('adminDesignation').value,
            dob: document.getElementById('adminDOB').value,
            contact: document.getElementById('adminContact').value,
            address: document.getElementById('adminAddress').value
        })
    })
    .then(response => response.ok ? alert("Admin details updated successfully!") : alert("Failed to update details."))
    .catch(error => console.error('Error:', error));
    location.reload();
    });


    // Save Admin Credentials
    document.getElementById('saveAdminCredentials').addEventListener('click', () => {
    const username = document.getElementById('adminUsername').value.trim();
    const password = document.getElementById('adminPassword').value.trim();

    // Password validation logic
    if (password === '') {
        alert('Password is required.');
        return; // Stop further execution
    }

    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
        alert('Password must be at least 8 characters long, with at least one uppercase letter and one number.');
        return; // Stop further execution
    }

    // Proceed with saving credentials if validation passes
    fetch('/update-admin-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    })
    .then(response => {
        if (response.ok) {
            alert("Admin credentials updated successfully!");
        } else {
            return response.json().then(data => {
                alert(data.error || "Failed to update credentials.");
            });
        }
    })
    .catch(error => console.error('Error:', error))
    .finally(() => location.reload());
});

// Clear mentor list function
document.getElementById('clearMentor').addEventListener('click', () => {
    mentorsList.innerHTML = ''; // Clear the mentor names from the box
    mentorCount.textContent = '0'; // Reset the count to 0
    localStorage.removeItem('mentors'); // Remove mentors data from localStorage

    // Reset the file input value
    document.getElementById('mentorFileInput').value = '';
});

// Clear student list function
document.getElementById('clearStudent').addEventListener('click', () => {
    studentsList.innerHTML = ''; // Clear the student names from the box
    studentCount.textContent = '0'; // Remove students data from localStorage
    localStorage.removeItem('students');

    // Reset the file input value
    document.getElementById('studentFileInput').value = '';
});

// Save mentors, students, batch, and branch to localStorage
function saveToLocalStorage() {
    const mentorNames = Array.from(document.querySelectorAll('#mentorsList p')).map(p => p.textContent);
    const studentNames = Array.from(document.querySelectorAll('#studentsList p')).map(p => p.textContent);
    const batch = document.getElementById('batch')?.value || '';
    const branch = document.getElementById('Branch')?.value || '';

    try {
        localStorage.setItem('mentors', JSON.stringify(mentorNames));
        localStorage.setItem('students', JSON.stringify(studentNames));
        localStorage.setItem('batch', batch); // Save batch
        localStorage.setItem('branch', branch); // Save branch

        console.log("Saved to localStorage:", { mentorNames, studentNames, batch, branch });
    } catch (error) {
        console.error("Error saving to localStorage:", error);
    }
}

// Load mentors, students, batch, and branch from localStorage
function loadFromLocalStorage() {
    const mentorsList = document.getElementById("mentorsList");
    const studentsList = document.getElementById("studentsList");
    const mentorNames = JSON.parse(localStorage.getItem('mentors')) || [];
    const studentNames = JSON.parse(localStorage.getItem('students')) || [];
    const batch = localStorage.getItem('batch') || ''; // Load batch
    const branch = localStorage.getItem('branch') || ''; // Load branch

    // Populate the lists
    if (mentorsList && studentsList) {
        mentorsList.innerHTML = mentorNames.map(name => `<p>${name}</p>`).join('');
        studentsList.innerHTML = studentNames.map(name => `<p>${name}</p>`).join('');
    }

    // Set dropdown values
    const batchSelect = document.getElementById("batch");
    const branchSelect = document.getElementById("Branch");

    if (batchSelect) {
        batchSelect.value = batch; // Set batch
    }
    if (branchSelect) {
        branchSelect.value = branch; // Set branch
    }

    console.log("Loaded from localStorage:", { mentorNames, studentNames, batch, branch });
}

// Add event listeners
document.getElementById("batch").addEventListener("change", saveToLocalStorage);
document.getElementById("Branch").addEventListener("change", saveToLocalStorage);
document.getElementById("mentorsList")?.addEventListener('DOMSubtreeModified', saveToLocalStorage);
document.getElementById("studentsList")?.addEventListener('DOMSubtreeModified', saveToLocalStorage);

// Load on page load
window.addEventListener('load', loadFromLocalStorage);

// ---------- Navigation Buttons ----------
document.getElementById('backButton').addEventListener('click', () => {
    if (confirm("Are you sure you want to return to the login page?")) {
        window.location.href = '/';
    }
});

document.getElementById('nextButton').addEventListener('click', () => {
    const mentors = Array.from(document.querySelectorAll('#mentorsList p')).map(p => p.textContent);
    const students = Array.from(document.querySelectorAll('#studentsList p')).map(p => p.textContent);
    localStorage.setItem('mentors', JSON.stringify(mentors));
    localStorage.setItem('students', JSON.stringify(students));
    window.location.href = '/mentor-alloc';
});

document.getElementById('take').addEventListener('click', () => {
    const mentors = Array.from(document.querySelectorAll('#mentorsList p')).map(p => p.textContent);
    const students = Array.from(document.querySelectorAll('#studentsList p')).map(p => p.textContent);
    localStorage.setItem('mentors', JSON.stringify(mentors));
    localStorage.setItem('students', JSON.stringify(students));
});

document.getElementById('ClearField').addEventListener('click', () => {
    // Get the batch and branch fields
    const batchElement = document.getElementById('batch');
    const branchElement = document.getElementById('Branch');

    // Clear the fields in the DOM
    if (batchElement) batchElement.value = "";
    if (branchElement) branchElement.value = "";

    // Remove the batch and branch from localStorage
    localStorage.removeItem('batch');
    localStorage.removeItem('branch');

    // Debugging: Log the clear action
    console.log("Batch and Branch fields cleared and removed from localStorage.");

    // Notify the user
    alert("Batch and Branch fields have been cleared.");
});

    
});

// Set year limits
const startYear = 2000;
const endYear = 2100;

// Get the select element
const batchSelect = document.getElementById("batch");

// Loop through the year range and create option elements
for (let year = startYear; year <= endYear; year++) {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    batchSelect.appendChild(option);
}
