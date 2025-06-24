// Content script for the Password Generator extension

// Listen for messages from the background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {  
  if (message.action === "fillPassword") {
    // Fill the password in the active element (password field)
    fillPasswordField(message.password);
    
    // Start monitoring for form submission
    monitorFormSubmission();
    
    // Check if this is a password change form
    checkPasswordChangeForm(message.password);
    
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

// Function to detect if we're on a password change form
function checkPasswordChangeForm(newPassword) {
  const activeElement = document.activeElement;
  
  if (!activeElement || activeElement.tagName !== "INPUT" || activeElement.type !== "password") {
    return false;
  }
  
  const form = activeElement.form;
  if (!form) return false;
  
  // Get all password fields in the form
  const passwordFields = form.querySelectorAll('input[type="password"]');
  
  // If there are 2-3 password fields, it might be a password change form
  // (current password, new password, confirm new password)
  if (passwordFields.length >= 2 && passwordFields.length <= 3) {
    // Check if field labels indicate a password change form
    const formText = form.innerText.toLowerCase();
    const isChangeForm = formText.includes('change password') || 
                        formText.includes('new password') || 
                        formText.includes('current password') ||
                        formText.includes('old password');
    
    if (isChangeForm) {
      console.log("Password change form detected");
      
      // Find the new password and confirm new password fields
      const currentField = findFieldByLabel(passwordFields, ['current', 'old']);
      const newField = findFieldByLabel(passwordFields, ['new']);
      const confirmField = findFieldByLabel(passwordFields, ['confirm', 'verify', 'repeat', 'reenter', 're-enter']);
      
      // If we can identify the new password field (not the current password field)
      if (newField) {
        // Make sure the new password field has the generated password
        if (newField !== activeElement) {
          newField.value = newPassword;
          const event = new Event('input', { bubbles: true });
          newField.dispatchEvent(event);
          const changeEvent = new Event('change', { bubbles: true });
          newField.dispatchEvent(changeEvent);
        }
      }
      
      // Find and setup password change form submission monitoring
      setupPasswordChangeMonitoring(form, newPassword);
      
      return true;
    }
  }
  
  return false;
}

// Helper function to find password fields by associated labels
function findFieldByLabel(fields, labelKeywords) {
  for (const field of fields) {
    const fieldId = field.id.toLowerCase();
    const fieldName = field.name.toLowerCase();
    const fieldLabel = findAssociatedLabel(field) || '';
    
    for (const keyword of labelKeywords) {
      if (fieldId.includes(keyword) || fieldName.includes(keyword) || fieldLabel.includes(keyword)) {
        return field;
      }
    }
  }
  return null;
}

// Setup monitoring for password change form submission
function setupPasswordChangeMonitoring(form, newPassword) {
  // Find form submission elements
  const submitButtons = form.querySelectorAll('button[type="submit"], input[type="submit"], button');
  
  // Find elements that might be "Save" buttons even if not formal submit buttons
  const possibleSaveButtons = Array.from(form.querySelectorAll('button, input[type="button"], a'))
    .filter(el => {
      const text = el.textContent.toLowerCase();
      return text.includes('save') || text.includes('update') || text.includes('change') || 
             text.includes('submit') || text.includes('confirm');
    });
  
  const allButtons = [...submitButtons, ...possibleSaveButtons];
  
  // Add event listeners to all potential submission elements
  allButtons.forEach(button => {
    button.addEventListener('click', () => {
      // Get the website domain
      const domain = window.location.hostname;
      
      // Ask for username/email if not previously saved
      checkExistingCredentials(domain, newPassword);
    });
  });
  
  // Also listen for form submission
  form.addEventListener('submit', () => {
    const domain = window.location.hostname;
    checkExistingCredentials(domain, newPassword);
  });
}

// Check if we have credentials for this site, and if not, prompt for username/email
function checkExistingCredentials(domain, newPassword) {
  chrome.storage.local.get("credentials", (result) => {
    const credentials = result.credentials || [];
    
    // Look for credentials for this domain
    const existingCredentials = credentials.filter(cred => {
      let credDomain = '';
      try {
        credDomain = new URL(cred.url).hostname;
      } catch (e) {
        credDomain = cred.url;
      }
      return credDomain === domain;
    });
    
    if (existingCredentials.length > 0) {
      // We have credentials for this site, update the password
      updatePasswordForExistingCredentials(domain, newPassword, existingCredentials);
    } else {
      // No credentials found, prompt for username/email
      promptForCredentialInfo(domain, newPassword);
    }
  });
}

// Prompt user for username/email to save with the new password
function promptForCredentialInfo(domain, password) {
  // Create modal dialog
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
  `;
  
  modal.innerHTML = `
    <div style="background-color: white; padding: 20px; border-radius: 5px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2); max-width: 400px; width: 100%;">
      <h3 style="margin-top: 0;">Save Password</h3>
      <p>Would you like to save this password for ${domain}?</p>
      <div style="margin-bottom: 10px;">
        <label style="display: block; margin-bottom: 5px;">Username or Email:</label>
        <input type="text" id="pc-username-input" style="width: 100%; padding: 8px; box-sizing: border-box;">
      </div>
      <div style="display: flex; justify-content: flex-end;">
        <button id="pc-cancel-btn" style="margin-right: 10px; padding: 8px 16px; cursor: pointer;">Cancel</button>
        <button id="pc-save-btn" style="padding: 8px 16px; background-color: #4CAF50; color: white; border: none; cursor: pointer;">Save</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Event listeners
  document.getElementById('pc-cancel-btn').addEventListener('click', () => {
    document.body.removeChild(modal);
  });
    document.getElementById('pc-save-btn').addEventListener('click', () => {
    const username = document.getElementById('pc-username-input').value.trim();
    
    // Determine if input is username or email
    let userData = {
      url: window.location.href,
      username: '',
      email: '',
      phone: '',
      password: password
    };
    
    if (username.includes('@')) {
      userData.email = username;
    } else {
      userData.username = username;
    }
    
    // Save the credentials
    chrome.runtime.sendMessage({
      action: "saveCredentials",
      data: userData
    }, (response) => {
      if (response && response.success) {
        console.log("Credentials saved successfully");
      }
    });
    
    document.body.removeChild(modal);
  });
}

// Update password for existing credentials
function updatePasswordForExistingCredentials(domain, newPassword, existingCredentials) {
  // If there's more than one credential for this domain, ask which one to update
  if (existingCredentials.length > 1) {
    promptToChooseCredential(existingCredentials, newPassword);
  } else {
    // Only one credential, update it directly
    const credential = existingCredentials[0];
    
    const updatedCredential = {
      url: credential.url,
      username: credential.username,
      email: credential.email,
      phone: credential.phone,
      password: newPassword
    };
    
    chrome.runtime.sendMessage({
      action: "saveCredentials",
      data: updatedCredential
    }, (response) => {
      if (response && response.success) {
        showNotification("Password updated successfully.");
      }
    });
  }
}

// Prompt user to choose which credential to update
function promptToChooseCredential(credentials, newPassword) {
  // Create modal dialog
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 10000;
  `;
  
  let credentialOptions = '';
  credentials.forEach((cred, index) => {
    const identifier = cred.username || cred.email || cred.phone || 'Unknown';
    credentialOptions += `
      <div style="margin-bottom: 10px; padding: 10px; border: 1px solid #ddd; cursor: pointer;" class="pc-credential-option" data-index="${index}">
        ${identifier}
      </div>
    `;
  });
  
  modal.innerHTML = `
    <div style="background-color: white; padding: 20px; border-radius: 5px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2); max-width: 400px; width: 100%;">
      <h3 style="margin-top: 0;">Update Password</h3>
      <p>Choose which account to update:</p>
      <div style="max-height: 300px; overflow-y: auto;">
        ${credentialOptions}
      </div>
      <div style="display: flex; justify-content: flex-end; margin-top: 10px;">
        <button id="pc-cancel-update-btn" style="padding: 8px 16px; cursor: pointer;">Cancel</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Event listeners
  document.getElementById('pc-cancel-update-btn').addEventListener('click', () => {
    document.body.removeChild(modal);
  });
  
  document.querySelectorAll('.pc-credential-option').forEach(option => {
    option.addEventListener('click', () => {
      const index = option.getAttribute('data-index');
      const credential = credentials[index];
      
      const updatedCredential = {
        url: credential.url,
        username: credential.username,
        email: credential.email,
        phone: credential.phone,
        password: newPassword
      };
      
      chrome.runtime.sendMessage({
        action: "saveCredentials",
        data: updatedCredential
      }, (response) => {
        if (response && response.success) {
          showNotification("Password updated successfully.");
        }
      });
      
      document.body.removeChild(modal);
    });
  });
}
