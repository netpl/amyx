const API_URL = 'https://amyx-56096bb96796.herokuapp.com'; // Replace with your Heroku app URL

const teacherList = document.getElementById("teacherListItems");
const teacherDetails = document.getElementById("teacherDetails");
const teacherName = document.getElementById("teacherName");
const voteCount = document.getElementById("voteCount");
const buyButton = document.getElementById("buyButton");
const sellButton = document.getElementById("sellButton");
const backButton = document.getElementById("backButton");
const votingChartContainer = document.getElementById("votingChartContainer");
const votingChartCanvas = document.getElementById("votingChart");

let currentTeacherId = null;
let votingData = [];  // To store the voting data for chart

// Fetch teachers from backend
async function fetchTeachers() {
    const response = await fetch(`${API_URL}/api/teachers`);
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
    votingChartContainer.style.display = 'block';
    teacherList.parentNode.style.display = 'none';
    teacherName.innerText = teacher.name;
    voteCount.innerText = teacher.votes;

    buyButton.onclick = () => updateVotes('buy');
    sellButton.onclick = () => updateVotes('sell');
    backButton.onclick = () => {
        teacherDetails.style.display = 'none';
        votingChartContainer.style.display = 'none';
        teacherList.parentNode.style.display = 'block';
        fetchTeachers();
    };

    // Fetch and render chart data
    fetchVotingData();
}

// Update votes
async function updateVotes(action) {
    const response = await fetch(`${API_URL}/api/teachers/${currentTeacherId}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ vote: action })
    });

    const updatedTeacher = await response.json();
    voteCount.innerText = updatedTeacher.votes;

    // Update chart data
    fetchVotingData();
}

// Fetch voting data (example data structure; should be adjusted based on actual implementation)
async function fetchVotingData() {
    const response = await fetch(`${API_URL}/api/teachers/${currentTeacherId}/voting-data`);
    votingData = await response.json(); // Adjust this according to your backend API
    renderVotingChart(votingData);
}

// Render candlestick chart using Chart.js
function renderVotingChart(data) {
    const ctx = votingChartCanvas.getContext('2d');

    // Format the data for the candlestick chart
    const formattedData = data.map(item => {
        return {
            x: new Date(item.time),  // Assuming 'time' is a timestamp
            o: item.open,  // The vote count at the start of the period
            h: item.high,  // The highest vote count during the period
            l: item.low,   // The lowest vote count during the period
            c: item.close  // The vote count at the end of the period
        };
    });

    new Chart(ctx, {
        type: 'candlestick',
        data: {
            datasets: [{
                label: 'Voting Data',
                data: formattedData,
            }]
        },
        options: {
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'minute'
                    }
                }
            }
        }
    });
}

// Initialize app
fetchTeachers();