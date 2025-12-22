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

async function runPython(codeId) {
  if (!pyodideReady) return;

  const code = document.getElementById(codeId).value;
  const secretElem = document.getElementById("secretMessage");
  const originalText = secretElem.getAttribute("data-original");

  try {
    // Wrap the code to execute in Pyodide
    const wrappedCode = `
${code}
result = None
import builtins
_stdout = []
def fake_print(*args, **kwargs):
    _stdout.append(" ".join(map(str,args)))
builtins.print = fake_print
try:
    exec("""${code.replace(/`/g, '\\`')}""")
    if _stdout:
        result = "\\n".join(_stdout)
except:
    result = None
`;

    await pyodide.runPythonAsync(wrappedCode);

    const transformed = pyodide.globals.get("result");

    if (transformed) {
      // Check if output matches original expected decode
      // For now, we treat any output as attempt
      if (transformed.trim() === originalText.trim()) {
        // Correct decode (rare: if they literally re-print original)
        secretElem.textContent = transformed;
      } else {
        // Incorrect decode: show wrong output for 5 seconds
        secretElem.textContent = transformed;
        secretElem.classList.add("flash-red");

        setTimeout(() => {
          secretElem.textContent = originalText;
          secretElem.classList.remove("flash-red");
        }, 5000);
      }
    } else {
      // Python error: revert to original
      secretElem.textContent = originalText;
    }

  } catch (err) {
    // JS error: revert
    secretElem.textContent = originalText;
  }
}


// Unlock logic
function unlock(roomNum, correct) {
  const answerElem = document.getElementById(`answer${roomNum}`);
  const feedback = document.getElementById(`feedback${roomNum}`);
  const secretElem = document.getElementById("secretMessage");
  const originalText = secretElem.getAttribute("data-original");

  const answer = answerElem.value.trim().toUpperCase();
  const correctAnswer = correct.toUpperCase();

  if (answer === correctAnswer) {
    feedback.textContent = "ACCESS GRANTED";

    // Animate decode of secret message
    animateDecode(secretElem, correctAnswer);

    // Unlock Room 2
    const room2 = document.getElementById("room2");
    room2.classList.remove("locked");
    room2.scrollIntoView({behavior:"smooth"}); // optional
  } else {
    feedback.textContent = "ACCESS DENIED";

    // Animate wrong decode
    const wrongText = "WRONG DECODE!";
    animateDecode(secretElem, wrongText, () => {
      secretElem.classList.add("flash-red");
      secretElem.classList.remove("flash-green");
      setTimeout(() => {
        secretElem.textContent = originalText;
        secretElem.classList.remove("flash-red");
      }, 5000);
    });
  }
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


// -----------------------
// Caesar cipher decode function
function caesarDecode(text, shift) {
  return text.replace(/[a-zA-Z]/g, function(c){
    const base = c <= 'Z' ? 65 : 97;
    return String.fromCharCode((c.charCodeAt(0) - base - shift + 26) % 26 + base);
  });
}

// Decode logs based on user input
function decodeCaesarLogs() {
  const shiftInput = document.getElementById("caesarShift").value;
  const shift = parseInt(shiftInput);
  const logData = document.getElementById("logData").textContent;
  const decodedElem = document.getElementById("decodedLogs");
  const suspectListElem = document.getElementById("suspects");

  if (isNaN(shift)) {
    decodedElem.textContent = "Please enter a valid number for the shift.";
    return;
  }

  const decoded = logData
    .split("\n")
    .map(line => caesarDecode(line, shift))
    .join("\n");

  decodedElem.textContent = decoded;

  // Extract suspects (example: any word starting with 'Suspect')
  const suspects = [];
  decoded.split("\n").forEach(line => {
    const match = line.match(/Suspect\d*/i);
    if (match && !suspects.includes(match[0])) {
      suspects.push(match[0]);
    }
  });

  // Display suspects
  suspectListElem.innerHTML = suspects.map(s => `<li>${s}</li>`).join("");
}
