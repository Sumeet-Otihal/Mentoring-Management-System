document.addEventListener('DOMContentLoaded', function () {
    const numExamsInput = document.getElementById('numExams');
    const generateDateFieldsButton = document.getElementById('generateDateFields');
    const examDateFields = document.getElementById('examDateFields');
    const saveExamDatesButton = document.getElementById('saveExamDates');
    const reminderMessage = document.getElementById('reminderMessage');
    const clearDatesButton = document.getElementById('clearDates');

    // Function to clear exam date input fields
    function clearExamFields() {
        // Clear the labels and input fields
        examDateFields.innerHTML = '';
        numExamsInput.value = ''; // Reset the number of exams input field

        // Optionally, hide the 'Clear Dates' button again
        clearDatesButton.style.display = 'none';
    }

    // Helper function to calculate date differences
    function getDaysDifference(examDate) {
        const examDateObj = new Date(examDate);
        const today = new Date();

        // Reset the time portion for accurate day comparison
        examDateObj.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        // Calculate the time difference in milliseconds
        const timeDiff = examDateObj - today;
        // Convert the time difference to days
        const daysDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

        return daysDiff;
    }

    // Function to validate if at least one exam date is entered
    function validateExamDates() {
        const numExams = parseInt(numExamsInput.value);
        let isAtLeastOneDateEntered = false;

        for (let i = 1; i <= numExams; i++) {
            const examDate = document.getElementById(`examDate${i}`).value;
            if (examDate) {
                isAtLeastOneDateEntered = true; // At least one date has been entered
                setReminderForMentor(examDate); // Set reminder for the entered date
            }
        }

        // Show a general reminder if at least one date is entered
        if (!isAtLeastOneDateEntered) {
            reminderMessage.textContent = ''; // Clear reminder message if no dates are entered
        }
    }

    // Step 1: Generate date fields based on the number of exams
    generateDateFieldsButton.addEventListener('click', function () {
        const numExams = parseInt(numExamsInput.value);
        if (numExams > 0) {
            examDateFields.innerHTML = ''; // Clear previous fields

            // Dynamically create input fields for each exam date
            for (let i = 1; i <= numExams; i++) {
                const label = document.createElement('label');
                label.textContent = `Internal Exam ${i} Date:`;
                const input = document.createElement('input');
                input.type = 'date';
                input.id = `examDate${i}`;
                input.required = true;
                examDateFields.appendChild(label);
                examDateFields.appendChild(input);

                // Add an event listener to detect date input changes
                input.addEventListener('change', validateExamDates);
            }

            saveExamDatesButton.style.display = 'block'; // Show the save button
        } else {
            alert('Please enter a valid number of exams.');
        }
    });

    // Step 2: Save exam dates and set reminders
    saveExamDatesButton.addEventListener('click', function () {
        const numExams = parseInt(numExamsInput.value);
        let examDates = [];
    
        for (let i = 1; i <= numExams; i++) {
            const examDate = document.getElementById(`examDate${i}`).value;
            if (!examDate) {
                alert('Please enter all exam dates.');
                return;
            }
            examDates.push(examDate);
        }

        // Save exam dates in localStorage (or send to server)
        localStorage.setItem('examDates', JSON.stringify(examDates));
    
        // Send data to the backend
        fetch('/save-exam-dates', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ numExams: numExams, examDates: examDates })
        })
        .then(response => response.json())
        .then(data => {
            if (data.message) {
                alert(data.message);
                // Show the clear dates button if exam dates are saved
                clearDatesButton.style.display = 'block';
            } else {
                alert('Failed to save exam dates.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred while saving exam dates.');
        });
    });
    
    

    // Step 3: Function to set reminders for mentors
    function setReminderForMentor(examDate) {
        const daysDiff = getDaysDifference(examDate);

        // Logic for setting reminder based on the difference in days
        if (daysDiff > 0) {
            reminderMessage.textContent = `The exam is in ${daysDiff} day(s). A meeting reminder will be triggered 7 days after the exam on ${examDate}.`;
        } else if (daysDiff === 0) {
            reminderMessage.textContent = `The exam is today. A reminder will be triggered in 7 days for a mentor meeting.`;
        } else if (daysDiff > -7) {
            const daysRemaining = 7 + daysDiff;
            reminderMessage.textContent = `A meeting reminder will be triggered in ${daysRemaining} day(s) after the exam on ${examDate}.`;
        } else {
            reminderMessage.textContent = `Reminder: Mentor should hold a meeting to discuss students' performance after the exam on ${examDate}.`;
        }
    }

    // Step 4: "Back" button functionality
    document.getElementById('backButton').addEventListener('click', function () {
        window.location.href = '/mentor-alloc';
    });

    // Function to clear exam dates
    clearDatesButton.addEventListener('click', function () {
        if (confirm('Are you sure you want to clear all exam dates?')) {
            // Clear data from localStorage
            localStorage.removeItem('examDates');

            // Clear the exam date input fields and labels
            clearExamFields();

            reminderMessage.textContent = '';

            // Send request to the backend to clear the exam dates in the database
            fetch('/clear-exam-dates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
            })
            .then(response => response.json())
            .then(data => {
                if (data.message) {
                    alert(data.message);
                } else {
                    alert('Failed to clear exam dates.');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('An error occurred while clearing exam dates.');
            });
        }
    });
});
