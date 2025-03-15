# Falling Sand Game with OpenAI LLM Integration

This is a modified version of the classic falling sand game with an OpenAI LLM integration that allows you to create custom particles by simply typing their names.

## How to Play

1. Open `saved_resource.html` in your web browser
2. Use the element buttons to select different materials
3. Click and drag on the canvas to place elements
4. Experiment with different interactions between elements

## Using the OpenAI LLM Integration

### Setup

1. Click the ⚙️ (gear) button in the LLM input area
2. Enter your OpenAI API key in the settings dialog
3. Click "Save API Key"

### Creating Custom Particles

1. Type the name of a new particle you want to create in the input box (e.g., "MERCURY", "SLIME", "ACID")
2. Click "Generate Particle" or press Enter
3. Wait for the LLM to generate your particle (this may take a few seconds)
4. Once generated, your new particle will appear in the "Custom Particles" section
5. Click on your new particle to select it and use it in the game

## Technical Details

The LLM integration uses OpenAI's o3-mini model to generate new particles with:
- Unique colors and visual properties
- Physical behaviors (falling, floating, static)
- Detailed interactions with existing particles
- Custom JavaScript code for the particle's action function

## Examples of Custom Particles to Try

- MERCURY - A heavy liquid metal
- ACID - Dissolves various materials
- HONEY - A viscous sticky substance
- CLOUD - Floats and produces rain
- MAGMA - Extremely hot liquid rock
- SLIME - A bouncy, stretchy material
- ELECTRICITY - Conducts through metals
- GLASS - Transparent material that can be melted
- BUBBLE - Rises through liquids and pops
- RADIOACTIVE - Decays and affects nearby particles

## Credits

- Original Falling Sand Game by Josh Don
- OpenAI LLM Integration added by [Your Name]

## Requirements

- A modern web browser with JavaScript enabled
- An OpenAI API key for creating custom particles 