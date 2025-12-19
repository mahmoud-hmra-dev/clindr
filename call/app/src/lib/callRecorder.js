'use strict';

const mysql = require('mysql2/promise');
const Logs = require('../logs');
const log = new Logs('CallRecorder');

// Defaults fall back to docker-compose service values if env not provided
const CALL_DB_HOST = process.env.CALL_DB_HOST || 'mysql_call';
const CALL_DB_PORT = Number(process.env.CALL_DB_PORT) || 3306;
const CALL_DB_NAME = process.env.CALL_DB_NAME || 'clindoctor_call';
const CALL_DB_USER = process.env.CALL_DB_USER || 'clindoctor';
const CALL_DB_PASSWORD = process.env.CALL_DB_PASSWORD || 'clindoctorpass';

const enabled = !!(CALL_DB_HOST && CALL_DB_NAME && CALL_DB_USER && CALL_DB_PASSWORD);
let pool = null;

// track socket -> call data to log leave events
const peerIndex = new Map();

async function init() {
    if (!enabled) {
        log.info('Call DB disabled (missing env). Skipping recorder init.');
        return;
    }

    try {
        pool = mysql.createPool({
            host: CALL_DB_HOST,
            port: CALL_DB_PORT,
            user: CALL_DB_USER,
            password: CALL_DB_PASSWORD,
            database: CALL_DB_NAME,
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
        });

        await pool.query(`
            CREATE TABLE IF NOT EXISTS call_events (
                id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                call_id VARCHAR(191) NOT NULL,
                peer_id VARCHAR(191) NOT NULL,
                peer_uuid VARCHAR(191) DEFAULT NULL,
                peer_name VARCHAR(191) DEFAULT NULL,
                event_type ENUM('join','leave') NOT NULL,
                metadata JSON NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_call_id (call_id),
                INDEX idx_peer_id (peer_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS call_messages (
                id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                call_id VARCHAR(191) NOT NULL,
                peer_id VARCHAR(191) NOT NULL,
                peer_uuid VARCHAR(191) DEFAULT NULL,
                peer_name VARCHAR(191) DEFAULT NULL,
                message TEXT NOT NULL,
                msg_to VARCHAR(191) DEFAULT NULL,
                is_private TINYINT(1) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_call_msg_call (call_id),
                INDEX idx_call_msg_peer (peer_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS call_files (
                id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
                call_id VARCHAR(191) NOT NULL,
                peer_id VARCHAR(191) NOT NULL,
                peer_uuid VARCHAR(191) DEFAULT NULL,
                peer_name VARCHAR(191) DEFAULT NULL,
                file_name VARCHAR(255) NOT NULL,
                file_size BIGINT UNSIGNED NOT NULL,
                file_type VARCHAR(191) DEFAULT NULL,
                broadcast TINYINT(1) DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_call_file_call (call_id),
                INDEX idx_call_file_peer (peer_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        `);

        log.info('Call recorder DB initialized');
    } catch (err) {
        log.error('Failed to initialize call recorder DB', err);
        pool = null;
    }
}

async function logEvent({ callId, peerId, peerUuid, peerName, eventType, metadata = null }) {
    if (!pool) return;
    try {
        await pool.execute(
            `INSERT INTO call_events (call_id, peer_id, peer_uuid, peer_name, event_type, metadata)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [callId, peerId, peerUuid || null, peerName || null, eventType, metadata ? JSON.stringify(metadata) : null]
        );
    } catch (err) {
        log.error('Error logging call event', { err: err.message, callId, peerId, eventType });
    }
}

function registerJoin({ socketId, callId, peerUuid, peerName }) {
    peerIndex.set(socketId, { callId, peerUuid, peerName });
    return logEvent({ callId, peerId: socketId, peerUuid, peerName, eventType: 'join' });
}

function registerLeave(socketId) {
    const info = peerIndex.get(socketId);
    if (!info) return;
    peerIndex.delete(socketId);
    const { callId, peerUuid, peerName } = info;
    return logEvent({ callId, peerId: socketId, peerUuid, peerName, eventType: 'leave' });
}

async function logMessage({ callId, peerId, peerUuid, peerName, message, msgTo, isPrivate }) {
    if (!pool) return;
    try {
        await pool.execute(
            `INSERT INTO call_messages (call_id, peer_id, peer_uuid, peer_name, message, msg_to, is_private)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [callId, peerId, peerUuid || null, peerName || null, message, msgTo || null, isPrivate ? 1 : 0]
        );
    } catch (err) {
        log.error('Error logging call message', { err: err.message, callId, peerId });
    }
}

async function logFile({ callId, peerId, peerUuid, peerName, fileName, fileSize, fileType, broadcast }) {
    if (!pool) return;
    try {
        await pool.execute(
            `INSERT INTO call_files (call_id, peer_id, peer_uuid, peer_name, file_name, file_size, file_type, broadcast)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [callId, peerId, peerUuid || null, peerName || null, fileName, fileSize, fileType || null, broadcast ? 1 : 0]
        );
    } catch (err) {
        log.error('Error logging call file', { err: err.message, callId, peerId, fileName });
    }
}

async function getMessages(callId, limit = 100, offset = 0) {
    if (!pool) {
        log.warn('DB pool not initialized when fetching messages', { callId });
        return [];
    }
    try {
        const [rows] = await pool.execute(
            `SELECT id, call_id, peer_id, peer_uuid, peer_name, msg_to, is_private, message, created_at
             FROM call_messages
             WHERE call_id = ?
             ORDER BY id DESC
             LIMIT ? OFFSET ?`,
            [callId, Number(limit), Number(offset)]
        );
        log.debug('Fetched messages', { callId, count: rows.length });
        return rows;
    } catch (err) {
        log.error(
            `Error fetching messages: ${err && err.message ? err.message : 'unknown'}`,
            {
                code: err.code,
                errno: err.errno,
                sqlMessage: err.sqlMessage,
                callId,
                limit,
                offset,
                stack: err.stack,
            }
        );
        return [];
    }
}

async function getFiles(callId, limit = 100, offset = 0) {
    if (!pool) {
        log.warn('DB pool not initialized when fetching files', { callId });
        return [];
    }
    try {
        const [rows] = await pool.execute(
            `SELECT id, call_id, peer_id, peer_uuid, peer_name, file_name, file_size, file_type, broadcast, created_at
             FROM call_files
             WHERE call_id = ?
             ORDER BY id DESC
             LIMIT ? OFFSET ?`,
            [callId, Number(limit), Number(offset)]
        );
        log.debug('Fetched files', { callId, count: rows.length });
        return rows;
    } catch (err) {
        log.error(
            `Error fetching files: ${err && err.message ? err.message : 'unknown'}`,
            {
                code: err.code,
                errno: err.errno,
                sqlMessage: err.sqlMessage,
                callId,
                limit,
                offset,
                stack: err.stack,
            }
        );
        return [];
    }
}

module.exports = {
    init,
    registerJoin,
    registerLeave,
    logMessage,
    logFile,
    getMessages,
    getFiles,
};
