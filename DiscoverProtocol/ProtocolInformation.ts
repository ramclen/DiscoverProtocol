const protocol = 'DiscoverProtocol';

export const messages = {
    client : {
        discover: serviceName => formatMessage('EHLO', serviceName),
        handshake: (serviceName, askingID) => formatMessage(`AYT ${askingID}`, serviceName),
        requestInformation: (serviceName) => formatMessage(`GET INFORMATION`, serviceName),
    },
    server : {
        discoverReceived: serviceName => `${protocol}:EHLO OK:${serviceName}`,
        acceptHandshake: (serviceName, askingID) => formatMessage(`OK ${askingID}`, serviceName),
        rejectHandsake: (serviceName, askingID) => formatMessage(`REJECT ${askingID}`, serviceName),
        sendInformation: (serviceName, information) => formatMessage(`INFO ${JSON.stringify(information)}`, serviceName)
    },
    common : {
        ACK: (serviceName) => formatMessage(`ACK`, serviceName),
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
    return `${protocol}:${message}:${serviceName}`
}
