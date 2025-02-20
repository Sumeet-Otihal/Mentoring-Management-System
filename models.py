from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class Admin(db.Model):
    __tablename__ = 'Admin'
    ssn = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    designation = db.Column(db.String(100))
    dob = db.Column(db.Date)
    contact = db.Column(db.String(15))
    address = db.Column(db.Text)

class Mentor(db.Model):
    __tablename__ = 'Mentor'
    id = db.Column(db.Integer, primary_key=True)
    ssn = db.Column(db.String(20))
    name = db.Column(db.String(100), nullable=False)
    branch = db.Column(db.String(50))
    contact = db.Column(db.String(15))
    email = db.Column(db.String(100))
    address = db.Column(db.Text)

class Student(db.Model):
    __tablename__ = 'Student'
    id = db.Column(db.String(10), primary_key=True)
    usn = db.Column(db.String(20), unique=True)
    name = db.Column(db.String(100), nullable=False)
    branch = db.Column(db.String(50))
    contact = db.Column(db.String(15))
    email = db.Column(db.String(100))
    address = db.Column(db.Text)
    mentor_name = db.Column(db.String(50), nullable=True)
    batch = db.Column(db.Integer, nullable=True)
    dob = db.Column(db.Date, nullable=True)  
    blood_group = db.Column(db.String(5), nullable=True)  
    hobbies = db.Column(db.String(255), nullable=True)  
    father_name = db.Column(db.String(100), nullable=True)  
    father_contact = db.Column(db.String(15), nullable=True)  
    mother_name = db.Column(db.String(100), nullable=True)  
    mother_contact = db.Column(db.String(15), nullable=True)

class Users(db.Model):
    __tablename__ = 'users'
    Sr_No = db.Column(db.Integer, primary_key=True, autoincrement=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(20), nullable=False)
    user_id = db.Column(db.String(20), db.ForeignKey('Student.usn'), unique=True, nullable=True)
    
    # Relationship to Student
    student = db.relationship('Student', backref=db.backref('credentials', uselist=False))

class Exam(db.Model):
    __tablename__ = 'Exam'
    id = db.Column(db.Integer, primary_key=True)
    exam_number = db.Column(db.Integer, nullable=False)
    exam_date = db.Column(db.Date, nullable=False)
    

class AcademicDetails(db.Model):
    __tablename__ = 'academic_details'
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, nullable=False)
    course = db.Column(db.String(100), nullable=False)
    first_cie_attendance = db.Column(db.Integer, nullable=True)
    first_cie_marks = db.Column(db.Integer, nullable=True)
    second_cie_attendance = db.Column(db.Integer, nullable=True)
    second_cie_marks = db.Column(db.Integer, nullable=True)
    third_cie_attendance = db.Column(db.Integer, nullable=True)
    third_cie_marks = db.Column(db.Integer, nullable=True)
    final_cie = db.Column(db.Integer, nullable=True)
    see_marks = db.Column(db.Integer, nullable=True)
    pass_fail = db.Column(db.String(10), nullable=True)
    semester = db.Column(db.String(10), nullable=False)
    section = db.Column(db.String(10), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "student_id": self.student_id,
            "course": self.course,
            "first_cie_attendance": self.first_cie_attendance,
            "first_cie_marks": self.first_cie_marks,
            "second_cie_attendance": self.second_cie_attendance,
            "second_cie_marks": self.second_cie_marks,
            "third_cie_attendance": self.third_cie_attendance,
            "third_cie_marks": self.third_cie_marks,
            "final_cie": self.final_cie,
            "see_marks": self.see_marks,
            "pass_fail": self.pass_fail,
            "semester": self.semester,
            "section": self.section,
        }
    @classmethod
    def update_or_create(cls, student_id, semester, section, course_data):
        """
        Updates or creates academic details for the given student and semester.
        Handles missing or blank values for CIE attendance and marks (set to NULL).
        """
        academic_record = cls.query.filter_by(student_id=student_id, semester=semester, section=section, course=course_data['course']).first()

        if not academic_record:
            academic_record = cls(student_id=student_id, semester=semester, section=section, course=course_data['course'])
            db.session.add(academic_record)

        # Handle third CIE as NULL if empty
        if not course_data.get('third_cie_attendance'):
            course_data['third_cie_attendance'] = None
        if not course_data.get('third_cie_marks'):
            course_data['third_cie_marks'] = None

        # Update fields with course data
        for key, value in course_data.items():
            if value == "":  # Explicitly set empty strings to NULL
                setattr(academic_record, key, None)
            else:
                setattr(academic_record, key, value)

        db.session.commit()
        return academic_record


class CocurricularDetails(db.Model):
    __tablename__ = 'cocurricular_details'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    semester = db.Column(db.String(10))
    student_id = db.Column(db.String(10), db.ForeignKey('Student.id'), nullable=False)
    date = db.Column(db.Date)
    activity_details = db.Column(db.Text)
    awards = db.Column(db.String(255))