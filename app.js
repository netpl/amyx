// Elements
const teacherList = document.getElementById("teacherListItems");
const teacherDetails = document.getElementById("teacherDetails");
const teacherName = document.getElementById("teacherName");
const voteCount = document.getElementById("voteCount");
const buyButton = document.getElementById("buyButton");
const sellButton = document.getElementById("sellButton");
const backButton = document.getElementById("backButton");
const votingChartContainer = document.getElementById("votingChartContainer");
const votingChartCanvas = document.getElementById("votingChart");

const API_URL = 'https://amyx-56096bb96796.herokuapp.com'; // Replace with your Heroku app URL

let currentTeacherId = null;

// Fetch teachers from backend
async function fetchTeachers() {
    const response = await fetch('https://amyx-56096bb96796.herokuapp.com/api/teachers');
    const teachers = await response.json();
    populateTeacherList(teachers);
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
function showTeacherDetails(teacher) {
    currentTeacherId = teacher._id;
    teacherDetails.style.display = 'block';
    teacherList.parentNode.style.display = 'none';
    teacherName.innerText = teacher.name;
    voteCount.innerText = teacher.votes;

    buyButton.onclick = () => updateVotes('buy');
    sellButton.onclick = () => updateVotes('sell');
    backButton.onclick = () => {
        teacherDetails.style.display = 'none';
        teacherList.parentNode.style.display = 'block';
        fetchTeachers();
    };

    // Fetch historical vote data
    const votingData = await fetchVoteHistory(teacher._id);

    // Show the chart container
    document.getElementById("chartContainer").style.display = "block";

    // Initialize or update the candlestick chart
    let options = {
        series: [{
            data: votingData
        }],
        chart: {
            type: 'candlestick',
            height: 350
        },
        title: {
            text: 'Voting Trends',
            align: 'left'
        },
        xaxis: {
            type: 'datetime'
        },
        yaxis: {
            tooltip: {
                enabled: true
            }
        }
    };

    let chart = new ApexCharts(document.querySelector("#candlestickChart"), options);
    chart.render();
}

// Update votes
async function updateVotes(action) {
    const response = await fetch(`https://amyx-56096bb96796.herokuapp.com/api/teachers/${currentTeacherId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ vote: action })
    });

    const updatedTeacher = await response.json();
    voteCount.innerText = updatedTeacher.votes;
}

// Fetch Vote History
async function fetchVoteHistory(teacherId) {
    const response = await fetch(`${API_URL}/api/teachers/${teacherId}/history`);
    const historyData = await response.json();

    return historyData.map(entry => ({
        x: new Date(entry.date),
        y: [entry.open, entry.high, entry.low, entry.close]
    }));
}

const chartContainer = document.createElement('canvas');
teacherDetails.appendChild(chartContainer);

// Fetch teachers from backend
async function fetchTeachers() {
    const response = await fetch(`${API_URL}/api/teachers`);
    const teachers = await response.json();
    populateTeacherList(teachers);
}

// Show teacher details and voting options
function showTeacherDetails(teacher) {
    currentTeacherId = teacher._id;
    teacherDetails.style.display = 'block';
    teacherList.parentNode.style.display = 'none';
    teacherName.innerText = teacher.name;
    voteCount.innerText = teacher.votes;

    fetchVoteHistory(teacher._id);

    buyButton.onclick = () => updateVotes('buy');
    sellButton.onclick = () => updateVotes('sell');
    backButton.onclick = () => {
        teacherDetails.style.display = 'none';
        teacherList.parentNode.style.display = 'block';
        fetchTeachers();
    };
}

// Fetch vote history for the chart
async function fetchVoteHistory(teacherId) {
    const response = await fetch(`${API_URL}/api/teachers/${teacherId}`);
    const teacher = await response.json();
    renderCandlestickChart(teacher.voteHistory);
}

// AdD TEACHERS
const addTeacherButton = document.getElementById('addTeacherButton');
const teacherNameInput = document.getElementById('teacherNameInput');

// Event listener for adding a new teacher
addTeacherButton.addEventListener('click', async () => {
    const teacherName = teacherNameInput.value.trim();
    
    if (teacherName === '') {
        alert('Please enter a teacher name.');
        return;
    }

    try {
        // Send POST request to add the new teacher
        const response = await fetch(`${API_URL}/api/teachers`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name: teacherName })
        });

        if (response.ok) {
            alert('Teacher added successfully!');
            teacherNameInput.value = ''; // Clear the input field
            fetchTeachers(); // Refresh the teacher list
        } else {
            alert('Failed to add teacher.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error adding teacher. Check console for details.');
    }
});

// Render candlestick chart using Chart.js
function renderCandlestickChart(voteHistory) {
    const ctx = chartContainer.getContext('2d');

    const data = voteHistory.map(record => ({
        t: new Date(record.date),
        o: record.open,
        h: record.high,
        l: record.low,
        c: record.close
    }));

    new Chart(ctx, {
        type: 'candlestick',
        data: {
            datasets: [{
                label: 'Vote History',
                data: data
            }]
        },
        options: {
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day'
                    }
                }
            }
        }
    });
}

// Initialize app
fetchTeachers();