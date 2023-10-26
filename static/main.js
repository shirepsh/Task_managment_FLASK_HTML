
// Constants for pagination and data
const recordsPerPage = 15;
let currentPage = 1;
let transformedData = [];
let shouldOpenModal = false;
let isAddingNewTask = false;

// #############################################################################################################################################################
// function to display the data at the Tasks table and from the emails table
function displayDataInTable(data) {
    const tableBody = document.querySelector('#data-table tbody');
    tableBody.innerHTML = ''; 

    data.forEach(item => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.task_id}</td>
            <td>${item.task_name}</td>
            <td>${item.task_type}</td>
            <td><input type="checkbox" class="active-checkbox" ${item.active === 0 ? 'checked' : ''} ${item.active === 1 ? 'disabled' : ''}></td>
            <td>${item.last_run}</td>
            <td>${item.next_run}</td>
            <td><img src="static/edit.png" class="edit-button" alt="Edit" style=" width: 20px; 
            height: 20px; cursor: pointer; "></td>
            <td><img src="static/delete.png" class="delete-button" alt="delete" style=" width: 20px; 
            height: 20px; cursor: pointer; "></td>
        `;

        // Add event listeners for edit and delete buttons
        const editButton = row.querySelector('.edit-button');
        const deleteButton = row.querySelector('.delete-button');

        deleteButton.addEventListener('click', () => {
            deleteRecord(item.task_id);
        });

        tableBody.appendChild(row);
    });
}

// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// transform the data after fetching from the DB into params
function transformData(data) {
    return data.map(item => {
        return {
            task_id: item[0],
            task_name: item[1],
            task_type: item[2],
            active: item[3],
            Description: item[4],
            last_run: item[5],
            next_run: item[6],
            Last_Exit_Code: item[7],
            updated: item[8],
            dirPath: item[9],
            placeId: item[10],
            ClearAllUsers: item[11],
            ClearSpecified: item[12],
            IgnoreRowsWithNoPlace: item[13],
            TriggerType: item[14],
            Interval: item[15],
            DaysOfWeek: item[16],
            DaysOfMonth: item[17],
            TaskTime: item[18]
        };
    });
}

function transformEmailData(data) {
    return data.emails;
}

// /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Function to populate edit modal with task data
async function populateEditModal(record, isNewTask, callback) {
    console.log('isNewTask:', isNewTask);
    try {
        // document.getElementById('newTaskId').value = record.task_id;
        document.getElementById('newTaskName').value = record.task_name;
        document.getElementById('NewActive').checked = record.active === 0;
        document.getElementById('NewDescription').value = record.Description;

        // Fetch email data based on task ID
        const taskId = record.task_id;
        const response = await fetch(`http://localhost:5000/api/get_emails?TaskId=${taskId}`);

        // Set the Task ID field based on the record data in order to dispaly it as disabled to edit
        document.getElementById('newTaskId').value = isNewTask ? '' : record.task_id;

        // Enable or disable the Task ID field based on whether it's a new task
        document.getElementById('newTaskId').disabled = !isNewTask;

        if (response.ok) {
            const data = await response.json();
            const emails = transformEmailData(data);
            document.getElementById('NewEmailList').value = emails.join(', ');

            // Reset the selected state for all options
            const taskTypeSelect = document.getElementById('newTaskType');
            for (let option of taskTypeSelect.options) {
                option.selected = false;
            }

            // Set TaskType dropdown selection based on record.TaskType
            for (let option of taskTypeSelect.options) {
                if (option.value === record.task_type) {
                    option.selected = true;
                }
            }

            // Trigger the change event after setting the selected option
            taskTypeSelect.dispatchEvent(new Event('change'));

            // Populate additional fields based on task type
            if (record.task_type === 'User Group') {
                document.getElementById('NewDirPath').value = record.dirPath;
                document.getElementById('NewPlaceId').value = record.placeId;
                document.getElementById('NewClearAllUsers').checked = record.ClearAllUsers === 1;
            } else if (record.task_type === 'Monthly') {
                document.getElementById('NewDirPathMonthly').value = record.dirPath;
                document.getElementById('NewPlaceIdMonthly').value = record.placeId;
                document.getElementById('NewClearAllUsersMonthly').checked = record.ClearAllUsers === 1;
                document.getElementById('NewClearSpecified').checked = record.ClearSpecified === 1;
                document.getElementById('NewIgnoreRowsWithNoPlace').checked = record.IgnoreRowsWithNoPlace === 1;
                document.getElementById('NewUpdated').value = record.updated;
            }

            const triggerTypeSelect = document.getElementById('NewTrigger');
            triggerTypeSelect.addEventListener('change', function () {
                const selectedTriggerType = this.value;
                toggleFieldsBasedOnTriggerType(selectedTriggerType);
            });

            for (let option of triggerTypeSelect.options) {
                option.selected = false;
            }

            // Set TriggerType dropdown selection based on record.TriggerType
            for (let option of triggerTypeSelect.options) {
                if (option.value === record.TriggerType) {
                    option.selected = true;
                }
            }

            toggleFieldsBasedOnTriggerType(record.TriggerType);

            // Show the edit modal
            const editModal = document.getElementById('editModal');
            editModal.style.display = 'block';

            // Center the modal on the screen
            const modalContent = editModal.querySelector('.modal-content');
            modalContent.style.margin = 'auto';

        } else {
            console.error('Error fetching email data:', response.status);
        }
    } catch (error) {
        console.error('Error fetching email data:', error);
    }
}

// ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Function to show/hide fields based on the selected task type and trigger type
function toggleFieldsBasedOnTaskType() {
    const taskTypeSelect = document.getElementById('newTaskType');
    const userGroupFields = document.getElementById('userGroupFields');
    const monthlyFields = document.getElementById('monthlyFields');

    taskTypeSelect.addEventListener('change', function () {
        const selectedTaskType = this.value;

        if (selectedTaskType === 'User Group') {
            userGroupFields.style.display = 'block';
            monthlyFields.style.display = 'none';
        } else if (selectedTaskType === 'Monthly') {
            userGroupFields.style.display = 'none';
            monthlyFields.style.display = 'block';
        } else {
            userGroupFields.style.display = 'none';
            monthlyFields.style.display = 'none';
        }
    });
}

toggleFieldsBasedOnTaskType()

// Function to show/hide fields based on the selected trigger type
function toggleFieldsBasedOnTriggerType(selectedTriggerType) {
    // Get all the fields
    const minutelyTriggerFields = document.getElementById('minutelyTriggerFields');
    const hourlyTriggerFields = document.getElementById('hourlyTriggerFields');
    const dailyTriggerFields = document.getElementById('dailyTriggerFields');
    const weeklyTriggerFields = document.getElementById('weeklyTriggerFields');
    const monthlyTriggerFields = document.getElementById('monthlyTriggerFields');
    const yearlyTriggerFields = document.getElementById('yearlyTriggerFields');

    // Hide all fields first
    minutelyTriggerFields.style.display = 'none';
    hourlyTriggerFields.style.display = 'none';
    dailyTriggerFields.style.display = 'none';
    weeklyTriggerFields.style.display = 'none';
    monthlyTriggerFields.style.display = 'none';
    yearlyTriggerFields.style.display = 'none';

    // Show fields based on the selected trigger type
    if (selectedTriggerType === 'Minutely') {
        minutelyTriggerFields.style.display = 'block';
    } else if (selectedTriggerType === 'Hourly') {
        hourlyTriggerFields.style.display = 'block';
    } else if (selectedTriggerType === 'Daily') {
        dailyTriggerFields.style.display = 'block';
    } else if (selectedTriggerType === 'Weekly') {
        weeklyTriggerFields.style.display = 'block';
    } else if (selectedTriggerType === 'Monthly') {
        monthlyTriggerFields.style.display = 'block';
    } else if (selectedTriggerType === 'Yearly') {
        yearlyTriggerFields.style.display = 'block';
    }
}

// #####################################################################################################################################################################################
// #####################################################################################################################################################################################
// #####################################################################################################################################################################################
// // all the events for the project
document.addEventListener('DOMContentLoaded', async () => {
    closeEditModal()
    console.log('DOMContentLoaded event fired');

    try {
        // Fetch all data from the server
        const dataResponse = await fetch('http://localhost:5000/api/get_task');
        if (dataResponse.ok) {
            console.log('Data fetched successfully');
            const data = await dataResponse.json();
            transformedData = transformData(data);
            displayDataInTable(transformedData, currentPage);
            console.log ("transformedData", transformedData )

            // Set up event listeners after data is fetched
            const saveButton = document.getElementById('saveButton');
            saveButton.addEventListener('click', saveButtonClicked);

            const dataTable = document.getElementById('data-table');
            dataTable.addEventListener('click', tableEditButtonClicked);

            const closeModalButton = document.getElementById('closeModal');
            closeModalButton.addEventListener('click', closeEditModal);

            // Add an event listener to the "Cancel" button in the form
            document.getElementById('cancelButton').addEventListener('click', function () {
                closeEditModal();
            });

            const nextPageButton = document.getElementById('nextPage');
            nextPageButton.addEventListener('click', nextPageButtonClicked);

            const prevPageButton = document.getElementById('prevPage');
            prevPageButton.addEventListener('click', prevPageButtonClicked);

            // // Optional: Populate the modal when the data is loaded
            // if (transformedData.length > 0) {
            //     populateEditModal(transformedData[0], false);
            // }

        } else {
            console.error('Error fetching data:', dataResponse.status);
        }
    } catch (error) {
        console.error('Error fetching data:', error);
    }
});


// ###########################################################################################################
// Event handler for the "Save" button in the edit modal
// async function saveButtonClicked(event) {
//     event.preventDefault();

//     const TaskId = document.getElementById('newTaskId').value;
//     const TaskName = document.getElementById('newTaskName').value;
//     const TaskType = document.getElementById('newTaskType').value;
//     const Active = document.getElementById('NewActive').checked ? 0 : 1;
//     const Description = document.getElementById('NewDescription').value;

//     // console.log("this", document.getElementById('NewDirPath').value)
//     // console.log(TaskType);

//     let DirPath
//     let PlaceId
//     let ClearAllUsers

//     if (TaskType === 'User Group') {
//         DirPath = document.getElementById('NewDirPath').value;
//         PlaceId = document.getElementById('NewPlaceId').value;
//         ClearAllUsers = document.getElementById('NewClearAllUsers').checked ? 1 : 0;
//     } else if (TaskType === 'Monthly') {
//         DirPath = document.getElementById('NewDirPathMonthly').value;
//         PlaceId = document.getElementById('NewPlaceIdMonthly').value;
//         ClearAllUsers = document.getElementById('NewClearAllUsersMonthly').checked ? 1 : 0;
//     }

//     const ClearSpecified = document.getElementById('NewClearSpecified').checked ? 1 : 0;
//     const IgnoreRowsWithNoPlace = document.getElementById('NewIgnoreRowsWithNoPlace').checked ? 1 : 0;
//     const Updated = document.getElementById('NewUpdated').value;

//     const NewEmailList = document.getElementById('NewEmailList').value;
//     const Emails = NewEmailList.split(',').map(email => email.trim());

//     let updatedTaskData = {
//         TaskId,
//         TaskName,
//         TaskType,
//         Active,
//         Description,
//         DirPath,
//         PlaceId,
//         ClearAllUsers,
//         ClearSpecified,
//         IgnoreRowsWithNoPlace,
//         Updated,
//         Emails: Emails
//     };

//     try {
//         // Send updated data to the server and handle the response
//         const response = await fetch('http://localhost:5000/api/update_task', {
//             method: 'POST',
//             headers: {
//                 'Content-Type': 'application/json',
//             },
//             body: JSON.stringify(updatedTaskData),
//         });

//         if (response.ok) {
//             const result = await response.json();
//             console.log(result.message);

//             // Fetch updated data immediately after updating the task
//             const dataResponse = await fetch('http://localhost:5000/api/get_task');
//             if (dataResponse.ok) {
//                 const data = await dataResponse.json();
//                 transformedData = transformData(data);
//                 // Display updated data in the table
//                 displayDataInTable(transformedData, currentPage);

//                 closeEditModal();
//             } else {
//                 console.error('Error fetching data:', dataResponse.status);
//             }
//         } else {
//             console.error('Error updating task:', response.status);
//             const errorResponse = await response.json();
//             console.error('Error details:', errorResponse);
//         }
//     } catch (error) {
//         console.error('Error updating task:', error);
//     }
// }

async function saveButtonClicked(event) {
    event.preventDefault();
    
    const TaskId = document.getElementById('newTaskId').value;
    const TaskName = document.getElementById('newTaskName').value;
    const TaskType = document.getElementById('newTaskType').value;
    const Active = document.getElementById('NewActive').checked ? 0 : 1;
    const Description = document.getElementById('NewDescription').value;

    let DirPath;
    let PlaceId;
    let ClearAllUsers;

    if (TaskType === 'User Group') {
        DirPath = document.getElementById('NewDirPath').value;
        PlaceId = document.getElementById('NewPlaceId').value;
        ClearAllUsers = document.getElementById('NewClearAllUsers').checked ? 1 : 0;
    } else if (TaskType === 'Monthly') {
        DirPath = document.getElementById('NewDirPathMonthly').value;
        PlaceId = document.getElementById('NewPlaceIdMonthly').value;
        ClearAllUsers = document.getElementById('NewClearAllUsersMonthly').checked ? 1 : 0;
    }

    const ClearSpecified = document.getElementById('NewClearSpecified').checked ? 1 : 0;
    const IgnoreRowsWithNoPlace = document.getElementById('NewIgnoreRowsWithNoPlace').checked ? 1 : 0;
    const Updated = document.getElementById('NewUpdated').value;

    const NewEmailList = document.getElementById('NewEmailList').value;
    const Emails = NewEmailList.split(',').map(email => email.trim());

    let updatedTaskData = {
        TaskId,
        TaskName,
        TaskType,
        Active,
        Description,
        DirPath,
        PlaceId,
        ClearAllUsers,
        ClearSpecified,
        IgnoreRowsWithNoPlace,
        Updated,
        Emails: Emails
    };

    try {
        // Send updated data to the server and handle the response
        const apiEndpoint = isAddingNewTask ? 'add_task' : 'update_task';
        const response = await fetch(`http://localhost:5000/api/${apiEndpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedTaskData),
        });

        if (response.ok) {
            const result = await response.json();
            console.log(result.message);

            // Fetch updated data immediately after updating/adding the task
            const dataResponse = await fetch('http://localhost:5000/api/get_task');
            if (dataResponse.ok) {
                const data = await dataResponse.json();
                transformedData = transformData(data);
                // Display updated data in the table
                displayDataInTable(transformedData, currentPage);

                closeEditModal();
            } else {
                console.error('Error fetching data:', dataResponse.status);
            }
        } else {
            console.error(`Error ${isAddingNewTask ? 'adding' : 'updating'} task:`, response.status);
            const errorResponse = await response.json();
            console.error('Error details:', errorResponse);

            isAddingNewTask = false;
        }
    } catch (error) {
        console.error(`Error ${isAddingNewTask ? 'adding' : 'updating'} task:`, error);
    }
}


// ########################################################################################################################
// Event handler for open the "Edit" modal after clicking the button in the table rows
function tableEditButtonClicked(event) {
    isAddingNewTask = false;
    console.log('Edit button clicked');
    if (event.target && event.target.classList.contains('edit-button')) {
        // Extract the record data and populate the edit modal
        const rowIndex = event.target.closest('tr').rowIndex;
        const record = transformedData[rowIndex - 1]; // Adjust for header row
        shouldOpenModal = true; // Set this flag based on your condition

        // Open the modal only if the flag is true
        if (shouldOpenModal) {
            populateEditModal(record, false);
            const modalTitle = document.getElementById('modalTitle');
            const saveButton = document.getElementById('saveButton');
            modalTitle.textContent = 'Edit Task';
            saveButton.textContent = 'Save';
        }
    }
}

// ##########################################################################################################################
// Event handler for the "Delete" button in the table rows
function tableDeleteButtonClicked(event) {
    if (event.target && event.target.classList.contains('delete-button')) {
        const rowIndex = event.target.closest('tr').rowIndex;
        const record = transformedData[rowIndex - 1]; // Adjust for header row
        const taskId = record.task_id;
        const confirmDelete = confirm(`Are you sure you want to delete task id ${taskId}?`);
        
        if (confirmDelete) {
            deleteTask(taskId);
        }
    }
}

// Event listener for the delete button click event
const dataTable = document.getElementById('data-table');
dataTable.addEventListener('click', tableDeleteButtonClicked);

// Function to delete the task and related emails
async function deleteTask(taskId) {
    try {
        // Send request to delete task and related emails
        const response = await fetch(`http://localhost:5000/api/delete_task?TaskId=${taskId}`, {
            method: 'DELETE',
        });

        if (response.ok) {
            const result = await response.json();
            console.log(result.message);

            // Fetch updated data immediately after deleting the task
            const dataResponse = await fetch('http://localhost:5000/api/get_task');
            if (dataResponse.ok) {
                const data = await dataResponse.json();
                transformedData = transformData(data);

                // Display updated data in the table
                displayDataInTable(transformedData, currentPage);
            } else {
                console.error('Error fetching data:', dataResponse.status);
            }
        } else {
            console.error('Error deleting task:', response.status);
            const errorResponse = await response.json();
            console.error('Error details:', errorResponse);
        }
    } catch (error) {
        console.error('Error deleting task:', error);
    }
}

// #######################################################################################################################
// Event handler for the "Add New Task" button that will open the window with empty fields and different title and button
const addNewTaskButton = document.getElementById('addNewTaskButton');
addNewTaskButton.addEventListener('click', async function () {
    isAddingNewTask = true;

    // Reset the form fields to empty values
    document.getElementById('newTaskId').value = '';
    document.getElementById('newTaskName').value = '';
    document.getElementById('newTaskType').value = '';
    document.getElementById('NewActive').checked = true;
    document.getElementById('NewEmailList').value = '';
    document.getElementById('NewDescription').value = '';
    document.getElementById('NewDirPath').value = '';
    document.getElementById('NewPlaceId').value = '';
    document.getElementById('NewClearAllUsers').checked = false;
    document.getElementById('NewDirPathMonthly').value = '';
    document.getElementById('NewPlaceIdMonthly').value = '';
    document.getElementById('NewClearAllUsersMonthly').checked = false;
    document.getElementById('NewClearSpecified').checked = false;
    document.getElementById('NewIgnoreRowsWithNoPlace').checked = false;
    document.getElementById('NewUpdated').value = '';

   // Show the modal
   const editModal = document.getElementById('editModal');
   editModal.style.display = 'block';

   // Update modal title and button text
   const modalTitle = document.getElementById('modalTitle');
   const saveButton = document.getElementById('saveButton');
   modalTitle.textContent = 'Add New Task';
   saveButton.textContent = 'Add';

//    in order to let the option to edit the task id field in add new task
   populateEditModal({}, true);

})

// Event handler for the "Add" button in the edit modal
async function addTaskButtonClicked(event) {
    event.preventDefault();

    if (!isAddingNewTask) {
        saveButtonClicked(event); // Call the saveButtonClicked function for editing an existing task
        return;
    }

    // Check if TaskId already exists
    const newTaskId = document.getElementById('newTaskId').value;

    for (const task of transformedData) {
        if (task.task_id.toString() === newTaskId.toString()) {
            alert('Task with the same Task ID already exists.');
            return; // Return immediately if the task with the same ID exists
        }
    }

    // Set all the new data to variables
    const TaskId = document.getElementById('newTaskId').value;
    const TaskName = document.getElementById('newTaskName').value;
    const TaskType = document.getElementById('newTaskType').value;
    const Active = document.getElementById('NewActive').checked ? 0 : 1;
    const Description = document.getElementById('NewDescription').value;

    let DirPath;
    let PlaceId;
    let ClearAllUsers;

    if (TaskType === 'User Group') {
        DirPath = document.getElementById('NewDirPath').value;
        PlaceId = document.getElementById('NewPlaceId').value;
        ClearAllUsers = document.getElementById('NewClearAllUsers').checked ? 1 : 0;
    } else if (TaskType === 'Monthly') {
        DirPath = document.getElementById('NewDirPathMonthly').value;
        PlaceId = document.getElementById('NewPlaceIdMonthly').value;
        ClearAllUsers = document.getElementById('NewClearAllUsersMonthly').checked ? 1 : 0;
    }

    const ClearSpecified = document.getElementById('NewClearSpecified').checked ? 1 : 0;
    const IgnoreRowsWithNoPlace = document.getElementById('NewIgnoreRowsWithNoPlace').checked ? 1 : 0;
    const Updated = document.getElementById('NewUpdated').value;

    let Interval
    let DaysOfWeek
    let DaysOfMonth
    let TaskTime

    const TriggerType = document.getElementById('NewTrigger').value;

    if (TriggerType === "Minutely"){
        Interval = document.getElementById('minutelyInterval').value;
        TaskTime = document.getElementById('minutelyTaskTime').value;
        DaysOfWeek = '0'
        DaysOfMonth = '0'
    } else if (TriggerType === 'Hourly') {
        Interval = document.getElementById('hourlyInterval').value;
        TaskTime = document.getElementById('hourlyTaskTime').value;
        DaysOfWeek = '0'
        DaysOfMonth = '0'
    } else if (TriggerType === 'Daily') {
        Interval = document.getElementById('dailyInterval').value;
        TaskTime = document.getElementById('dailyTaskTime').value;
        DaysOfWeek = '0'
        DaysOfMonth = '0'
    } else if (TriggerType === 'Weekly') {
        Interval = '0'
        DaysOfWeek = document.getElementById('weeklyDay').value;
        TaskTime = document.getElementById('weeklyTaskTime').value;
        DaysOfMonth = '0'
    } else if (TriggerType === 'Monthly') {
        Interval = '0'
        DaysOfWeek = document.getElementById('monthlyDay').value;
        TaskTime = document.getElementById('monthlyTaskTime').value;
        DaysOfMonth = '0'
    } else if (TriggerType === 'Yearly') {
        Interval = document.getElementById('yearlyInterval').value;
        TaskTime = document.getElementById('yearlyTaskTime').value;
        DaysOfWeek = '0'
        DaysOfMonth = '0'
    }

    const NewEmailList = document.getElementById('NewEmailList').value;
    const Emails = NewEmailList.split(',').map(email => email.trim());

    // Validate email addresses
    // if (Emails.some(email => email === '')) {
    //     alert('Please provide valid email addresses.');
    //     return;
    // }

    let DataToAdd = {
        TaskId,
        TaskName,
        TaskType,
        Active,
        Description,
        DirPath,
        PlaceId,
        ClearAllUsers,
        ClearSpecified,
        IgnoreRowsWithNoPlace,
        Updated,
        TriggerType,
        Interval,
        DaysOfWeek,
        DaysOfMonth,
        TaskTime,
        Emails: Emails
    };

    try {
        // Send updated data to the server and handle the response
        const response = await fetch('http://localhost:5000/api/add_task', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(DataToAdd),
        });

        if (response.ok) {
            const result = await response.json();
            console.log(result.message);

            const dataResponse = await fetch('http://localhost:5000/api/get_task');
            if (dataResponse.ok) {
                const data = await dataResponse.json();
                transformedData = transformData(data);
                // Display updated data in the table
                displayDataInTable(transformedData, currentPage);
            } else {
                console.error('Error fetching data:', dataResponse.status);
            }
            closeEditModal();
        } else {
            console.error('Error adding task:', response.status);
            const errorResponse = await response.json();
            console.error('Error details:', errorResponse);
        }
    } catch (error) {
        console.error('Error adding task:', error);
    }
    isAddingNewTask = false;
}


// Add event listener for the "Add" button
saveButton.addEventListener('click', addTaskButtonClicked);


// ###########################################################################################################
// Event handler for the "Close" button in the edit modal
function closeEditModal() {
    // Close the edit modal, e.g., by hiding it
    const editModal = document.getElementById('editModal');
    editModal.style.display = 'none';
}

// ###########################################################################################################
// Event handler for the "Next Page" button
function nextPageButtonClicked() {
    if (currentPage < Math.ceil(transformedData.length / recordsPerPage)) {
        currentPage++;
        displayDataInTable(transformedData, currentPage);
    }
}

// ###########################################################################################################
// Event handler for the "Previous Page" button
function prevPageButtonClicked() {
    if (currentPage > 1) {
        currentPage--;
        displayDataInTable(transformedData, currentPage);
    }
}

// #########################################################################################################
// Add an event listener to the search box
const taskNameSearchInput = document.getElementById('taskNameSearch');
taskNameSearchInput.addEventListener('input', performSearch);

// Search function to filter tasks based on task name
function performSearch() {
    const searchTerm = taskNameSearchInput.value.toLowerCase();
    const filteredTasks = transformedData.filter(task => task.task_name.toLowerCase().includes(searchTerm));
    displayDataInTable(filteredTasks, currentPage);
}
