// Credentials Manager JavaScript

document.addEventListener('DOMContentLoaded', () => {
  console.log('Credentials page loaded!');

  // UI Elements
  const searchField = document.getElementById('search-field');
  const sortSelect = document.getElementById('sort-select');
  const removeDuplicatesBtn = document.getElementById('remove-duplicates-btn');
  const credentialsList = document.getElementById('credentials-list');
  
  console.log('Elements:', {
    searchField: !!searchField,
    sortSelect: !!sortSelect,
    removeDuplicatesBtn: !!removeDuplicatesBtn,
    credentialsList: !!credentialsList
  });

  // Load credentials
  loadCredentials();
  
  // Event listeners
  searchField.addEventListener('input', filterCredentials);
  sortSelect.addEventListener('change', sortCredentials);
  removeDuplicatesBtn.addEventListener('click', removeDuplicates);
});

// Load and display credentials from storage
function loadCredentials() {
  chrome.storage.local.get('credentials', (result) => {
    const credentials = result.credentials || [];
    displayCredentials(credentials);
  });
}

// Display credentials with various sort options
function displayCredentials(credentials) {
  const credentialsList = document.getElementById('credentials-list');
  const sortMethod = document.getElementById('sort-select').value;
  
  // Apply sorting
  credentials = sortCredentialsList(credentials, sortMethod);
  
  // Clear previous credentials
  credentialsList.innerHTML = '';
  
  if (credentials.length === 0) {
    credentialsList.innerHTML = `
      <div class="no-credentials">
        <p>No credentials found.</p>
        <p>Generate passwords and save credentials to see them here.</p>
      </div>
    `;
    return;
  }
  
  // Create credential items
  credentials.forEach((credential, index) => {
    // Extract domain from URL
    let domain = extractDomain(credential.url);
    
    // Format date
    let formattedDate = formatDate(credential.date);
    
    const item = document.createElement('div');
    item.className = 'credential-item';
    
    // Create the credential card
    item.innerHTML = `
      <div class="credential-header">
        <div class="credential-site">${domain}</div>
        <div class="credential-date">${formattedDate}</div>
      </div>
      <div class="credential-details">
        ${credential.username ? `
          <div class="credential-field">
            <div class="credential-label">Username:</div>
            <div class="credential-value">${credential.username}</div>
          </div>
        ` : ''}
        ${credential.email ? `
          <div class="credential-field">
            <div class="credential-label">Email:</div>
            <div class="credential-value">${credential.email}</div>
          </div>
        ` : ''}
        ${credential.phone ? `
          <div class="credential-field">
            <div class="credential-label">Phone:</div>
            <div class="credential-value">${credential.phone}</div>
          </div>
        ` : ''}
        <div class="credential-field">
          <div class="credential-label">Password:</div>
          <div class="credential-value">
            <span class="masked-value" id="password-${index}">••••••••••••</span>
            <span class="show-password" data-index="${index}">Show</span>
          </div>
        </div>
      </div>
      <div class="credential-actions">
        <button class="credential-btn copy-password" data-index="${index}">Copy Password</button>
        ${credential.username ? `<button class="credential-btn copy-username" data-index="${index}">Copy Username</button>` : ''}
        ${credential.email ? `<button class="credential-btn copy-email" data-index="${index}">Copy Email</button>` : ''}
        ${credential.phone ? `<button class="credential-btn copy-phone" data-index="${index}">Copy Phone</button>` : ''}
        <button class="credential-btn delete" data-index="${index}">Delete</button>
      </div>
    `;
    
    credentialsList.appendChild(item);
  });
  
  // Add event listeners
  addEventListeners(credentials);
}

// Helper function to extract domain from URL
function extractDomain(url) {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return url;
  }
}

// Helper function to format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Add event listeners to all buttons and interactive elements
function addEventListeners(credentials) {
  // Show/hide password
  document.querySelectorAll('.show-password').forEach(button => {
    button.addEventListener('click', (e) => {
      const index = e.target.getAttribute('data-index');
      const passwordSpan = document.getElementById(`password-${index}`);
      
      if (e.target.textContent === 'Show') {
        passwordSpan.textContent = credentials[index].password;
        passwordSpan.classList.remove('masked-value');
        e.target.textContent = 'Hide';
      } else {
        passwordSpan.textContent = '••••••••••••';
        passwordSpan.classList.add('masked-value');
        e.target.textContent = 'Show';
      }
    });
  });
  
  // Copy password
  document.querySelectorAll('.copy-password').forEach(button => {
    button.addEventListener('click', (e) => {
      const index = e.target.getAttribute('data-index');
      copyToClipboard(credentials[index].password);
      showNotification('Password copied to clipboard');
    });
  });
  
  // Copy username
  document.querySelectorAll('.copy-username').forEach(button => {
    button.addEventListener('click', (e) => {
      const index = e.target.getAttribute('data-index');
      copyToClipboard(credentials[index].username);
      showNotification('Username copied to clipboard');
    });
  });
  
  // Copy email
  document.querySelectorAll('.copy-email').forEach(button => {
    button.addEventListener('click', (e) => {
      const index = e.target.getAttribute('data-index');
      copyToClipboard(credentials[index].email);
      showNotification('Email copied to clipboard');
    });
  });
  
  // Copy phone
  document.querySelectorAll('.copy-phone').forEach(button => {
    button.addEventListener('click', (e) => {
      const index = e.target.getAttribute('data-index');
      copyToClipboard(credentials[index].phone);
      showNotification('Phone number copied to clipboard');
    });
  });
  
  // Delete credential
  document.querySelectorAll('.credential-btn.delete').forEach(button => {
    button.addEventListener('click', (e) => {
      const index = e.target.getAttribute('data-index');
      if (confirm('Are you sure you want to delete this credential?')) {
        deleteCredential(index);
      }
    });
  });
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
      let domain = extractDomain(credential.url).toLowerCase();
      
      return domain.includes(searchTerm) || 
             (credential.username && credential.username.toLowerCase().includes(searchTerm)) ||
             (credential.email && credential.email.toLowerCase().includes(searchTerm)) ||
             (credential.phone && credential.phone.toLowerCase().includes(searchTerm));
    });
    
    displayCredentials(filteredCredentials);
  });
}

// Sort credentials based on selected option
function sortCredentials() {
  chrome.storage.local.get('credentials', (result) => {
    const credentials = result.credentials || [];
    displayCredentials(credentials);
  });
}

// Sort credentials list based on method
function sortCredentialsList(credentials, method) {
  const sortedCredentials = [...credentials]; // Create a copy
  
  switch (method) {
    case 'date-desc':
      return sortedCredentials.sort((a, b) => new Date(b.date) - new Date(a.date));
    case 'date-asc':
      return sortedCredentials.sort((a, b) => new Date(a.date) - new Date(b.date));
    case 'domain-asc':
      return sortedCredentials.sort((a, b) => {
        const domainA = extractDomain(a.url).toLowerCase();
        const domainB = extractDomain(b.url).toLowerCase();
        return domainA.localeCompare(domainB);
      });
    case 'domain-desc':
      return sortedCredentials.sort((a, b) => {
        const domainA = extractDomain(a.url).toLowerCase();
        const domainB = extractDomain(b.url).toLowerCase();
        return domainB.localeCompare(domainA);
      });
    default:
      return sortedCredentials;
  }
}

// Delete a credential
function deleteCredential(index) {
  chrome.storage.local.get('credentials', (result) => {
    const credentials = result.credentials || [];
    credentials.splice(index, 1);
    
    chrome.storage.local.set({ credentials }, () => {
      loadCredentials();
      showNotification('Credential deleted');
    });
  });
}

// Remove duplicate entries
function removeDuplicates() {
  chrome.storage.local.get('credentials', (result) => {
    const credentials = result.credentials || [];
    
    // Create a map to identify duplicates
    const uniqueMap = new Map();
    const uniqueCredentials = [];
    let duplicatesRemoved = 0;
    
    credentials.forEach(credential => {
      const domain = extractDomain(credential.url);
      const identifier = credential.username || credential.email || credential.phone || '';
      const key = `${domain}-${identifier}`;
      
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, true);
        uniqueCredentials.push(credential);
      } else {
        duplicatesRemoved++;
      }
    });
    
    if (duplicatesRemoved > 0) {
      chrome.storage.local.set({ credentials: uniqueCredentials }, () => {
        loadCredentials();
        showNotification(`${duplicatesRemoved} duplicate(s) removed`);
      });
    } else {
      showNotification('No duplicates found');
    }
  });
}

// Helper function to copy text to clipboard
function copyToClipboard(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}

// Show notification
function showNotification(message) {
  // Check if there's an existing notification
  let notification = document.querySelector('.notification');
  
  if (notification) {
    // Update existing notification
    clearTimeout(notification.dataset.timeoutId);
    notification.textContent = message;
  } else {
    // Create new notification
    notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background-color: #4361ee;
      color: white;
      padding: 10px 20px;
      border-radius: 4px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      z-index: 1000;
      animation: slide-up 0.3s ease-out;
    `;
    document.body.appendChild(notification);
  }
  
  // Set timeout to remove notification
  const timeoutId = setTimeout(() => {
    notification.style.animation = 'slide-down 0.3s ease-out forwards';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
  
  notification.dataset.timeoutId = timeoutId;
}

// Define CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slide-up {
    from { transform: translate(-50%, 100%); opacity: 0; }
    to { transform: translate(-50%, 0); opacity: 1; }
  }
  
  @keyframes slide-down {
    from { transform: translate(-50%, 0); opacity: 1; }
    to { transform: translate(-50%, 100%); opacity: 0; }
  }
`;
document.head.appendChild(style);
