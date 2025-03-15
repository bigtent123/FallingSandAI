/*
 * Integration with OpenAI for custom particle generation.
 * This file handles the communication with OpenAI's API and
 * the generation of new particles based on user input.
 */

// Configuration for OpenAI API
let config = {
  apiKey: '', // User must provide their own API key
  model: 'o3-mini', // Using o3-mini as specified
  initialized: false
};

// Store generated particles
const customParticles = {};

// Error and status messages
let statusMessage = '';
let errorMessage = '';

/**
 * Initialize the OpenAI integration
 * @param {string} apiKey - The OpenAI API key
 * @returns {boolean} - Whether initialization was successful
 */
function initOpenAI(apiKey) {
  if (!apiKey || apiKey.trim() === '') {
    errorMessage = 'Please enter a valid OpenAI API key';
    return false;
  }
  
  config.apiKey = apiKey;
  config.initialized = true;
  statusMessage = 'OpenAI integration initialized';
  return true;
}

/**
 * Generate a prompt for creating a new particle
 * @param {string} particleName - The name of the particle to create
 * @returns {string} - The prompt to send to OpenAI
 */
function generateParticlePrompt(particleName) {
  // Determine if this is a specific type of particle that needs special handling
  const particleType = categorizeParticleType(particleName);
  
  // Use a regular string to build the prompt instead of template literals 
  // to avoid issues with nested ${} expressions
  return "Create a new particle named " + particleName + " for a falling sand game. This particle MUST be DISTINCTIVE, INTERACTIVE, and UNIQUE, capturing the essence of what \"" + particleName + "\" truly is. Be CREATIVE and THINK OUTSIDE THE BOX.\n" +
  "\n" +
  "CRITICAL INSTRUCTION: Your particle MUST NOT BEHAVE LIKE ANY EXISTING PARTICLE. Your particle MUST be visually and behaviorally DISTINCTIVE from standard elements like FIRE, WATER, SAND, etc. DO NOT just recreate an existing element with a new name.\n" +
  "\n" +
  "MOST IMPORTANT: The particle should LOOK, BEHAVE, and INTERACT in ways that are IMMEDIATELY recognizable as \"" + particleName + "\". DO NOT create a generic particle - it must have REALISTIC INTERACTIONS with other elements.\n" +
  "\n" +
  getSpecialInstructionsForType(particleName, particleType) + 
  "\n" +
  "The particle should have these distinctive properties defined:\n" +
  "1. A VIVID and UNIQUE RGB color value that perfectly represents " + particleName + " and is NOTICEABLY DIFFERENT from built-in elements\n" +
  "   • FIRE is [255, 0, 10] - DO NOT use similar red shades for non-fire particles\n" +
  "   • WATER is [0, 10, 255] - DO NOT use similar blue shades for non-liquid particles\n" +
  "   • PLANT is [0, 220, 0] - DO NOT use similar green shades for non-plant particles\n" +
  "   • SAND is [223, 193, 99] - DO NOT use similar tan shades for non-granular particles\n" +
  "   • Choose a color that makes visual sense for " + particleName + " specifically\n" +
  "2. UNIQUE movement behavior that captures how " + particleName + " would actually move (not just basic falling)\n" +
  "3. REALISTIC INTERACTIONS with existing particles - this is EXTREMELY IMPORTANT:\n" +
  "   - SAND (223, 193, 99) - granular material that piles up\n" +
  "   - WATER (0, 10, 255) - flowing liquid that spreads horizontally\n" +
  "   - FIRE (255, 0, 10) - burns things and spreads\n" +
  "   - PLANT (0, 220, 0) - grows upward and can be consumed\n" +
  "   - OIL (150, 60, 0) - flammable liquid that floats on water\n" +
  "   - WALL (127, 127, 127) - solid immovable barrier\n" +
  "   - C4 (240, 230, 150) - explosive that can be detonated\n" +
  "   - GUNPOWDER (170, 170, 140) - explosive powder that ignites with fire\n" +
  "\n" +
  "Format the response as a JSON object with the following structure:\n" +
  "{\n" +
  "  \"name\": \"" + particleName + "\",\n" +
  "  \"color\": [r, g, b],\n" +
  "  \"behavior\": \"Detailed description of physical behavior that is UNIQUE to " + particleName + "\",\n" +
  "  \"interactions\": {\n" +
  "    \"SAND\": \"How " + particleName + " interacts with sand\",\n" +
  "    \"WATER\": \"How " + particleName + " interacts with water\",\n" +
  "    \"FIRE\": \"How " + particleName + " interacts with fire\",\n" +
  "    \"PLANT\": \"How " + particleName + " interacts with plant\",\n" +
  "    \"OIL\": \"How " + particleName + " interacts with oil\"\n" +
  "  },\n" +
  "  \"action_code\": \"JavaScript code for the particle's behavior\"\n" +
  "}\n" +
  "\n" +
  "For the action_code, you can use these helper functions to create REALISTIC and INTERACTIVE behaviors:\n" +
  "- doGravity(x, y, i, allowDiagonal, chance) - Makes particles fall down\n" +
  "- doDensityLiquid(x, y, i, ANOTHER_ELEMENT, sinkChance, equalizeChance) - Fluid dynamics\n" +
  "- doRise(x, y, i, riseChance, adjacentChance) - Makes particles rise upward\n" +
  "- random() - Returns a random number between 0 and 1\n" +
  "- below(y, i, type) - Check if element below is of specific type\n" +
  "- above(y, i, type) - Check if element above is of specific type\n" +
  "- adjacent(x, i, type) - Check if adjacent element is of specific type\n" +
  "- bordering(x, y, i, type) - Check if ANY surrounding element is of type\n" +
  "- gameImagedata32[i] = BACKGROUND - Removes the particle (explosion/destruction)\n" +
  "- gameImagedata32[i+1] or gameImagedata32[i-1] - Access neighboring pixels\n" +
  "- gameImagedata32[i+width] - Access pixel below this one (for falling/effects)\n" +
  "- gameImagedata32[i-width] - Access pixel above this one (for rising/effects)\n" +
  "\n" +
  "EXAMPLES of REALISTIC INTERACTIVE behaviors (be even more realistic than these):\n" +
  "\n" +
  getTNTExample(particleType) +
  "\n" +
  getRelevantExamples(particleType) +
  "\n" +
  getSpecificExampleFor(particleName) +
  "\n" +
  "IMPORTANT GUIDELINES:\n" +
  "1. Make the behavior DISTINCTIVE - not just sand-like or water-like\n" +
  "2. Make the color VIVID and REPRESENTATIVE of what " + particleName + " actually is\n" +
  "3. CREATE REALISTIC INTERACTIONS with other elements\n" +
  "4. Include ACTUAL CHEMICAL/PHYSICAL REACTIONS when appropriate\n" +
  "5. Make explosive things ACTUALLY EXPLODE when near fire\n" +
  "6. Make flammable things ACTUALLY BURN when near fire\n" +
  "7. The code should be safe, not cause infinite loops, and be 5-15 lines long\n" +
  "8. DO NOT COPY EXISTING PARTICLES - BE ORIGINAL AND TRULY REPRESENT " + particleName.toUpperCase() + "\n" +
  "\n" +
  "Your goal is to create a particle that is INSTANTLY RECOGNIZABLE as \"" + particleName + "\" from its appearance and behavior, with REALISTIC PHYSICS and INTERACTIONS.";
}

/**
 * Categorize the particle type based on its name
 * @param {string} particleName - The name of the particle
 * @returns {string} - The category of the particle
 */
function categorizeParticleType(particleName) {
  const name = particleName.toUpperCase();
  
  // Explosives
  if (name.includes('TNT') || name.includes('BOMB') || name.includes('EXPLO') || 
      name.includes('DYNA') || name.includes('C4') || name === 'BOOM') {
    return 'explosive';
  }
  
  // Liquids
  if (name.includes('WATER') || name.includes('OIL') || name.includes('JUICE') || 
      name.includes('LAVA') || name.includes('BLOOD') || name.includes('ACID') ||
      name.includes('LIQUID')) {
    return 'liquid';
  }
  
  // Gases
  if (name.includes('GAS') || name.includes('STEAM') || name.includes('SMOKE') || 
      name.includes('FOG') || name.includes('VAPOR') || name.includes('AIR')) {
    return 'gas';
  }
  
  // Creatures
  if (name.includes('CAT') || name.includes('DOG') || name.includes('BIRD') || 
      name.includes('BUG') || name.includes('FISH') || name.includes('MOUSE') ||
      name.includes('RAT') || name === 'ANT' || name.includes('HUMAN') ||
      name.includes('ZOMBIE')) {
    return 'creature';
  }
  
  // Metals
  if (name.includes('METAL') || name.includes('IRON') || name.includes('GOLD') || 
      name.includes('SILVER') || name.includes('COPPER') || name.includes('STEEL')) {
    return 'metal';
  }
  
  // Foods
  if (name.includes('FOOD') || name.includes('CAKE') || name.includes('BREAD') || 
      name.includes('PIZZA') || name.includes('COOKIE') || name.includes('FRUIT')) {
    return 'food';
  }
  
  // Default
  return 'generic';
}

/**
 * Get special instructions for specific particle types
 * @param {string} particleName - The name of the particle
 * @param {string} particleType - The type of the particle
 * @returns {string} - Custom instructions for this type
 */
function getSpecialInstructionsForType(particleName, particleType) {
  switch (particleType) {
    case 'explosive':
      return "SPECIAL INSTRUCTIONS FOR EXPLOSIVE TYPE:\n" +
             "- " + particleName + " MUST EXPLODE when in contact with FIRE, creating a chain reaction\n" +
             "- Explosion should convert surrounding pixels to FIRE or BACKGROUND (disappear)\n" +
             "- It should have an appropriate delay/fuse before exploding\n" +
             "- Color should be appropriate for explosives (often red, brown, or yellow tones)\n" +
             "- Should fall like a solid object until triggered";
      
    case 'liquid':
      return "SPECIAL INSTRUCTIONS FOR LIQUID TYPE:\n" +
             "- " + particleName + " should FLOW realistically with proper fluid dynamics\n" +
             "- Should spread horizontally when hitting surfaces\n" +
             "- Should have appropriate viscosity (thickness) in its movement\n" +
             "- Consider whether it should float or sink in water\n" +
             "- Consider whether it's flammable or reactive with other elements";
      
    case 'gas':
      return "SPECIAL INSTRUCTIONS FOR GAS TYPE:\n" +
             "- " + particleName + " should RISE upward against gravity\n" +
             "- Should spread out horizontally as it rises\n" +
             "- Should have appropriate diffusion/dissipation behavior\n" +
             "- Consider whether it's flammable, toxic, or has other special properties\n" +
             "- May gradually disappear over time";
      
    case 'creature':
      return "SPECIAL INSTRUCTIONS FOR CREATURE TYPE:\n" +
             "- " + particleName + " should MOVE in a way appropriate for this type of creature\n" +
             "- Should respond to its environment (avoiding fire, moving on surfaces)\n" +
             "- Should have some autonomous/independent behavior\n" +
             "- Consider special abilities like jumping, flying, swimming\n" +
             "- May consume or interact with appropriate elements (like plants for herbivores)";
      
    case 'metal':
      return "SPECIAL INSTRUCTIONS FOR METAL TYPE:\n" +
             "- " + particleName + " should be HEAVY and fall quickly\n" +
             "- Should be sturdy and not easily destroyed\n" +
             "- Consider conductivity for electricity or heat\n" +
             "- May melt when exposed to extreme heat (like lava)\n" +
             "- Should have appropriate metallic color and properties";
      
    case 'food':
      return "SPECIAL INSTRUCTIONS FOR FOOD TYPE:\n" +
             "- " + particleName + " should have appropriate consistency (solid, crumbly, etc.)\n" +
             "- Should burn/cook when exposed to heat/fire\n" +
             "- May absorb liquids or dissolve in them\n" +
             "- May attract creatures if applicable\n" +
             "- Should have appropriate color for the food";
             
    default:
      return "For \"" + particleName + "\":\n" +
             "- If it's a creature → It should MOVE like that creature (slither, hop, fly, crawl)\n" +
             "- If it's a liquid → It should FLOW in a distinctive way (thick, thin, sticky, etc.)\n" +
             "- If it's a gas → It should RISE and SPREAD in a characteristic pattern\n" +
             "- If it's an object → Its behavior should REFLECT its real-world properties";
  }
}

/**
 * Get a TNT example for the prompt
 * @param {string} particleType - The type of particle
 * @returns {string} - Example for TNT behavior
 */
function getTNTExample(particleType) {
  // Always include the TNT example
  return "For TNT (example for explosive):\n" +
  "```\n" +
  "// TNT falls like a solid until it's triggered\n" +
  "if (bordering(x, y, i, FIRE)) {\n" +
  "  // When TNT touches fire, it explodes\n" +
  "  // Create an explosion by setting surrounding pixels to FIRE\n" +
  "  gameImagedata32[i] = FIRE; // Center becomes fire\n" +
  "  \n" +
  "  // Create explosion pattern\n" +
  "  if (i+1 < gameImagedata32.length) gameImagedata32[i+1] = FIRE;\n" +
  "  if (i-1 >= 0) gameImagedata32[i-1] = FIRE;\n" +
  "  if (i+width < gameImagedata32.length) gameImagedata32[i+width] = FIRE;\n" +
  "  if (i-width >= 0) gameImagedata32[i-width] = FIRE;\n" +
  "  \n" +
  "  // Larger explosion\n" +
  "  if (i+width+1 < gameImagedata32.length) gameImagedata32[i+width+1] = FIRE;\n" +
  "  if (i+width-1 < gameImagedata32.length) gameImagedata32[i+width-1] = FIRE;\n" +
  "  if (i-width+1 >= 0) gameImagedata32[i-width+1] = FIRE;\n" +
  "  if (i-width-1 >= 0) gameImagedata32[i-width-1] = FIRE;\n" +
  "} else {\n" +
  "  // Normal behavior - fall like sand\n" +
  "  doGravity(x, y, i, true, 0.9);\n" +
  "}\n" +
  "```\n";
}

/**
 * Get relevant examples based on particle type
 * @param {string} particleType - The type of particle
 * @returns {string} - Example behaviors for this type
 */
function getRelevantExamples(particleType) {
  let examples = "";
  
  // Add specific examples based on type
  switch(particleType) {
    case 'liquid':
      examples += "For ACID (example for liquid):\n" +
      "```\n" +
      "// Acid is a corrosive liquid that dissolves materials\n" +
      "doDensityLiquid(x, y, i, WATER, 0.8, 0.6); // Heavier than water, flows well\n" +
      "\n" +
      "// Dissolve materials it touches\n" +
      "if (bordering(x, y, i, SAND) && random() < 0.1) {\n" +
      "  // Find the sand particle and dissolve it\n" +
      "  const positions = [1, -1, width, -width, width+1, width-1, -width+1, -width-1];\n" +
      "  for (let j = 0; j < positions.length; j++) {\n" +
      "    if (i + positions[j] >= 0 && i + positions[j] < gameImagedata32.length) {\n" +
      "      if (gameImagedata32[i + positions[j]] === SAND) {\n" +
      "        gameImagedata32[i + positions[j]] = BACKGROUND;\n" +
      "        break;\n" +
      "      }\n" +
      "    }\n" +
      "  }\n" +
      "}\n" +
      "```\n";
      break;
      
    case 'gas':
      examples += "For HELIUM (example for gas):\n" +
      "```\n" +
      "// Helium is a light gas that rises quickly\n" +
      "doRise(x, y, i, 0.95, 0.8); // Very high chance to rise and spread\n" +
      "\n" +
      "// Sometimes disappears (escapes atmosphere)\n" +
      "if (random() < 0.01) {\n" +
      "  gameImagedata32[i] = BACKGROUND;\n" +
      "}\n" +
      "\n" +
      "// Creates upward force on adjacent particles\n" +
      "if (above(y, i, SAND) && random() < 0.2) {\n" +
      "  // Try to lift sand (simulating balloon effect)\n" +
      "  gameImagedata32[i] = SAND;\n" +
      "  gameImagedata32[i-width] = BACKGROUND;\n" +
      "}\n" +
      "```\n";
      break;
      
    case 'creature':
      examples += "For ANT (example for creature):\n" +
      "```\n" +
      "// Ants move in patterns, search for food, and follow walls\n" +
      "if (below(y, i, WALL) || below(y, i, SAND)) {\n" +
      "  // On a surface - move horizontally\n" +
      "  if (random() < 0.7) {\n" +
      "    // Move left or right\n" +
      "    if (random() < 0.5 && x > 0) {\n" +
      "      // Move left if possible\n" +
      "      if (gameImagedata32[i-1] === BACKGROUND) {\n" +
      "        gameImagedata32[i] = BACKGROUND;\n" +
      "        gameImagedata32[i-1] = ANT; // Reference to current element\n" +
      "      }\n" +
      "    } else if (x < width-1) {\n" +
      "      // Move right if possible\n" +
      "      if (gameImagedata32[i+1] === BACKGROUND) {\n" +
      "        gameImagedata32[i] = BACKGROUND;\n" +
      "        gameImagedata32[i+1] = PLANT; // Using PLANT as ANT\n" +
      "      }\n" +
      "    }\n" +
      "  }\n" +
      "} else {\n" +
      "  // Not on surface - fall down\n" +
      "  doGravity(x, y, i, true, 1.0);\n" +
      "}\n" +
      "```\n";
      break;
      
    default:
      // For other types, use a generic example
      examples += "For HONEY (example for viscous substance):\n" +
      "```\n" +
      "// Honey is extremely viscous (thick and slow-flowing)\n" +
      "if (random() < 0.3) { // Moves much slower than water\n" +
      "  // Very thick liquid that prefers to stick together\n" +
      "  doDensityLiquid(x, y, i, WATER, 0.95, 0.15);\n" +
      "}\n" +
      "\n" +
      "// Sometimes sticks to things it touches\n" +
      "if (adjacent(x, i, SAND) && random() < 0.01) {\n" +
      "  // Create sticky connections\n" +
      "  gameImagedata32[i] = SAND;\n" +
      "}\n" +
      "```\n";
  }
  
  return examples;
}

/**
 * Get a specific example for certain particle types
 * @param {string} particleName - The name of the particle
 * @returns {string} - A targeted example for this specific particle
 */
function getSpecificExampleFor(particleName) {
  const name = particleName.toUpperCase();
  
  // Hair example
  if (name.includes('HAIR')) {
    return "For HAIR (specific example):\n" +
    "```\n" +
    "// Hair has distinct properties - it falls, can be blown by wind, burns, and is affected by water\n" +
    "if (adjacent(x, i, FIRE)) {\n" +
    "  // Hair burns quickly when exposed to fire\n" +
    "  if (random() < 0.8) {\n" +
    "    gameImagedata32[i] = FIRE;\n" +
    "  }\n" +
    "} else if (adjacent(x, i, WATER)) {\n" +
    "  // Hair becomes wet and clumps together in water\n" +
    "  doGravity(x, y, i, false, 0.95); // Falls straight down when wet\n" +
    "} else {\n" +
    "  // Normal behavior - hair strands hang and can move slightly\n" +
    "  if (below(y, i, BACKGROUND) && random() < 0.2) {\n" +
    "    // Sometimes hair strands drift slightly\n" +
    "    if (random() < 0.5 && gameImagedata32[i+1] === BACKGROUND) {\n" +
    "      gameImagedata32[i] = BACKGROUND;\n" +
    "      gameImagedata32[i+1] = PLANT; // Using PLANT as reference for HAIR\n" +
    "    } else if (gameImagedata32[i-1] === BACKGROUND) {\n" +
    "      gameImagedata32[i] = BACKGROUND;\n" +
    "      gameImagedata32[i-1] = PLANT; // Using PLANT as reference for HAIR\n" +
    "    }\n" +
    "  } else {\n" +
    "    // Hair falls but can catch on things\n" +
    "    doGravity(x, y, i, true, 0.7);\n" +
    "  }\n" +
    "}\n" +
    "```\n";
  }
  
  // Metal example  
  if (name.includes('METAL') || name.includes('IRON') || name.includes('STEEL')) {
    return "For METAL (specific example):\n" +
    "```\n" +
    "// Metal is heavy, conducts heat, and melts at high temperatures\n" +
    "if (adjacent(x, i, LAVA) || (adjacent(x, i, FIRE) && random() < 0.01)) {\n" +
    "  // Metal melts when exposed to extreme heat (rarely with fire, always with lava)\n" +
    "  gameImagedata32[i] = LAVA;\n" +
    "} else if (adjacent(x, i, FIRE)) {\n" +
    "  // Metal conducts heat to nearby metal\n" +
    "  const positions = [1, -1, width, -width];\n" +
    "  for (let pos of positions) {\n" +
    "    if (i + pos >= 0 && i + pos < gameImagedata32.length) {\n" +
    "      // Heat propagation - chance to turn adjacent metal hot\n" +
    "      if (gameImagedata32[i + pos] === METAL && random() < 0.1) {\n" +
    "        // This would be a visual effect showing heat, but we can't reference METAL directly\n" +
    "        // so this is a placeholder for the concept\n" +
    "      }\n" +
    "    }\n" +
    "  }\n" +
    "  // Metal falls faster than most materials\n" +
    "  doGravity(x, y, i, false, 0.99);\n" +
    "} else {\n" +
    "  // Heavy, falls quickly and straight down\n" +
    "  doGravity(x, y, i, false, 0.98);\n" +
    "}\n" +
    "```\n";
  }
  
  // Default - return empty string if no specific example
  return "";
}

/**
 * Generate a new particle using OpenAI's API
 * @param {string} particleName - The name of the particle to create
 * @returns {Promise} - A promise that resolves with the new particle data
 */
async function generateParticle(particleName) {
  if (!config.initialized) {
    throw new Error('OpenAI API not initialized. Please provide an API key.');
  }

  statusMessage = `Generating ${particleName} particle...`;
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      body: JSON.stringify({
        model: config.model,
        messages: [
          {
            role: 'user',
            content: generateParticlePrompt(particleName)
          }
        ],
        reasoning_effort: 'high'
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API Error: ${error.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Parse the JSON response
    try {
      // Extract JSON from the content in case the LLM includes additional text
      let jsonStr = content;
      
      // Try to extract JSON if it's surrounded by backticks or other characters
      const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || 
                        content.match(/```\s*([\s\S]*?)\s*```/) ||
                        content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
        // If we've extracted a JSON block, make sure it's just the JSON object
        if (jsonStr.startsWith('```')) {
          jsonStr = jsonMatch[1];
        }
      }
      
      // Clean up the string to ensure it's valid JSON
      jsonStr = jsonStr.trim();
      
      // Ensure the string starts with { and ends with }
      if (!jsonStr.startsWith('{') || !jsonStr.endsWith('}')) {
        console.warn('JSON string format issue, attempting to fix', jsonStr);
        // Try to extract just the JSON object
        const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
        if (objectMatch) {
          jsonStr = objectMatch[0];
        } else {
          throw new Error('Could not extract valid JSON from the response');
        }
      }
      
      const particleData = JSON.parse(jsonStr);
      
      // Verify the required fields are present
      if (!particleData.name || !particleData.color || !particleData.action_code) {
        throw new Error('Response missing required fields (name, color, or action_code)');
      }
      
      // Ensure the name matches what was requested (case insensitive)
      particleData.name = particleData.name.toUpperCase();
      if (particleData.name !== particleName.toUpperCase()) {
        console.warn(`LLM returned name ${particleData.name} instead of ${particleName}, correcting`);
        particleData.name = particleName.toUpperCase();
      }
      
      // Ensure color is in correct format
      if (!Array.isArray(particleData.color) || particleData.color.length !== 3) {
        throw new Error('Color must be an array of 3 numbers [r, g, b]');
      }
      
      // Ensure color values are in valid range
      particleData.color = particleData.color.map(c => {
        const val = parseInt(c);
        return Math.max(0, Math.min(255, val)); // Clamp between 0 and 255
      });
      
      // Validate that the particle is unique compared to existing ones
      const validationResult = validateUniqueParticle(particleData);
      if (!validationResult.isValid) {
        console.warn(`Generated particle too similar to existing particle: ${validationResult.message}`);
        // Try to adjust the color to make it more unique
        particleData.color = adjustColorForUniqueness(particleData.color, particleData.name);
        console.log(`Adjusted color to make ${particleData.name} more unique: ${particleData.color}`);
      }
      
      // Store the new particle
      customParticles[particleName] = particleData;
      statusMessage = `Successfully generated ${particleName} particle!`;
      return particleData;
    } catch (parseError) {
      console.error('Failed to parse response:', content);
      throw new Error(`Failed to parse OpenAI response: ${parseError.message}`);
    }
  } catch (error) {
    errorMessage = error.message;
    throw error;
  }
}

/**
 * Validate that a generated particle is unique compared to built-in elements
 * @param {Object} particleData - The particle data to validate
 * @returns {Object} - Validation result with isValid and message
 */
function validateUniqueParticle(particleData) {
  const [r, g, b] = particleData.color;
  
  // Standard element colors to compare against
  const standardColors = {
    FIRE: [255, 0, 10],
    WATER: [0, 10, 255],
    PLANT: [0, 220, 0],
    SAND: [223, 193, 99],
    WALL: [127, 127, 127],
    OIL: [150, 60, 0],
    LAVA: [245, 110, 40],
    ICE: [200, 200, 255]
  };
  
  // Check if color is too similar to any standard element
  for (const [elementName, [er, eg, eb]] of Object.entries(standardColors)) {
    // Calculate color distance (Euclidean distance in RGB space)
    const distance = Math.sqrt(
      Math.pow(r - er, 2) + 
      Math.pow(g - eg, 2) + 
      Math.pow(b - eb, 2)
    );
    
    // If color is too close to a standard element
    if (distance < 60) { // Threshold for similarity
      return {
        isValid: false,
        message: `Color [${r},${g},${b}] is too similar to ${elementName} [${er},${eg},${eb}]`
      };
    }
  }
  
  // Check if the action code is too similar to basic actions
  const code = particleData.action_code.toLowerCase();
  
  // Very simple actions that are too generic
  if (code.trim() === "dogravity(x, y, i, true, 0.9);" ||
      code.trim() === "dogravity(x, y, i, true, 1.0);") {
    return {
      isValid: false,
      message: "Action code is too simple/generic (just basic gravity)"
    };
  }
  
  // For anything matching a particle name, check if the code is overly focused on that behavior
  const name = particleData.name.toLowerCase();
  
  if (name.includes("fire") && code.includes("fire") && !code.includes("water") && !code.includes("sand")) {
    return {
      isValid: false,
      message: "Fire-like particle with too generic behavior"
    };
  }
  
  if (name.includes("water") && code.includes("densityliquid") && code.length < 50) {
    return {
      isValid: false,
      message: "Water-like particle with too generic behavior"
    };
  }
  
  // Default is valid
  return { isValid: true, message: "Particle is unique" };
}

/**
 * Adjust color to make it more unique compared to standard elements
 * @param {Array} color - Original [r,g,b] color array
 * @param {string} name - Particle name
 * @returns {Array} - Adjusted color array
 */
function adjustColorForUniqueness(color, name) {
  let [r, g, b] = color;
  const nameUpper = name.toUpperCase();
  
  // Shift color based on name to create more distinctiveness
  if (nameUpper.includes('FIRE') || nameUpper.includes('FLAME')) {
    // Make it more purple/orange instead of pure red
    r = Math.min(255, r + 20);
    g = Math.min(255, g + 80); // More orange
    b = Math.min(255, b + 120); // More purple tint
  } else if (nameUpper.includes('WATER') || nameUpper.includes('LIQUID')) {
    // Make it more teal/cyan instead of pure blue
    r = Math.min(255, r + 40);
    g = Math.min(255, g + 150); // More cyan
    b = Math.max(150, b - 30); // Less pure blue
  } else if (nameUpper.includes('PLANT') || nameUpper.includes('LEAF')) {
    // Make it more bluish-green or yellow-green
    r = Math.min(255, r + 100); // More yellow
    g = Math.max(100, g - 70); // Less pure green
    b = Math.min(255, b + 40); // More blue tint
  } else {
    // General shift to make colors more vivid and unique
    const maxChannel = Math.max(r, g, b);
    const minChannel = Math.min(r, g, b);
    
    // Increase saturation
    if (maxChannel > 0) {
      const ratio = 255 / maxChannel;
      r = Math.round(r * ratio * 0.8);
      g = Math.round(g * ratio * 0.8);
      b = Math.round(b * ratio * 0.8);
    }
    
    // Add some complementary color to make it more distinct
    r = 255 - r;
    g = 255 - g;
    b = 255 - b;
  }
  
  // Ensure values are in valid range
  return [
    Math.max(0, Math.min(255, Math.round(r))),
    Math.max(0, Math.min(255, Math.round(g))),
    Math.max(0, Math.min(255, Math.round(b)))
  ];
}

/**
 * Get a custom particle by name
 * @param {string} particleName - The name of the particle
 * @returns {Object|null} - The particle data or null if not found
 */
function getCustomParticle(particleName) {
  return customParticles[particleName] || null;
}

/**
 * Get all custom particles
 * @returns {Object} - All custom particles
 */
function getAllCustomParticles() {
  return customParticles;
}

/**
 * Get current status message
 * @returns {string} - Current status message
 */
function getStatusMessage() {
  return statusMessage;
}

/**
 * Get current error message
 * @returns {string} - Current error message
 */
function getErrorMessage() {
  return errorMessage;
}

/**
 * Clear error message
 */
function clearErrorMessage() {
  errorMessage = '';
}

/**
 * Clear status message
 */
function clearStatusMessage() {
  statusMessage = '';
} 