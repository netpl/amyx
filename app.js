// Elements
const teacherList = document.getElementById("teacherListItems");
const teacherDetails = document.getElementById("teacherDetails");
const compareAllDetails = document.getElementById("compareAllDetails");
const teacherName = document.getElementById("teacherName");
const voteCount = document.getElementById("voteCount");
const buyButton = document.getElementById("buyButton");
const sellButton = document.getElementById("sellButton");
const backButton = document.getElementById("backButton");
const backButtonCompareAll = document.getElementById("backButtonCompareAll");

const API_URL = 'https://amyx-56096bb96796.herokuapp.com'; // Replace with your Heroku app URL

let currentTeacherId = null;
let votesChart = null;
let compareAllChart = null;


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
    compareAllLi.innerText = '비교분석';
    compareAllLi.id = 'compareAllButton';
    compareAllLi.onclick = () => compareAllTeachers(teachers);
    teacherList.appendChild(compareAllLi);

    // Populate the rest of the teacher list
    teachers.forEach(teacher => {
        const li = document.createElement('li');
        li.innerText = teacher.name;
        li.addEventListener('click', () => showTeacherDetails(teacher));
        teacherList.appendChild(li);
    });
}

async function showTeacherDetails(teacher) {
    currentTeacherId = teacher._id;
    teacherDetails.style.display = 'block';
    teacherList.parentNode.style.display = 'none';
    compareAllDetails.style.display = 'none';
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

        const detailedTeacher = await response.json();
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
                label: `Votes for ${teacherName}`,
                data: votes,
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
                fill: false,
                tension: 0.4,
                pointRadius: 0
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


// Function to compare all teachers
function compareAllTeachers(teachers) {
    console.log('Compare All clicked');

    if (teachers.length === 0) {
        console.log('No teachers to compare');
        return;
    }

    teacherDetails.style.display = 'none';  // Hide individual teacher details
    teacherList.parentNode.style.display = 'none';  // Hide the teacher list
    compareAllDetails.style.display = 'block';  // Show the compare all section

    const ctx = document.getElementById('compareAllChart').getContext('2d');

    if (compareAllChart) {
        compareAllChart.destroy();  // Destroy any existing chart instance
    }

    // Calculate the cutoff date for 12 months ago
    const currentDate = new Date();
    const cutoffDate = new Date();
    cutoffDate.setFullYear(currentDate.getFullYear() - 1);  // Subtract 1 year

    // Step 1: Collect all unique timestamps within the last 12 months across all teachers
    let allTimestamps = new Set();
    teachers.forEach(teacher => {
        teacher.voteHistory.forEach(entry => {
            const entryDate = new Date(entry.timestamp);
            if (entryDate >= cutoffDate) {
                allTimestamps.add(entryDate.toLocaleTimeString());
            }
        });
    });

    // Convert the set to an array and sort it in ascending order (oldest to newest)
    allTimestamps = Array.from(allTimestamps).sort((a, b) => new Date(a) - new Date(b));

    // Step 2: Prepare datasets for each teacher, ensuring alignment with all timestamps
    const datasets = teachers.map(teacher => {
        let lastKnownValue = null;
        const data = allTimestamps.map(timestamp => {
            const entry = teacher.voteHistory.find(e => new Date(e.timestamp).toLocaleTimeString() === timestamp);
            if (entry && new Date(entry.timestamp) >= cutoffDate) {
                lastKnownValue = entry.votes;  // Update the last known value
                return entry.votes;
            } else {
                return lastKnownValue;  // Fill with the last known value
            }
        });

        return {
            label: teacher.name,
            data: data,
            backgroundColor: getRandomColor(),
            borderColor: getRandomColor(),
            borderWidth: 1,
            fill: false,
            tension: 0.4,
            pointRadius: 0
        };
    });

    // Step 3: Create the chart with aligned data
    compareAllChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: allTimestamps,  // Use the full set of sorted timestamps
            datasets: datasets
        },
        options: {
            scales: {
                x: {
                    type: 'category',
                    title: {
                        display: true,
                        text: 'Time'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Votes'
                    }
                }
            }
        }
    });

    // Back button logic for "Compare All" view
    backButtonCompareAll.onclick = () => {
        compareAllDetails.style.display = 'none';   // Hide the compare all section
        teacherList.parentNode.style.display = 'block';  // Show the teacher list
    };
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
