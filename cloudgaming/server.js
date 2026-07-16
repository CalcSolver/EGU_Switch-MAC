const express = require('express');
const app = express();
const path = require('path');
const robot = require('robotjs');
const os = require('os'); 

// Create a standard HTTP server (No Certificates Required)
const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(path.join(__dirname, 'public')));
const screenSize = robot.getScreenSize();

// Helper function to get the Mac's Local IP Address
function getLocalIpAddress() {
    const interfaces = os.networkInterfaces();
    for (const interfaceName in interfaces) {
        for (const iface of interfaces[interfaceName]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

io.on('connection', (socket) => {
    console.log('📱 iPad Connected via HTTP!');
    
    const streamInterval = setInterval(() => {
        try {
            const img = robot.screen.capture(0, 0, screenSize.width, screenSize.height);
            const buffer = Buffer.alloc(img.image.length);
            
            // BGRA to RGBA Fix for Mac Retina
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
const LOCAL_IP = getLocalIpAddress();

http.listen(PORT, '0.0.0.0', () => {
    console.log(`\n==================================================`);
    console.log(`🚀 Server is successfully running!`);
    console.log(`🖥️  Screen Detected: ${screenSize.width}x${screenSize.height}`);
    console.log(`--------------------------------------------------`);
    console.log(`🔗 Type this exact URL into your iPad's browser:`);
    console.log(`👉 http://${LOCAL_IP}:${PORT}`); // Note: http, not https
    console.log(`==================================================\n`);
});
