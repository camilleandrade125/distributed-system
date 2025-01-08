// server.ts
import express, { Application } from 'express';
import http from 'http';
import { Server } from 'socket.io';

interface MessageData {
    userName: string;
    message: string;
}

class App {
    private app: Application;
    private http: http.Server;
    private io: Server;
    private totalClientes: number;
    private quantidadeMensagens: number;
    private tempoAtivoServer: Date;

    constructor() {
        this.app = express();
        this.http = http.createServer(this.app);
        this.io = new Server(this.http, {
            cors: {
                origin: "*",
                methods: ["GET", "POST"]
            }
        });
        
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
            
            socket.on('message', (data: MessageData) => {
                this.quantidadeMensagens++;
                console.log(`Mensagem recebida de ${data.userName}: ${data.message}`);
                
                const message = data.message.trim();
                let response: string;

                // Processamento dos comandos
                if (message.startsWith('invert ')) {
                    const inverterTexto = message.replace('invert ', '');
                    response = `${data.userName}: Texto invertido: ${inverterTexto.split('').reverse().join('')}`;
                }
                else if (message.startsWith('count ')) {
                    const contarTexto = message.replace('count ', '');
                    response = `${data.userName}: Quantidade de caracteres: ${contarTexto.length}`;
                }
                else if (/^\d+(\s+\d+)*$/.test(message)) {
                    const numeros = message.split(' ').map(Number);
                    const soma = numeros.reduce((acc, num) => acc + num, 0);
                    response = `${data.userName}: Soma dos números: ${soma}`;
                }
                else {
                    response = `${data.userName}: ${message}`;
                }

                // Emite a mensagem para todos os clientes
                this.io.emit('message', response);
                
                // Atualiza estatísticas
                this.io.emit('updateStats', {
                    totalClients: this.totalClientes,
                    messageCount: this.quantidadeMensagens,
                    uptime: this.formatUptime(this.tempoAtivoServer),
                });
            });

            socket.on('disconnect', () => {
                this.totalClientes--;
                console.log(`User disconnected => ${socket.id}`);
            });
        });
    }

    private formatUptime(startTime: Date): string {
        const diff = Math.floor((Date.now() - startTime.getTime()) / 1000);
        const hour = Math.floor(diff / 3600);
        const minutes = Math.floor((diff % 3600) / 60);
        const seconds = diff % 60;
        return `${hour}h ${minutes}m ${seconds}s`;
    }

    setupRoutes() {
        this.app.get('/', (req, res) => {
            res.sendFile(__dirname + '/index.html');
        });
    }
}

const app = new App();
app.listenServer();