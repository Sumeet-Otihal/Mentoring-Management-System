from flask import Flask, render_template, request, redirect, url_for, flash, jsonify
from models import db, Admin, Mentor, Student, Users, Exam, AcademicDetails, CocurricularDetails
from datetime import datetime
from flask import session
from sqlalchemy.orm import Session
import os
import logging
import bcrypt
from dotenv import load_dotenv

load_dotenv(dotenv_path='flask_key.env')

# Configure logging
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
app.secret_key = os.getenv('FLASK_SECRET_KEY')
app.config['SESSION_TYPE'] = 'filesystem'

# Configure SQLAlchemy with MySQL
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URI')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

# Create database tables if they don't exist
with app.app_context():
    db.create_all()

@app.route('/')
def login():
    return render_template('login.html')

@app.route('/logout')
def logout():
    session.clear()  # Clears the session data (user info)
    return render_template('login.html')  # Redirect to the login page


@app.route('/api/login', methods=['POST'])
def login_user():
    try:
        # Extract data from the request
        data = request.json
        username = data.get('username')  # For students, this will be USN
        password = data.get('password')
        role = data.get('role', '').upper()

        logging.debug(f"Received login attempt for role: {role}, username: {username}")

        # Validate role
        valid_roles = {"ADMIN", "STAFF", "STUDENT"}
        if role not in valid_roles:
            logging.error(f"Invalid role received: {role}")
            return jsonify({
                "success": False,
                "message": f"Invalid role: {role}. Expected roles are: {list(valid_roles)}"
            }), 400

        # Fetch the user from the database
        user = Users.query.filter_by(username=username, role=role).first()

        if not user:
            logging.warning(f"No user found for username: {username} with role: {role}")
            return jsonify({
                "success": False,
                "message": "Invalid credentials"
            }), 401

        logging.debug(f"User found: {user.username}, role: {user.role}")

        # Validate the password using bcrypt
        if not bcrypt.checkpw(password.encode('utf-8'), user.password.encode('utf-8')):
            logging.warning(f"Invalid password for user: {username}")
            return jsonify({
                "success": False,
                "message": "Invalid credentials"
            }), 401

        # Role-specific logic
        if role == "STAFF":
            # Fetch mentor details
            mentor = Mentor.query.filter_by(name=user.username).first()
            if mentor:
                logging.debug(f"Mentor found: {mentor.name} with ID: {mentor.id}")
                # Set session values for mentors
                session['mentor_id'] = mentor.id
                session['mentor_name'] = mentor.name
            else:
                logging.warning(f"Mentor details not found for user: {user.username}")
                return jsonify({
                    "success": False,
                    "message": "Mentor details not found"
                }), 404

        elif role == "STUDENT":
            # Fetch student details by USN
            student = Student.query.filter_by(usn=user.username).first()
            if student:
                logging.debug(f"Student found: {student.name} with USN: {student.usn}")
                # Set session values for student
                session['student_id'] = student.id
                session['student_name'] = student.name
                session['user_role'] = role  # Store the role in session
            else:
                logging.warning(f"Student details not found for user: {user.username}")
                return jsonify({
                    "success": False,
                    "message": "Student details not found"
                }), 404

        # Redirect based on role
        redirect_url = '/admin' if role == "ADMIN" else '/staff' if role == "STAFF" else f'/student/{student.id}'
        logging.debug(f"Redirecting user {username} to {redirect_url}")

        return jsonify({
            "success": True,
            "redirect": redirect_url,
            "message": "Login Successful!",
            "role": role
        })

    except Exception as e:
        # Log the full exception with traceback for debugging
        logging.error(f"Error during login: {str(e)}", exc_info=True)
        return jsonify({
            "success": False,
            "error": "Internal server error",
            "details": str(e)  # Optional, remove if you don't want to expose the error
        }), 500



@app.route('/admin')
def admin():
    admin = Admin.query.first()
    user_credentials = Users.query.filter_by(role="ADMIN").first()
    mentors = Mentor.query.all()
    students = Student.query.all()
    return render_template('admin.html', admin=admin, user=user_credentials, mentors=mentors, students=students)

# Route to update Admin details (e.g., Name, SSN, etc.)
@app.route('/update-admin-details', methods=['POST'])
def update_admin_details():
    try:
        data = request.get_json()
        admin = Admin.query.first()

        if admin:
            # Log current and incoming data for troubleshooting
            logging.debug(f"Current Admin Details: {admin.__dict__}")
            logging.debug(f"Received Update Data: {data}")

            # Update only if new data is provided
            admin.name = data.get('name', admin.name)
            admin.ssn = data.get('ssn', admin.ssn)
            admin.designation = data.get('designation', admin.designation)
            admin.dob = data.get('dob', admin.dob)
            admin.contact = data.get('contact', admin.contact)
            admin.address = data.get('address', admin.address)

            # Commit changes and confirm successful update
            db.session.commit()
            logging.info("Admin details updated successfully")
            return jsonify(success=True, message="Updating the data!!")
        
        logging.error("Admin record not found")
        return jsonify(success=False, message="Admin record not found"), 404

    except Exception as e:
        logging.error(f"Error updating admin details: {e}")
        return jsonify(success=False, message="Failed to update admin details.", error=str(e)), 500


# Route to update Admin credentials (username and password)
@app.route('/update-admin-credentials', methods=['POST'])
def update_admin_credentials():
    try:
        data = request.get_json()
        new_username = data.get('username')
        new_password = data.get('password')

        # Validate the password
        if new_password:
            if (
                len(new_password) < 8 or
                not any(char.isupper() for char in new_password) or
                not any(char.isdigit() for char in new_password)
            ):
                return jsonify(
                    success=False,
                    error="Password must be at least 8 characters long, with at least one uppercase letter and one number."
                ), 400

        user = Users.query.filter_by(role="ADMIN").first()
        if user:
            # Update username if provided
            if new_username:
                user.username = new_username
            
            # Hash and update password if provided
            if new_password:
                hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
                user.password = hashed_password.decode('utf-8')  # Store as string

            # Save changes to the database
            db.session.commit()
            return jsonify(success=True, message="Admin credentials updated successfully!")
        else:
            return jsonify(success=False, error="Admin user not found"), 404

    except Exception as e:
        logging.error(f"Error updating admin credentials: {e}")
        return jsonify(success=False, error="Failed to update admin credentials."), 500


@app.route('/mentor-alloc')
def mentor_alloc():
    return render_template('Mentor-Alloc.html')

@app.route('/save-allocations', methods=['POST'])
def save_allocations():
    data = request.json
    allocations = data.get('allocations', {})  # Mentor-student mappings
    batch = data.get('batch')  # Batch sent from frontend
    branch = data.get('branch')  # Branch sent from frontend

    if not batch or not branch or not allocations:
        return jsonify({'message': 'Invalid data received. Please check your inputs.'}), 400

    try:
        # Define the default password and hash it once
        default_password = "Bldeacet2024"
        hashed_password = bcrypt.hashpw(default_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        # Create a set of mentor and student names for efficient lookups
        existing_mentors = {m.name: m for m in Mentor.query.all()}
        existing_users = {u.username: u for u in Users.query.all()}
        existing_students = {s.name: s for s in Student.query.all()}

        for mentor_name, students in allocations.items():
            # Add mentor if not already in the database
            mentor = existing_mentors.get(mentor_name)
            if not mentor:
                mentor = Mentor(name=mentor_name, branch=branch)
                db.session.add(mentor)
                existing_mentors[mentor_name] = mentor

            # Add user account for the mentor if not present
            if mentor_name not in existing_users:
                user = Users(username=mentor_name, password=hashed_password, role='staff')
                db.session.add(user)
                existing_users[mentor_name] = user

            # Process students assigned to this mentor
            for student_name in students:
                student = existing_students.get(student_name)
                if not student:
                    student = Student(name=student_name, mentor_name=mentor_name, branch=branch, batch=batch)
                    db.session.add(student)
                    existing_students[student_name] = student
                else:
                    # Update existing student with the new mentor, branch, and batch
                    student.mentor_name = mentor_name
                    student.branch = branch
                    student.batch = batch

        db.session.commit()
        return jsonify({'message': 'Allocations, batch, branch, and user accounts saved successfully!'}), 200

    except Exception as e:
        db.session.rollback()
        app.logger.error("Error saving allocations: %s", e)
        return jsonify({'message': 'An error occurred while saving allocations.', 'error': str(e)}), 500


@app.route('/clear-database', methods=['POST'])
def clear_database():
    try:
        data = request.json
        batch = data.get('batch')
        branch = data.get('branch')

        if not batch or not branch:
            return jsonify({'message': 'Batch and Branch are required to clear the database.'}), 400

        # Log the incoming request for debugging
        app.logger.info(f"Clear request received for Batch={batch}, Branch={branch}")

        # Fetch mentor names from the Mentor table for the specified branch
        mentor_names = [mentor.name for mentor in Mentor.query.filter_by(branch=branch).all()]

        # Clear students for the specified batch and branch
        Student.query.filter_by(batch=batch, branch=branch).delete()

        # Clear mentors for the specified branch
        Mentor.query.filter_by(branch=branch).delete()

        # Clear related mentor entries from the Users table
        if mentor_names:
            Users.query.filter(
                Users.username.in_(mentor_names),
                Users.role == 'staff'
            ).delete(synchronize_session=False)

        db.session.commit()

        return jsonify({'message': f'Database cleared successfully for Batch: {batch} and Branch: {branch}!'}), 200

    except Exception as e:
        db.session.rollback()
        app.logger.error(f"Error clearing the database: {e}")
        return jsonify({'message': 'An error occurred while clearing the database.', 'error': str(e)}), 500


@app.route('/exam-reminder')
def exam_reminder():
    return render_template('exam-reminder.html')

@app.route('/save-exam-dates', methods=['POST'])
def save_exam_dates():
    try:
        data = request.json
        num_exams = data.get('numExams')
        exam_dates = data.get('examDates')

        if not num_exams or not exam_dates or len(exam_dates) != num_exams:
            return jsonify({'message': 'Invalid data received.'}), 400

        # Clear existing data for fresh updates (optional)
        Exam.query.delete()

        # Insert exam data into the database
        for i, date in enumerate(exam_dates, start=1):
            exam = Exam(exam_number=i, exam_date=datetime.strptime(date, '%Y-%m-%d'))
            db.session.add(exam)

        db.session.commit()

        return jsonify({'message': 'Exam dates saved successfully!'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'An error occurred while saving exam dates.', 'error': str(e)}), 500
    
@app.route('/clear-exam-dates', methods=['POST'])
def clear_exam_dates():
    try:
        # Clear all records from the Exam table
        Exam.query.delete()
        db.session.commit()

        return jsonify({'message': 'Exam dates cleared successfully!'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'An error occurred while clearing exam dates.', 'error': str(e)}), 500
    
@app.route('/mentor_list', methods=['GET', 'POST'])
def mentor_list():
    branches = ["CSE", "ECE", "AIML", "ISE", "Civil Engineering", 
                "Mechanical Engineering", "EEE", "CSE (Data Science)"]
    batches = list(range(2000, 2101))  # Batch years from 2000 to 2100

    selected_branch = request.form.get('branch')
    selected_batch = request.form.get('batch')

    mentors = []
    students_under_mentors = {}

    if request.method == 'POST' and selected_branch and selected_batch:
        # Query mentors in the selected branch
        mentors = Mentor.query.filter_by(branch=selected_branch).all()
        
        # Fetch students grouped under mentors
        for mentor in mentors:
            students = Student.query.filter_by(branch=selected_branch, batch=int(selected_batch), mentor_name=mentor.name).all()
            students_under_mentors[mentor.name] = students

    return render_template('mentor_list.html', 
                           branches=branches, 
                           batches=batches, 
                           mentors=mentors, 
                           students_under_mentors=students_under_mentors,
                           selected_branch=selected_branch,
                           selected_batch=selected_batch)

@app.route('/search-student', methods=['GET'])
def search_student():
    usn = request.args.get('usn', '').strip()
    if not usn:
        return jsonify({"error": "USN is required"}), 400

    # Fetch student details from the database
    student = Student.query.filter_by(usn=usn).first()
    if not student:
        return jsonify({"error": "Student not found"}), 404

    # Fetch mentor details based on mentor's name
    mentor = Mentor.query.filter_by(name=student.mentor_name).first()

    # Prepare the response with student and mentor details
    return jsonify({
        "usn": student.usn,
        "name": student.name,
        "contact": student.contact,
        "email": student.email,
        "batch": student.batch,
        "father_name": student.father_name,
        "father_contact": student.father_contact,
        "mother_name": student.mother_name,
        "mother_contact": student.mother_contact,
        "mentor_name": mentor.name if mentor else None  # Return None if mentor not found
    })

@app.route('/staff', methods=['GET'])
def staff_page():
    mentor_id = session.get('mentor_id')  # Safely get mentor ID
    mentor_name = session.get('mentor_name')  # Safely get mentor name

    if mentor_id and mentor_name:
        # Query for mentor and credentials
        mentor = Mentor.query.filter_by(id=mentor_id).first()
        credentials = Users.query.filter_by(username=mentor_name, role='STAFF').first()

        if mentor and credentials:
            return render_template('staff.html', mentor=mentor, credentials=credentials)
        else:
            return "Mentor or Credentials not found", 404
    else:
        return redirect('/')

# To get Mentor Details
@app.route('/get-mentor-details', methods=['GET'])
def get_mentor_details():
    try:
        mentor_id = session.get('mentor_id')
        mentor = Mentor.query.get(mentor_id)
        user = Users.query.filter_by(username=mentor.name, role='STAFF').first()
        
        if mentor and user:
            return jsonify({
                "id": mentor.id,
                "ssn": mentor.ssn,
                "name": mentor.name,
                "branch": mentor.branch,
                "contact": mentor.contact,
                "email": mentor.email,
                "address": mentor.address,
                "username": user.username,
                "password": "******"  # Masked password for display
            })
        return jsonify({"error": "Mentor not found"}), 404
    except Exception as e:
        logging.error(f"Error fetching mentor details: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500

@app.route('/get-mentees', methods=['GET'])
def get_mentees():
    try:
        # Get mentor ID from session (assuming the mentor is logged in)
        mentor_id = session.get('mentor_id')

        # Fetch the mentor's details based on the mentor_id
        mentor = Mentor.query.filter_by(id=mentor_id).first()

        if mentor is None:
            return jsonify({"error": "Mentor not found"}), 404

        # Now, get the mentees allocated to the mentor (based on mentor's name)
        mentees = Student.query.filter_by(mentor_name=mentor.name).all()

        # Return the list of mentees in the expected format
        return jsonify([{"id": mentee.id, "name": mentee.name} for mentee in mentees])
    
    except Exception as e:
        logging.error(f"Error fetching mentees: {str(e)}")
        return jsonify({"error": "Internal server error"}), 500


@app.route('/update_mentor_details', methods=['POST'])
def update_mentor_details():
    try:
        data = request.json
        mentor = Mentor.query.get(data.get('mentorID'))
        
        if mentor:
            mentor.ssn = data.get('mentorSSN')
            mentor.name = data.get('name')
            mentor.branch = data.get('branch')
            mentor.contact = data.get('contact')
            mentor.email = data.get('email')
            mentor.address = data.get('address')
            db.session.commit()
            return jsonify({"success": True})
        return jsonify({"success": False, "message": "Mentor not found"}), 404
    except Exception as e:
        logging.error(f"Error updating mentor details: {str(e)}")
        return jsonify({"success": False, "message": "Internal server error"}), 500


@app.route('/update_mentor_credentials', methods=['POST'])
def update_mentor_credentials():
    try:
        data = request.json
        user = Users.query.filter_by(username=session.get('mentor_name')).first()
        
        if user:
            user.username = data.get('username')
            user.password = bcrypt.hashpw(data.get('password').encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            db.session.commit()
            return jsonify({"success": True})
        return jsonify({"success": False, "message": "User not found"}), 404
    except Exception as e:
        logging.error(f"Error updating mentor credentials: {str(e)}")
        return jsonify({"success": False, "message": "Internal server error"}), 500

@app.route('/student/<int:student_id>')
def student_details_page(student_id):
    student = Student.query.get(student_id)
    if not student:
        return "Student not found", 404
    
    # Fetch credentials if they exist
    credentials = Users.query.filter_by(username=student.usn, role='Student').first()

    return render_template('student.html', student=student, credentials=credentials)

@app.route('/api/student/<int:student_id>', methods=['GET'])
def get_student_details(student_id):
    print(f"Fetching details for student_id: {student_id}")
    student = Student.query.get(student_id)
    if not student:
        print("Student not found!")
        return jsonify({'message': 'Student not found'}), 404

    credentials = Users.query.filter_by(user_id=student.id).first()

    student_data = {
        'id': student.id,
        'name': student.name,
        'branch': student.branch,
        'batch': student.batch,
        'contact': student.contact,
        'email': student.email,
        'address': student.address,
        'mentor_name': student.mentor_name,
        'dob': student.dob.isoformat() if student.dob else None,
        'blood_group': student.blood_group,
        'hobbies': student.hobbies,
        'father_name': student.father_name,
        'father_contact': student.father_contact,
        'mother_name': student.mother_name,
        'mother_contact': student.mother_contact,
        'credentials': {
            'username': credentials.username if credentials else None,
            'password': 'Exists' if credentials else None
        }
    }
    return jsonify(student_data), 200



@app.route('/update-student-details', methods=['POST'])
def update_student_details():
    try:
        data = request.get_json()  # Get the updated details from the request
        student_id = data.get('id')  # ID is still used to fetch the student

        # Fetch student by ID (hidden field)
        student = Student.query.filter_by(id=student_id).first()

        if not student:
            return jsonify({'success': False, 'message': 'Student not found'}), 404

        # Update student details
        student.usn = data.get('usn', student.usn)  # Update USN (visible field)
        student.name = data.get('name', student.name)
        student.batch = data.get('batch', student.batch)
        student.branch = data.get('branch', student.branch)
        student.mentor_name = data.get('mentor_name', student.mentor_name)
        student.contact = data.get('contact', student.contact)
        student.email = data.get('email', student.email)
        student.address = data.get('address', student.address)
        student.dob = data.get('dob', student.dob)
        student.blood_group = data.get('blood_group', student.blood_group)
        student.hobbies = data.get('hobbies', student.hobbies)
        student.father_name = data.get('father_name', student.father_name)
        student.father_contact = data.get('father_contact', student.father_contact)
        student.mother_name = data.get('mother_name', student.mother_name)
        student.mother_contact = data.get('mother_contact', student.mother_contact)

        db.session.commit()

        return jsonify({'success': True, 'message': 'Student details updated successfully'})
    
    except Exception as e:
        app.logger.error(f"Error updating student details: {e}")
        return jsonify({'success': False, 'message': 'Failed to update student details', 'error': str(e)}), 500


@app.route('/update-student-credentials', methods=['POST'])
def update_student_credentials():
    data = request.json
    password = data.get('password')
    student_id = data.get('student_id')

    if not password or not student_id:
        return jsonify({'success': False, 'message': 'Invalid data'}), 400

    # Fetch student by ID
    student = Student.query.get(student_id)
    if not student:
        return jsonify({'success': False, 'message': 'Student not found'}), 404

    username = student.usn  # Force username to match USN
    if not username:
        return jsonify({'success': False, 'message': 'USN is not set for the student'}), 400

    # Check if credentials already exist
    existing_user = Users.query.filter_by(user_id=username).first()
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    if existing_user:
        # Update existing credentials
        existing_user.username = username
        existing_user.password = hashed_password
    else:
        # Add new credentials
        new_user = Users(username=username, password=hashed_password, role='Student', user_id=username)
        db.session.add(new_user)

    try:
        db.session.commit()
        return jsonify({'success': True, 'message': 'Credentials updated successfully'})
    except Exception as e:
        db.session.rollback()
        return jsonify({'success': False, 'message': str(e)}), 500



@app.route('/marks/<string:student_id>')
def marks_page(student_id):
    student = Student.query.get(student_id)
    if not student:
        return "Student not found", 404

    # Fetch academic and co-curricular details for the student
    academic_details = AcademicDetails.query.filter_by(student_id=student_id).all()
    cocurricular_details = CocurricularDetails.query.filter_by(student_id=student_id).all()

    return render_template('marks.html', student=student, academic_details=academic_details, cocurricular_details=cocurricular_details)

@app.route('/get_details/<int:student_id>', methods=['GET'])
def get_details(student_id):
    semester = request.args.get('semester')
    if not semester:
        return jsonify({"status": "error", "message": "Semester is required"}), 400
    print(f"Fetching details for student_id={student_id}, semester={semester}")
    
    try:
        # Fetch all details for the given student and semester
        academic_details = AcademicDetails.query.filter_by(student_id=student_id, semester=semester).all()
        cocurricular_details = CocurricularDetails.query.filter_by(student_id=student_id, semester=semester).all()

        # Fetch section from the first academic record if available
        section = academic_details[0].section if academic_details else None

        if not academic_details and not cocurricular_details:
            return jsonify({"status": "error", "message": "No details found for the selected semester"}), 404

        # Filter only the relevant fields for academic details
        def filter_academic_fields(record):
            return {
                "id": record.id,
                "course": record.course,
                "first_cie_attendance": record.first_cie_attendance,
                "first_cie_marks": record.first_cie_marks,
                "second_cie_attendance": record.second_cie_attendance,
                "second_cie_marks": record.second_cie_marks,
                "third_cie_attendance": record.third_cie_attendance,
                "third_cie_marks": record.third_cie_marks,
                "final_cie": record.final_cie,
                "see_marks": record.see_marks,
                "pass_fail": record.pass_fail,
            }

        # Filter only the relevant fields for co-curricular details (changed 'activity' to 'activity_details')
        def filter_cocurricular_fields(record):
            return {
                "id": record.id,
                "date": record.date,
                "activity_details": record.activity_details,  # updated field name
                "awards": record.awards,
            }

        return jsonify({
            "status": "success",
            "academic_details": [filter_academic_fields(record) for record in academic_details],
            "cocurricular_details": [filter_cocurricular_fields(record) for record in cocurricular_details],
            "section": section,
        }), 200
    except Exception as e:
        app.logger.error(f"Error fetching details for student_id={student_id}, semester={semester}: {str(e)}")
        return jsonify({"status": "error", "message": str(e)}), 500

@app.route('/update_details/<int:student_id>', methods=['POST'])
def update_details(student_id):
    data = request.json
    semester = data.get('semester')
    division = data.get('division')  # Pass the division/section

    try:
        # Update Academic Details
        academic_data = data.get('academic')
        if academic_data:
            for course_data in academic_data:
                AcademicDetails.update_or_create(student_id, semester, division, course_data)

        # Update Co-curricular Details
        cocurricular_data = data.get('cocurricular')
        if cocurricular_data:
            for activity in cocurricular_data:
                cocurricular_record = CocurricularDetails(
                    student_id=student_id,
                    semester=semester,
                    date=activity.get('date'),
                    activity_details=activity.get('activity'),
                    awards=activity.get('awards')
                )
                db.session.add(cocurricular_record)

        db.session.commit()
        return jsonify({"status": "success", "message": "Details updated successfully."})

    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500
    
@app.route('/delete_record/<int:record_id>', methods=['DELETE'])
def delete_record(record_id):
    try:
        # Find and delete the academic record
        academic_record = AcademicDetails.query.get(record_id)
        if academic_record:
            db.session.delete(academic_record)
            db.session.commit()
            return jsonify({"status": "success", "message": "Academic record deleted successfully."})

        # Find and delete the cocurricular record
        cocurricular_record = CocurricularDetails.query.get(record_id)
        if cocurricular_record:
            db.session.delete(cocurricular_record)
            db.session.commit()
            return jsonify({"status": "success", "message": "Cocurricular record deleted successfully."})

        return jsonify({"status": "error", "message": "Record not found"}), 404

    except Exception as e:
        db.session.rollback()
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
