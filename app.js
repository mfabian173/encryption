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
  animateDecode(
    secretElem,
    "IN ONE HOUR, ALL OF YOUR FILES WILL BE WIPED FOREVER. LET THE GAMES BEGIN!\nPASSWORD: PROGRAMMER"
  );

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
03:41:12 | USER_12 | 192.168.4.23 | OPENED FILE: finances.csv
03:47:09 | USER_07 | 192.168.4.19 | OPENED FILE: employee_records.db
03:52:44 | USER_07 | 192.168.4.19 | ACCESS DENIED: admin.cfg
04:01:03 | USER_03 | 192.168.4.88 | OPENED FILE: secret_key.pdf
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
// Decode logs based on user input
function decodeCaesarLogs() {
  const shift = parseInt(document.getElementById("caesarShift").value);
  const output = document.getElementById("decodedLogs");
  const suspects = document.getElementById("suspects");

  const encrypted = document.getElementById("logData").textContent;
  const correctShift = 3;

  // Reset UI
  output.classList.remove("flash-red", "flash-green");
  output.innerHTML = "";
  suspects.innerHTML = "";
  suspects.style.display = "none";

  // ❌ Wrong shift
  if (shift !== correctShift) {
    output.classList.add("flash-red");
    animateText(output, "❌ INVALID DECRYPTION ATTEMPT");
    return;
  }

  // ✅ Correct shift
  output.classList.add("flash-green");

  // 🔓 Decode logs line-by-line
  const decryptedLines = encrypted
    .split("\n")
    .map(line => caesarDecode(line, shift));

  const decryptedText = decryptedLines.join("\n");

  // ✨ Animate decoded logs
  animateText(output, decryptedText, 10, () => {
    // 🎯 Build suspect list AFTER decode finishes
    const users = new Set();

    decryptedLines.forEach(line => {
      const userMatch = line.match(/USER_\d+/);
      if (userMatch) users.add(userMatch[0]);

      // Highlight ACCESS DENIED lines
      if (line.includes("ACCESS DENIED")) {
        output.innerHTML = output.innerHTML.replace(
          line,
          `<span class="denied">${line}</span>`
        );
      }
    });

    // Populate suspects
    users.forEach(user => {
      const li = document.createElement("li");
      li.textContent = user;
      li.classList.add("suspect");
      li.onclick = () => investigateSuspect(user);
      suspects.appendChild(li);
    });

    suspects.style.display = "block";
    document.querySelectorAll(".suspect").forEach(item => {
  item.addEventListener("click", () => {
    const bio = document.getElementById("suspectBio");
    document.getElementById("bioName").textContent = item.dataset.name;
    document.getElementById("bioLang").textContent = item.dataset.language;
    document.getElementById("bioAccess").textContent = item.dataset.access;
    bio.style.display = "block";
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

function investigateSuspect(user) {
  alert(`Investigating ${user}...`);
}

function updateProgress(item) {
  const el = document.getElementById(item);
  if (el) el.textContent = "✅ " + el.textContent.slice(2);
}

function runChallenge() {
  const challengeCode = document.getElementById("challengeInput").value;
  const output = document.getElementById("decodedLogs");

  // simple parser: check if it contains a loop and shift assignment
  if (challengeCode.includes("for") && challengeCode.includes("range") && challengeCode.includes("shift")) {
    const correctShift = 3; // same as normal
    const decryptedLogs = caesarDecode(document.getElementById("logData").textContent, correctShift);
    output.classList.add("flash-green");
    output.textContent = decryptedLogs;

    // Show suspects and update progress
    document.getElementById("suspects").style.display = "block";
    updateProgress("progressLogs");
  } else {
    output.classList.add("flash-red");
    output.textContent = "❌ Challenge failed! Make sure to loop from 0-26 and set shift.";
    setTimeout(() => { output.classList.remove("flash-red"); output.textContent = ""; }, 3000);
  }
}

    
window.addEventListener("load", initPyodide);
