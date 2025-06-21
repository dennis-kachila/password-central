// Background script for the Password Generator extension

// Create context menu item for password generation
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "generate-password",
    title: "Generate Strong Password",
    contexts: ["editable"]
  });
});

// Handle context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "generate-password") {
    // Generate password
    const password = generateStrongPassword();
    
    // Send the password to the content script to fill in the field
    chrome.tabs.sendMessage(tab.id, {
      action: "fillPassword",
      password: password
    });

    // Store the password temporarily until the user confirms saving it
    chrome.storage.local.set({ 
      "tempPassword": password,
      "tempTimestamp": Date.now()
    });
  }
});

// Listen for messages from content script to save credentials
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "saveCredentials") {
    saveCredentials(message.data, () => {
      sendResponse({ success: true });
    });
    return true; // Keep the message channel open for the async response
  }
  
  // Handle opening the credentials page
  else if (message.action === "openCredentialsPage") {
    const credentialsUrl = chrome.runtime.getURL('popup/credentials.html');
    chrome.tabs.create({ url: credentialsUrl }, tab => {
      sendResponse({ success: true, tabId: tab.id });
    });
    return true; // Keep the message channel open for the async response
  }
});

// Generate a strong password
function generateStrongPassword(length = 16) {
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lowercase = "abcdefghijklmnopqrstuvwxyz";
  const numbers = "0123456789";
  const symbols = "!@#$%^&*()_+~`|}{[]:;?><,./-=";
  
  const allChars = uppercase + lowercase + numbers + symbols;
  let password = "";
  
  // Ensure at least one character from each character set
  password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
  password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
  password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  password += symbols.charAt(Math.floor(Math.random() * symbols.length));
  
  // Fill the rest of the password
  for (let i = 4; i < length; i++) {
    password += allChars.charAt(Math.floor(Math.random() * allChars.length));
  }
  
  // Shuffle the password
  return password.split('').sort(() => 0.5 - Math.random()).join('');
}

// Save credentials to local storage
function saveCredentials(data, callback) {
  chrome.storage.local.get("credentials", (result) => {
    const credentials = result.credentials || [];
    
    // Extract domain from URL
    let domain = '';
    try {
      domain = new URL(data.url).hostname;
    } catch (e) {
      domain = data.url;
    }
    
    // Check for duplicates
    const identifier = data.username || data.email || data.phone || '';
    const isDuplicate = credentials.some(cred => {
      let credDomain = '';
      try {
        credDomain = new URL(cred.url).hostname;
      } catch (e) {
        credDomain = cred.url;
      }
      
      const credIdentifier = cred.username || cred.email || cred.phone || '';
      return domain === credDomain && identifier === credIdentifier;
    });
    
    // If it's a duplicate, update the existing entry instead of adding a new one
    if (isDuplicate) {
      for (let i = 0; i < credentials.length; i++) {
        let credDomain = '';
        try {
          credDomain = new URL(credentials[i].url).hostname;
        } catch (e) {
          credDomain = credentials[i].url;
        }
        
        const credIdentifier = credentials[i].username || credentials[i].email || credentials[i].phone || '';
        
        if (domain === credDomain && identifier === credIdentifier) {
          credentials[i] = {
            url: data.url,
            username: data.username,
            email: data.email,
            phone: data.phone,
            password: data.password,
            date: new Date().toISOString()
          };
          break;
        }
      }
    } else {
      // Add new credentials
      credentials.push({
        url: data.url,
        username: data.username,
        email: data.email,
        phone: data.phone,
        password: data.password,
        date: new Date().toISOString()
      });
    }
    
    // Save updated credentials
    chrome.storage.local.set({ "credentials": credentials }, () => {
      // Clear temporary password
      chrome.storage.local.remove(["tempPassword", "tempTimestamp"], () => {
        // Execute callback if provided
        if (callback && typeof callback === 'function') {
          callback();
        }
      });
    });
  });
}
