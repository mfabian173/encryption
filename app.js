let pyodide;
let pyodideReady = false;
let room1Unlocked = false;

const CORRECT_MESSAGE =
"In one hour, all of your files will be wiped forever. Let the games begin!";

async function initPyodide() {
  pyodide = await loadPyodide();
  pyodideReady = true;
  document.getElementById("loading").textContent = "✅ Python ready.";
}
initPyodide();

function startCase() {
  document.getElementById("briefing").classList.add("hidden");
  document.getElementById("room1").classList.remove("hidden");
}

function showBrief(cipher) {
  const d = document.getElementById("briefDisplay");
  let text = "";

  if (cipher === "atbash") {
    text = `
Atbash Cipher

def atbash(text):
    result = ""
    for c in text:
        if c.isalpha():
            base = ord('A') if c.isupper() else ord('a')
            result += chr(base + (25 - (ord(c) - base)))
        else:
            result += c
    return result
`;
  }

  if (cipher === "caesar") {
    text = `
Caesar Cipher

def caesar(text, shift):
    result = ""
    for c in text:
        if c.isalpha():
            base = ord('A') if c.isupper() else ord('a')
            result += chr((ord(c) - base + shift) % 26 + base)
        else:
            result += c
    return result
`;
  }

  if (cipher === "rot13") {
    text = `
ROT13

def rot13(text):
    return caesar(text, 13)
`;
  }

  if (cipher === "vigenere") {
    text = `
Vigenère Cipher

def vigenere(text, key):
    result = ""
    k = 0
    for c in text:
        if c.isalpha():
            shift = ord(key[k % len(key)].upper()) - ord('A')
            result += chr((ord(c.upper()) - ord('A') + shift) % 26 + ord('A'))
            k += 1
        else:
            result += c
    return result
`;
  }

  if (cipher === "base64") {
    text = `
Base64

import base64
def decode(text):
    return base64.b64decode(text).decode()
`;
  }

  d.innerHTML = `<pre>${text}</pre>`;
}

async function runPython(codeId, outputId) {
  if (!pyodideReady) return;

  const code = document.getElementById(codeId).value;
  const outputEl = document.getElementById(outputId);

  try {
    const result = await pyodide.runPythonAsync(code);
    outputEl.textContent = result ?? "";

    if (
      typeof result === "string" &&
      result.toLowerCase().includes("one hour") &&
      !room1Unlocked
    ) {
      unlockRoom();
    }

  } catch (err) {
    outputEl.textContent = err;
  }
}

function unlockRoom() {
  room1Unlocked = true;

  document.getElementById("secretMessage").textContent = CORRECT_MESSAGE;

  const lock = document.getElementById("lockStatus");
  lock.textContent = "🔓 FILE DECRYPTED — ROOM 1 CLEARED";
  lock.classList.add("unlocked");

  const overlay = document.getElementById("roomLock");
  overlay.classList.add("room-unlock");
  setTimeout(() => overlay.remove(), 1200);

  document.getElementById("room1Content").classList.remove("room-locked");

  evidenceBanner();
}

function evidenceBanner() {
  const b = document.createElement("div");
  b.textContent = "📂 EVIDENCE UNLOCKED";
  b.style.position = "fixed";
  b.style.top = "20px";
  b.style.right = "20px";
  b.style.background = "#003300";
  b.style.color = "#00ff00";
  b.style.padding = "10px";
  b.style.border = "1px solid #00ff00";
  document.body.appendChild(b);
  setTimeout(() => b.remove(), 3000);
}
