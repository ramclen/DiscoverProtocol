import { expect } from 'chai';
import 'mocha';
import ClientInfo from '../../DiscoverProtocol/ClientInfo';
import { ClientDiscoverProtocol } from '../../DiscoverProtocol/DiscoverClient';
import { messages, ProtocolSteps } from '../../DiscoverProtocol/ProtocolInformation';

describe('Client Discover Protocol', () => {
  const id = 'pepe';
  const serviceName = 'DISCOVER';
  let  clientDiscover: ClientDiscoverProtocol;

  beforeEach(() => {
    clientDiscover = new ClientDiscoverProtocol(id, serviceName);
  })

  it('should return handshake to a discoverReceived message', () => {
    discoverStep(clientDiscover);
  });

  it('should return requestInformation when acceptHandshake message', () => {
    discoverStep(clientDiscover)

    requestInformation(clientDiscover);
  });

  it('should return ACK when information message received', () => {
    discoverStep(clientDiscover)

    requestInformation(clientDiscover);

    const incomingMessage = messages.server.sendInformation(serviceName, {foo: 'hello'});
    const serverConnection = new ClientInfo('', 4, ProtocolSteps.REQUEST_INFORMATION);

    expect(clientDiscover.checkStep(incomingMessage, serverConnection)).to.equal(false);

    const response = clientDiscover.actionMap.default('', serverConnection);
    expect(response).to.equal(messages.common.ACK(serviceName));
  });

  it('should detect that a step is had not been produced', () => {
    discoverStep(clientDiscover)

    const incomingMessage = messages.server.sendInformation(serviceName, {foo: 'hello'});
    const serverConnection = new ClientInfo('', 4, ProtocolSteps.REQUEST_INFORMATION);

    expect(clientDiscover.checkStep(incomingMessage, serverConnection)).to.equal(false);
  });

  function discoverStep(protocol: ClientDiscoverProtocol): void {
    const incomingMessage = messages.server.discoverReceived(serviceName);
    const serverConnection = new ClientInfo('', 4, ProtocolSteps.DISCOVER);

    expect(protocol.checkStep(incomingMessage, serverConnection)).to.equal(true);
    const response = protocol.actionMap[incomingMessage]('', serverConnection);
    expect(response).to.equal(messages.client.handshake(serviceName, id));
  }

  function requestInformation(protocol: ClientDiscoverProtocol): void {
    const incomingMessage = messages.server.acceptHandshake(serviceName, id);
    const serverConnection = new ClientInfo('', 4, ProtocolSteps.HANDSHAKE);
    expect(protocol.checkStep(incomingMessage, serverConnection)).to.equal(true);
    const response = protocol.actionMap[incomingMessage]('', serverConnection);
    expect(response).to.equal(messages.client.requestInformation(serviceName));
  }

});




