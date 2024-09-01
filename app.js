// Elements
const teacherList = document.getElementById("teacherListItems");
const teacherDetails = document.getElementById("teacherDetails");
const teacherName = document.getElementById("teacherName");
const voteCount = document.getElementById("voteCount");
const buyButton = document.getElementById("buyButton");
const sellButton = document.getElementById("sellButton");
const backButton = document.getElementById("backButton");

const compareAllButton = document.getElementById("compareAllButton");

const API_URL = 'https://amyx-56096bb96796.herokuapp.com'; // Replace with your Heroku app URL

let currentTeacherId = null;
let votesChart = null;  // Declare the chart variable

let detailedTeacher = null;

// Fetch teachers from backend
async function fetchTeachers() {
    try {
        const response = await fetch(`${API_URL}/api/teachers`);
        const teachers = await response.json();
        populateTeacherList(teachers);
    } catch (error) {
        console.error('Error fetching teachers:', error);
    }
}


// Populate teacher list
function populateTeacherList(teachers) {
    teacherList.innerHTML = ''; // Clear the list

    // Add the "Compare All" option first
    const compareAllLi = document.createElement('li');
    compareAllLi.innerText = 'Compare All';
    compareAllLi.id = 'compareAllButton'; // Set an ID to ensure it's unique
    compareAllLi.onclick = () => compareAllTeachers(teachers); // Add click event
    teacherList.appendChild(compareAllLi);

    // Populate the rest of the teacher list
    teachers.forEach(teacher => {
        const li = document.createElement('li');
        li.innerText = teacher.name;
        li.addEventListener('click', () => showTeacherDetails(teacher));
        teacherList.appendChild(li);
    });
}

// Show teacher details and voting options
async function showTeacherDetails(teacher) {
    currentTeacherId = teacher._id;
    teacherDetails.style.display = 'block';
    teacherList.parentNode.style.display = 'none';
    teacherName.innerText = teacher.name;
    voteCount.innerText = teacher.votes;

    try {
        const response = await fetch(`${API_URL}/api/teachers/${teacher._id}`);
        detailedTeacher = await response.json();
        updateChart(detailedTeacher.name, detailedTeacher.voteHistory);
    } catch (error) {
        console.error('Error fetching teacher details:', error);
    }

    buyButton.onclick = () => updateVotes('buy');
    sellButton.onclick = () => updateVotes('sell');
    backButton.onclick = () => {
        teacherDetails.style.display = 'none';
        teacherList.parentNode.style.display = 'block';
        fetchTeachers();
    };
}

// Update votes
async function updateVotes(action) {
    try {
        const response = await fetch(`${API_URL}/api/teachers/${currentTeacherId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ vote: action })
        });

        detailedTeacher = await response.json();
        voteCount.innerText = detailedTeacher.votes;
        updateChart(detailedTeacher.name, detailedTeacher.voteHistory);
    } catch (error) {
        console.error('Error updating votes:', error);
    }
}


// Function to update the chart
function updateChart(teacherName, voteHistory) {
    const ctx = document.getElementById('votesChart').getContext('2d');

    const timestamps = voteHistory.map(entry => new Date(entry.timestamp).toLocaleTimeString());
    const votes = voteHistory.map(entry => entry.votes);

    if (votesChart) {
        votesChart.destroy();  // Destroy any existing chart instance
    }

    votesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timestamps,
            datasets: [{
                label: `Votes for ${teacherName}`,  // Set the legend label correctly
                data: votes,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
                fill: false,
                tension: 0.4,  // Add tension to create smooth curves
                pointRadius: 0  // Remove the dots/points from the line
            }]
        },
        options: {
            scales: {
                x: {
                    type: 'category'
                },
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Compare all
function compareAllTeachers(teachers) {
    const ctx = document.getElementById('votesChart').getContext('2d');

    if (votesChart) {
        votesChart.destroy();  // Destroy any existing chart instance
    }

    const datasets = teachers.map(teacher => {
        const timestamps = teacher.voteHistory.map(entry => new Date(entry.timestamp).toLocaleTimeString());
        const votes = teacher.voteHistory.map(entry => entry.votes);

        return {
            label: teacher.name,
            data: votes,
            backgroundColor: getRandomColor(),
            borderColor: getRandomColor(),
            borderWidth: 1,
            fill: false,
            tension: 0.4,
            pointRadius: 0
        };
    });

    votesChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: teachers[0].voteHistory.map(entry => new Date(entry.timestamp).toLocaleTimeString()),
            datasets: datasets
        },
        options: {
            scales: {
                x: {
                    type: 'category'
                },
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Utility function to get a random color
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}



// Handle creating a new teacher
async function createTeacher() {
    const teacherName = document.getElementById('newTeacherName').value.trim();
    const errorMessage = document.getElementById('errorMessage');

    if (!teacherName) {
        errorMessage.innerText = 'Please enter a teacher name';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/teachers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: teacherName })
        });

        if (response.status === 400) {
            const errorData = await response.json();
            errorMessage.innerText = errorData.message;
            return;
        }

        const newTeacher = await response.json();
        errorMessage.innerText = ''; // Clear any previous error messages
        fetchTeachers(); // Refresh the teacher list
    } catch (error) {
        console.error('Error creating teacher:', error);
        errorMessage.innerText = 'An error occurred while creating the teacher';
    }
}

// Initialize app
fetchTeachers();


// Attach the createTeacher function to the create teacher button
document.getElementById('createTeacherButton').onclick = createTeacher;
