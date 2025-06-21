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
  const viewCredentialsBtn = document.getElementById('view-credentials-btn');
  
  // Event listeners
  generateBtn.addEventListener('click', generatePassword);
  copyBtn.addEventListener('click', copyPasswordToClipboard);
  viewCredentialsBtn.addEventListener('click', openCredentialsPage);
  
  // Generate a password when popup opens
  generatePassword();
  
  // For debugging
  console.log('Popup script loaded');
  if (viewCredentialsBtn) {
    console.log('View credentials button found');
  } else {
    console.log('View credentials button NOT found');
  }
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

// Open credentials page in a new tab
function openCredentialsPage() {
  console.log('Opening credentials page');
  
  // Using a background script message to open the tab
  // This is more reliable than direct tab creation from a popup
  chrome.runtime.sendMessage({
    action: "openCredentialsPage"
  }, response => {
    console.log('Response from background script:', response);
    if (chrome.runtime.lastError) {
      console.error('Error:', chrome.runtime.lastError);
    }
  });
}
