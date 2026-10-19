# Chat visual QA

Run `node qa/chat/serve.cjs` from `frontend/` after `npm ci`.
Open http://127.0.0.1:4318. The server binds only to loopback.

This harness renders the real ticket card, tag and audio components with fake
contacts and mocked API/context modules. No login, database or WhatsApp session
is used. It is not imported by the app or included in the deployed bundle.
The four-second WAV is generated in memory by the local server.

Check 280/320/370/480px columns, long names/tags, +N expand/collapse, light/dark
themes, focus/hover icons, audio play/pause, seeking and 1/1.5/2× playback.
Waveform failures must expose native audio controls; playback must not start
automatically. With OS reduced motion enabled, icon animations must stop.

The SVG examples use the actual AnimatedIcon component and real Motion runtime.
Hover the **text** of Chat: the bubble forms and its three lines draw sequentially;
the root SVG must keep `transform: none`. Dashboard tiles assemble independently.
Keyboard focus also triggers these animations; disabled actions never animate.
After mouse leave, every shape must be fully visible again. No idle/shake CSS.
"Lista vazia" shows the real TicketListSurface with the app's Paper overrides:
both inner surfaces must have zero-width borders and no rounded/elevation1 class.

Chat bubbles here are sample markup using the shared CSS, not an end-to-end
test of message sending, sockets, groups or permissions. Validate those in dev.
