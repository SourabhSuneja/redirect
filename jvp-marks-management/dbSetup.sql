DROP TABLE IF EXISTS marks;
DROP TABLE IF EXISTS custom_exams;

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

-- Enable Row Level Security (RLS)
ALTER TABLE marks ENABLE ROW LEVEL SECURITY;

-- Policy for inserting data
CREATE POLICY "Allow authenticated users to insert data"
ON marks
FOR INSERT
TO authenticated
WITH CHECK ( true );

-- Policy for updating data
CREATE POLICY "Allow authenticated users to update data"
ON marks
FOR UPDATE
TO authenticated
USING ( true );

-- Policy for deleting data
CREATE POLICY "Allow authenticated users to delete data"
ON marks
FOR DELETE
TO authenticated
USING ( true );

-- Policy for selecting data
CREATE POLICY "Allow authenticated users to select data"
ON marks
FOR SELECT
TO authenticated
USING ( true );

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

