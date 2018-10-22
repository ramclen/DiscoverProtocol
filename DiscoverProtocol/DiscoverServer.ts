import { messages, port } from './ProtocolInformation';
const dgram = require('dgram');

export default class DiscoverServer {
    private connection: any;
    private process: NodeJS.Timeout;
    private serverProtocol: ServerProtocol;

    constructor(id: string, information: any) {
        this.connection = dgram.createSocket('udp4');
        this.connection.bind(port);
        this.serverProtocol = new ServerProtocol(id, information);
    }

    run(): void {
        this.connection.on('message', (msg, rinfo) => {
            const clientInfo = new ClientInfo(rinfo.address, rinfo.port);
            this.send(this.serverProtocol.actionMap[msg](msg, clientInfo), clientInfo);
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
        this.connection.send(msg, clientInfo.address, clientInfo.port);
    }

}

class ServerProtocol {
    private id: string;
    private information: any;
    private name: string = 'DISCOVER';
    private connections: Array<ClientInfo>;
    public actionMap: any = {
        [messages.client.discover(this.name)] : this.handsake,
        [messages.client.handsake(this.name, this.id)] : this.acceptHandsake,
        [messages.client.requestInformation(this.name)] : this.sendInformation,
        [messages.common.ACK(this.name)] : this.finishConnection,
    };

    constructor(id: string, information: any) {
        this.id = id;
        this.information = information;
    }

    private finishConnection(msg: string, clientInfo: ClientInfo): string {
        return this.executeProtocolStep(messages.common.ACK(this.name), clientInfo, ProtocolSteps.REQUEST_INFORMATION);
    }

    private sendInformation(msg: string, clientInfo: ClientInfo): string {
        return this.executeProtocolStep(messages.server.sendInformation(this.name, this.information), clientInfo, ProtocolSteps.HANDSAKE);
    }

    private acceptHandsake(msg: string, clientInfo: ClientInfo): string {
        return this.executeProtocolStep(messages.server.acceptHandsake(this.name, this.id), clientInfo, ProtocolSteps.DISCOVER);
    }

    private handsake(msg: string, clientInfo: ClientInfo): string {
        clientInfo.step = ProtocolSteps.DISCOVER;
        this.connections.push(clientInfo);
        return messages.server.discoverRecived(this.name);
    }

    private executeProtocolStep(msg: string, clientInfo: ClientInfo, expectedStep: ProtocolSteps): string {
        if (!this.checkProtocol(clientInfo, expectedStep)) {
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


class ClientInfo {
    public address: string;
    public port: number;
    public step: ProtocolSteps;

    constructor(address: string, _port: number, step: ProtocolSteps = ProtocolSteps.HANDSAKE) {
        this.address = address;
        this.port = _port;
        this.step = step;
    }

    public sameClient(clientInfo: ClientInfo): boolean {
        return (clientInfo.address === this.address) && (clientInfo.port === this.port);
    }
}

enum ProtocolSteps {
    DISCOVER = 0,
    HANDSAKE = 1,
    REQUEST_INFORMATION = 2,
    ACK = 3
}
