// Storage functionality for Password Generator extension

// Save credentials to secure storage
function saveCredentials(credentials) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get("credentials", (result) => {
      const existingCredentials = result.credentials || [];
      
      // Check if credential for this website already exists
      const existingIndex = existingCredentials.findIndex(cred => 
        cred.url === credentials.url && 
        ((cred.username && cred.username === credentials.username) ||
         (cred.email && cred.email === credentials.email) ||
         (cred.phone && cred.phone === credentials.phone))
      );
      
      // Update or add new credential
      if (existingIndex !== -1) {
        existingCredentials[existingIndex] = {
          ...existingCredentials[existingIndex],
          ...credentials,
          date: new Date().toISOString()
        };
      } else {
        existingCredentials.push({
          ...credentials,
          date: new Date().toISOString()
        });
      }
      
      // Save to storage
      chrome.storage.local.set({ "credentials": existingCredentials }, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(existingCredentials);
        }
      });
    });
  });
}

// Get all saved credentials
function getAllCredentials() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get("credentials", (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result.credentials || []);
      }
    });
  });
}

// Get credentials for a specific website
function getCredentialsForSite(url) {
  return new Promise((resolve, reject) => {
    getAllCredentials()
      .then(credentials => {
        // Extract domain from URL
        let domain = '';
        try {
          domain = new URL(url).hostname;
        } catch (e) {
          domain = url;
        }
        
        // Filter credentials by domain
        const siteCredentials = credentials.filter(cred => {
          let credDomain = '';
          try {
            credDomain = new URL(cred.url).hostname;
          } catch (e) {
            credDomain = cred.url;
          }
          
          return credDomain === domain;
        });
        
        resolve(siteCredentials);
      })
      .catch(reject);
  });
}

// Delete a credential by index
function deleteCredential(index) {
  return new Promise((resolve, reject) => {
    getAllCredentials()
      .then(credentials => {
        if (index >= 0 && index < credentials.length) {
          credentials.splice(index, 1);
          
          chrome.storage.local.set({ "credentials": credentials }, () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(credentials);
            }
          });
        } else {
          reject(new Error("Invalid credential index"));
        }
      })
      .catch(reject);
  });
}

// Clear all stored credentials
function clearAllCredentials() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.remove("credentials", () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve();
      }
    });
  });
}

// Export functions
export {
  saveCredentials,
  getAllCredentials,
  getCredentialsForSite,
  deleteCredential,
  clearAllCredentials
};
