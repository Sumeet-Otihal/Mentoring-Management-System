document.addEventListener('DOMContentLoaded', function() {
    // Retrieve mentors and students from localStorage
    const mentors = JSON.parse(localStorage.getItem('mentors')) || [];
    const students = JSON.parse(localStorage.getItem('students')) || [];

    // Display mentors and students
    const mentorsBox = document.querySelector('.mentors-box');
    mentorsBox.innerHTML = mentors.map(mentor => `<p>${mentor}</p>`).join('');

    const studentsBox = document.querySelector('.students-box');
    studentsBox.innerHTML = students.map(student => `<p>${student}</p>`).join('');


// Function to get mentor and student data dynamically from the page
function getMentorsAndStudents() {
    let mentors = Array.from(document.querySelectorAll(".mentors-box p")).map(mentor => mentor.textContent);
    let students = Array.from(document.querySelectorAll(".students-box p")).map(student => student.textContent);
    return { mentors, students };
}

// Function to sort mentors and students based on user selection
function sortData() {
    let { mentors, students } = getMentorsAndStudents();
    
    let mentorSortType = document.getElementById('sortMentors').value;
    let studentSortType = document.getElementById('sortStudents').value;

    mentors = sortList(mentors, mentorSortType);
    students = sortList(students, studentSortType);

    updateUIWithSortedData(mentors, students);
}

// Helper function to sort a list based on the chosen sort option
function sortList(list, sortType) {
    if (sortType === 'alphabetical') {
        return list.sort();
    } else if (sortType === 'reverse') {
        return list.sort().reverse();
    } else {
        return list;
    }
}

// Function to update the UI after sorting
function updateUIWithSortedData(mentors, students) {
    const mentorBox = document.querySelector(".mentors-box");
    const studentBox = document.querySelector(".students-box");

    mentorBox.innerHTML = mentors.map(mentor => `<p>${mentor}</p>`).join("");
    studentBox.innerHTML = students.map(student => `<p>${student}</p>`).join("");
}

// Function to allocate students to mentors dynamically
function allocateMentors() {
    let { mentors, students } = getMentorsAndStudents();

    if (mentors.length === 0 || students.length === 0) {
        alert('Please ensure both mentors and students are available before allocation.');
        return;
    }

    let allocations = {};
    mentors.forEach(mentor => allocations[mentor] = []);

    let baseStudentCount = Math.floor(students.length / mentors.length);
    let extraStudents = students.length % mentors.length;

    let studentIndex = 0;
    mentors.forEach((mentor, index) => {
        for (let i = 0; i < baseStudentCount; i++) {
            allocations[mentor].push(students[studentIndex++]);
        }
        if (index < extraStudents) {
            allocations[mentor].push(students[studentIndex++]);
        }
    });

    displayAllocations(allocations);
}

// Function to display the allocations on the page
function displayAllocations(allocations) {
    const allocationContainer = document.getElementById("allocationResults");
    allocationContainer.innerHTML = ""; 

    for (let mentor in allocations) {
        let mentorBlock = document.createElement("div");
        mentorBlock.classList.add("mentor-allocation");

        let mentorTitle = document.createElement("h4");
        mentorTitle.textContent = `${mentor} (Allocated Students: ${allocations[mentor].length})`;

        let studentList = document.createElement("ul");
        allocations[mentor].forEach(student => {
            let listItem = document.createElement("li");
            listItem.textContent = student;
            studentList.appendChild(listItem);
        });

        mentorBlock.appendChild(mentorTitle);
        mentorBlock.appendChild(studentList);
        allocationContainer.appendChild(mentorBlock);
    }
}

function saveCurrentDataToLocalStorage() {
    const mentorNames = Array.from(document.querySelectorAll('.mentors-box p')).map(p => p.textContent);
    const studentNames = Array.from(document.querySelectorAll('.students-box p')).map(p => p.textContent);

    localStorage.setItem('mentors', JSON.stringify(mentorNames));
    localStorage.setItem('students', JSON.stringify(studentNames));
}

// Event listeners
document.getElementById("sortButton").addEventListener("click", sortData);
document.getElementById("allocateMentorsButton").addEventListener("click", allocateMentors);
document.getElementById('backButton').addEventListener('click', function () {
    saveCurrentDataToLocalStorage();
    window.location.href = '/admin';
});

document.getElementById('nextButton').addEventListener('click', function () {
    saveCurrentDataToLocalStorage();
    window.location.href = '/exam-reminder';
});

document.getElementById('SaveResult').addEventListener('click', () => {
    let batch = null;
    let branch = null;

    // Try to get batch and branch values from the DOM
    const batchElement = document.getElementById('batch');
    const branchElement = document.getElementById('Branch');

    if (batchElement) batch = batchElement.value;
    if (branchElement) branch = branchElement.value;

    // Fallback to localStorage if DOM values are unavailable or empty
    if (!batch) {
        batch = localStorage.getItem('batch');
        console.log("Fallback to localStorage for Batch:", batch);
    }
    if (!branch) {
        branch = localStorage.getItem('branch');
        console.log("Fallback to localStorage for Branch:", branch);
    }

    // Ensure batch and branch are valid
    if (!batch || !branch) {
        alert('Error: Batch and Branch must be selected or loaded.');
        console.error("Batch or Branch is missing. Batch:", batch, "Branch:", branch);
        return;
    }

    const allocations = {};
    const allocationBlocks = document.querySelectorAll('.mentor-allocation');

    allocationBlocks.forEach(block => {
        const mentor = block.querySelector('h4').textContent.split(' (')[0]; // Extract mentor name
        const students = Array.from(block.querySelectorAll('li')).map(li => li.textContent); // Extract student names
        allocations[mentor] = students;
    });

    console.log("Allocations:", allocations);
    console.log("Batch:", batch);
    console.log("Branch:", branch);

    fetch('/save-allocations', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ allocations, batch, branch }),
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw err; });
            }
            return response.json();
        })
        .then(data => {
            console.log("Response from backend:", data); // Log the response
            alert(data.message); // Notify the user
        })
        .catch(error => {
            console.error('Error saving results:', error);
            alert(`An error occurred: ${error.message || 'Please check the console for details.'}`);
        });
});



document.getElementById('ClearTable').addEventListener('click', () => {
    // Retrieve batch and branch from localStorage
    const batch = localStorage.getItem('batch');
    const branch = localStorage.getItem('branch');

    // Validate that batch and branch are available
    if (!batch || !branch) {
        alert('Batch and Branch are not set. Please go back to the admin page and select them.');
        console.error('Batch or Branch missing. Batch:', batch, 'Branch:', branch);
        return;
    }

    // Confirm with the user before proceeding
    const confirmation = confirm(`Are you sure you want to clear data for Batch: ${batch}, Branch: ${branch}?`);
    if (!confirmation) return;

    // Send request to the backend to clear database for the selected batch and branch
    fetch('/clear-database', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ batch, branch }),
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(err => { throw err; });
            }
            return response.json();
        })
        .then(data => {
            alert(data.message); // Notify the user of success
            document.getElementById('allocationResults').innerHTML = ''; // Optionally clear the UI
        })
        .catch(error => {
            console.error('Error:', error);
            alert(`An error occurred: ${error.message || 'Please check the console for details.'}`);
        });
});

// Log loaded batch and branch for debugging
console.log("Loaded Batch from localStorage:", localStorage.getItem('batch'));
console.log("Loaded Branch from localStorage:", localStorage.getItem('branch'));


loadBatchAndBranch();

});

// Load batch and branch from localStorage and set in dropdowns
function loadBatchAndBranch() {
    const savedBatch = localStorage.getItem('batch');
    const savedBranch = localStorage.getItem('branch');

    // Set batch dropdown
    const batchDropdown = document.getElementById('batch');
    if (savedBatch && batchDropdown) {
        batchDropdown.value = savedBatch;
    }

    // Set branch dropdown
    const branchDropdown = document.getElementById('Branch');
    if (savedBranch && branchDropdown) {
        branchDropdown.value = savedBranch;
    }

    console.log("Loaded Batch:", savedBatch);
    console.log("Loaded Branch:", savedBranch);
}