import { messages, port, ProtocolSteps } from './ProtocolInformation';
import ClientInfo from './ClientInfo';
const dgram = require('dgram');

export default class UDPServer {
    private connection: any;
    private process: NodeJS.Timeout;
    private serverProtocol: ServerDiscoverProtocol;

    constructor(serverProtocol: ServerDiscoverProtocol) {
        this.connection = dgram.createSocket('udp4');
        this.connection.bind(port.server);
        this.serverProtocol =  serverProtocol;
    }

    run(): void {

        this.connection.on('listening', () => {
            this.connection.setBroadcast(true);
            const address = this.connection.address();
            console.log(`server listening ${address.address}:${address.port}`);
        })
        this.connection.on('message', (msg, rinfo) => {
            const clientInfo = new ClientInfo(rinfo.address, rinfo.port);

            console.log('message receive from: ')
            console.log(clientInfo.toString())
            console.log('information: ')
            console.log(msg.toString())
            if (this.serverProtocol.actionMap[msg]) {
                this.send(this.serverProtocol.actionMap[msg](clientInfo), clientInfo);
            } else {
                this.send(this.serverProtocol.actionMap.default(clientInfo), clientInfo);
            }
        })

        this.process = setInterval(() => {}, 1000)
    }

    stop(): void {
        if (this.process) {
            clearInterval(this.process)
        } else {
            throw new Error('Impossible stop, No server running!')
        }
    }

    private send(msg: string, clientInfo: ClientInfo): void {
        console.log('sending package to: ')
        console.log(clientInfo.toString())
        console.log('message : ')
        console.log(msg.toString())
        this.connection.send(msg, clientInfo.port, clientInfo.address);
    }

}

export class ServerDiscoverProtocol {
    private id: string;
    private information: any;
    private name: string = 'DISCOVER';
    private connections: Array<ClientInfo>;
    public actionMap: any;

    constructor(id: string, information: any) {
        this.id = id;
        this.information = information;
        this.connections = [];
        this.actionMap = this.buildActionMap();
    }

    buildActionMap(): any {
        return {
            [messages.client.discover(this.name)] : this.handsake.bind(this),
            [messages.client.handshake(this.name, this.id)] : this.acceptHandsake.bind(this),
            [messages.client.requestInformation(this.name)] : this.sendInformation.bind(this),
            [messages.common.ACK(this.name)] : this.finishConnection.bind(this),
            default: () => 'Protocol not implemented'
        };
    }

    private finishConnection(clientInfo: ClientInfo): string {
        return this.executeProtocolStep(messages.common.ACK(this.name), clientInfo, ProtocolSteps.REQUEST_INFORMATION);
    }

    private sendInformation(clientInfo: ClientInfo): string {
        return this.executeProtocolStep(messages.server.sendInformation(this.name, this.information), clientInfo, ProtocolSteps.HANDSHAKE);
    }

    private acceptHandsake(clientInfo: ClientInfo): string {
        return this.executeProtocolStep(messages.server.acceptHandshake(this.name, this.id), clientInfo, ProtocolSteps.DISCOVER);
    }

    private handsake(clientInfo: ClientInfo): string {
        clientInfo.step = ProtocolSteps.DISCOVER;
        this.connections.push(clientInfo);
        return messages.server.discoverReceived(this.name);
    }

    private executeProtocolStep(msg: string, clientInfo: ClientInfo, expectedStep: ProtocolSteps): string {
        if (this.checkProtocol(clientInfo, expectedStep)) {
            this.updateClientInfo(clientInfo);
            return msg;
        } else {
            return 'Wrong protocol implementation';
        }
    }

    private updateClientInfo(clientInfo: ClientInfo): void {
        const client = this.getClientConnection(clientInfo);
        client.step++;
        this.updateConnection(client);
    }

    private checkProtocol(clientInfo: ClientInfo, expectedStep: ProtocolSteps): boolean {
        if (!this.existsConnection(clientInfo) ) {
            return false;
        }

        if (this.getClientConnection(clientInfo).step !== expectedStep) {
            return false;
        }

        return true;
    }

    private updateConnection(clientInfo: ClientInfo): any {
        this.connections = this.connections.filter(element => element.sameClient(clientInfo))
        this.connections.push(clientInfo);
    }

    private existsConnection(clientInfo: ClientInfo): boolean {
        return this.getClientConnection(clientInfo) !== undefined;
    }

    private getClientConnection(clientInfo: ClientInfo): ClientInfo {
        return this.connections.find(element => (element.port === clientInfo.port) && (element.address === clientInfo.address));
    }
}




