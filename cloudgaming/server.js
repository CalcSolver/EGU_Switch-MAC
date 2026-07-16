const express = require('express');
const app = express();
const fs = require('fs');
const path = require('path');
const robot = require('robotjs');

// Read the generated trusted certificates
const httpsOptions = {
    key: fs.readFileSync(path.join(__dirname, 'key.pem')),
    cert: fs.readFileSync(path.join(__dirname, 'cert.pem'))
};

// Create a native HTTPS secure server
const http = require('https').createServer(httpsOptions, app);
const io = require('socket.io')(http);

app.use(express.static(path.join(__dirname, 'public')));
const screenSize = robot.getScreenSize();

io.on('connection', (socket) => {
    console.log('📱 iPad Connected securely via HTTPS!');
    
    const streamInterval = setInterval(() => {
        try {
            const img = robot.screen.capture(0, 0, screenSize.width, screenSize.height);
            const buffer = Buffer.alloc(img.image.length);
            
            // BGRA to RGBA Fix
            for (let i = 0; i < img.image.length; i += 4) {
                buffer[i]     = img.image[i + 2]; 
                buffer[i + 1] = img.image[i + 1]; 
                buffer[i + 2] = img.image[i];     
                buffer[i + 3] = img.image[i + 3]; 
            }
            
            socket.emit('screen-frame', {
                width: img.width,
                height: img.height,
                data: buffer
            });
        } catch (err) {}
    }, 60);

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
http.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Secure Server running on https://localhost:${PORT}`);
});
