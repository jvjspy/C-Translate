async function translate(text) {
  const htmlText = await (
    await fetch("https://dictionary.cambridge.org/dictionary/english/" + text)
  ).text();
  const dom = new DOMParser().parseFromString(htmlText, "text/html");
  const res = {
    audioSrc: "",
    audioType: "",
    ipa: "",
    meanings: [],
    text,
  };
  const entries = dom.querySelectorAll(".pr.entry-body__el");
  const audio = dom.querySelector("source");
  res.audioSrc = "https://dictionary.cambridge.org" + audio.getAttribute("src");
  res.moreUrl = "https://dictionary.cambridge.org/dictionary/english/" + text;
  res.audioType = audio.type;
  res.ipa = dom.querySelector(".ipa").textContent;
  res.vi =
    dom.querySelector(".tc-bb[lang='vi']")?.textContent ||
    "Không tìm thấy định nghĩa nào.";
  entries.forEach((entry) => {
    const meaning = {};
    const type = entry.querySelector(".pos.dpos");
    if (type) {
      meaning.type = type.textContent;
      meaning.def = entry
        .querySelector(".def.ddef_d.db")
        .textContent.trim()
        .replace(/:$/, "");
      res.meanings.push(meaning);
    }
  });
  return res;
}
chrome.runtime.onInstalled.addListener(function () {
  chrome.contextMenus.create({
    id: "translate",
    title: "C-Translate",
    contexts: ["selection"],
  });
  chrome.contextMenus.onClicked.addListener(handleTranslate);
});
function handleTranslate(data) {
  if (data.menuItemId == "translate") {
    chrome.tabs.query(
      {
        active: true,
        currentWindow: true,
      },
      async function (tabs) {
        const message = {
          data: null,
          state: "fetching",
        };
        chrome.tabs.sendMessage(tabs[0].id, message);
        try {
          const res = await translate(data.selectionText.trim().toLowerCase());
          message.data = res;
          message.state = "success";
          chrome.tabs.sendMessage(tabs[0].id, message);
        } catch (err) {
          console.log(err);
          message.state = "error";
          chrome.tabs.sendMessage(tabs[0].id, message);
        }
      }
    );
  }
}
function allowCSP(headers) {
  for (let i = 0; i < headers.length; ++i) {
    if (headers[i].name.toLowerCase() == "content-security-policy") {
      if (/media-src/.test(headers[i].value)) {
        headers[i].value = headers[i].value.replace(
          /(media-src.+?);/,
          "$1 https://dictionary.cambridge.org;"
        );
      } else {
        headers[i].value += "media-src https://dictionary.cambridge.org;";
      }
      return;
    }
  }
}
chrome.webRequest.onHeadersReceived.addListener(
  function (details) {
    allowCSP(details.responseHeaders);
    return { responseHeaders: details.responseHeaders };
  },
  { urls: ["https://*/*", "http://*/*"] },
  ["blocking", "responseHeaders", "extraHeaders"]
);
