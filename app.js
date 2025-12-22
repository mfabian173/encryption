let pyodideReady = false;
let pyodide;

async function initPyodide() {
  pyodide = await loadPyodide();

  await pyodide.runPythonAsync(`
import base64

def atbash(text):
    result = ""
    for char in text:
        if char.isalpha():
            base = ord('A') if char.isupper() else ord('a')
            result += chr(base + (25 - (ord(char) - base)))
        else:
            result += char
    return result

def caesar(text, shift):
    result = ""
    for char in text:
        if char.isalpha():
            base = ord('A') if char.isupper() else ord('a')
            result += chr((ord(char) - base + shift) % 26 + base)
        else:
            result += char
    return result

def rot13(text):
    return caesar(text, 13)

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

def base64_encode(text):
    return base64.b64encode(text.encode()).decode()

def base64_decode(text):
    return base64.b64decode(text.encode()).decode()
  `);

  pyodideReady = true;
  document.getElementById("loading").textContent = "✅ Python ready.";
  document.getElementById("beginBtn").style.display = "inline-block";
}

initPyodide();

// Unlock Room 1 when Begin clicked
function beginInvestigation() {
  document.getElementById("briefing").style.display = "none";
  document.getElementById("room1").style.display = "block";
}

// Run Python in a textarea
async function runPython(codeId, outputId) {
  if (!pyodideReady) return;
  const code = document.getElementById(codeId).value;
  try {
    const output = await pyodide.runPythonAsync(code);
    document.getElementById(outputId).textContent = output;
  } catch(err) {
    document.getElementById(outputId).textContent = "Error: " + err;
  }
}

// Unlock logic
function unlock(roomNum, correct) {
  const answer = document.getElementById(`answer${roomNum}`).value.trim().toUpperCase();
  const feedback = document.getElementById(`feedback${roomNum}`);
  if (answer === correct) feedback.textContent = "ACCESS GRANTED";
  else feedback.textContent = "ACCESS DENIED";
}

// Detective briefs display
function showBrief(cipher) {
  const display = document.getElementById("briefDisplay");
  switch(cipher) {
    case "atbash":
      display.textContent = "Atbash: Ancient Hebrew substitution cipher, reverses the alphabet.";
      break;
    case "caesar":
      display.textContent = "Caesar: Named for Julius Caesar, shifts letters by a set value.";
      break;
    case "rot13":
      display.textContent = "ROT13: Simple letter rotation by 13, used in online forums.";
      break;
    case "vigenere":
      display.textContent = "Vigenère: Polyalphabetic cipher from the 16th century, more secure than Caesar.";
      break;
    case "base64":
      display.textContent = "Base64: Encoding scheme for binary data, often used in computers.";
      break;
  }
}
