console.log('VICCI Content Script: Initializing...');

let isVicciActive = false;
let isRecognitionActive = false;
let isSpeaking = false;
let recognition;

function activateVicci() {
  console.log('VICCI Content Script: Activating VICCI');
  isVicciActive = true;
  requestMicrophoneAccess();  // Ensure microphone access is requested when VICCI is activated
  speakFeedback(window.VICCI.config.initialMessage);
}

function deactivateVicci() {
  console.log('VICCI Content Script: Deactivating VICCI');
  isVicciActive = false;
  speakFeedback("VICCI deactivated.");
  stopRecognition();  // Ensure recognition is stopped when VICCI is deactivated
}

function speakFeedback(text) {
  console.log('VICCI Content Script: Speaking feedback:', text);
  isSpeaking = true;
  if (recognition && isRecognitionActive) {
    recognition.stop();  // Stop recognition before speaking
  }

  chrome.runtime.sendMessage({ action: "speak", text: text }, (response) => {
    console.log('VICCI Content Script: TTS response:', response);
    isSpeaking = false;
    if (isVicciActive && !isRecognitionActive) {
      setTimeout(() => {
        console.log('VICCI Content Script: Restarting voice recognition after TTS.');
        recognition.start();  // Restart recognition after speaking
      }, 1500);  // Adding a delay to avoid immediate loop and allow TTS feedback to finish
    }
  });
}

document.addEventListener('keydown', (event) => {
  console.log('VICCI Content Script: Keydown event:', event.key);

  if (event.altKey && event.shiftKey && event.key === 'V') {
    console.log('VICCI Content Script: Activation shortcut detected');
    if (isVicciActive) {
      deactivateVicci();
    } else {
      activateVicci();
    }
  } else if (event.altKey && event.shiftKey && event.key === 'M') {
    console.log('VICCI Content Script: Microphone activation shortcut detected');
    requestMicrophoneAccess();
  }

  if (isVicciActive) {
    console.log('VICCI Content Script: VICCI is active, checking for commands');
    switch(event.key.toLowerCase()) {
      case 'h':
        console.log('VICCI Content Script: Help command detected');
        window.VICCI.actions.help();
        break;
      case 'p':
        console.log('VICCI Content Script: Describe page command detected');
        describePage();
        break;
      // Add more command handlers here
    }
  } else {
    console.log('VICCI Content Script: VICCI is not active');
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('VICCI Content Script: Received message:', request);

  if (request.action === "activateVicci") {
    activateVicci();
    sendResponse({ status: "activateVicci executed" });
  } else if (request.action === "describePage") {
    console.log('VICCI Content Script: describePage action received');
    describePage();
    sendResponse({ status: "describePage executed" });
  } else if (request.action === "activateMicrophone") {
    console.log('VICCI Content Script: activateMicrophone action received');
    requestMicrophoneAccess();
    sendResponse({ status: "activateMicrophone executed" });
  } else if (request.action === "getExposedFunctions") {
    console.log('Content Script: Received request for exposed functions.');
    const functions = Object.keys(window.VICCI.actions).filter(key => typeof window.VICCI.actions[key] === 'function');
    sendResponse({ functions });
  }
});

function requestMicrophoneAccess() {
  console.log('VICCI Content Script: Requesting microphone access');
  speakFeedback("Please allow microphone access to enable voice commands.");

  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      console.log('VICCI Content Script: Microphone access granted');
      speakFeedback("Microphone access granted. You can now use voice commands.");
      initializeMicrophone();
    })
    .catch(error => {
      console.error('VICCI Content Script: Microphone access denied:', error);
      speakFeedback("Microphone access denied. Please enable it in your browser settings.");
    });
}

function initializeMicrophone() {
  console.log('VICCI Content Script: Initializing microphone');
  if (!('webkitSpeechRecognition' in window)) {
    console.log("VICCI Content Script: Speech recognition not supported");
    speakFeedback("Speech recognition is not supported in your browser.");
    return;
  }

  recognition = new webkitSpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.lang = 'en-US';

  recognition.onstart = () => {
    isRecognitionActive = true;
    console.log('VICCI Content Script: Voice recognition started.');
    if (!isSpeaking) {
      speakFeedback("Voice recognition started. You can now give voice commands.");
    }
  };

  recognition.onresult = (event) => {
    const transcript = event.results[event.resultIndex][0].transcript.trim();
    console.log('VICCI Content Script: Voice command received:', transcript);
    if (!isSpeaking) {
      speakFeedback(`Voice command received: ${transcript}`);
    }
    handleVoiceCommand(transcript);
  };

  recognition.onerror = (event) => {
    console.log('VICCI Content Script: Voice recognition error:', event.error);
    if (!isSpeaking) {
      speakFeedback(`Voice recognition error: ${event.error}`);
    }
  };

  recognition.onend = () => {
    if (isVicciActive) {
      setTimeout(() => {
        console.log('VICCI Content Script: Voice recognition ended, restarting after delay.');
        recognition.start();  // Restart recognition if it's still active after a delay
      }, 30000);  // Adding a delay of 30 seconds before restarting
    } else {
      isRecognitionActive = false;
      console.log('VICCI Content Script: Voice recognition ended.');
    }
  };

  recognition.start();
}

function stopRecognition() {
  if (recognition) {
    recognition.stop();
    isRecognitionActive = false;
    console.log('VICCI Content Script: Stopping voice recognition.');
  }
}

function handleVoiceCommand(command) {
  console.log('VICCI Content Script: Handling voice command:', command);
  // Handle voice commands to control chat and other actions
  if (command.toLowerCase().includes('start chat')) {
    window.VICCI.actions.startChat();
  } else if (command.toLowerCase().includes('pause chat')) {
    window.VICCI.actions.pauseChat();
  } else if (command.toLowerCase().includes('resume chat')) {
    window.VICCI.actions.resumeChat();
  } else if (command.toLowerCase().includes('stop chat')) {
    window.VICCI.actions.stopChat();
  } else if (command.toLowerCase().includes('describe page')) {
    window.VICCI.actions.describePage();
  }
    else if (command.toLowerCase().includes('click element')) {
    window.VICCI.actions.click_element();
  }
    else if (command.toLowerCase().includes('describe element')){
    window.VICCI.actions.describe_element();
  }
    else if (command.toLowerCase().includes('navigate to google.com')){
    window.VICCI.actions.navigate();
  }
    else if (command.toLowerCase().includes('scroll in a specified direction')){
    window.VICCI.actions.scroll_page();
  } 

  
  

function describePage() {
  console.log('VICCI Content Script: Describing page');
  // Insert your describe page logic here, e.g., analyzing the DOM and generating a description
  speakFeedback("This is the description of the current page.");
}

console.log('VICCI Content Script: Initialization complete');
