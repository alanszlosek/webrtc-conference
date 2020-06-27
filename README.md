# WebRTC Conference

A self-hosted WebRTC video conference webapp.

Adapted from MDN's example code: https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Signaling_and_video_calling



## Requirements

* Firefox - Calling currently only works between Firefox browsers. Tested between MacOSX and PopOS Linux
* Server with: coturn, node.js, HTTP server capable of WebSockets

## Installation

* See Caddy Server and Coturn configs in the config folder
* Be sure to poke a hole in your firewall for coturn on port 3478
* Tested with node 10.x
* npm install websocket
* Update public/index.html with the domain of your TURN server