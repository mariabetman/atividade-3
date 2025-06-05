// Inicia o Express.js
const express = require('express');
const app = express();

// Body Parser - usado para processar dados da requisição HTTP
const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Inicia o Servidor na porta 8080
let porta = 8081;
app.listen(porta, () => {
 console.log('Servidor em execução na porta: ' + porta);
});

// Importa o package do SQLite
const sqlite3 = require('sqlite3');

// Acessa o arquivo com o banco de dados
var db = new sqlite3.Database('./dados-usuarios.db', (err) => {
        if (err) {
            console.log('ERRO: não foi possível conectar ao SQLite.');
            throw err;
        }
        console.log('Conectado ao SQLite!');
    });

// Cria a tabela usuarios, caso ela não exista
db.run(`CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    cpf INTEGER NOT NULL UNIQUE,
    numero BIGINT(14) NOT NULL UNIQUE
    )`, [], (err) => {
        if (err) {
            console.log('ERRO: não foi possível criar a tabela.');
            throw err;
        }
    });

// Método HTTP POST /usuarios - cadastra um novo usuário
app.post('/usuarios', (req, res) => {
    db.run(`INSERT INTO usuarios(nome, email, cpf, numero) VALUES(?,?,?,?)`, 
        [req.body.nome, req.body.email, req.body.cpf, req.body.numero], (err) => {
        if (err) {
            console.log("Error: " + err);
            res.status(500).send('Erro ao cadastrar usuário.');
        } else {
            console.log('Usuário cadastrado com sucesso!');
            res.status(200).send('Usuário cadastrado com sucesso!');
        }
    });
});

// Método HTTP PATCH /usuarios/:id - atualiza parcialmente os dados de um usuário (exceto o CPF e o ID)
app.patch('/usuarios/:id', (req, res) => {
    let updates = [];
    let values = [];

    if (req.body.nome !== undefined) {
        updates.push('nome = ?');
        values.push(req.body.nome);
    }
    if (req.body.email !== undefined) {
        updates.push('email = ?');
        values.push(req.body.email);
    }
    if (req.body.numero !== undefined) {
        updates.push('numero = ?');
        values.push(req.body.numero);
    }

    values.push(req.params.id);

    if (updates.length === 0) {
        return res.status(400).send('Nenhum campo válido para atualização fornecido.');
    }

    const query = `UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`;

    db.run(query, values, function (err) {
        if (err) {
            console.log('Erro: ' + err);
            res.status(500).send('Erro ao atualizar usuário.');
        } else if (this.changes === 0) {
            res.status(404).send('Usuário não encontrado.');
        } else {
            console.log('Usuário atualizado com sucesso!');
            res.status(200).send('Usuário atualizado com sucesso!');
        }
    });
});

// Método HTTP GET /usuarios - retorna todos os cadastros
app.get('/usuarios', (req, res) => {
    db.all(`SELECT * FROM usuarios`, [], (err, result) => {
        if (err) {
            console.log("Erro: " + err);
            res.status(500).send('Erro ao obter dados.');
        } else {
            res.status(200).json(result);
        }
    });
});

// Método HTTP GET /usuarios/:id - retorna cadastro do usuário com base no ID
app.get('/usuarios/:id', (req, res) => {
    db.get(`SELECT * FROM usuarios WHERE id = ?`, [req.params.id], (err, row) => {
        if (err) {
            console.log('Erro: ' + err);
            res.status(500).send('Erro ao obter dados.');
        } else if (!row) {
            res.status(404).send('Usuário não encontrado.');
        } else {
            res.status(200).json(row);
        }
    });
});

//Método HTTP DELETE /usuarios/:id - remove um usuário do cadastro
app.delete('/usuarios/:id', (req, res) => {
    db.run(`DELETE FROM usuarios WHERE id = ?`, [req.params.id], function (err) {
        if (err) {
            res.status(500).send('Erro ao remover usuário.');
        } else if (this.changes === 0) {
            res.status(404).send('Usuário não encontrado.');
        } else {
            res.status(200).send('Usuário removido com sucesso!');
        }
    });
});
