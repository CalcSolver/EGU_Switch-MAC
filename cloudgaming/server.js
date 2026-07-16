const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const robot = require('robotjs');
const path = require('path');

app.use(express.static(path.join(__dirname, 'public')));

// Logical screen size used for mouse coordinate mapping
const screenSize = robot.getScreenSize();

io.on('connection', (socket) => {
    console.log('📱 iPad Connected to Streaming Engine!');
    
    // 1. Capture and Stream Loop
    const streamInterval = setInterval(() => {
        try {
            // Grab a raw screen snapshot
            const img = robot.screen.capture(0, 0, screenSize.width, screenSize.height);
            
            // FIX RETINA GLITCH: Calculate exact pixel scaling factor
            // img.width reflects the true pixel resolution, screenSize.width is the logical point scale
            const scale = img.width / screenSize.width; 
            
            // RobotJS captures in BGRA format. Convert it to a usable format.
            // For a basic and lightweight local web transmission, we build a BMP or extract raw lines.
            // However, to keep it smooth and universally readable by canvas without 3rd party native image builders:
            const buffer = Buffer.alloc(img.image.length);
            
            // Fast byte swap from BGRA to RGBA for standard HTML canvas ingestion
            for (let i = 0; i < img.image.length; i += 4) {
                buffer[i]     = img.image[i + 2]; // R
                buffer[i + 1] = img.image[i + 1]; // G
                buffer[i + 2] = img.image[i];     // B
                buffer[i + 3] = img.image[i + 3]; // A
            }
            
            // Send the raw frame along with its true pixel dimensions
            socket.emit('screen-frame', {
                width: img.width,
                height: img.height,
                data: buffer
            });
        } catch (err) {
            // Suppress minor capture errors during window transitions
        }
    }, 60); // ~16 Frames Per Second (Perfect for local network control)

    // 2. Map iPad Touch Coordinates to Host Screen Coordinates
    socket.on('mouse-move', (data) => {
        const targetX = Math.min(Math.max(data.x * screenSize.width, 0), screenSize.width);
        const targetY = Math.min(Math.max(data.y * screenSize.height, 0), screenSize.height);
        robot.moveMouse(targetX, targetY);
    });

    socket.on('mouse-click', () => {
        robot.mouseClick();
    });

    socket.on('disconnect', () => {
        clearInterval(streamInterval);
        console.log('📱 iPad Disconnected');
    });
});

const PORT = 3000;
http.listen(PORT, () => {
    console.log(`🚀 Streaming Server running on port ${PORT}`);
    console.log(`🖥️ Screen Detected: ${screenSize.width}x${screenSize.height}`);
});
