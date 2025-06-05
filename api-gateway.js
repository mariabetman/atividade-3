const httpProxy = require('express-http-proxy');
const express = require('express');
const app = express();
var logger = require('morgan');

app.use(logger('dev'));

function selectProxyHost(req) {
    if (req.path.startsWith('/usuarios')) // Cadastro de Usuários
        return 'http://localhost:8081/';
    else if (req.path.startsWith('/alarmes')) // Cadastro de Alarmes
        return 'http://localhost:8082/';
    else if (req.path.startsWith('/acionamento')) // Controle de Acionamento
        return 'http://localhost:8083/';
    else if (req.path.startsWith('/disparo')) // Controle de Disparo
        return 'http://localhost:8084/';
    else if (req.path.startsWith('/notificacoes')) // Notificação de Usuários
        return 'http://localhost:8085/';
    else if (req.path.startsWith('/logs')) // Logging
        return 'http://localhost:8086/';
    else return null;
}

app.use((req, res, next) => {
    var proxyHost = selectProxyHost(req);
    if (proxyHost == null)
        res.status(404).send('Not found');
    else
        httpProxy(proxyHost)(req, res, next);
});

app.listen(8000, () => {
    console.log('API Gateway iniciado!');
});