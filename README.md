# DiscoverProtocol

[![npm](https://img.shields.io/npm/v/@ramclen/dicover-protocol.svg)](https://github.com/ramclen/DiscoverProtocol)


Request service information to unknown server locations

## Install

```
$ npm install @ramclen/discover-protocol
```

## Usage

### Client Side

```js
import DiscoverClient, { ClientDiscoverProtocol } from '../DiscoverProtocol/DiscoverClient';

new DiscoverClient(new ClientDiscoverProtocol('pepe', 'DISCOVER')).run();
```

### Server Side

```js
import UDPServer, { ServerDiscoverProtocol } from '../DiscoverProtocol/DiscoverServer';

new UDPServer(new ServerDiscoverProtocol('pepe', {cosa: 'cosa'}) ).run();
```