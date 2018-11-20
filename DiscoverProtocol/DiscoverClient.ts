import * as dgram from 'dgram';
import { Socket } from 'dgram';
import { messages, port, ProtocolSteps } from './ProtocolInformation';
import ClientInfo from './ClientInfo';
import { AddressInfo } from 'net';


export default class DiscoverClient {
    private connection: Socket;
    private clientDiscoverProtocol: ClientDiscoverProtocol;
    private process: NodeJS.Timeout;
    timeout: Timeout;

    constructor(clientProtocol: ClientDiscoverProtocol) {
        this.connection = dgram.createSocket('udp4');
        this.connection.bind(port.client)
        this.clientDiscoverProtocol = clientProtocol;
        this.timeout = new Timeout(() => {
            this.clientDiscoverProtocol.restart();
            this.process = this.runDiscoverProcess();
        })
    }

    run(): void {
        this.connection.on('listening', () => {
            const address = this.connection.address();
            console.log('UDP Client listening on ' + address);
            this.connection.setBroadcast(true);
        });

        this.process = this.runDiscoverProcess()

        this.connection.on('message', (msg, rinfo) => {
            if (!this.clientDiscoverProtocol.isFinished()) {
                this.runProtocol(msg, rinfo)
            } else {
                this.timeout.stop()
                console.log('Protocol Finished')
            }
        })
    }

    private runProtocol(msg: Buffer, rinfo: AddressInfo): void {
        const serverInfo = new ClientInfo(rinfo.address, rinfo.port, ProtocolSteps.DISCOVER);
        console.log('message receive from: ')
        console.log(serverInfo.toString())
        console.log('information: ')
        console.log(msg.toString())
        if (!this.process && !this.clientDiscoverProtocol.checkStep(msg.toString(), serverInfo)) {
            this.process = this.runDiscoverProcess();
        }

        if (this.process && this.clientDiscoverProtocol.checkStep(msg.toString(), serverInfo)) {
            clearInterval(this.process);
            this.timeout.start();
        }

        if (!this.process && this.clientDiscoverProtocol.checkStep(msg.toString(), serverInfo)) {
            this.timeout.refresh();
        }

        setTimeout(() => {
            let message;
            if (this.clientDiscoverProtocol.checkStep(msg.toString(), serverInfo)) {
                message = this.clientDiscoverProtocol.actionMap[msg.toString()](msg.toString(), serverInfo)
            } else {
                message = this.clientDiscoverProtocol.actionMap.default(msg.toString(), serverInfo)
            }
            console.log('sending package to: ')
            console.log(serverInfo.toString())
            console.log('message : ')
            console.log(message.toString())
            this.send(message, serverInfo)
        }, 500)

    }

    private send(msg: string, serverInfo: ClientInfo): any {
        this.connection.send(msg, serverInfo.port, serverInfo.address);
    }

    private runDiscoverProcess(): NodeJS.Timeout {
        console.log('Sending discover message...')
        return setInterval(() => {
            this.sendBroadcast(this.clientDiscoverProtocol.connect(), this.clientDiscoverProtocol.serverConnection);
        }, 2000);
    }

    private sendBroadcast(msg: string, serverInfo: ClientInfo): any {
        this.connection.send(msg, port.server, '255.255.255.255');
    }

}

class Timeout {
    private timeout: NodeJS.Timeout;
    private action: Function;

    constructor(action: Function) {
        this.action = action;
    }

    start(): any {
        if (!this.timeout) {
            this.timeout = setTimeout(() => this.action(), 3000)
        }
    }

    stop(): void {
        clearTimeout(this.timeout)
        this.timeout = undefined;
    }

    refresh(): any {
        this.stop()
        this.start()
    }
}

export class ClientDiscoverProtocol {
    public finish: boolean = false;
    public serverConnection: ClientInfo;
    private step: ProtocolSteps = ProtocolSteps.DISCOVER;
    private name: string;
    private id: string;
    public actionMap: any;
    private expectedStep: any;

    constructor(id: string, serviceName: string) {
        this.id = id;
        this.name = serviceName;
        this.serverConnection = new ClientInfo(undefined, port.server, ProtocolSteps.DISCOVER);
        this.buildMaps()
    }


    public restart(): any {
        this.step = ProtocolSteps.DISCOVER;
        this.serverConnection.address = undefined;
        this.finish = false;
    }

    public checkStep(msg: string, serverInfo: ClientInfo): boolean {
        return (this.actionMap[msg] !== undefined) && this.checkProtocol(serverInfo, this.expectedStep[msg]);
    }

    public isFinished(): boolean {
        return this.step === ProtocolSteps.ACK
    }

    public connect(): string {
        return messages.client.discover(this.name)
    }

    buildMaps(): any {
        this.actionMap = {
            [messages.server.discoverReceived(this.name)] : this.handsake.bind(this),
            [messages.server.acceptHandshake(this.name, this.id)] : this.requestInformation.bind(this),
            [messages.common.ACK(this.name)]: this.finishProtocol.bind(this),
            default: this.default.bind(this),
        };

        this.expectedStep = {
            [messages.server.discoverReceived(this.name)] : ProtocolSteps.DISCOVER,
            [messages.server.acceptHandshake(this.name, this.id)] : ProtocolSteps.HANDSHAKE,
            [messages.server.sendInformation(this.name, this.id)] : ProtocolSteps.HANDSHAKE,
            [messages.common.ACK(this.name)]: ProtocolSteps.ACK,
            default: this.default.bind(this),
        };
    }

    // cambiar client connection a server connection y cambiar el nombre de la clase
    private handsake(msg: string, clientInfo: ClientInfo): string {
        this.serverConnection = clientInfo;
        return this.executeProtocolStep(messages.client.handshake(this.name, this.id), clientInfo, ProtocolSteps.DISCOVER);
    }

    private requestInformation(msg: string, clientInfo: ClientInfo): string {
        return this.executeProtocolStep(messages.client.requestInformation(this.name), clientInfo, ProtocolSteps.HANDSHAKE);
    }

    private default(msg: string, clientInfo: ClientInfo): string {
        return this.executeProtocolStep(messages.common.ACK(this.name), clientInfo, ProtocolSteps.REQUEST_INFORMATION);
    }

    private finishProtocol(msg: string, clientInfo: ClientInfo): string {
        return this.executeProtocolStep(messages.common.ACK(this.name), clientInfo, ProtocolSteps.ACK);
    }

    private executeProtocolStep(msg: string, clientInfo: ClientInfo, expectedStep: ProtocolSteps): string {
        if (this.checkProtocol(clientInfo, expectedStep)) {
            this.step++;
            return msg;
        } else {
            return 'Wrong protocol implementation';
        }
    }

    private checkProtocol(clientInfo: ClientInfo, expectedStep: ProtocolSteps): boolean {
        if (this.serverConnection.address === undefined ) {
            return this.step === expectedStep;
        }
        return this.step === expectedStep && clientInfo.sameClient(this.serverConnection);
    }
}



