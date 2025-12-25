import 'dotenv/config';
import http from 'http';
import { URL } from 'url';
import fs from 'fs';
import path from 'path';
import handler from './api/index.js'; // Use the unified handler

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

    // Routing
    if (url.pathname === '/api/mapper' || url.pathname === '/api/status') {
        try {
            req.query = Object.fromEntries(url.searchParams);
            await handler(req, res);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    } else {
        // Serve Static Files (Simple implementation for local dev)
        // In Vercel, this is handled by `vercel.json` or public folder automatically.
        // For `npm run dev`, we need to serve it manually.

        let filePath = `./public${url.pathname}`;
        if (url.pathname === '/') filePath = './public/index.html';

        const extname = path.extname(filePath);
        let contentType = 'text/html';
        switch (extname) {
            case '.js': contentType = 'text/javascript'; break;
            case '.css': contentType = 'text/css'; break;
            case '.json': contentType = 'application/json'; break;
            case '.png': contentType = 'image/png'; break;
            case '.jpg': contentType = 'image/jpg'; break;
        }

        fs.readFile(filePath, (error, content) => {
            if (error) {
                if (error.code == 'ENOENT') {
                    res.writeHead(404);
                    res.end('File not found');
                } else {
                    res.writeHead(500);
                    res.end('Internal Server Error: ' + error.code);
                }
            } else {
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content, 'utf-8');
            }
        });
    }
});

const PORT = process.env.PORT || 7860;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running at http://localhost:${PORT}`);
    console.log(`📌 Mapper API: http://localhost:${PORT}/api/mapper?anilist_id=1`);
    console.log(`📂 Mappings File: http://localhost:${PORT}/mappings.json`);
    console.log(`📂 Master File: http://localhost:${PORT}/master_anime.json`);
    console.log(`📊 Status Page: http://localhost:${PORT}/`);
    console.log(`   (Listening on 0.0.0.0:${PORT})`);
    console.log(`🚀 DEPLOYMENT VERSION: 1.1 - ${new Date().toISOString()}`);
});
