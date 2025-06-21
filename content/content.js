// Content script for the Password Generator extension

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {  if (message.action === "fillPassword") {
    // Fill the password in the active element (password field)
    fillPasswordField(message.password);
    
    // Start monitoring for form submission
    monitorFormSubmission();
    
    // Send immediate response
    sendResponse({ success: true });
  }
});

// Fill the password in the currently focused input field and any confirm password field
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
      
      // Find and fill any confirm password fields
      const confirmedFilled = findAndFillConfirmPasswordFields(password);
      
      // If confirmation field wasn't found and filled, show the single field notification
      if (!confirmedFilled) {
        showNotification("Password generated and filled in the field.");
      }
    } 
    // If it's a contentEditable element
    else if (activeElement.isContentEditable) {
      activeElement.textContent = password;
    }
  }
}

// Function to find and fill confirm password fields
function findAndFillConfirmPasswordFields(password) {
  // Get the form containing the active element
  const form = document.activeElement.form;
  let confirmPasswordField = null;
  
  if (form) {
    // Look within the form first
    const inputs = form.querySelectorAll('input[type="password"]');
    
    // Skip the first field if it's our active element
    for (let i = 0; i < inputs.length; i++) {
      if (inputs[i] !== document.activeElement) {        // Check if this field might be a confirm password field
        const field = inputs[i];
        const fieldId = field.id.toLowerCase();
        const fieldName = field.name.toLowerCase();
        const fieldLabel = findAssociatedLabel(field);
        
        // Check for common confirm password identifiers
        if (fieldId.includes('confirm') || fieldId.includes('verify') || fieldId.includes('repeat') || 
            fieldId.includes('reenter') || fieldId.includes('re-enter') ||
            fieldName.includes('confirm') || fieldName.includes('verify') || fieldName.includes('repeat') || 
            fieldName.includes('reenter') || fieldName.includes('re-enter') ||
            (fieldLabel && (fieldLabel.includes('confirm') || fieldLabel.includes('verify') || fieldLabel.includes('repeat') || 
                          fieldLabel.includes('reenter') || fieldLabel.includes('re-enter') || fieldLabel.includes('re enter')))) {
          confirmPasswordField = field;
          break;
        }
      }
    }
  }
  
  // If no confirm field found in the form, look in the entire page
  if (!confirmPasswordField) {
    const allPasswordFields = document.querySelectorAll('input[type="password"]');
    
    for (let i = 0; i < allPasswordFields.length; i++) {
      if (allPasswordFields[i] !== document.activeElement) {        const field = allPasswordFields[i];
        const fieldId = field.id.toLowerCase();
        const fieldName = field.name.toLowerCase();
        const fieldLabel = findAssociatedLabel(field);
        
        // Check for common confirm password identifiers
        if (fieldId.includes('confirm') || fieldId.includes('verify') || fieldId.includes('repeat') || 
            fieldId.includes('reenter') || fieldId.includes('re-enter') ||
            fieldName.includes('confirm') || fieldName.includes('verify') || fieldName.includes('repeat') || 
            fieldName.includes('reenter') || fieldName.includes('re-enter') ||
            (fieldLabel && (fieldLabel.includes('confirm') || fieldLabel.includes('verify') || fieldLabel.includes('repeat') || 
                          fieldLabel.includes('reenter') || fieldLabel.includes('re-enter') || fieldLabel.includes('re enter')))) {
          confirmPasswordField = field;
          break;
        }
      }
    }
  }
  
  // Fill the confirm password field if found
  if (confirmPasswordField) {
    confirmPasswordField.value = password;
    
    // Trigger events to notify the page
    const inputEvent = new Event('input', { bubbles: true });
    confirmPasswordField.dispatchEvent(inputEvent);
    
    const changeEvent = new Event('change', { bubbles: true });
    confirmPasswordField.dispatchEvent(changeEvent);
    
    // Show a notification that both fields were filled
    showNotification("Password generated and filled in both fields.");
    return true;
  }
  
  return false;
}

// Helper function to find associated label for an input field
function findAssociatedLabel(input) {
  // Check for label with 'for' attribute
  if (input.id) {
    const label = document.querySelector(`label[for="${input.id}"]`);
    if (label) return label.textContent.toLowerCase();
  }
  
  // Check for parent label
  let parent = input.parentElement;
  while (parent) {
    if (parent.tagName === 'LABEL') {
      return parent.textContent.toLowerCase();
    }
    parent = parent.parentElement;
  }
  
  // Check for nearby elements that might be labels (preceding siblings or previous elements)
  let previousElement = input.previousElementSibling;
  if (previousElement) {
    // Check if the previous element contains text that might indicate a password confirmation field
    const previousText = previousElement.textContent.toLowerCase();
    if (previousText.includes('confirm') || previousText.includes('verify') || 
        previousText.includes('repeat') || previousText.includes('re-enter') || 
        previousText.includes('reenter') || previousText.includes('re enter')) {
      return previousText;
    }
  }
  
  // Look for nearby divs, spans, or paragraphs that might act as labels
  const possibleLabels = input.closest('form, div, fieldset')?.querySelectorAll('div, span, p, label, h1, h2, h3, h4, h5, h6');
  if (possibleLabels) {
    for (const element of possibleLabels) {
      if (element !== input && element.textContent) {
        const text = element.textContent.toLowerCase();
        if (text.includes('confirm') || text.includes('verify') || 
            text.includes('repeat') || text.includes('re-enter') || 
            text.includes('reenter') || text.includes('re enter')) {
          // Check if this element is reasonably close to our input
          const elementRect = element.getBoundingClientRect();
          const inputRect = input.getBoundingClientRect();
          const verticalDistance = Math.abs(elementRect.bottom - inputRect.top);
          
          // If the element is within a reasonable distance (e.g., 50px vertically)
          if (verticalDistance < 50) {
            return text;
          }
        }
      }
    }
  }
  
  return null;
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
  }, (response) => {
    if (response && response.success) {
      console.log("Credentials saved successfully");
    }
  });
}
