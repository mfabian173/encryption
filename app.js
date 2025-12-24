let pyodideReady = false;
let pyodide;

async function initPyodide() {
  console.log("🔥 initPyodide() CALLED");
  try {
    pyodide = await loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.25.1/full/"
    });

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
    `);

    pyodideReady = true;
    document.getElementById("loading").textContent = "✅ Investigation environment ready.";
    document.getElementById("beginBtn").style.display = "inline-block";

  } catch (err) {
    console.error("Pyodide failed:", err);
    document.getElementById("loading").textContent =
      "❌ Failed to initialize investigation environment.";
  }
}


// Unlock Room 1 when Begin clicked
function beginInvestigation() {
  // Hide briefing
  document.getElementById("briefing").style.display = "none";

  // Show Room 1
  const room1 = document.getElementById("room1");
  room1.style.display = "block";

  // Show Room 2 as locked
  const room2 = document.getElementById("room2");
  room2.style.display = "block";  // now visible
  room2.classList.add("locked");   // greyed out, cannot interact
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

function animateDecode(element, text, done) {
  element.textContent = "";
  let i = 0;

  const interval = setInterval(() => {
    element.textContent += text[i];
    i++;

    if (i >= text.length) {
      clearInterval(interval);
      if (done) done();
    }
  }, 30);
}


function unlock(roomNum, correct) {
  const answerElem = document.getElementById(`answer${roomNum}`);
  const feedback = document.getElementById(`feedback${roomNum}`);
  const secretElem = document.getElementById("secretMessage");
  const originalText = secretElem.getAttribute("data-original");

  const answer = answerElem.value.trim().toUpperCase();
  const correctAnswer = correct.toUpperCase();

  if (answer === correctAnswer) {
    feedback.textContent = "ACCESS GRANTED";

    // Animate secret message
    animateDecode(secretElem, correctAnswer);

    // Unlock Room 2
    const room2 = document.getElementById("room2");
    room2.classList.remove("locked"); // fully interactive now
    room2.scrollIntoView({behavior:"smooth"});

  } else {
    feedback.textContent = "ACCESS DENIED";

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
      title = `Atbash Cipher Brief`;
      description = `Atbash: The Atbash cipher is an ancient Hebrew substitution cipher, reversing the alphabet (A=Z, B=Y) and named from its first letters, Aleph (A) and Taw (T). Used since at least 500 BC, it appears in the Hebrew Bible to conceal sensitive information or create wordplay, relying on cultural familiarity for security. The advantage of the Atbash is that it does not require special knowledge or technology to use, but this also leads to its biggest drawback: it's pretty easy to solve.`;
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
      title = `Caesar Cipher Brief`;
      description = `The Caesar cipher, named after Julius Caesar (c. 100-44 BC) who used it for military messages, is one of history's earliest known codes, working by shifting each letter of a message a fixed number of places down the alphabet (like 'A' becoming 'D' with a shift of 3) to create gibberish for enemies, though it was easily broken by frequency analysis centuries later by Arab mathematician Al-Kindi (letter frequencies in a language remain constant. By counting letters in the encrypted text, codebreakers could find the shift.) How It Works: Substitution: Replaces each letter with another letter a fixed number of positions away in the alphabet. Key: The key is the number of positions to shift (e.g., 3). Encryption: 'A' shifts to 'D' (shift of 3). Decryption: The recipient reverses the shift (e.g., 'D' shifts back to 'A'). Vulnerability: Its simplicity and lack of variation made it extremely easy to crack, rendering it useless for serious security today, though modern ROT13 (shift of 13) is used online to hide spoilers.`;
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
      title = `ROT13 Cipher Brief`;
      description = `ROT13 is a simple substitution cipher, a type of Caesar cipher (shift cipher) where each letter is replaced by the letter 13 places after it in the alphabet, making it self-decrypting (applying it twice returns the original text) and offering minimal security. Primarily used for obscuring spoilers, jokes, or sensitive words on early internet forums like Usenet to avoid casual viewing. Its history stems from ancient Caesar ciphers but gained modern prominence in digital culture for its ease of use and playful, non-secure hiding of text.`;
      code = `
def rot13(text):
    return caesar(text, 13)
      `;
      break;

    case "vigenere":
      title = `Vigenère Cipher Brief`;
      description = `Origin: Giovan Battista Bellaso (1553) described the core polyalphabetic method. Later mistakenly credited to Blaise de Vigenère (1586), who developed a stronger auto-key cipher. Mechanism: Uses a keyword (repeated) to select different Caesar shifts for each letter, making it stronger than simple substitution. "Unbreakable" Era: For roughly 300 years, it was called le chiffre indéchiffrable (the unbreakable cipher). Breakthrough: Friedrich Kasiski (1863) and Charles Babbage (1854) independently developed methods to find repeating key sequences, allowing for decryption. Later Use: The Confederate States used a Vigenère cipher disk during the American Civil War. How it Works (Simplified): Keyword: A word like "KEY" is chosen. Repetition: The keyword repeats to match the message length (e.g., KEYKEYKEY...). Shifting: Each letter of the message is shifted by the corresponding keyword letter's position (A=0, B=1, etc.). The primary weakness is the repeating nature of its key.`;
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
      title = `Base64 Brief`;
      description = `Base64 is not a true cipher but an encoding method for sending binary data over text-only channels. Converts bytes into 64 safe characters (A-Z, a-z, 0-9, +, /). Used in early internet protocols and now essential for MIME, HTML, JSON, and APIs. Groups of 3 bytes are encoded into 4 characters, padding with '=' if needed. Not encryption: easily reversible, no secret key, primarily used to hide data from casual view.`;
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


const decryptedLogs = `
This is a test log to date: 01-15-2025 03:47 - Caesar 3 used
UserID: admin01 | IP: 192.168.1.24 | File: payroll.db
This is a test log to date: 01-15-2025 03:55 - Password attempt
UserID: guest07 | IP: 192.168.1.18 | File: —
This is a test log to date: 01-15-2025 04:30 - Suspect1
UserID: sys_core | IP: 10.0.0.5 | File: customer_dump.sql
`;


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
  const shift = parseInt(document.getElementById("caesarShift").value);
  const output = document.getElementById("decodedLogs");
  const suspects = document.getElementById("suspects");

  const encrypted = document.getElementById("logData").textContent;
  const correctShift = 3;

  if (shift !== correctShift) {
    output.classList.add("flash-red");
    animateText(output, "❌ INVALID DECRYPTION ATTEMPT");
    setTimeout(() => {
      output.textContent = "";
      output.classList.remove("flash-red");
    }, 3000);
    return;
  }

  output.classList.add("flash-green");
  animateText(output, decryptedLogs, 10, () => {
    suspects.style.display = "block";
  });
}


function animateText(element, text, speed = 20, done) {
  element.textContent = "";
  let i = 0;
  const interval = setInterval(() => {
    element.textContent += text[i];
    i++;
    if (i >= text.length) {
      clearInterval(interval);
      if (done) done();
    }
  }, speed);
}

window.addEventListener("load", initPyodide);
