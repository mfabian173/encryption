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
  const outputElem = document.getElementById(outputId);

  try {
    let output = "";

    // Redirect stdout and stderr during this run
    pyodide.setStdout({
      batched: (s) => { output += s; }
    });
    pyodide.setStderr({
      batched: (s) => { output += s; }
    });

    await pyodide.runPythonAsync(code);

    outputElem.textContent = output; // display captured stdout
  } catch(err) {
    outputElem.textContent = "Error: " + err;
  }
}


// Unlock logic
function unlock(roomNum, correct) {
  const answer = document.getElementById(`answer${roomNum}`).value.trim().toUpperCase();
  const feedback = document.getElementById(`feedback${roomNum}`);
  if (answer === correct) feedback.textContent = "ACCESS GRANTED";
  else feedback.textContent = "ACCESS DENIED";
}

function showBrief(cipher) {
  const display = document.getElementById("briefDisplay");
  let title = "";
  let description = "";
  let code = "";

  switch(cipher) {
    case "atbash":
      title = "Atbash Cipher Brief";
      description = "Atbash: Ancient Hebrew substitution cipher. Reverses the alphabet.";
      code = `
def atbash(text):
    result = ""
    for char in text:
        if char.isalpha():
            base = ord('A') if char.isupper() else ord('a')
            result += chr(base + (25 - (ord(char) - base)))
        else:
            result += char
    return result
      `;
      break;

    case "caesar":
      title = "Caesar Cipher Brief";
      description = "Caesar: Named for Julius Caesar, shifts letters by a set value.";
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

    case "rot13":
      title = "ROT13 Cipher Brief";
      description = "ROT13: Simple letter rotation by 13, often used in online forums.";
      code = `
def rot13(text):
    return caesar(text, 13)
      `;
      break;

    case "vigenere":
      title = "Vigenère Cipher Brief";
      description = "Vigenère: Polyalphabetic cipher from the 16th century, more secure than Caesar.";
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
      description = "Base64: Encoding scheme for binary data, often used in computers.";
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
