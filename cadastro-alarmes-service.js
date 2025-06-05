// Inicia o Express.js
const express = require('express');
const app = express();

// Body Parser
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Inicia o Servidor
let porta = 8082;
app.listen(porta, () => {
 console.log('Servidor em execução na porta: ' + porta);
});

// Importa o package do SQLite
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./database.db');

// Cria a tabela alarmes, caso ela não exista
db.run(`CREATE TABLE IF NOT EXISTS alarmes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    local_instalacao TEXT NOT NULL,
    pontos_monitorados TEXT, -- JSON com array de objetos contendo id e nome do ponto monitorado
    usuarios_permitidos TEXT, -- JSON com array de IDs,
    acionado BOOLEAN DEFAULT FALSE
    )`, [], (err) => {
        if (err) {
            console.log('ERRO: não foi possível criar tabela.');
            throw err;
        }
      });

// Método HTTP POST /alarmes - cadastra um novo alarme
app.post('/alarmes', (req, res) => {
    const { 
        local_instalacao,
        pontos_monitorados,
        usuarios_permitidos,
        acionado
    } = req.body;

    const pontosJSON = JSON.stringify(pontos_monitorados || []);
    const usuariosJSON = JSON.stringify(usuarios_permitidos || []);

    db.run(`INSERT INTO alarmes (local_instalacao, pontos_monitorados, usuarios_permitidos, acionado) VALUES (?, ?, ?, ?)`,
        [local_instalacao, pontosJSON, usuariosJSON, acionado], (err) => { 
        if (err) {
            console.log("Error: " + err);
            res.status(500).send('Erro ao cadastrar alarme.');
        } else {
            console.log('Alarme cadastrado com sucesso!');
            res.status(200).send('Alarme cadastrado com sucesso!');
        }
    });
});

// Método HTTP PATCH /alarmes/:id/pontos/adiciona - adiciona pontos monitorados
app.patch('/alarmes/:id/pontos/adiciona', (req, res) => {
    const { pontos } = req.body;

    if (!Array.isArray(pontos)) {
        return res.status(400).json({ error: 'Formato inválido. Esperado um array de pontos.' });
    }

    db.get(`SELECT pontos_monitorados FROM alarmes WHERE id = ?`, [req.params.id], (err, row) => {
        if (err) {
            console.log('Erro: ' + err);
            res.status(500).send('Erro ao obter dados.');
        } else if (!row) {
            res.status(404).send('Alarme não encontrado.');
        } else {
            const pontosAtuais = JSON.parse(row.pontos_monitorados || '[]');

            const idRepetido = (novo) =>
                pontosAtuais.some(p => p.id === novo.id);

            const novosPontos = pontos.filter(p => !idRepetido(p));

            if (novosPontos.length === 0) {
                return res.status(200).json({ message: 'Nenhum ponto novo foi adicionado.' });
            }

            const atualizados = [...pontosAtuais, ...novosPontos];

            db.run(`UPDATE alarmes SET pontos_monitorados = ? WHERE id = ?`,
                [JSON.stringify(atualizados), req.params.id],
                function (err) {
                    if (err) {
                        console.log("Error: " + err);
                        res.status(500).send('Erro ao salvar pontos.');
                    } else {
                        console.log('Pontos adicionados com sucesso.');
                        res.status(200).send('Pontos adicionados com sucesso.');
                    }
                }
            );
        }
    });
});

// Método HTTP PATCH /alarmes/:id/pontos/remove - remove pontos monitorados pelo
app.patch('/alarmes/:id/pontos/remove', (req, res) => {
    const { pontos } = req.body;

    if (!Array.isArray(pontos)) {
        return res.status(400).json({ error: 'Formato inválido. Esperado um array de pontos.' });
    }

    const idsParaRemover = pontos.map(p => p.id);

    db.get(`SELECT pontos_monitorados FROM alarmes WHERE id = ?`, [req.params.id], (err, row) => {
        if (err) {
            console.log('Erro: ' + err);
            res.status(500).send('Erro ao obter dados.');
        } else if (!row) {
            res.status(404).send('Alarme não encontrado.');
        } else {
            const pontosAtuais = JSON.parse(row.pontos_monitorados || '[]');

            const pontosFiltrados = pontosAtuais.filter(p => !idsParaRemover.includes(p.id));

            if (pontosFiltrados.length === pontosAtuais.length) {
                return res.status(200).json({ message: 'Nenhum ponto foi removido.' });
            }

            db.run(`UPDATE alarmes SET pontos_monitorados = ? WHERE id = ?`,
                [JSON.stringify(pontosFiltrados), req.params.id],
                function (err) {
                    if (err) {
                        console.log("Error: " + err);
                        res.status(500).send('Erro ao remover pontos.');
                    } else {
                        console.log('Pontos removidos com sucesso.');
                        res.status(200).send('Pontos removidos com sucesso.');
                    }
                }
            );
        }
    });
});

// Método HTTP PATCH /alarmes/:id/usuarios/adiciona - adiciona usuários permitido
app.patch('/alarmes/:id/usuarios/adiciona', (req, res) => {
    const { usuarios } = req.body;

    if (!Array.isArray(usuarios)) {
        return res.status(400).json({ error: 'Formato inválido. Esperado um array de usuários.' });
    }

    db.get(`SELECT usuarios_permitidos FROM alarmes WHERE id = ?`, [req.params.id], (err, row) => {
        if (err) {
            console.log('Erro: ' + err);
            res.status(500).send('Erro ao obter dados.');
        } else if (!row) {
            res.status(404).send('Alarme não encontrado.');
        } else {
            const usuariosAtuais = JSON.parse(row.usuarios_permitidos || '[]');

            const cpfExistente = (novo) =>
                usuariosAtuais.some(u => u.cpf === novo.cpf);

            const novosUsuarios = usuarios.filter(u => !cpfExistente(u));

            if (novosUsuarios.length === 0) {
                return res.status(200).json({ message: 'Nenhum usuário novo foi adicionado.' });
            }

            const atualizados = [...usuariosAtuais, ...novosUsuarios];

            db.run(`UPDATE alarmes SET usuarios_permitidos = ? WHERE id = ?`,
                [JSON.stringify(atualizados), req.params.id],
                function (err) {
                    if (err) {
                        console.log('Erro: ' + err);
                        res.status(500).send('Erro ao salvar usuários.');
                    } else {
                        console.log('Usuários adicionados com sucesso.');
                        res.status(200).send('Usuários adicionados com sucesso.');
                    }
                }
            );
        }
    });
});

// Método HTTP PATCH /alarmes/:id/usuarios/remove - remove usuários permitidos
app.patch('/alarmes/:id/usuarios/remove', (req, res) => {
    const { usuarios } = req.body;

    if (!Array.isArray(usuarios)) {
        return res.status(400).json({ error: 'Formato inválido. Esperado um array de usuários.' });
    }

    db.get(`SELECT usuarios_permitidos FROM alarmes WHERE id = ?`, [req.params.id], (err, row) => {
        if (err) {
            console.log('Erro: ' + err);
            res.status(500).send('Erro ao obter dados.');
        } else if (!row) {
            res.status(404).send('Alarme não encontrado.');
        } else {
            const usuariosAtuais = JSON.parse(row.usuarios_permitidos || '[]');
            const cpfsParaRemover = usuarios.map(u => u.cpf);

            const atualizados = usuariosAtuais.filter(u => !cpfsParaRemover.includes(u.cpf));

            if (atualizados.length === usuariosAtuais.length) {
                return res.status(200).json({ message: 'Nenhum usuário foi removido.' });
            }

            db.run(`UPDATE alarmes SET usuarios_permitidos = ? WHERE id = ?`,
                [JSON.stringify(atualizados), req.params.id],
                function (err) {
                    if (err) {
                        console.log('Erro: ' + err);
                        res.status(500).send('Erro ao remover usuários.');
                    } else {
                        console.log('Usuários removidos com sucesso.');
                        res.status(200).send('Usuários removidos com sucesso.');
                    }
                }
            );
        }
    });
});

// Método HTTP PATCH /alarmes/:id/acionado - alterna o valor de 'acionado' do alarme
app.patch('/alarmes/:id/acionado', (req, res) => {
    db.get(`SELECT acionado FROM alarmes WHERE id = ?`, [req.params.id], (err, row) => {
        if (err) {
            console.log('Erro: ' + err);
            res.status(500).send('Erro ao obter dados.');
        } else if (!row) {
            res.status(404).send('Alarme não encontrado.');
        } else {
            db.run(`UPDATE alarmes SET acionado = ? WHERE id = ?`, !row.acionado, function (err) {
            if (err) {
                console.log('Erro: ' + err);
                res.status(500).send('Erro ao atualizar alarme.');
            } else if (this.changes === 0) {
                res.status(404).send('Alarme não encontrado.');
            } else {
                console.log('Alarme atualizado com sucesso!');
                res.status(200).send('Alarme atualizado com sucesso!');
            }
        });
        }
    });
});

// Método HTTP GET /alarmes - retorna todos os alarmes
app.get('/alarmes', (req, res) => {
    db.all(`SELECT * FROM alarmes`, [], (err, result) => {
        if (err) {
             console.log("Erro: " + err);
             res.status(500).send('Erro ao obter dados.');
        } else {
            res.status(200).json(result);
        }
    });
});

// Método HTTP GET /alarmes/:id - retorna cadastro do alarme com base no ID
app.get('/alarmes/:id', (req, res) => {
    db.get(`SELECT * FROM alarmes WHERE id = ?`, [req.params.id], (err, row) => {
        if (err) {
            console.log('Erro: ' + err);
            res.status(500).send('Erro ao obter dados.');
        } else if (!row) {
            res.status(404).send('Alarme não encontrado.');
        } else {
            res.status(200).json(row);
        }
    });
});

//Método HTTP DELETE /alarmes/:id - remove um alarme do cadastro
app.delete('/alarmes/:id', (req, res) => {
    db.run(`DELETE FROM alarmes WHERE id = ?`, [req.params.id], function (err) {
        if (err) {
        res.status(500).send('Erro ao remover alarme.');
        } else if (this.changes === 0) {
        res.status(404).send('Alarme não encontrado.');
        } else {
        res.status(200).send('Alarme removido com sucesso!');
        }
    });
});