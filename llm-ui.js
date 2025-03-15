/*
 * UI elements for the LLM integration.
 * This file handles the UI elements for the LLM integration,
 * including the text input box and API key configuration.
 */

// UI elements
let llmInputContainer = null;
let llmInputBox = null;
let llmSubmitButton = null;
let llmStatusDisplay = null;
let llmSettingsButton = null;
let llmSettingsContainer = null;
let llmApiKeyInput = null;
let llmSaveApiKeyButton = null;
let llmCloseSettingsButton = null;
let llmCustomParticlesContainer = null;
let llmTestButton = null;

// Initialize the LLM UI
function initLLMUI() {
  // Create input container
  llmInputContainer = document.createElement('div');
  llmInputContainer.id = 'llmInputContainer';
  llmInputContainer.className = 'llm-container';
  
  // Create input box
  llmInputBox = document.createElement('input');
  llmInputBox.type = 'text';
  llmInputBox.id = 'llmInputBox';
  llmInputBox.className = 'llm-input';
  llmInputBox.placeholder = 'Type a new particle name...';
  
  // Create submit button
  llmSubmitButton = document.createElement('button');
  llmSubmitButton.id = 'llmSubmitButton';
  llmSubmitButton.className = 'llm-button';
  llmSubmitButton.textContent = 'Generate Particle';
  
  // Create settings button
  llmSettingsButton = document.createElement('button');
  llmSettingsButton.id = 'llmSettingsButton';
  llmSettingsButton.className = 'llm-button';
  llmSettingsButton.textContent = '⚙️';
  
  // Create test button (for development/debugging)
  llmTestButton = document.createElement('button');
  llmTestButton.id = 'llmTestButton';
  llmTestButton.className = 'llm-button';
  llmTestButton.textContent = 'Test';
  llmTestButton.style.fontSize = '12px';
  llmTestButton.style.padding = '4px 8px';
  
  // Create status display
  llmStatusDisplay = document.createElement('div');
  llmStatusDisplay.id = 'llmStatusDisplay';
  llmStatusDisplay.className = 'llm-status';
  
  // Add elements to container
  llmInputContainer.appendChild(llmInputBox);
  llmInputContainer.appendChild(llmSubmitButton);
  llmInputContainer.appendChild(llmSettingsButton);
  llmInputContainer.appendChild(llmTestButton);
  llmInputContainer.appendChild(llmStatusDisplay);
  
  // Create settings container (initially hidden)
  llmSettingsContainer = document.createElement('div');
  llmSettingsContainer.id = 'llmSettingsContainer';
  llmSettingsContainer.className = 'llm-settings-container';
  llmSettingsContainer.style.display = 'none';
  
  // Create API key input
  llmApiKeyInput = document.createElement('input');
  llmApiKeyInput.type = 'password';
  llmApiKeyInput.id = 'llmApiKeyInput';
  llmApiKeyInput.className = 'llm-input';
  llmApiKeyInput.placeholder = 'Enter your OpenAI API key...';
  
  // Create save API key button
  llmSaveApiKeyButton = document.createElement('button');
  llmSaveApiKeyButton.id = 'llmSaveApiKeyButton';
  llmSaveApiKeyButton.className = 'llm-button';
  llmSaveApiKeyButton.textContent = 'Save API Key';
  
  // Create close settings button
  llmCloseSettingsButton = document.createElement('button');
  llmCloseSettingsButton.id = 'llmCloseSettingsButton';
  llmCloseSettingsButton.className = 'llm-button';
  llmCloseSettingsButton.textContent = 'Close';
  
  // Add elements to settings container
  llmSettingsContainer.appendChild(document.createElement('h3')).textContent = 'OpenAI API Settings';
  llmSettingsContainer.appendChild(llmApiKeyInput);
  llmSettingsContainer.appendChild(llmSaveApiKeyButton);
  llmSettingsContainer.appendChild(llmCloseSettingsButton);
  
  // Create custom particles container
  llmCustomParticlesContainer = document.createElement('div');
  llmCustomParticlesContainer.id = 'llmCustomParticlesContainer';
  llmCustomParticlesContainer.className = 'llm-custom-particles';
  
  // Add settings container to body
  document.body.appendChild(llmSettingsContainer);
  
  // Add input container to menu wrapper
  const menuWrapper = document.getElementById('menuWrapper');
  if (menuWrapper) {
    menuWrapper.appendChild(llmInputContainer);
    menuWrapper.appendChild(llmCustomParticlesContainer);
  } else {
    console.error('Menu wrapper not found, cannot add LLM UI');
  }
  
  // Setup event listeners
  setupLLMEventListeners();
}

// Setup event listeners for LLM UI
function setupLLMEventListeners() {
  llmSubmitButton.addEventListener('click', handleParticleSubmission);
  
  llmInputBox.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
      handleParticleSubmission();
    }
  });
  
  llmSettingsButton.addEventListener('click', function() {
    llmSettingsContainer.style.display = 'block';
  });
  
  llmCloseSettingsButton.addEventListener('click', function() {
    llmSettingsContainer.style.display = 'none';
  });
  
  llmSaveApiKeyButton.addEventListener('click', function() {
    const apiKey = llmApiKeyInput.value.trim();
    if (initOpenAI(apiKey)) {
      updateLLMStatus(getStatusMessage(), 'success');
      localStorage.setItem('openai_api_key', apiKey);
      llmSettingsContainer.style.display = 'none';
    } else {
      updateLLMStatus(getErrorMessage(), 'error');
    }
  });

  // Test button for quick testing without API call
  llmTestButton.addEventListener('click', function() {
    try {
      updateLLMStatus('Creating test particle...', 'loading');
      const testParticle = createTestParticle();
      registerCustomParticle(testParticle);
      updateLLMStatus('Test particle created!', 'success');
      updateCustomParticlesList();
    } catch (error) {
      console.error('Test particle creation failed:', error);
      updateLLMStatus(`Test failed: ${error.message}`, 'error');
    }
  });

  // Check for stored API key
  const storedApiKey = localStorage.getItem('openai_api_key');
  if (storedApiKey) {
    llmApiKeyInput.value = storedApiKey;
    initOpenAI(storedApiKey);
  }
}

// Handle particle submission
async function handleParticleSubmission() {
  const particleName = llmInputBox.value.trim().toUpperCase();
  
  if (!particleName) {
    updateLLMStatus('Please enter a particle name', 'error');
    return;
  }
  
  if (!config.initialized) {
    updateLLMStatus('Please configure your OpenAI API key first', 'error');
    llmSettingsContainer.style.display = 'block';
    return;
  }
  
  try {
    updateLLMStatus(`Generating ${particleName} particle...`, 'loading');
    llmSubmitButton.disabled = true;
    
    const particleData = await generateParticle(particleName);
    
    // Register the new element and UI
    try {
      registerCustomParticle(particleData);
      
      // Update UI
      updateLLMStatus(`Successfully generated ${particleName}!`, 'success');
      updateCustomParticlesList();
      llmInputBox.value = '';
    } catch (registerError) {
      console.error('Failed to register particle:', registerError);
      updateLLMStatus(`Error registering particle: ${registerError.message}`, 'error');
    }
  } catch (error) {
    console.error('Particle generation error:', error);
    updateLLMStatus(`Error: ${error.message}`, 'error');
  } finally {
    llmSubmitButton.disabled = false;
  }
}

// Update status display
function updateLLMStatus(message, type = 'info') {
  llmStatusDisplay.textContent = message;
  llmStatusDisplay.className = `llm-status ${type}`;
  
  // Clear success/info messages after 5 seconds
  if (type === 'success' || type === 'info') {
    setTimeout(() => {
      if (llmStatusDisplay.textContent === message) {
        llmStatusDisplay.textContent = '';
        llmStatusDisplay.className = 'llm-status';
      }
    }, 5000);
  }
}

// Update the list of custom particles
function updateCustomParticlesList() {
  llmCustomParticlesContainer.innerHTML = '';
  
  const particles = getAllCustomParticles();
  const particleNames = Object.keys(particles);
  
  if (particleNames.length === 0) {
    return;
  }
  
  const title = document.createElement('h3');
  title.textContent = 'Custom Particles';
  llmCustomParticlesContainer.appendChild(title);
  
  const particlesList = document.createElement('div');
  particlesList.className = 'llm-particles-list';
  
  particleNames.forEach(name => {
    const particle = particles[name];
    const particleButton = document.createElement('button');
    particleButton.className = 'elementMenuButton';
    particleButton.textContent = name;
    
    // Set button color based on particle color
    const [r, g, b] = particle.color;
    // Make sure the color is bright enough to see against dark background
    const textColor = ensureVisibleColor(r, g, b);
    particleButton.style.color = textColor;
    
    // Use the element color for selection
    const elementColor = customElementColors[name];
    
    // Set ID on the button to allow for proper selection/deselection
    particleButton.id = elementColor.toString();
    
    particleButton.addEventListener('click', function() {
      // Deselect the currently selected element
      if (document.getElementById(SELECTED_ELEM.toString())) {
        document.getElementById(SELECTED_ELEM.toString()).classList.remove("selectedElementMenuButton");
      }
      
      // Handle selection in custom particles list
      particleButton.classList.add("selectedElementMenuButton");
      SELECTED_ELEM = elementColor;
    });
    
    particlesList.appendChild(particleButton);
  });
  
  llmCustomParticlesContainer.appendChild(particlesList);
  
  // Add click handler to original menu buttons to ensure they work after custom particles are selected
  addOriginalMenuButtonHandlers();
}

// Function to ensure the color is visible against the dark background
function ensureVisibleColor(r, g, b) {
  // Brighten colors that would be too dark to see
  const minBrightness = 100; // Minimum brightness value to ensure visibility
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  
  if (brightness < minBrightness) {
    // Increase brightness while preserving hue
    const factor = minBrightness / Math.max(brightness, 1);
    r = Math.min(255, Math.round(r * factor));
    g = Math.min(255, Math.round(g * factor));
    b = Math.min(255, Math.round(b * factor));
  }
  
  return `rgb(${r}, ${g}, ${b})`;
}

// Add click handlers to all original menu buttons to ensure they work
function addOriginalMenuButtonHandlers() {
  // Get all element menu buttons from the original menu
  const originalButtons = document.querySelectorAll('#elementTable .elementMenuButton');
  
  // Add/reapply click handlers
  originalButtons.forEach(button => {
    // Clear existing listeners by cloning and replacing
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);
    
    // Add the proper click handler
    newButton.addEventListener('click', function() {
      // Deselect the currently selected element from anywhere
      const selectedButtons = document.querySelectorAll('.selectedElementMenuButton');
      selectedButtons.forEach(btn => btn.classList.remove('selectedElementMenuButton'));
      
      // Select this button
      newButton.classList.add('selectedElementMenuButton');
      SELECTED_ELEM = parseInt(newButton.id, 10);
    });
  });
} 