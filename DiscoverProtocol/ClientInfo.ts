import { ProtocolSteps } from './ProtocolInformation';

export default class ClientInfo {
    public address: string;
    public port: number;
    public step: ProtocolSteps;

    constructor(address: string, _port: number, step: ProtocolSteps = ProtocolSteps.HANDSHAKE) {
        this.address = address;
        this.port = _port;
        this.step = step;
    }

    public sameClient(clientInfo: ClientInfo): boolean {
        return (clientInfo != null) && (clientInfo.address === this.address) && (clientInfo.port === this.port);
    }

    public toString(): string {
        return `address: ${this.address}
            port: ${this.port}
            step: ${this.step}`
    }
}
