document.addEventListener('DOMContentLoaded', function () {
    // Get student ID from the page's data attribute
    const studentId = document.body.getAttribute('data-student-id');

    if (!studentId) {
        alert('Student ID is missing!');
        return;
    }

    const semesterSelect = document.getElementById('semester');
    const academicTableBody = document.querySelector('#academic-table tbody');
    const cocurricularTableBody = document.querySelector('#cocurricular-table tbody');
    const divisionDisplay = document.getElementById('Division'); // Division display
    const divisionSelect = document.getElementById('DivisionSelect');
    const closeEditContainer = document.getElementById('closeEditContainer');
    const editContainer = document.getElementById('editContainer');
    const generateCoursesButton = document.getElementById('generateCourseFields');
    const generateActivitiesButton = document.getElementById('generateActivityFields');
    const numCoursesInput = document.getElementById('courseCount');
    const numActivitiesInput = document.getElementById('activityCount');
    const courseFieldsContainer = document.getElementById('course-fields');
    const activityFieldsContainer = document.getElementById('activity-fields');
    const updateButton = document.getElementById('update-button');
    const adminContent = document.getElementById('modal');
    const editButton = document.getElementById('edit-all');

    // Background blur functions
    function blurAdminContent() {
        adminContent.style.transition = 'filter 0.3s ease';
        adminContent.style.filter = 'blur(15px)';
    }

    function unblurAdminContent() {
        adminContent.style.transition = 'filter 0.3s ease';
        adminContent.style.filter = 'none';
    }

    // Event: Semester selection
    semesterSelect.addEventListener('change', () => {
        const selectedSemester = semesterSelect.value;
        if (!selectedSemester) {
            clearTables();
            displayMessage('Please select a semester.');
            return;
        }

        // Fetch and display data for the selected semester
        fetchDetails(selectedSemester);
    });

    // Fetch and populate details
    function fetchDetails(semester) {
        fetch(`/get_details/${studentId}?semester=${semester}`)
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    const section = data.section || 'N/A';  // Display section (division)
                    divisionDisplay.textContent = section;

                    // Populate academic and co-curricular details
                    if (data.academic_details.length > 0) {
                        populateAcademicTable(data.academic_details);
                    }
                    if (data.cocurricular_details.length > 0) {
                        populateCocurricularTable(data.cocurricular_details);
                    }
                } else {
                    displayMessage('No data found for the selected semester.');
                }
            })
            .catch(error => {
                console.error('Error fetching details:', error);
                displayMessage(error.message);
            });
    }

    function populateAcademicTable(data) {
        const academicTableBody = document.querySelector('#academic-table tbody');
        academicTableBody.innerHTML = '';  // Clear existing rows
    
        data.forEach(item => {
            const row = `
                <tr data-id="${item.id}">
                    <td>${item.course}</td>
                    <td>${item.first_cie_attendance || '-'}</td>
                    <td>${item.first_cie_marks || '-'}</td>
                    <td>${item.second_cie_attendance || '-'}</td>
                    <td>${item.second_cie_marks || '-'}</td>
                    <td>${item.third_cie_attendance || '-'}</td>
                    <td>${item.third_cie_marks || '-'}</td>
                    <td>${item.final_cie || '-'}</td>
                    <td>${item.see_marks || '-'}</td>
                    <td>${item.pass_fail || '-'}</td>
                    <td><button class="remove-btn">X</button></td> <!-- Remove button -->
                </tr>
            `;
            academicTableBody.insertAdjacentHTML('beforeend', row);
        });
    
        // Attach remove event listener after table is populated
        attachRemoveListeners();
    }    

    function populateCocurricularTable(data) {
        const cocurricularTableBody = document.querySelector('#cocurricular-table tbody');
        cocurricularTableBody.innerHTML = '';  // Clear existing rows
    
        data.forEach(item => {
            const row = `
                <tr data-id="${item.id}">
                    <td>${item.date || '-'}</td>
                    <td>${item.activity_details || '-'}</td>
                    <td>${item.awards || '-'}</td>
                    <td><button class="remove-btn">X</button></td> <!-- Remove button -->
                </tr>
            `;
            cocurricularTableBody.insertAdjacentHTML('beforeend', row);
        });
    
        // Attach remove event listener after table is populated
        attachRemoveListeners();
    }    

    function clearTables() {
        academicTableBody.innerHTML = '';
        cocurricularTableBody.innerHTML = '';
    }

    function attachRemoveListeners() {
        const removeButtons = document.querySelectorAll('.remove-btn');
    
        removeButtons.forEach(button => {
            button.addEventListener('click', function (e) {
                const row = e.target.closest('tr');
                const recordId = row.getAttribute('data-id');  // Get the ID of the record
    
                // Remove the row from the table
                row.remove();
    
                // Call the backend to remove the record from the database
                removeRecordFromDatabase(recordId);
            });
        });
    }

    function removeRecordFromDatabase(recordId) {
        fetch(`/delete_record/${recordId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: recordId })  // Send the ID to the backend
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                console.log('Record deleted successfully');
            } else {
                console.error('Error deleting record:', data.message);
            }
        })
        .catch(error => console.error('Error:', error));
    }    
    
    function displayMessage(message, tableType = 'general') {
        const row = `<tr><td colspan="10" style="text-align: center; color: red;">${message}</td></tr>`;
        if (tableType === 'academic') {
            academicTableBody.insertAdjacentHTML('beforeend', row);
        } else if (tableType === 'cocurricular') {
            cocurricularTableBody.insertAdjacentHTML('beforeend', row);
        } else {
            clearTables();
            academicTableBody.insertAdjacentHTML('beforeend', row);
            cocurricularTableBody.insertAdjacentHTML('beforeend', row);
        }
        attachEditListeners();
    }

    function attachEditListeners() {
        const editButtons = document.querySelectorAll('.edit-row');

        editButtons.forEach(button => {
            button.addEventListener('click', function (e) {
                const row = e.target.closest('tr');
                if (row) {
                    editContainer.style.display = 'block';
                    blurAdminContent();
                    populateEditFields(row);
                }
            });
        });
    }

    // Populate edit fields
    function populateEditFields(row) {
        const cells = row.querySelectorAll('td');

        if (cells.length > 9) {
            document.getElementById('edit-course').value = cells[0].innerText || '';
            document.getElementById('edit-first-cie-attendance').value = cells[1].innerText || '';
            document.getElementById('edit-first-cie-marks').value = cells[2].innerText || '';
            document.getElementById('edit-second-cie-attendance').value = cells[3].innerText || '';
            document.getElementById('edit-second-cie-marks').value = cells[4].innerText || '';
            document.getElementById('edit-third-cie-attendance').value = cells[5].innerText || '';
            document.getElementById('edit-third-cie-marks').value = cells[6].innerText || '';
            document.getElementById('edit-final-cie').value = cells[7].innerText || '';
            document.getElementById('edit-see-marks').value = cells[8].innerText || '';
            document.getElementById('edit-pass-fail').value = cells[9].innerText || '';
        } else {
            document.getElementById('edit-date').value = cells[0].innerText || '';
            document.getElementById('edit-activity').value = cells[1].innerText || '';
            document.getElementById('edit-awards').value = cells[2].innerText || '';
        }
    }

    // Open Edit Container
    editButton.addEventListener('click', () => {
        editContainer.style.display = 'block';
        blurAdminContent();  
    });

    // Close Edit Container
    closeEditContainer.addEventListener('click', () => {
        editContainer.style.display = 'none';
        unblurAdminContent();  
    });

    // Generate Course Fields
    generateCoursesButton.addEventListener('click', () => {
        const numCourses = parseInt(numCoursesInput.value);
        courseFieldsContainer.innerHTML = ''; // Clear previous fields

        if (isNaN(numCourses) || numCourses < 1) {
            alert('Please enter a valid number of courses.');
            return;
        }

        for (let i = 1; i <= numCourses; i++) {
            const courseFieldHTML = `
                <div class="course-group">
                    <h4>Course ${i}</h4>
                    <input type="text" placeholder="Course Name" id="course-${i}-name" />
                    <input type="number" placeholder="First CIE Attendance(in %)" id="course-${i}-cie1-att" />
                    <input type="number" placeholder="First CIE Marks" id="course-${i}-cie1-marks" />
                    <input type="number" placeholder="Second CIE Attendance(in %)" id="course-${i}-cie2-att" />
                    <input type="number" placeholder="Second CIE Marks" id="course-${i}-cie2-marks" />
                    <input type="number" placeholder="Third CIE Attendance(in %)" id="course-${i}-cie3-att" />
                    <input type="number" placeholder="Third CIE Marks" id="course-${i}-cie3-marks" />
                    <input type="number" placeholder="Final CIE Marks" id="course-${i}-final-cie" />
                    <input type="number" placeholder="SEE Marks" id="course-${i}-see-marks" />
                    <input type="text" placeholder="Pass/Fail" id="course-${i}-pass-fail" />
                </div>
            `;
            courseFieldsContainer.insertAdjacentHTML('beforeend', courseFieldHTML);
        }
    });

    // Generate Activity Fields
    generateActivitiesButton.addEventListener('click', () => {
        const numActivities = parseInt(numActivitiesInput.value);
        activityFieldsContainer.innerHTML = ''; // Clear previous fields

        if (isNaN(numActivities) || numActivities < 1) {
            alert('Please enter a valid number of activities.');
            return;
        }

        for (let i = 1; i <= numActivities; i++) {
            const activityFieldHTML = `
                <div class="activity-group">
                    <h4>Activity ${i}</h4>
                    <input type="date" placeholder="Date" id="activity-${i}-date" />
                    <input type="text" placeholder="Activity" id="activity-${i}-activity" />
                    <input type="text" placeholder="Awards" id="activity-${i}-awards" />
                </div>
            `;
            activityFieldsContainer.insertAdjacentHTML('beforeend', activityFieldHTML);
        }
    });

    // Handle Update
    updateButton.addEventListener('click', () => {
        const semester = semesterSelect.value;
        const division = divisionSelect.value;  // Get the selected division value
    
        if (!semester) {
            alert('Please select a semester.');
            return;
        }
        
        if (!division) {  // Ensure a division is selected
            alert('Please select a division.');
            return;
        }
    
        // Gather academic data
        const academicData = [];
        for (let i = 1; i <= parseInt(numCoursesInput.value) || 0; i++) {
            const courseName = document.getElementById(`course-${i}-name`).value.trim();
            if (!courseName) {
                alert(`Please provide the course name for Course ${i}`);
                return;
            }
    
            academicData.push({
                course: courseName,
                first_cie_attendance: document.getElementById(`course-${i}-cie1-att`).value.trim(),
                first_cie_marks: document.getElementById(`course-${i}-cie1-marks`).value.trim(),
                second_cie_attendance: document.getElementById(`course-${i}-cie2-att`).value.trim(),
                second_cie_marks: document.getElementById(`course-${i}-cie2-marks`).value.trim(),
                third_cie_attendance: document.getElementById(`course-${i}-cie3-att`).value.trim(),
                third_cie_marks: document.getElementById(`course-${i}-cie3-marks`).value.trim(),
                final_cie: document.getElementById(`course-${i}-final-cie`).value.trim(),
                see_marks: document.getElementById(`course-${i}-see-marks`).value.trim(),
                pass_fail: document.getElementById(`course-${i}-pass-fail`).value.trim(),
            });
        }
    
        // Gather co-curricular data
        const cocurricularData = [];
        for (let i = 1; i <= parseInt(numActivitiesInput.value) || 0; i++) {
            const activityDate = document.getElementById(`activity-${i}-date`).value.trim();
            const activityName = document.getElementById(`activity-${i}-activity`).value.trim();
            const awards = document.getElementById(`activity-${i}-awards`).value.trim();
    
            if (!activityDate || !activityName) {
                alert(`Please provide both date and activity for Activity ${i}`);
                return;
            }
    
            cocurricularData.push({
                date: activityDate,
                activity: activityName,
                awards: awards,
            });
        }
    
        // Send data to the backend, including the division value
        fetch(`/update_details/${studentId}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                semester: semester,
                division: division,  // Pass the division here
                academic: academicData,
                cocurricular: cocurricularData,
            }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                alert('Details updated successfully!');
                editContainer.style.display = 'none';
                location.reload(); // Refresh to show updated data
            } else {
                alert('Error: ' + data.message);
            }
        })
        .catch(error => console.error('Error:', error));
    });
    

    document.getElementById('backButton').addEventListener('click', () => {
        if (confirm("Are you sure you want to return to the Student page?")) {
            window.location.href = `/student/${studentId}`;
        }
    });
});


