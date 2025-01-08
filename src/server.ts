import express, { Application } from 'express';
import http from 'http';
import { uptime } from 'process';
import { Server } from 'socket.io';

class App {
    private app: Application;
    private http: http.Server;
    private io: Server;

    // Propriedades para estatísticas
    private totalClientes: number;
    private quantidadeMensagens: number;
    private tempoAtivoServer: Date;

    constructor() {
        this.app = express();
        this.http = http.createServer(this.app);
        this.io = new Server(this.http);

        // Inicialização das estatísticas
        this.totalClientes = 0;
        this.quantidadeMensagens = 0;
        this.tempoAtivoServer = new Date();

        this.listenSocket();
        this.setupRoutes();
    }

    listenServer() {
        this.http.listen(3000, () => console.log('Server is running on PORT 3000'));
    }

    listenSocket() {
        this.io.on('connection', (socket) => {
            this.totalClientes++;
            console.log('User connect =>', socket.id);
            console.log(`Total de clientes conectados: ${this.totalClientes}`);

            socket.on('message', (msg) => {
                this.quantidadeMensagens++;
                console.log(`Mensagem recebida: ${msg}`);

                const message = msg.trim();
                let response: string = 'Comando inválido.';

                // Inverter texto
                if (message.startsWith('invert ')) {
                    const inverterTexto = message.replace('invert ', '');
                    response = `Comando inverter: ${inverterTexto.split('').reverse().join('')}`;
                }
                // Contar caracteres
                else if (message.startsWith('count ')) {
                    const contarTexto = message.replace('count ', '');
                    response = `Comando contar: ${contarTexto.length}`;
                }
                // Somar números
                else if (/^\d+(\s+\d+)*$/.test(message)) {
                    const numeros = message.split(' ').map(Number);
                    const soma = numeros.reduce((acc, num) => acc + num, 0);
                    response = `Comando somar: ${soma}`;
                }

                // Emitir a resposta
                this.io.emit('message', response);

                const formatUptime = (startTime: Date)=>{
                    const diff = Math.floor((Date.now() - startTime.getTime()) / 1000)
                    const hour = Math.floor(diff / 3600)
                    const minutes = Math.floor((diff % 3600) / 60)
                    const seconds = diff % 60
                    return `${hour}h ${minutes}m ${seconds}s`
                }

                // Atualizando as estatísticas
                this.io.emit('updateStats', {
                    totalClients: this.totalClientes,
                    messageCount: this.quantidadeMensagens,
                    uptime: formatUptime(this.tempoAtivoServer),
                });
            });

            socket.on('disconnect', () => {
                this.totalClientes--;
                console.log(`User disconnected => ${socket.id}`);
                console.log(`Total de clientes conectados: ${this.totalClientes}`);
            });
        });
    }

    setupRoutes() {
        this.app.get('/', (req, res) => {
            res.sendFile(__dirname + '/index.html');
        });
    }
}

const app = new App();
app.listenServer();
