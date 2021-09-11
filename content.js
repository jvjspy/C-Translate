let pos;
window.addEventListener("mouseup", (e) => {
  if (e.button == 2) {
    pos = {
      x: e.pageX,
      y: e.pageY,
    };
  }
});
function calculateDisplayPos(pos) {
  const sw = window.screen.width;
  if (pos.x + 350 > sw) {
    return {
      anchor: "right",
      x: pos.x - 330,
      y: pos.y + 20,
    };
  }
  return {
    anchor: "left",
    x: pos.x - 20,
    y: pos.y + 20,
  };
}
async function getTemplate() {
  return await (await fetch(chrome.runtime.getURL("template.ejs"))).text();
}
chrome.runtime.onMessage.addListener(function (message) {
  renderPopup(message.data, message.state);
});
async function renderPopup(data, state) {
  let popup = document.querySelector("#ctrans-popup");
  if (!popup) {
    popup = createPopup();
  }
  const root = popup.shadowRoot;
  root.innerHTML = ejs.render(await getTemplate(), {
    data,
    pos: calculateDisplayPos(pos),
    state,
  });
  root.querySelector("#close").addEventListener("click", () => {
    popup.remove();
  });
  if (state == "success") {
    root.querySelector("#play").addEventListener("click", () => {
      root.querySelector("audio").play();
    });
  }
}
function createPopup() {
  const host = document.createElement("div");
  host.id = "ctrans-popup";
  host.attachShadow({ mode: "open" });
  document.body.append(host);
  return host;
}
