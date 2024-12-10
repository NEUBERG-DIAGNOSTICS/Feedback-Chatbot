let chatBox = document.getElementById('chat-box');
let feedbackContainer = document.getElementById('feedback-container');
let feedbackStep = 0;
let selectedOptions = [];
let lockFeedback = false;
let UserFeedback = {}; 

function botMessage(message) {
    let botMessageDiv = document.createElement('div');
    botMessageDiv.classList.add('bot-message');
    botMessageDiv.innerHTML = `<div class="message">${message}</div>`;
    chatBox.appendChild(botMessageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function userMessage(message) {
    let userMessageDiv = document.createElement('div');
    userMessageDiv.classList.add('user-message');
    userMessageDiv.innerHTML = `<div class="message">${message}</div>`;
    chatBox.appendChild(userMessageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function startChat() {
    botMessage("Hello! Welcome to Neuberg Diagnostics. How was your recent experience with us?");
    feedbackStep = 1;
    showFeedbackButtons();
}

function showFeedbackButtons() {
    feedbackContainer.innerHTML = `
        <button id="feedback-btn1" class="feedback-button good-button" onclick="handleFeedback('😊', 'Good' )">😊 Good</button>
        <button id="feedback-btn2" class="feedback-button neutral-button" onclick="handleFeedback('😐','Neutral')">😐 Neutral</button>
        <button id="feedback-btn3" class="feedback-button bad-button" onclick="handleFeedback('😞, 'Bad')">😞 Bad</button>
    `;
    feedbackContainer.style.opacity = '1';
    feedbackContainer.style.transform = 'translateY(0)';
}

function handleFeedback(rating, description) {
    if (lockFeedback) return;
    UserFeedback.Feedback = description;
    UserFeedback.FeedbackDataFrom = 'from_centre_collection';
    userMessage(rating);
    feedbackContainer.style.opacity = '0';
    feedbackContainer.style.transform = 'translateY(-20px)';

    if (rating === '😊') {
        botMessage("We are happy to delight you with our services, please tell us what you liked the most..");
    } else if (rating === '😐') {
        botMessage("Thank you for your feedback, please let us know what could have been better?");
    } else if (rating === '😞') {
        botMessage("We regret that you had a poor experience. What went wrong?");
    }

    setTimeout(() => {
        showOptionButtons();
    }, 500);
}

function showOptionButtons() {
    let buttons = ['Overall Ambiance & Hygiene of the centre', ' Waiting Time & Registration Process', ' Knowledge & Groom of our Sample Collection Expert', 'Sample Collection Experience', 'Other'];
    feedbackContainer.innerHTML = '';
    buttons.forEach(option => {
        let button = document.createElement('button');
        button.classList.add('feedback-button', 'purple-button');
        button.innerText = option;
        button.onclick = () => toggleOptionSelection(button, option);
        feedbackContainer.appendChild(button);
    });

    let submitButton = document.createElement('button');
    submitButton.id = 'submit-feedback-btn';
    submitButton.innerText = 'Submit';
    submitButton.onclick = submitSelectedFeedback;
    submitButton.disabled = true;
    submitButton.classList.add('feedback-button', 'good-button');
    feedbackContainer.appendChild(submitButton);

    feedbackContainer.style.opacity = '1';
    feedbackContainer.style.transform = 'translateY(0)';
}

function toggleOptionSelection(button, option) {
    if (selectedOptions.includes(option)) {
        selectedOptions = selectedOptions.filter(item => item !== option);
        button.classList.remove('selected');
    } else {
        selectedOptions.push(option);
        button.classList.add('selected');
    }
    UserFeedback.selectedoptions = selectedOptions.toString();
    const submitButton = document.getElementById('submit-feedback-btn');
    submitButton.disabled = selectedOptions.length === 0;

    if (option === 'Other') {
        const textbox = document.getElementById('other-feedback-container');
        textbox.style.display = textbox.style.display === 'none' ? 'block' : 'none';
        button.style.backgroundColor = textbox.style.display === 'block' ? '#FFBF00' : '#6A0DAD';
    } else {
        document.getElementById('other-feedback-container').style.display = 'none';
    }
}

function submitOtherFeedback() {
    const feedback = document.getElementById('other-feedback-textbox').value;
    if (feedback.trim()) {
        UserFeedback.additionalfeedback = feedback.trim();
        feedDataToSQL(UserFeedback);
        userMessage(feedback);
        botMessage("Thank you for your feedback! Is there anything else you would like to add?");

        document.getElementById('other-feedback-container').style.display = 'none';
        document.getElementById('other-feedback-textbox').value = '';

        setTimeout(() => {
            document.getElementById('thank-you-modal').style.display = 'block';
            document.getElementById('lock-overlay').style.display = 'block';
            lockFeedback = true;
            setTimeout(() => {
                document.getElementById('thank-you-modal').style.display = 'none';
                document.getElementById('lock-overlay').style.display = 'none';
                lockFeedback = false;
            }, 600000);
        }, 1500);
    } else {
        botMessage("Please provide feedback before submitting.");
    }
}

function submitSelectedFeedback() {
    
    if (selectedOptions.length === 0) return;
    feedDataToSQL(UserFeedback)

    userMessage(selectedOptions.join(', '));
    botMessage("Thank you for your feedback! Is there anything else you would like to add?");

    document.getElementById('thank-you-modal').style.display = 'block';
    document.getElementById('lock-overlay').style.display = 'block';
    lockFeedback = true;

    setTimeout(() => {
        document.getElementById('thank-you-modal').style.display = 'none';
        document.getElementById('lock-overlay').style.display = 'none';
        lockFeedback = false;
    }, 600000);
}

document.getElementById('back-button').addEventListener('click', () => {
    document.getElementById('other-feedback-container').style.display = 'none';
});

startChat();

function feedDataToSQL(UserFeedback){
    
    fetch('http://localhost:3000/form', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(UserFeedback)
    })
        .then(response => response.json())
        .then(data => {
            // Handle success (response from server)
            document.getElementById('responseMessage').innerText = 'Feedback submitted successfully!';
            console.log(data);
        })
        .catch(error => {
            // Handle error
            document.getElementById('responseMessage').innerText = 'Error submitting feedback.';
            console.error('Error:', error);
        });
}