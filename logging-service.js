// servico-logging-service.js
const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

let porta = 8086;
app.listen(porta, () => {
    console.log('Serviço de logging em execução na porta: ' + porta);
});

const dbPath = path.join(__dirname, 'logs.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.log('Erro ao conectar ao banco de dados:', err.message);
    } else {
        console.log('Conectado ao banco de dados logs.db');
    }
});

db.run(`CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    idAlarme TEXT,
    idUsuario TEXT,
    evento TEXT,
    timestamp TEXT
)`);

// URLs dos serviços de verificação
const ALARMES_SERVICE_URL = 'http://localhost:8082/alarmes';
const USUARIOS_SERVICE_URL = 'http://localhost:8081/usuarios';

// POST /logs - registra um log com verificação
app.post('/logs', async (req, res) => {
    const { idAlarme, idUsuario, evento, timestamp } = req.body;

    if (!idAlarme || !evento || !timestamp) {
        return res.status(400).json({ error: 'Campos obrigatórios: idAlarme, evento, timestamp.' });
    }

    try {
        // Verifica se o alarme existe
        const alarmeRes = await axios.get(`${ALARMES_SERVICE_URL}/${idAlarme}`).catch(() => null);
        if (!alarmeRes || !alarmeRes.data) {
            return res.status(404).json({ error: 'Alarme não encontrado.' });
        }

        // Verifica se o usuário existe, se informado
        if (idUsuario) {
            const usuarioRes = await axios.get(`${USUARIOS_SERVICE_URL}/${idUsuario}`).catch(() => null);
            if (!usuarioRes || !usuarioRes.data) {
                return res.status(404).json({ error: 'Usuário não encontrado.' });
            }
        }

        const sql = `INSERT INTO logs (idAlarme, idUsuario, evento, timestamp) VALUES (?, ?, ?, ?)`;
        const params = [idAlarme, idUsuario, evento, timestamp];

        db.run(sql, params, function (err) {
            if (err) {
                console.error('Erro ao registrar log:', err.message);
                res.status(500).json({ error: 'Erro ao registrar log.' });
            } else {
                res.status(201).json({ message: 'Log registrado com sucesso.', id: this.lastID });
            }
        });
    } catch (err) {
        console.error('Erro durante verificação de alarme/usuário:', err.message);
        res.status(500).json({ error: 'Erro ao verificar dados antes de registrar log.' });
    }
});

// GET /logs - retorna todos os logs
app.get('/logs', (req, res) => {
    db.all(`SELECT * FROM logs ORDER BY timestamp DESC`, [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: 'Erro ao recuperar logs.' });
        } else {
            res.status(200).json(rows);
        }
    });
});
