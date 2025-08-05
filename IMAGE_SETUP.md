# Bugzapper Image Setup

## Setting Up Your Bug Image

To use your custom bug image in the Bugzapper game, follow these steps:

### 1. Create the Images Directory
Create a directory called `images` inside the `public` folder:
```
public/
├── images/
├── game.js
├── index.html
└── styles.css
```

### 2. Add Your Bug Image
Save your bug image as `bug.png` in the `public/images/` directory:
```
public/
├── images/
│   └── bug.png  <- Your bug image here
├── game.js
├── index.html
└── styles.css
```

### 3. Image Requirements
- **Format**: PNG (recommended) or JPG
- **Size**: Ideally 80x80 pixels or larger (the game will scale it automatically)
- **Background**: Transparent background works best, but solid background is fine
- **Shape**: Square or circular images work well

### 4. How It Works
The game will:
- Load the bug image when the game starts
- Scale the image based on bug size (large, medium, small)
- Rotate the bugs as they move around the screen
- Fall back to geometric shapes if the image fails to load

### 5. Customization Options
You can modify the image path in `game.js`:
- Change `'images/bug.png'` to your preferred path
- Add multiple bug images for variety
- Adjust the scale factors for different sizes

### 6. Testing
- Start the game server: `node server.js`
- Open `http://localhost:3000` in your browser
- The bugs should now appear as your custom image instead of purple shapes

### 7. Troubleshooting
If the bugs don't appear:
- Check the browser console for error messages
- Verify the image path is correct
- Make sure the image file exists and is readable
- The game will automatically fall back to geometric shapes if the image fails to load

## Game Changes Made
- Updated Asteroid class to support image rendering
- Added image loading and caching in Game class
- Implemented fallback to geometric shapes if image loading fails
- Added scaling based on bug size (large, medium, small)
- Maintained all original game functionality 