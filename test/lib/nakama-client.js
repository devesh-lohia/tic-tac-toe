const WebSocket = require('ws');
const http = require('http');

class NakamaClient {
    constructor(username, host = 'localhost', port = 7350, httpKey = 'defaulthttpkey') {
        this.username = username;
        this.host = host;
        this.port = port;
        this.httpKey = httpKey;
        this.token = null;
        this.socket = null;
        this.messageQueue = [];
    }

    async callRpc(id, payload = {}) {
        return new Promise((resolve, reject) => {
            const data = JSON.stringify(JSON.stringify(payload));
            const options = {
                hostname: this.host,
                port: this.port,
                path: `/v2/rpc/${id}?http_key=${this.httpKey}`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(data)
                }
            };

            const req = http.request(options, (res) => {
                let body = '';
                res.on('data', d => body += d);
                res.on('end', () => {
                    if (res.statusCode !== 200) reject(new Error(`RPC ${id} Failed (${res.statusCode}): ${body}`));
                    else {
                        const result = JSON.parse(body);
                        resolve(result.payload ? JSON.parse(result.payload) : result);
                    }
                });
            });
            req.on('error', reject);
            req.write(data);
            req.end();
        });
    }

    async authenticate(browserId) {
        const result = await this.callRpc('authenticate_exclusive', { username: this.username, browser_id: browserId });
        this.token = result.token;
        return result;
    }

    async connect() {
        if (!this.token) throw new Error("Authentication required before connecting");
        return new Promise((resolve, reject) => {
            const url = `ws://${this.host}:${this.port}/ws?token=${this.token}&lang=en&status=true`;
            this.socket = new WebSocket(url);
            
            this.socket.on('open', resolve);
            this.socket.on('error', reject);
            this.socket.on('message', (data) => {
                try {
                    const msg = JSON.parse(data);
                    if (msg.match_data && msg.match_data.op_code !== undefined) {
                        msg.match_data.op_code = Number(msg.match_data.op_code);
                    }
                    this.messageQueue.push(msg);
                } catch (e) {}
            });
        });
    }

    send(data) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) throw new Error("Socket not connected");
        this.socket.send(JSON.stringify(data));
    }

    async waitForMessage(predicate, timeout = 10000) {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            const index = this.messageQueue.findIndex(predicate);
            if (index !== -1) {
                return this.messageQueue.splice(index, 1)[0];
            }
            await new Promise(r => setTimeout(r, 100));
        }

        console.error(`\n--- [DEBUG QUEUE DUMP for ${this.username}] ---`);
        console.error(JSON.stringify(this.messageQueue, null, 2));
        console.error("------------------------------------------");

        throw new Error(`Timeout waiting for message matching criteria in ${this.username}'s queue`);
    }

    async getApi(path) {
        if (!this.token) throw new Error("Authentication required for API calls");
        return new Promise((resolve, reject) => {
            const options = {
                hostname: this.host,
                port: this.port,
                path: `/v2/${path}`,
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            };

            const req = http.request(options, (res) => {
                let body = '';
                res.on('data', d => body += d);
                res.on('end', () => {
                    // Nakama returns 404 for empty list in some versions or missing records
                    if (res.statusCode === 404) resolve(null);
                    else if (res.statusCode !== 200) reject(new Error(`API GET ${path} Failed (${res.statusCode}): ${body}`));
                    else {
                        try {
                            resolve(JSON.parse(body));
                        } catch (e) {
                            reject(new Error(`Failed to parse API response: ${body}`));
                        }
                    }
                });
            });
            req.on('error', reject);
            req.end();
        });
    }

    async getStorage(collection, key, userId) {
        const path = `storage`;
        const body = JSON.stringify({
            object_ids: [{
                collection: collection,
                key: key,
                user_id: userId
            }]
        });

        return new Promise((resolve, reject) => {
            const options = {
                hostname: this.host,
                port: this.port,
                path: `/v2/${path}`,
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength(body)
                }
            };

            const req = http.request(options, (res) => {
                let resBody = '';
                res.on('data', d => resBody += d);
                res.on('end', () => {
                    if (res.statusCode !== 200) reject(new Error(`API POST ${path} Failed (${res.statusCode}): ${resBody}`));
                    else {
                        const result = JSON.parse(resBody);
                        if (result.objects && result.objects.length > 0) {
                            resolve(JSON.parse(result.objects[0].value));
                        } else {
                            resolve(null);
                        }
                    }
                });
            });
            req.on('error', reject);
            req.write(body);
            req.end();
        });
    }

    async getLeaderboard(leaderboardId, userId) {
        // Fetch more records to ensure we find the player
        const path = `leaderboard/${leaderboardId}?limit=100`;
        try {
            const result = await this.getApi(path);
            if (result && result.records) {
                const record = result.records.find(r => r.owner_id === userId);
                if (record && record.metadata) {
                    try {
                        record.metadata = JSON.parse(record.metadata);
                    } catch (e) {}
                }
                return record || null;
            }
        } catch (e) {
            console.error(`      ⚠️ Leaderboard fetch error: ${e.message}`);
        }
        return null;
    }

    disconnect() {
        if (this.socket) {
            this.socket.terminate();
        }
        this.messageQueue = [];
    }
}

module.exports = NakamaClient;
