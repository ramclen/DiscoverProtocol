const head = 'DiscoverProtocol';

export const messages = {
    client : {
        discover: name => formatMessage('EHLO', name),
        handsake: (name, askingID) => formatMessage(`AYT ${askingID}`, name),
        requestInformation: (name) => formatMessage(`GET INFORMATION`, name),
    },
    server : {
        discoverRecived: name => `${head}:EHLO OK:${name}`,
        acceptHandsake: (name, askingID) => formatMessage(`OK ${askingID}`, name),
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



function formatMessage(message: string, serviceName: string): string {
    return `${head}:${message}:${serviceName}`
}
