import http from 'http';
import { URL } from 'url';
import handler from './api/mapper.js';

const server = http.createServer(async (req, res) => {
    // Parse URL
    const url = new URL(req.url, `http://${req.headers.host}`);

    // Add Express-like methods to res object
    let statusCode = 200;
    let jsonData = null;

    res.status = function (code) {
        statusCode = code;
        return this;
    };

    res.json = function (data) {
        jsonData = data;
        res.writeHead(statusCode, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
        return this;
    };

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Only handle /api/mapper requests
    if (url.pathname === '/api/mapper') {
        try {
            req.query = Object.fromEntries(url.searchParams);
            await handler(req, res);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    } else {
        res.status(404).json({ error: 'Not found' });
    }
});

const PORT = 3000;
server.listen(PORT, () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
    console.log(`📌 Test it: http://localhost:${PORT}/api/mapper?anilist_id=1`);
});
