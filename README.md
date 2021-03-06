# DiscoverProtocol

[![npm](https://img.shields.io/npm/v/@ramclen/dicover-protocol.svg)](https://github.com/ramclen/DiscoverProtocol)


Request service information to unknown server locations

## Install

```
$ npm install @ramclen/discover-protocol
```

## Usage

### Server Side

```js
import UDPServer, { ServerDiscoverProtocol } from '@ramclen/discover-protocol/server';

new UDPServer(new ServerDiscoverProtocol('ServiceName', {info: 'content'}) ).run();
```

### Client Side

```js
import DiscoverClient, { ClientDiscoverProtocol } from '@ramclen/discover-protocol/client';

new DiscoverClient(new ClientDiscoverProtocol('ServiceName', 'ProtocolName'))
  .run()
  .then(information => {
    console.log(information.info);
  });
```


