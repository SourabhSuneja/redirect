DROP TABLE IF EXISTS custom_exams;
DROP TABLE IF EXISTS marks;
DROP TABLE IF EXISTS class_subject_assignments;
DROP TABLE IF EXISTS teachers;
DROP TABLE IF EXISTS admins;

-- Create admins table
CREATE TABLE admins (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on admins
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Select policy for authenticated users
CREATE POLICY "authenticated_users_can_read_admins"
ON admins
FOR SELECT
USING (auth.role() = 'authenticated');

-- Create teachers table
CREATE TABLE teachers (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL
);

-- Enable RLS on teachers
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;

-- Select policy for authenticated users
CREATE POLICY "authenticated_users_can_read_teachers"
ON teachers
FOR SELECT
USING (auth.role() = 'authenticated');


-- Insert policy for admin users
CREATE POLICY "admins_can_insert_teachers"
ON teachers
FOR INSERT
WITH CHECK (
  auth.uid() IN (SELECT id FROM admins)
);

-- Update policy for admin users
CREATE POLICY "admins_can_update_teachers"
ON teachers
FOR UPDATE
USING (
  auth.uid() IN (SELECT id FROM admins)
);

-- Delete policy for admin users
CREATE POLICY "admins_can_delete_teachers"
ON teachers
FOR DELETE
USING (
  auth.uid() IN (SELECT id FROM admins)
);


-- Create table class_subject_assignments
CREATE TABLE class_subject_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    class TEXT NOT NULL,
    CONSTRAINT unique_teacher_subject_class UNIQUE (teacher_id, subject, class)
);


-- Enable RLS on class_subject_assignments
ALTER TABLE class_subject_assignments ENABLE ROW LEVEL SECURITY;

-- Select policy for authenticated users
CREATE POLICY "authenticated_users_can_read_class_subject_assignments"
ON class_subject_assignments
FOR SELECT
USING (auth.role() = 'authenticated');


-- Insert policy for admin users
CREATE POLICY "admins_can_insert_class_subject_assignments"
ON class_subject_assignments
FOR INSERT
WITH CHECK (
  auth.uid() IN (SELECT id FROM admins)
);

-- Update policy for admin users
CREATE POLICY "admins_can_update_class_subject_assignments"
ON class_subject_assignments
FOR UPDATE
USING (
  auth.uid() IN (SELECT id FROM admins)
);

-- Delete policy for admin users
CREATE POLICY "admins_can_delete_class_subject_assignments"
ON class_subject_assignments
FOR DELETE
USING (
  auth.uid() IN (SELECT id FROM admins)
);


-- Create "marks" table
CREATE TABLE marks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam TEXT NOT NULL,
    subject TEXT NOT NULL,
    student TEXT NOT NULL,
    class TEXT NOT NULL,
    marks DECIMAL(5, 2) DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add a unique constraint
ALTER TABLE marks
ADD CONSTRAINT unique_exam_subject_student_class
UNIQUE (exam, subject, student, class);


-- Enable RLS on marks table
ALTER TABLE marks ENABLE ROW LEVEL SECURITY;


-- Policy for SELECT: Any authenticated user can view marks
CREATE POLICY marks_select_policy ON marks
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Policy for INSERT: Teachers can only insert marks for their assigned subjects and classes
CREATE POLICY marks_insert_policy ON marks
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM class_subject_assignments
            WHERE teacher_id = auth.uid()
            AND subject = marks.subject
            AND class = marks.class
        )
    );

-- Policy for UPDATE: Teachers can only update marks for their assigned subjects and classes
CREATE POLICY marks_update_policy ON marks
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM class_subject_assignments
            WHERE teacher_id = auth.uid()
            AND subject = marks.subject
            AND class = marks.class
        )
    );

-- Policy for DELETE: Teachers can only delete marks for their assigned subjects and classes
CREATE POLICY marks_delete_policy ON marks
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM class_subject_assignments
            WHERE teacher_id = auth.uid()
            AND subject = marks.subject
            AND class = marks.class
        )
    );



-- Create table "custom_exams"
CREATE TABLE custom_exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    mm INTEGER NOT NULL CHECK (mm > 0),
    class TEXT NOT NULL,
    subject TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enable Row Level Security (RLS)
ALTER TABLE custom_exams ENABLE ROW LEVEL SECURITY;

-- Policy for inserting data
CREATE POLICY "Allow authenticated users to insert data"
ON custom_exams
FOR INSERT
TO authenticated
WITH CHECK ( true );

-- Policy for updating data
CREATE POLICY "Allow authenticated users to update data"
ON custom_exams
FOR UPDATE
TO authenticated
USING ( true );

-- Policy for deleting data
CREATE POLICY "Allow authenticated users to delete data"
ON custom_exams
FOR DELETE
TO authenticated
USING ( true );

-- Policy for selecting data
CREATE POLICY "Allow authenticated users to select data"
ON custom_exams
FOR SELECT
TO authenticated
USING ( true );