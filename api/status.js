import { stats } from './mapper.js';

export default function handler(req, res) {
    const uptime = Date.now() - stats.startTime;

    // Convert uptime to readable string
    const seconds = Math.floor((uptime / 1000) % 60);
    const minutes = Math.floor((uptime / (1000 * 60)) % 60);
    const hours = Math.floor((uptime / (1000 * 60 * 60)) % 24);
    const days = Math.floor((uptime / (1000 * 60 * 60 * 24)));

    const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;

    res.status(200).json({
        status: 'Operational',
        uptime: uptimeString,
        total_requests: stats.totalRequests,
        requests_today: stats.requestsToday,
        json_downloads: stats.jsonDownloads,
        start_time: stats.startTime,
        region: process.env.VERCEL_REGION || 'dev'
    });
}
