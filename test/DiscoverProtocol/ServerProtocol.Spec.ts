import { expect } from 'chai';
import 'mocha';
import ClientInfo from '../../DiscoverProtocol/ClientInfo';
import { ServerDiscoverProtocol } from '../../DiscoverProtocol/DiscoverServer';
import { messages, ProtocolSteps, port } from '../../DiscoverProtocol/ProtocolInformation';

describe('Server Discover Protocol', () => {
  const id = 'pepe';
  const serviceName = 'DISCOVER';
  const information = {direction: '1234'};
  let  serverDiscover: ServerDiscoverProtocol;

  beforeEach(() => {
    serverDiscover = new ServerDiscoverProtocol(id, information);
  })

  it('should return discover received to a discover message', () => {
    const sendMessage = serverDiscover.actionMap[messages.client.discover(serviceName)](new ClientInfo('', port.client));
    expect(messages.server.discoverReceived(serviceName)).to.be.equal(sendMessage);
  });

  it('should return accept handshake to a handshake message', () => {
    const clientInfo = new ClientInfo('1234', port.client);
    const sendMessage = performAcceptHandshakeStage(serverDiscover, serviceName, clientInfo, id);
    expect(messages.server.acceptHandshake(serviceName, id)).to.be.equal(sendMessage);
  });

  it('should return information to a request information', () => {
    const clientInfo = new ClientInfo('1234', port.client);
    const sendMessage = performSendInformationStage(serverDiscover, serviceName, clientInfo, id);
    expect(messages.server.sendInformation(serviceName, {direction: '1234'})).to.be.equal(sendMessage);
  });

  it('should return ACK to a ACK message', () => {
    const clientInfo = new ClientInfo('1234', port.client);
    const sendMessage = performACKStage(serverDiscover, serviceName, clientInfo, id);
    expect(messages.common.ACK(serviceName)).to.be.equal(sendMessage);
  });

  it('should fail protocol when try to get information without previous steps', () => {
    const clientInfo = new ClientInfo('1234', port.client);

    const sendMessage = serverDiscover.actionMap[messages.client.requestInformation(serviceName)](clientInfo);
    expect('Wrong protocol implementation').to.be.equal(sendMessage);
  })

  it('should fail if steps have not been followed', () => {
    const clientInfo = new ClientInfo('1234', port.client);
    let sendMessage = serverDiscover.actionMap[messages.client.discover(serviceName)](clientInfo);
    expect(messages.server.discoverReceived(serviceName)).to.be.equal(sendMessage);

    sendMessage = serverDiscover.actionMap[messages.client.requestInformation(serviceName)](clientInfo);
    expect('Wrong protocol implementation').to.be.equal(sendMessage);
  })

})

function performAcceptHandshakeStage(serverDiscover: ServerDiscoverProtocol, serviceName: string,
                                    clientInfo: ClientInfo, id: string): string {

    const sendMessage = serverDiscover.actionMap[messages.client.discover(serviceName)](clientInfo);
    expect(messages.server.discoverReceived(serviceName)).to.be.equal(sendMessage);
    return  serverDiscover.actionMap[messages.client.handshake(serviceName, id)](clientInfo);
}

function performSendInformationStage(serverDiscover: ServerDiscoverProtocol,
                                        serviceName: string, clientInfo: ClientInfo, id: string): string  {

    const sendMessage = performAcceptHandshakeStage(serverDiscover, serviceName, clientInfo, id)
    expect(messages.server.acceptHandshake(serviceName, id)).to.be.equal(sendMessage);
    return serverDiscover.actionMap[messages.client.requestInformation(serviceName)](clientInfo);
}

function performACKStage(serverDiscover: ServerDiscoverProtocol, serviceName: string,
                        clientInfo: ClientInfo, id: string): string  {

    const sendMessage = performSendInformationStage(serverDiscover, serviceName, clientInfo, id)
    expect(messages.server.sendInformation(serviceName, { direction: '1234' })).to.be.equal(sendMessage);
    return serverDiscover.actionMap[messages.common.ACK(serviceName)](clientInfo);
}

