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

// Fetch voting data
async function fetchVotingData() {
    const response = await fetch(`${API_URL}/api/teachers/${currentTeacherId}/voting-data`);
    if (response.ok) {
        const votingData = await response.json();
        renderVotingChart(votingData);
    } else {
        console.error('Failed to fetch voting data');
    }
}

router.patch('/:id', async (req, res) => {
    try {
        const teacher = await Teacher.findById(req.params.id);
        if (!teacher) return res.status(404).json({ message: 'Teacher not found' });

        const voteValue = req.body.vote === 'buy' ? 1 : -1;

        // Update the teacher's vote count
        teacher.votes += voteValue;
        const updatedTeacher = await teacher.save();

        // Record the vote in the Votes collection
        const newVote = new Votes({
            teacherId: req.params.id,
            votes: voteValue
        });
        await newVote.save();

        res.json(updatedTeacher);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Render candlestick chart using Chart.js
function renderVotingChart(data) {
    const ctx = votingChartCanvas.getContext('2d');

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


const addTeacherButton = document.getElementById('addTeacherButton');
const teacherNameInput = document.getElementById('teacherNameInput');

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

// Initialize app
fetchTeachers();