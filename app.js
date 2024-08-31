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
    document.getElementById('toggleChartSwitch').onchange = toggleChartType;

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

    if (votesChart) {
        votesChart.data.labels = timestamps;
        votesChart.data.datasets[0].data = votes;
        votesChart.update();
    } else {
        votesChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: timestamps,
                datasets: [{
                    label: `Votes for ${teacherName}`,
                    data: votes,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
}

function toggleChartType() {
    const isChecked = document.getElementById('toggleChartSwitch').checked;
    if (isChecked) {
        currentChartType = 'candlestick';
        document.getElementById('toggleChartLabel').innerText = 'Candlestick Chart';
    } else {
        currentChartType = 'line';
        document.getElementById('toggleChartLabel').innerText = 'Line Chart';
    }
    updateChart(teacherName.innerText, getCurrentVoteHistory());
}

// Initialize app
fetchTeachers();

// Add Teachers
const addTeacherButton = document.getElementById('addTeacherButton');
const teacherNameInput = document.getElementById('teacherNameInput');

addTeacherButton.addEventListener('click', async () => {
    const teacherName = teacherNameInput.value.trim();
    console.log('Teacher Name:', teacherName); // Check the input value

    if (teacherName === '') {
        alert('Please enter a teacher name.');
        return;
    }

    try {
        console.log('Sending POST request...');
        const response = await fetch(`${API_URL}/api/teachers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: teacherName })
        });
        console.log('Response:', response);

        if (response.ok) {
            const newTeacher = await response.json();
            console.log('New Teacher:', newTeacher);
            alert(`Teacher "${newTeacher.name}" added successfully!`);
            teacherNameInput.value = ''; // Clear the input field
            fetchTeachers(); // Refresh the teacher list
        } else {
            const errorData = await response.json();
            alert(`Failed to add teacher: ${errorData.message}`);
        }
    } catch (error) {
        console.error('Error adding teacher:', error);
        alert('An error occurred while adding the teacher.');
    }
});