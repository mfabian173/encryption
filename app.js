
// =======================
// app.js - Full Room 1 Magic
// =======================

// -----------------------
// 1️⃣ Initialize Pyodide (optional if you still want Python elsewhere)
let pyodideReady = false;
let pyodide;

async function initPyodide() {
  pyodide = await loadPyodide();
  pyodideReady = true;
  document.getElementById("loading").textContent = "✅ Python ready.";
  document.getElementById("beginBtn").style.display = "inline-block";
}

initPyodide();

// -----------------------
// 2️⃣ Begin Investigation
function beginInvestigation() {
  document.getElementById("briefing").style.display = "none";
  document.getElementById("room1").style.display = "block";
}

// -----------------------
// 3️⃣ ROT13 + Letter-by-letter decode + terminal flashes

function rot13(str) {
  return str.replace(/[a-zA-Z]/g, function(c){
    const base = c <= "Z" ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - base + 13) % 26) + base);
  });
}

// Animate text letter by letter
function animateDecode(elem, text, callback=null) {
  elem.textContent = "";
  let i = 0;
  const interval = setInterval(() => {
    elem.textContent += text[i];
    i++;
    if (i >= text.length) {
      clearInterval(interval);
      if (callback) callback();
    }
  }, 25);
}

// Main "Run Python" handler (magical terminal)
function runPython(codeId) {
  const secretElem = document.getElementById("secretMessage");
  const originalText = secretElem.getAttribute("data-original");
  const userCode = document.getElementById(codeId).value.trim();

  // Correct if user typed rot13(...)
  if (/rot13\s*\(/i.test(userCode)) {
    const decoded = rot13(originalText);
    animateDecode(secretElem, decoded, () => {
      // Flash green briefly
      secretElem.classList.add("flash-green");
      setTimeout(() => secretElem.classList.remove("flash-green"), 1000);
    });

  } else {
    // Wrong decode: show "WRONG DECODE!" in red then revert
    const wrongText = "WRONG DECODE!";
    animateDecode(secretElem, wrongText, () => {
      secretElem.classList.add("flash-red");
      setTimeout(() => {
        secretElem.textContent = originalText;
        secretElem.classList.remove("flash-red");
      }, 5000);
    });
  }
}

// -----------------------
// 4️⃣ Show brief documents (ROT13, Caesar, Vigenère, Base64)
function showBrief(cipher) {
  const display = document.getElementById("briefDisplay");
  let title = "";
  let description = "";
  let code = "";

  switch(cipher) {
    case "rot13":
      title = "ROT13 Cipher Brief";
      description = "ROT13: Simple letter rotation by 13. This is the correct decoder for this message.";
      code = `
def rot13(text):
    result = ""
    for char in text:
        if char.isalpha():
            base = ord('A') if char.isupper() else ord('a')
            result += chr((ord(char) - base + 13) % 26 + base)
        else:
            result += char
    return result
      `;
      break;

    case "caesar":
      title = "Caesar Cipher Brief";
      description = "Caesar: Shifts letters by a fixed number of places.";
      code = `
def caesar(text, shift):
    result = ""
    for char in text:
        if char.isalpha():
            base = ord('A') if char.isupper() else ord('a')
            result += chr((ord(char) - base + shift) % 26 + base)
        else:
            result += char
    return result
      `;
      break;

    case "vigenere":
      title = "Vigenère Cipher Brief";
      description = "Vigenère: Polyalphabetic cipher using a key.";
      code = `
def vigenere(text, key):
    result = ""
    key_index = 0
    key = key.upper()
    for char in text:
        if char.isalpha():
            shift = ord(key[key_index % len(key)]) - ord('A')
            result += chr((ord(char.upper()) - ord('A') + shift) % 26 + ord('A'))
            key_index += 1
        else:
            result += char
    return result
      `;
      break;

    case "base64":
      title = "Base64 Brief";
      description = "Base64: Encoding scheme for binary data.";
      code = `
import base64
def base64_encode(text):
    return base64.b64encode(text.encode()).decode()
def base64_decode(text):
    return base64.b64decode(text.encode()).decode()
      `;
      break;
  }

  display.innerHTML = `
<h3>${title}</h3>
<p>${description}</p>
<code>${code}</code>
`;
}
