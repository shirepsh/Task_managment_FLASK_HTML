from flask import Flask, jsonify, render_template, request, send_from_directory
from flask_cors import CORS 
import sqlite3
import webbrowser
import os

app = Flask(__name__)
CORS(app)

# Determine the path to the static folder
static_folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static')

# //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
# Function to fetch data from SQLite database Tasks table
def fetch_data():
    try:
        with sqlite3.connect('DB/tasks_database.db') as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM Tasks")
            data = cursor.fetchall()
            # print("Fetched data from database:", data) 
            return data
    except Exception as e:
        print(str(e))
        return []


@app.route('/api/get_task')
def get_tasks():
    data = fetch_data()
    return jsonify(data)

# ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
# Function to fetch emails based on task ID from SQLite database TasksReportEmail table
def fetch_emails(task_id):
    conn = sqlite3.connect('DB/tasks_database.db')
    cursor = conn.cursor()
    cursor.execute("SELECT Email FROM TasksReportEmail WHERE TaskId=?", (task_id,))
    emails = [email[0] for email in cursor.fetchall()]
    conn.close()
    return emails

@app.route('/api/get_emails', methods=['GET'])
def get_emails():
    try:
        task_id = request.args.get('TaskId')
        emails = fetch_emails(task_id)
        return jsonify({'emails': emails}), 200
    except Exception as e:
        print(str(e))
        return jsonify({'error': str(e)}), 500

# /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
# Function to add new data to the Tasks table
@app.route('/api/add_task', methods=['POST'])
def add_task():
    try:
        add_data = request.json
        # print("Received data:", add_data) 
        TaskId= add_data['TaskId']
        TaskName = add_data['TaskName']
        TaskType = add_data['TaskType']
        Active = add_data['Active']
        Description = add_data['Description']
        DirPath = add_data['DirPath']
        PlaceId = add_data['PlaceId']
        ClearAllUsers = add_data['ClearAllUsers']
        ClearSpecified = add_data['ClearSpecified']
        IgnoreRowsWithNoPlace = add_data['IgnoreRowsWithNoPlace']
        TriggerType = add_data['TriggerType']
        Interval = add_data['Interval']
        DaysOfWeek = add_data['DaysOfWeek']
        DaysOfMonth = add_data['DaysOfMonth']
        TaskTime = add_data['TaskTime']
        Emails = add_data['Emails']

        with sqlite3.connect('DB/tasks_database.db') as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM Tasks WHERE TaskId=?", (TaskId,))
            existing_task = cursor.fetchone()
            if existing_task:
                return jsonify({'error': 'TaskId already exists'}), 400
            else:
                cursor.execute("INSERT INTO Tasks (TaskId, TaskName, TaskType, Active, Description, DirPath, PlaceId, ClearAllUsers, ClearSpecified, IgnoreRowsWithNoPlace, TriggerType, Interval, DaysOfWeek, DaysOfMonth, TaskTime) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                            (TaskId, TaskName, TaskType, Active, Description, DirPath, PlaceId, ClearAllUsers, ClearSpecified, IgnoreRowsWithNoPlace, TriggerType, Interval, DaysOfWeek, DaysOfMonth, TaskTime))

                # Insert new email records into the TasksReportEmail table using the with statement
                for email in Emails:
                    cursor.execute("INSERT INTO TasksReportEmail (TaskId, Email) VALUES (?, ?)", (TaskId, email.strip()))
                conn.commit()


        updated_data = fetch_data()  # Fetch updated data from the database
        return jsonify({'message': 'Task added successfully', 'data': updated_data}), 200

    except Exception as e:
        app.logger.error(str(e))
        print(f"Error: {e}")
        return jsonify({'error': str(e)}), 500
    
# ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
@app.route('/api/update_task', methods=['POST'])
def update_task():
    try:
        updated_data = request.json

        # Check for required keys in the JSON data
        required_keys = ['TaskId', 'TaskName', 'TaskType', 'Active', 'Description', 'DirPath', 'PlaceId', 'ClearAllUsers', 'ClearSpecified', 'IgnoreRowsWithNoPlace', 'Updated', 'TriggerType', 'Interval', 'DaysOfWeek', 'DaysOfMonth', 'TaskTime']
        if not all(key in updated_data for key in required_keys):
            return jsonify({'error': 'Invalid Request: Missing required keys'}), 400

        TaskId = updated_data['TaskId']
        TaskName = updated_data['TaskName']
        TaskType = updated_data['TaskType']
        Active = updated_data['Active']
        Description = updated_data['Description']
        DirPath = updated_data['DirPath']  
        PlaceId = updated_data['PlaceId'] 
        ClearAllUsers = int(updated_data.get('ClearAllUsers', 0))  
        ClearSpecified = updated_data['ClearSpecified']
        IgnoreRowsWithNoPlace = updated_data['IgnoreRowsWithNoPlace']
        Updated = updated_data['Updated']
        TriggerType = updated_data['TriggerType']
        Interval = updated_data['Interval']
        DaysOfWeek = updated_data['DaysOfWeek']
        DaysOfMonth = updated_data['DaysOfMonth']
        TaskTime = updated_data['TaskTime']
        emails = updated_data.get('Emails', [])

        # Update the task record in the database (assuming you have sanitized inputs to prevent SQL injection)
        conn = sqlite3.connect('DB/tasks_database.db')
        cursor = conn.cursor()
        conn.execute("BEGIN")

        try:
            cursor.execute("UPDATE Tasks SET TaskName=?, TaskType=?, Active=?, Description=?, DirPath=?, PlaceId=?, ClearAllUsers=?, ClearSpecified=?, IgnoreRowsWithNoPlace=?, Updated=?, TriggerType=?, Interval=?, DaysOfWeek=?, DaysOfMonth=?, TaskTime=?  WHERE TaskId=?", 
                        (TaskName, TaskType, Active, Description, DirPath, PlaceId, ClearAllUsers, ClearSpecified, IgnoreRowsWithNoPlace, Updated, TriggerType, Interval, DaysOfWeek, DaysOfMonth, TaskTime, TaskId))
            
            for email in emails:
                cursor.execute("INSERT OR REPLACE INTO TasksReportEmail (TaskId, Email) VALUES (?, ?)", (TaskId, email.strip()))

            conn.commit()
            return jsonify({'message': 'Task updated successfully'}), 200
        except Exception as e:
            # Log the error
            app.logger.error(str(e))
            # Rollback the transaction if there's an error
            conn.rollback()
            return jsonify({'error': 'Internal Server Error'}), 500
        finally:
            # Close the connection
            conn.close()

    except Exception as e:
        # Log the error
        app.logger.error(str(e))
        return jsonify({'error': 'Invalid Request'}), 400

# //////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
# Function to delete task and related emails from the database
@app.route('/api/delete_task', methods=['DELETE'])
def delete_task():
    try:
        task_id = request.args.get('TaskId')
        conn = sqlite3.connect('DB/tasks_database.db')
        cursor = conn.cursor()

        # Delete task from Tasks table
        cursor.execute("DELETE FROM Tasks WHERE TaskId=?", (task_id,))

        # Delete related emails from TasksReportEmail table
        cursor.execute("DELETE FROM TasksReportEmail WHERE TaskId=?", (task_id,))

        conn.commit()
        conn.close()

        return jsonify({'message': f'Task number {task_id} and related emails deleted successfully'}), 200
    except Exception as e:
        app.logger.error(str(e))
        return jsonify({'error': str(e)}), 500

# ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
@app.route('/')
def index():
    return render_template('display_tasks.html')

# Route for serving static files (JavaScript and CSS)
@app.route('/static/<path:filename>')
def serve_static(filename):
    allowed_files = ['main.js', 'styles.css']
    if filename in allowed_files:
        return send_from_directory(static_folder, filename)
    else:
        return "File not found", 404

if __name__ == '__main__':
    url = "http://localhost:5000"
    webbrowser.open(url)
    # Run the Flask app
    app.run(debug=True)


