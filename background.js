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
    
    // Add new credentials
    credentials.push({
      url: data.url,
      username: data.username,
      email: data.email,
      phone: data.phone,
      password: data.password,
      date: new Date().toISOString()
    });
    
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
