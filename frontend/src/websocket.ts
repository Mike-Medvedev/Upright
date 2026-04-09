export const ws = new WebSocket("/ws");
ws.onopen = (event) => {
  console.log("Web socket opened!", event);
  ws.send("What up big boi");
};
ws.onerror = (event) => {
  console.log("Web socket error", event);
};
ws.onclose = (event) => {
  console.log("Web socket closed", event);
};
