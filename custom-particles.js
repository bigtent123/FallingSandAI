/*
 * Implementation of custom particles created via LLM.
 * This file handles the registration and implementation of
 * custom particles generated via the OpenAI API.
 */

// Map to store custom element colors by name
const customElementColors = {};

// Map to store custom element action functions
const customElementActions = {};

// Next available element index
let nextCustomElementIdx = 64; // Start at a safe distance from built-in elements

/**
 * Preprocess action code to fix common issues with LLM-generated code
 * @param {string} code - The raw action code
 * @param {string} particleName - The name of the particle
 * @param {number} elementColor - The color value of the element
 * @returns {string} - Fixed action code
 */
function preprocessActionCode(code, particleName, elementColor) {
  // If code is too simple, enhance it based on the particle name
  if (code.trim().length < 50 || code.trim() === "doGravity(x, y, i, true, 0.9);") {
    console.log(`Action code for ${particleName} is too simple, enhancing based on name`);
    const enhancedCode = enhanceCodeBasedOnName(code, particleName, elementColor);
    if (enhancedCode !== code) {
      console.log(`Enhanced code for ${particleName}`);
      code = enhancedCode;
    }
  }

  // Replace references to the particle name as a variable with the element color
  const particleNameRegExp = new RegExp('\\b' + particleName.toUpperCase() + '\\b', 'g');
  
  // First, preserve structure by replacing with a special token
  code = code.replace(particleNameRegExp, 'THIS_ELEMENT_COLOR');
  
  // Enable explosion behaviors - this is critical for items like TNT
  // Allow access to neighboring elements for creating explosion effects
  code = code.replace(/bordering\s*\(\s*x\s*,\s*y\s*,\s*i\s*,\s*FIRE\s*\)/g, 
                     'adjacent(x, i, FIRE) || below(y, i, FIRE) || above(y, i, FIRE)');
  
  // Fix common problem patterns with gameImagedata32 array access
  // Pattern for setting a neighboring pixel to an element
  const arrayAccessPattern = /gameImagedata32\[i\s*([+-])\s*(\w+)\]\s*=\s*([A-Z_]+)\s*;/g;
  code = code.replace(arrayAccessPattern, function(match, operator, offset, elementName) {
    // Allow setting FIRE and BACKGROUND values which are needed for explosions
    if (elementName === 'FIRE' || elementName === 'BACKGROUND') {
      return match;
    }
    
    // If it's trying to set another pixel to THIS_ELEMENT_COLOR, use the actual element color
    if (elementName === 'THIS_ELEMENT_COLOR') {
      return match.replace('THIS_ELEMENT_COLOR', elementColor.toString());
    }
    
    // For other element types, check if they're valid existing elements
    if (isKnownElement(elementName)) {
      return match;
    } else {
      // Default substitution to prevent errors
      return match.replace(elementName, 'FIRE'); // Most interactions should produce fire
    }
  });
  
  // Now replace THIS_ELEMENT_COLOR with the actual element color
  code = code.replace(/THIS_ELEMENT_COLOR/g, elementColor.toString());
  
  // Special case for TNT and explosives - allow them to interact with fire
  if (particleName.toUpperCase().includes('TNT') || 
      particleName.toUpperCase().includes('BOMB') || 
      particleName.toUpperCase().includes('EXPLO')) {
      
    // If the code doesn't already have fire interaction, add it
    if (!code.includes('FIRE') && !code.includes('fire')) {
      code = `
        // Check for contact with fire for explosion
        if (adjacent(x, i, FIRE) || below(y, i, FIRE) || above(y, i, FIRE)) {
          // Create explosion
          gameImagedata32[i] = FIRE;
          // Set surrounding pixels to FIRE
          if (i+1 < gameImagedata32.length) gameImagedata32[i+1] = FIRE;
          if (i-1 >= 0) gameImagedata32[i-1] = FIRE;
          if (i+width < gameImagedata32.length) gameImagedata32[i+width] = FIRE;
          if (i-width >= 0) gameImagedata32[i-width] = FIRE;
        } else {
          // Default behavior
          ${code}
        }
      `;
    }
  }
  
  return code;
}

/**
 * Enhance simple action code based on the particle name
 * @param {string} code - Original code
 * @param {string} particleName - Particle name
 * @param {number} elementColor - Element color
 * @returns {string} - Enhanced code
 */
function enhanceCodeBasedOnName(code, particleName, elementColor) {
  const name = particleName.toUpperCase();
  
  // Hair-like materials
  if (name.includes('HAIR') || name.includes('FUR') || name.includes('STRING')) {
    return `
      // ${particleName} behavior - strands that hang and can be affected by elements
      if (adjacent(x, i, FIRE)) {
        // Burns quickly when exposed to fire
        if (random() < 0.8) {
          gameImagedata32[i] = FIRE;
        }
      } else if (adjacent(x, i, WATER)) {
        // Gets wet and clumps together
        doGravity(x, y, i, false, 0.95);
      } else {
        // Normal behavior - strands hang and can move slightly
        if (below(y, i, BACKGROUND) && random() < 0.2) {
          // Strands can drift slightly to sides
          if (random() < 0.5 && gameImagedata32[i+1] === BACKGROUND) {
            gameImagedata32[i] = BACKGROUND;
            gameImagedata32[i+1] = ${elementColor};
          } else if (gameImagedata32[i-1] === BACKGROUND) {
            gameImagedata32[i] = BACKGROUND;
            gameImagedata32[i-1] = ${elementColor};
          }
        } else {
          // Falls but can catch on things
          doGravity(x, y, i, true, 0.7);
        }
      }
    `;
  }
  
  // Gas or smoke
  if (name.includes('GAS') || name.includes('SMOKE') || name.includes('VAPOR') || name.includes('STEAM')) {
    return `
      // ${particleName} - gaseous substance that rises and dissipates
      doRise(x, y, i, 0.9, 0.7);
      
      // Gradually disappears as it rises
      if (random() < 0.03) {
        gameImagedata32[i] = BACKGROUND;
      }
      
      // Affected by heat/fire
      if (adjacent(x, i, FIRE) && random() < 0.5) {
        // More likely to rise faster near heat
        doRise(x, y, i, 1.0, 0.9);
      }
    `;
  }
  
  // Liquid
  if (name.includes('WATER') || name.includes('LIQUID') || name.includes('OIL') || 
      name.includes('JUICE') || name.includes('BLOOD')) {
    // Determine if it should float on water
    const floatsOnWater = name.includes('OIL');
    
    return `
      // ${particleName} - liquid with unique properties
      // Liquid dynamics - flows and spreads
      doDensityLiquid(x, y, i, ${floatsOnWater ? 'WATER' : 'SAND'}, 0.9, 0.7);
      
      // Interaction with fire
      if (adjacent(x, i, FIRE) && random() < 0.1) {
        // Some liquids are flammable, some extinguish fire
        ${name.includes('OIL') ? 'gameImagedata32[i] = FIRE;' : 'gameImagedata32[i] = STEAM;'}
      }
    `;
  }
  
  // Default - just return the original code if no specific enhancement
  return code;
}

/**
 * Check if an element name is a known built-in element
 * @param {string} elementName - The name of an element
 * @returns {boolean} - True if it's a known element
 */
function isKnownElement(elementName) {
  const knownElements = [
    'BACKGROUND', 'WALL', 'SAND', 'WATER', 'PLANT', 'FIRE', 'SALT', 'OIL', 
    'SPOUT', 'WELL', 'TORCH', 'GUNPOWDER', 'WAX', 'ICE', 'LAVA', 'CRYO',
    'NITRO', 'STEAM', 'C4', 'FUSE', 'SALT_WATER', 'FALLING_WAX'
  ];
  
  return knownElements.includes(elementName);
}

/**
 * Register a custom particle from the LLM response
 * @param {Object} particleData - The particle data from the LLM
 */
function registerCustomParticle(particleData) {
  try {
    const particleName = particleData.name;
    const [r, g, b] = particleData.color;
    
    // Check if particle already exists and handle it gracefully
    if (customElementColors[particleName]) {
      console.log(`Particle ${particleName} already exists, updating it`);
      // If we're updating, we need to use the existing color value
      const elementColor = customElementColors[particleName];
      
      // Update just the action function
      try {
        // Process action code to extract just the function body if it's a complete function declaration
        let actionCode = particleData.action_code.trim();
        
        // If the code starts with "function" keyword, extract just the function body
        if (actionCode.startsWith('function')) {
          // Find the opening brace of the function body
          const openBraceIndex = actionCode.indexOf('{');
          if (openBraceIndex !== -1) {
            // Make sure we find the matching closing brace (considering nested braces)
            let braceCount = 1;
            let closeBraceIndex = -1;
            
            for (let i = openBraceIndex + 1; i < actionCode.length; i++) {
              if (actionCode[i] === '{') braceCount++;
              if (actionCode[i] === '}') braceCount--;
              
              if (braceCount === 0) {
                closeBraceIndex = i;
                break;
              }
            }
            
            if (closeBraceIndex !== -1) {
              // Extract just the function body without the outer braces
              actionCode = actionCode.substring(openBraceIndex + 1, closeBraceIndex).trim();
            }
          }
        }
        
        // Remove any potential harmful code patterns
        actionCode = sanitizeActionCode(actionCode);
        
        // Fix common issues with LLM-generated code
        actionCode = preprocessActionCode(actionCode, particleName, elementColor);
        
        // Create a wrapper that adds timeouts and performance monitoring
        const safeActionCode = `
          try {
            // Default to simple behavior as fallback
            if (Math.random() < 0.1) {
              doGravity(x, y, i, true, 0.9);
              return;
            }
            
            // Custom particle code below
            ${actionCode}
          } catch (error) {
            console.error("Error in particle action:", error);
            // Default fallback behavior
            doGravity(x, y, i, true, 1.0);
          }
        `;
        
        // Create a function from the safe action code
        const actionFunction = new Function('x', 'y', 'i', safeActionCode);
        
        // Register the action function
        customElementActions[elementColor] = createSafeParticleAction(actionFunction, particleName);
        
        console.log(`Successfully updated ${particleName} particle`);
      } catch (error) {
        console.error(`Failed to update action function for ${particleName}:`, error);
        throw new Error(`Failed to update action function: ${error.message}`);
      }
      
      updateCustomParticlesList();
      return elementColor;
    }
    
    // For new particles
    // Generate a color for the element
    const elementColor = __inGameColor(r, g, b);
    
    // Store the color for the element
    customElementColors[particleName] = elementColor;
    
    // Register the element in the menu names
    menuNames[elementColor] = particleName;
    
    // Register the element action
    try {
      // Process action code to extract just the function body if it's a complete function declaration
      let actionCode = particleData.action_code.trim();
      
      // If the code starts with "function" keyword, extract just the function body
      if (actionCode.startsWith('function')) {
        // Find the opening brace of the function body
        const openBraceIndex = actionCode.indexOf('{');
        if (openBraceIndex !== -1) {
          // Make sure we find the matching closing brace (considering nested braces)
          let braceCount = 1;
          let closeBraceIndex = -1;
          
          for (let i = openBraceIndex + 1; i < actionCode.length; i++) {
            if (actionCode[i] === '{') braceCount++;
            if (actionCode[i] === '}') braceCount--;
            
            if (braceCount === 0) {
              closeBraceIndex = i;
              break;
            }
          }
          
          if (closeBraceIndex !== -1) {
            // Extract just the function body without the outer braces
            actionCode = actionCode.substring(openBraceIndex + 1, closeBraceIndex).trim();
          }
        }
      }
      
      // Remove any potential harmful code patterns
      actionCode = sanitizeActionCode(actionCode);
      
      // Fix common issues with LLM-generated code
      actionCode = preprocessActionCode(actionCode, particleName, elementColor);
      
      // Create a safe wrapper for the action code
      const safeActionCode = `
        try {
          // Default to simple behavior as fallback with small probability
          if (Math.random() < 0.1) {
            doGravity(x, y, i, true, 0.9);
            return;
          }
          
          // Custom particle code below
          ${actionCode}
        } catch (error) {
          console.error("Error in particle action:", error);
          // Default fallback behavior
          doGravity(x, y, i, true, 1.0);
        }
      `;
      
      // Create a function from the safe action code
      const actionFunction = new Function('x', 'y', 'i', safeActionCode);
      
      // Create a safe version of the action function
      const safeFunction = createSafeParticleAction(actionFunction, particleName);
      
      // Register the action function
      customElementActions[elementColor] = safeFunction;
      
      // Add the element to the elements array
      elements.push(elementColor);
      
      // Add the action to the elementActions array
      elementActions.push(safeFunction);
      
      // Increment the custom element index
      nextCustomElementIdx++;
      
      console.log(`Successfully registered ${particleName} particle`);
    } catch (error) {
      console.error(`Failed to create action function for ${particleName}:`, error);
      throw new Error(`Failed to create action function: ${error.message}`);
    }
    
    // Don't add to the main menu, only to the custom particles list
    // addCustomElementToMenu(particleName, elementColor);
    
    // Update the custom particles list
    updateCustomParticlesList();
    
    return elementColor;
  } catch (error) {
    console.error('Failed to register custom particle:', error);
    throw error;
  }
}

/**
 * Sanitize action code to remove potentially harmful patterns
 * @param {string} code - The raw action code
 * @returns {string} - Sanitized action code
 */
function sanitizeActionCode(code) {
  // Remove any attempts to define new functions
  code = code.replace(/function\s+\w+\s*\(/g, '');
  
  // Remove any attempts to create loops
  code = code.replace(/while\s*\(/g, 'if(');
  code = code.replace(/for\s*\(/g, 'if(');
  
  // Remove any attempts to use eval or Function constructor
  code = code.replace(/eval\s*\(/g, 'console.log(');
  code = code.replace(/new\s+Function/g, 'console.log');
  
  // Remove any attempts to use setTimeout or setInterval
  code = code.replace(/setTimeout/g, 'console.log');
  code = code.replace(/setInterval/g, 'console.log');
  
  // Remove any attempts to access global objects
  code = code.replace(/window\./g, 'void_');
  code = code.replace(/document\./g, 'void_');
  code = code.replace(/globalThis\./g, 'void_');
  
  return code;
}

/**
 * Create a safe wrapper for a particle action function
 * @param {Function} actionFn - The particle action function
 * @param {string} particleName - The name of the particle
 * @returns {Function} - Safe wrapped action function
 */
function createSafeParticleAction(actionFn, particleName) {
  return function(x, y, i) {
    const start = performance.now();
    
    try {
      // Execute the action function - we wrap it in a try/catch and with performance monitoring
      actionFn(x, y, i);
      
      // Check execution time
      const duration = performance.now() - start;
      if (duration > 5) {
        console.warn(`${particleName} particle action took ${duration.toFixed(2)}ms at (${x}, ${y})`);
      }
    } catch (error) {
      console.error(`Error in ${particleName} particle:`, error);
      
      // Fallback behavior based on the particle name
      if (particleName.toUpperCase().includes('TNT') || 
          particleName.toUpperCase().includes('BOMB') || 
          particleName.toUpperCase().includes('EXPLO')) {
        // For explosives, try to create an explosion if there was an error
        gameImagedata32[i] = FIRE;
      } else if (particleName.toUpperCase().includes('WATER') || 
                particleName.toUpperCase().includes('LIQUID')) {
        // For liquids, just flow like water
        doDensityLiquid(x, y, i, SAND, 0.9, 0.6);
      } else if (particleName.toUpperCase().includes('GAS') || 
                particleName.toUpperCase().includes('SMOKE')) {
        // For gases, rise
        doRise(x, y, i, 0.9, 0.6);
      } else {
        // Default fallback - simple gravity-based movement
        doGravity(x, y, i, true, 0.8);
      }
    }
  };
}

/**
 * Add a custom element to the menu
 * @param {string} elementName - The name of the element
 * @param {number} elementColor - The color value of the element
 */
function addCustomElementToMenu(elementName, elementColor) {
  // Get the element table
  const elementTable = document.getElementById('elementTable');
  if (!elementTable) {
    console.error('Element table not found');
    return;
  }
  
  // Find the last row of the table
  let lastRow = elementTable.rows[elementTable.rows.length - 1];
  
  // If the last row is full or doesn't exist, create a new row
  if (!lastRow || lastRow.cells.length >= ELEMENT_MENU_ELEMENTS_PER_ROW) {
    lastRow = elementTable.insertRow();
  }
  
  // Create a cell for the new element
  const cell = lastRow.insertCell();
  
  // Create a button for the element
  const elemButton = document.createElement('input');
  elemButton.type = 'button';
  elemButton.className = 'elementMenuButton';
  elemButton.value = elementName;
  elemButton.id = elementColor;
  
  // Set the button color
  const [r, g, b] = getColorComponents(elementColor);
  elemButton.style.color = `rgb(${r}, ${g}, ${b})`;
  
  // Add click event handler
  elemButton.addEventListener('click', function() {
    document
      .getElementById(SELECTED_ELEM.toString())
      .classList.remove('selectedElementMenuButton');
    elemButton.classList.add('selectedElementMenuButton');
    SELECTED_ELEM = parseInt(elemButton.id, 10);
  });
  
  // Add the button to the cell
  cell.appendChild(elemButton);
}

/**
 * Get the RGB components of an element color
 * @param {number} elementColor - The color value of the element
 * @returns {Array} - Array of [r, g, b] values
 */
function getColorComponents(elementColor) {
  const r = elementColor & 0xff;
  const g = (elementColor & 0xff00) >>> 8;
  const b = (elementColor & 0xff0000) >>> 16;
  return [r, g, b];
}

/**
 * Get an element color from its name
 * @param {string} name - The name of the element
 * @returns {number|null} - The color value of the element, or null if not found
 */
function getElementColorFromName(name) {
  return customElementColors[name] || null;
}

/**
 * Initialize custom particles functionality
 */
function initCustomParticles() {
  // Nothing to do here yet, but might be needed for future expansion
  console.log('Custom particles system initialized');
}

/**
 * Evaluate a custom particle action code in a safe context
 * @param {string} code - The JavaScript code to evaluate
 * @returns {Function} - The action function
 */
function createActionFunction(code) {
  // Create a function with the code
  return new Function('x', 'y', 'i', code);
}

/**
 * Debug helper to log information about custom particles
 */
function debugCustomParticles() {
  console.log('Custom Elements:', customElementColors);
  console.log('Custom Element Actions:', customElementActions);
  
  // Log details of each custom particle
  Object.keys(customElementColors).forEach(name => {
    const color = customElementColors[name];
    console.log(`Particle: ${name}`);
    console.log(`  Color: ${color}`);
    console.log(`  Has action: ${!!customElementActions[color]}`);
  });
}

/**
 * Create a simple test particle for debugging
 * @returns {Object} - The test particle data
 */
function createTestParticle() {
  return {
    name: "TNT",
    color: [255, 60, 30], // Reddish color for TNT
    behavior: "Explosive material that detonates when in contact with fire",
    interactions: {
      "WATER": "Waterproof, continues to fall in water",
      "FIRE": "Explodes violently when in contact with fire",
      "PLANT": "Falls through plants, can destroy them when exploding",
      "WALL": "Cannot pass through walls, but explosion can damage walls"
    },
    // TNT with realistic explosion behavior
    action_code: `
      // Check if TNT is in contact with fire
      if (adjacent(x, i, FIRE) || below(y, i, FIRE) || above(y, i, FIRE)) {
        // Create explosion
        gameImagedata32[i] = FIRE; // Center becomes fire
        
        // Set surrounding pixels to fire to create explosion effect
        if (i+1 < gameImagedata32.length) gameImagedata32[i+1] = FIRE;
        if (i-1 >= 0) gameImagedata32[i-1] = FIRE;
        if (i+width < gameImagedata32.length) gameImagedata32[i+width] = FIRE;
        if (i-width >= 0) gameImagedata32[i-width] = FIRE;
        
        // Larger explosion radius
        if (i+width+1 < gameImagedata32.length) gameImagedata32[i+width+1] = FIRE;
        if (i+width-1 < gameImagedata32.length && i+width-1 >= 0) gameImagedata32[i+width-1] = FIRE;
        if (i-width+1 >= 0 && i-width+1 < gameImagedata32.length) gameImagedata32[i-width+1] = FIRE;
        if (i-width-1 >= 0) gameImagedata32[i-width-1] = FIRE;
      } else {
        // Normal behavior - falls like sand
        doGravity(x, y, i, true, 0.9);
      }
    `
  };
} 