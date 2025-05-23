// Popup script for Password Generator extension

document.addEventListener('DOMContentLoaded', () => {
  // UI Elements
  const passwordLengthInput = document.getElementById('password-length');
  const includeUppercase = document.getElementById('include-uppercase');
  const includeLowercase = document.getElementById('include-lowercase');
  const includeNumbers = document.getElementById('include-numbers');
  const includeSymbols = document.getElementById('include-symbols');
  const generateBtn = document.getElementById('generate-btn');
  const passwordField = document.getElementById('password-field');
  const copyBtn = document.getElementById('copy-btn');
  const searchField = document.getElementById('search-field');
  const credentialsList = document.getElementById('credentials-list');
  
  // Load saved credentials
  loadSavedCredentials();
  
  // Event listeners
  generateBtn.addEventListener('click', generatePassword);
  copyBtn.addEventListener('click', copyPasswordToClipboard);
  searchField.addEventListener('input', filterCredentials);
  
  // Generate a password when popup opens
  generatePassword();
});

// Generate a new password based on user options
function generatePassword() {
  const length = document.getElementById('password-length').value;
  const includeUppercase = document.getElementById('include-uppercase').checked;
  const includeLowercase = document.getElementById('include-lowercase').checked;
  const includeNumbers = document.getElementById('include-numbers').checked;
  const includeSymbols = document.getElementById('include-symbols').checked;
  
  // Ensure at least one character set is selected
  if (!includeUppercase && !includeLowercase && !includeNumbers && !includeSymbols) {
    alert('Please select at least one character set.');
    return;
  }
  
  // Character sets
  let characters = '';
  if (includeUppercase) characters += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (includeLowercase) characters += 'abcdefghijklmnopqrstuvwxyz';
  if (includeNumbers) characters += '0123456789';
  if (includeSymbols) characters += '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  // Generate password
  let password = '';
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    password += characters.charAt(randomIndex);
  }
  
  // Update password field
  document.getElementById('password-field').value = password;
}

// Copy the generated password to clipboard
function copyPasswordToClipboard() {
  const passwordField = document.getElementById('password-field');
  passwordField.select();
  document.execCommand('copy');
  
  // Show feedback
  const copyBtn = document.getElementById('copy-btn');
  copyBtn.textContent = 'Copied!';
  copyBtn.style.backgroundColor = '#2ecc71';
    // Reset button after 2 seconds
  setTimeout(() => {
    copyBtn.textContent = 'Copy';
    copyBtn.style.backgroundColor = '';
  }, 2000);
}

// Load saved credentials from storage
function loadSavedCredentials() {
  chrome.storage.local.get('credentials', (result) => {
    const credentials = result.credentials || [];
    displayCredentials(credentials);
  });
}

// Display credentials in the popup
function displayCredentials(credentials) {
  const credentialsList = document.getElementById('credentials-list');
  credentialsList.innerHTML = '';
  
  if (credentials.length === 0) {
    credentialsList.innerHTML = `
      <div class="no-credentials">
        No saved credentials yet.
      </div>
    `;
    return;
  }
  
  // Sort credentials by date (newest first)
  credentials.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // Create credential items
  credentials.forEach((credential, index) => {
    const item = document.createElement('div');
    item.className = 'credential-item';
    
    // Extract domain from URL
    let domain = '';
    try {
      domain = new URL(credential.url).hostname;
    } catch (e) {
      domain = credential.url;
    }
    
    // Determine which identifier to display (username, email, or phone)
    let identifier = credential.username || credential.email || credential.phone || 'No identifier';
    
    item.innerHTML = `
      <div class="site">${domain}</div>
      <div class="username">${identifier}</div>
      <div class="actions">
        <button class="copy-password" data-index="${index}">Copy Password</button>
        <button class="copy-username" data-index="${index}">Copy ${credential.username ? 'Username' : credential.email ? 'Email' : 'Phone'}</button>
      </div>
    `;
    
    credentialsList.appendChild(item);
  });
  
  // Add event listeners to copy buttons
  document.querySelectorAll('.copy-password').forEach(button => {
    button.addEventListener('click', (e) => {
      const index = e.target.getAttribute('data-index');
      copyCredential(credentials[index].password, 'Password');
    });
  });
  
  document.querySelectorAll('.copy-username').forEach(button => {
    button.addEventListener('click', (e) => {
      const index = e.target.getAttribute('data-index');
      const credential = credentials[index];
      const value = credential.username || credential.email || credential.phone;
      copyCredential(value, 'Identifier');
    });
  });
}

// Copy credential to clipboard
function copyCredential(value, type) {
  // Create temporary textarea to copy from
  const textarea = document.createElement('textarea');
  textarea.value = value;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
  
  // Show notification
  const notification = document.createElement('div');
  notification.textContent = `${type} copied to clipboard`;
  notification.style.cssText = `
    position: absolute;
    bottom: 10px;
    left: 50%;
    transform: translateX(-50%);
    background-color: #2ecc71;
    color: white;
    padding: 8px 16px;
    border-radius: 4px;
    font-size: 14px;
  `;
  document.body.appendChild(notification);
  
  // Remove notification after 2 seconds
  setTimeout(() => {
    document.body.removeChild(notification);
  }, 2000);
}

// Filter credentials based on search term
function filterCredentials() {
  const searchTerm = document.getElementById('search-field').value.toLowerCase();
  
  chrome.storage.local.get('credentials', (result) => {
    const credentials = result.credentials || [];
    
    if (searchTerm === '') {
      displayCredentials(credentials);
      return;
    }
    
    const filteredCredentials = credentials.filter(credential => {
      let domain = '';
      try {
        domain = new URL(credential.url).hostname.toLowerCase();
      } catch (e) {
        domain = credential.url.toLowerCase();
      }
      
      return domain.includes(searchTerm) || 
             (credential.username && credential.username.toLowerCase().includes(searchTerm)) ||
             (credential.email && credential.email.toLowerCase().includes(searchTerm)) ||
             (credential.phone && credential.phone.toLowerCase().includes(searchTerm));
    });
    
    displayCredentials(filteredCredentials);
  });
}
