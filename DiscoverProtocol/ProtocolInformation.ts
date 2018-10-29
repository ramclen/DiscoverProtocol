const head = 'DiscoverProtocol';

export const messages = {
    client : {
        discover: name => formatMessage('EHLO', name),
        handshake: (name, askingID) => formatMessage(`AYT ${askingID}`, name),
        requestInformation: (name) => formatMessage(`GET INFORMATION`, name),
    },
    server : {
        discoverReceived: name => `${head}:EHLO OK:${name}`,
        acceptHandshake: (name, askingID) => formatMessage(`OK ${askingID}`, name),
        rejectHandsake: (name, askingID) => formatMessage(`REJECT ${askingID}`, name),
        sendInformation: (name, information) => formatMessage(`INFO ${JSON.stringify(information)}`, name)
    },
    common : {
        ACK: (name) => formatMessage(`ACK`, name),
    }
}

export const port = {
    server: 41234,
    client: 41235
}

export enum ProtocolSteps {
    DISCOVER = 0,
    HANDSHAKE = 1,
    REQUEST_INFORMATION = 2,
    ACK = 3
}

function formatMessage(message: string, serviceName: string): string {
    return `${head}:${message}:${serviceName}`
}
