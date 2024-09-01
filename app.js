// Elements
const teacherList = document.getElementById("teacherListItems");
const teacherDetails = document.getElementById("teacherDetails");
const teacherName = document.getElementById("teacherName");
const voteCount = document.getElementById("voteCount");
const buyButton = document.getElementById("buyButton");
const sellButton = document.getElementById("sellButton");
const backButton = document.getElementById("backButton");

const API_URL = 'https://amyx-56096bb96796.herokuapp.com'; // Replace with your Heroku app URL

let currentTeacherId = null;
let votesChart = null;  // Declare the chart variable

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
    teacherList.innerHTML = '';
    teachers.forEach(teacher => {
        let li = document.createElement('li');
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
        const detailedTeacher = await response.json();
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

        const updatedTeacher = await response.json();
        voteCount.innerText = updatedTeacher.votes;
        updateChart(updatedTeacher.name, updatedTeacher.voteHistory);
    } catch (error) {
        console.error('Error updating votes:', error);
    }
}


// Function to update the chart
function updateChart(teacherName, voteHistory) {
    const ctx = document.getElementById('votesChart').getContext('2d');

    const timestamps = voteHistory.map(entry => new Date(entry.timestamp).toLocaleTimeString());
    const votes = voteHistory.map(entry => entry.votes);

    // Define data for line and candlestick charts
    const lineChartData = {
        labels: timestamps,
        datasets: [{
            label: `Votes for ${teacherName}`,  // Update the label with the current teacher's name
            data: votes,
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
            fill: false
        }]
    };

    const candlestickData = voteHistory.map(entry => ({
        x: new Date(entry.timestamp),
        o: entry.votes,
        h: entry.votes + 2, // Placeholder for high
        l: entry.votes - 2, // Placeholder for low
        c: entry.votes
    }));

    const candlestickChartData = {
        datasets: [{
            label: `Votes for ${teacherName}`,  // Update the label with the current teacher's name
            data: candlestickData,
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            borderColor: 'rgba(75, 192, 192, 1)',
            borderWidth: 1,
        }]
    };

    if (votesChart) {
        votesChart.destroy(); // Destroy the existing chart before creating a new one
    }

    if (currentChartType === 'line') {
        votesChart = new Chart(ctx, {
            type: 'line',
            data: lineChartData,
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
    } else if (currentChartType === 'candlestick') {
        votesChart = new Chart(ctx, {
            type: 'candlestick',
            data: candlestickChartData,
            options: {
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'minute'
                        }
                    },
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
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
