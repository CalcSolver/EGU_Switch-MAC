const express = require('express');
const app = express();
const path = require('path');
const robot = require('robotjs');
const os = require('os'); 
const fs = require('fs'); // Node's file system module to read your switch file

const http = require('http').createServer(app);
const io = require('socket.io')(http);

app.use(express.static(path.join(__dirname, 'public')));
const screenSize = robot.getScreenSize();

// File path for the kill switch
const switchFilePath = path.join(__dirname, 'server.gitignore');

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

// KILL SWITCH MONITOR: Checks the file every 1000ms (1 second)
setInterval(() => {
    if (fs.existsSync(switchFilePath)) {
        const fileContent = fs.readFileSync(switchFilePath, 'utf8').trim();
        
        // If the file explicitly does not say "Yes", kill the engine
        if (fileContent.toLowerCase() !== 'yes') {
            console.log('\n🛑 Kill-switch triggered via server.gitignore! Shutting down server immediately...');
            io.close();
            http.close(() => {
                process.exit(0); // Safely exits the Node.js process
            });
        }
    } else {
        // Fallback: Create the file if it goes missing so it doesn't crash
        fs.writeFileSync(switchFilePath, 'Yes');
    }
}, 1000);

io.on('connection', (socket) => {
    console.log('📱 iPad Connected via HTTP!');
    
    const streamInterval = setInterval(() => {
        try {
            const img = robot.screen.capture(0, 0, screenSize.width, screenSize.height);
            const buffer = Buffer.alloc(img.image.length);
            
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
    console.log(`🔒 Kill-switch active: Change server.gitignore to 'No' to stop.`);
    console.log(`--------------------------------------------------`);
    console.log(`🔗 Type this exact URL into your iPad's browser:`);
    console.log(`👉 http://${LOCAL_IP}:${PORT}`);
    console.log(`==================================================\n`);
});
