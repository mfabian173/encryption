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
    const overlay = room2.querySelector(".room-lock-overlay");
    if (overlay) overlay.remove(); 
    
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

const userFileAccess = {
  "USER_12": ["finances.csv"],
  "USER_07": ["employee_records.db", "admin.cfg"],
  "USER_03": ["secret_key.pdf"] // <-- Room 3 entry point
};


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
// Robust Caesar decode
function caesarDecode(text, shift) {
  return text.split("").map(char => {
    if (char >= "A" && char <= "Z") {
      const code = ((char.charCodeAt(0) - 65 - shift + 26) % 26) + 65;
      return String.fromCharCode(code);
    } else if (char >= "a" && char <= "z") {
      const code = ((char.charCodeAt(0) - 97 - shift + 26) % 26) + 97;
      return String.fromCharCode(code);
    } else {
      return char; // non-letter stays the same
    }
  }).join("");
}

function decodeCaesarLogs() {
  const shift = parseInt(document.getElementById("caesarShift").value);
  const output = document.getElementById("decodedLogs");
  const suspects = document.getElementById("suspects");
  const suspectSection = document.getElementById("suspectSection");
  const encrypted = document.getElementById("logData").textContent;
  const correctShift = 3;

  // Reset UI
  output.classList.remove("flash-red", "flash-green");
  output.innerHTML = "";
  suspects.innerHTML = "";
  suspectSection.style.display = "none";

  // Always decode logs, even if wrong
  const decryptedLines = encrypted.split("\n").map(line => caesarDecode(line, shift));
  const decryptedText = `🔐 Attempted shift: ${shift}\n\n` + decryptedLines.join("\n");

  animateText(output, decryptedText, 10, () => {
    // Highlight ACCESS DENIED
    decryptedLines.forEach(line => {
      if (line.includes("ACCESS DENIED")) {
        output.innerHTML = output.innerHTML.replace(
          line,
          `<span class="denied">${line}</span>`
        );
      }
    });

    if (shift === correctShift) {
      output.classList.add("flash-green");

      const users = new Set();
      decryptedLines.forEach(line => {
        const match = line.match(/USER_\d+/);
        if (match) users.add(match[0]);
      });

      users.forEach(user => {
        const li = document.createElement("li");
        li.classList.add("suspect");

        li.dataset.name = user;
        li.dataset.language =
          user === "USER_12"
            ? "R — statistical computing & data analysis"
            : user === "USER_07"
            ? "C/C++ — systems-level programming"
            : user === "USER_03"
            ? "SQL — structured database querying"
            : "Unknown";

        li.dataset.access =
          user === "USER_12"
            ? "Full admin access"
            : user === "USER_07"
            ? "Read / Write access"
            : user === "USER_03"
            ? "Restricted access"
            : "Unknown";

        // Only show the name in the main list — no files
        li.innerHTML = `
          <div class="suspect-title">${user}</div>
        `;

        // Click → populate bio with recent files
        li.addEventListener("click", () => {
          const bio = document.getElementById("suspectBio");
          bio.querySelector("#bioName").textContent = li.dataset.name;
          bio.querySelector("#bioLang").textContent = li.dataset.language;
          bio.querySelector("#bioAccess").textContent = li.dataset.access;

          const bioFiles = bio.querySelector("#bioFiles");
          bioFiles.innerHTML = "";

          (userFileAccess[user] || []).forEach(f => {
            const liFile = document.createElement("li");
            if (user === "USER_03" && f.includes("secret_key")) {
              liFile.innerHTML = `<a href="#" onclick="openRoom3()">📁 ${f}</a>`;
            } else {
              liFile.textContent = `📄 ${f}`;
            }
            bioFiles.appendChild(liFile);
          });

          bio.style.display = "block";
        });

        suspects.appendChild(li);
      });

      suspectSection.style.display = "block"; // Make entire section visible
    } else {
      output.classList.add("flash-red");
    }
  });
}
function tileReveal() {
  const container = document.getElementById("stegoImageContainer");
  const pre = document.getElementById("stegoImage");
  const post = document.getElementById("stegoReveal");

  const rows = 6;
  const cols = 6;
  const tileWidth = pre.offsetWidth / cols;
  const tileHeight = pre.offsetHeight / rows;

  // Hide original image
  pre.style.opacity = 0;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const tile = document.createElement("div");
      tile.className = "tile";
      tile.style.width = tileWidth + "px";
      tile.style.height = tileHeight + "px";
      tile.style.left = c * tileWidth + "px";
      tile.style.top = r * tileHeight + "px";
      tile.style.backgroundImage = `url(${pre.src})`;
      tile.style.backgroundPosition = `-${c * tileWidth}px -${r * tileHeight}px`;

      container.appendChild(tile);

      // staggered flip
      setTimeout(() => tile.classList.add("flip"), 100 + (r + c) * 60);
    }
  }

  // Reveal new image
  setTimeout(() => {
    post.style.display = "block";

    post.style.opacity = 1;
  }, 900);

  // Show cracked message
  setTimeout(() => {
    document.getElementById("crackedMessage").classList.remove("hidden");
  }, 1300);
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

function openRoom3() {
  // Lock room 2 interaction if you want
  // Show room 3
  const room3 = document.getElementById("room3");
  room3.style.display = "block";
  room3.scrollIntoView({ behavior: "smooth" });

  // Optional dramatic message
  const stage = document.getElementById("stageMessage");
  if (stage) {
    stage.textContent = "🔍 FILE UNLOCKED: IMAGE METADATA DETECTED";
  }
}

function investigateSuspect(user) {
  alert(`Investigating ${user}...`);
}
function unlockRoom3() {
  const room3 = document.getElementById("room3");
  room3.style.display = "block";
  room3.scrollIntoView({ behavior: "smooth" });
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
    output.classList.add("flash-green");
    output.textContent = `✅ Correct shift: ${correctShift}\n\n${decryptedLogs}`;

  // Show suspects and update progress
    document.getElementById("suspects").style.display = "block";
    updateProgress("progressLogs");

  } else {
    output.classList.add("flash-red");
    output.textContent = "❌ Challenge failed! Make sure to loop from 0-26 and set shift.";
    setTimeout(() => { output.classList.remove("flash-red"); output.textContent = ""; }, 3000);
  }
}
async function runStegoChallenge() {
  if (!pyodideReady) return;

  const code = document.getElementById("stegoInput").value;
  const output = document.getElementById("stegoOutput");

  try {
    // Wrap user code and capture print output
    const wrappedCode = `
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
except Exception as e:
    result = "ERROR: " + str(e)
`;

    await pyodide.runPythonAsync(wrappedCode);
    const result = pyodide.globals.get("result");

    // Show output
    output.textContent = result || "No output";

    // Optional: auto-unlock Room 4 if correct key found
    if (result && result.includes("KEY:CRYPTO2025")) {
      unlockRoom4();
    }

  } catch (err) {
    output.textContent = "JS ERROR: " + err;
  }
}

function unlockRoom4() {
  const room3 = document.getElementById("room3");
  const room4 = document.getElementById("room4");
  const stage = document.getElementById("stageMessage");

  // Optional dramatic stage message
  if (stage) stage.textContent = "🔓 Room 4 Unlocked";

  // Fade out Room 3
  room3.style.transition = "opacity 0.8s";
  room3.style.opacity = 0;

  setTimeout(() => {
    room3.style.display = "none"; // hide Room 3
    room3.style.opacity = 1; // reset for later if needed

    // Show Room 4
    room4.style.display = "block";
    room4.style.opacity = 0;
    room4.style.transition = "opacity 1s";
    setTimeout(() => {
      room4.style.opacity = 1;
      room4.scrollIntoView({ behavior: "smooth" });

      // Animate intro text
      const introText = "🕵️‍♂️ Vigenère Cipher Challenge Unlocked!\nDecrypt the hidden message to proceed...";
      const introEl = document.getElementById("room4Intro");

      if (introEl) {
        typeText(introEl, introText, 30);
      }

    }, 50);
  }, 800);
}

// Typing animation helper
function typeText(element, text, speed = 30) {
  element.textContent = "";
  let i = 0;
  const interval = setInterval(() => {
    element.textContent += text[i];
    i++;
    if (i >= text.length) clearInterval(interval);
  }, speed);
}

async function runRoom3() {
  if (!pyodideReady) return;

  const output = document.getElementById("stegoOutput");
  
  function getCode(id) {
    const el = document.getElementById(id);
    return el ? el.innerText.trim() : "";
  }
  
  const loopPixels = getCode("loopPixels");
  const appendBit  = getCode("appendBit");
  const loopBits   = getCode("loopBits");
  const addByte    = getCode("addByte");


  function indent(code, spaces = 4) {
    const pad = " ".repeat(spaces);
    return code.split("\n").map(l => l.trim() ? pad + l : "").join("\n");
  }

  const studentCode = `
pixels = [(0,), (1,), (0,), (1,), (1,), (0,), (0,), (1,),
          (0,), (1,), (1,), (0,), (1,), (0,), (1,), (0,)]
bits = []
chars = []
byte = []

${loopPixels}
${indent(appendBit)}

${loopBits}
${indent(addByte)}

i = 0
while i < len(bits):
    byte_chunk = bits[i:i+8]
    if len(byte_chunk) == 8:
        value = 0
        for b in byte_chunk:
            value = value * 2 + b
        chars.append(chr(value))
    i += 8
result = "".join(chars)
`;

  try {
    await pyodide.runPythonAsync(studentCode);
    const result = pyodide.globals.get("result");

    document.getElementById("stegoImage").style.display = "none";
    document.getElementById("stegoReveal").style.display = "block";
    document.getElementById("crackedMessage").classList.remove("hidden");

    output.textContent = "";
    let i = 0;
    const interval = setInterval(() => {
      if (i >= result.length) {
        clearInterval(interval);
        tileReveal();

        return;
      }
      output.textContent += result[i];
      i++;
    }, 30);


  } catch (err) {
    console.error(err);
    output.textContent = "❌ Check your loops and append.";
  }
}

function submitReport() {
  const answer = document
    .getElementById("culpritInput")
    .value
    .trim()
    .toUpperCase();

  const feedback = document.getElementById("reportFeedback");

  if (answer === "ALEX MERCER" || answer === "USER_07") {
    feedback.textContent = "✅ SUCCESS! You solved the case.";
    feedback.className = "success";
    showVictory();
  } else {
    feedback.textContent = "❌ Evidence does not support this conclusion.";
    feedback.className = "error";
  }
}

// Called when student runs their Vigenère Python code
async function runVigenere() {
  if (!pyodideReady) return;

  const code = document.getElementById("vigenereInput").value;
  const output = document.getElementById("vigenereOutput");

  try {
    const wrappedCode = `
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
except Exception as e:
    result = "ERROR: " + str(e)
`;

    await pyodide.runPythonAsync(wrappedCode);
    const result = pyodide.globals.get("result");

    output.textContent = result || "No output";

    // Trigger suspect reveal and final report if all names are present
    if (
      result &&
      result.includes("ALICE MERCER") &&
      result.includes("CHARLIE MERCER") &&
      result.includes("BOB MERCER")
    ) {
      revealSuspects();
      revealFinalReport();
    }

  } catch (err) {
    output.textContent = "JS ERROR: " + err;
  }
}

// Show all suspect profiles
function revealSuspects() {
  document.getElementById("user03Profile").classList.remove("hidden");
  document.getElementById("user07Profile").classList.remove("hidden");
  document.getElementById("user12Profile").classList.remove("hidden");
}

// Show final report input
function revealFinalReport() {
  document.getElementById("finalReport").classList.remove("hidden");
  document.getElementById("finalReport").scrollIntoView({behavior:"smooth"});
}

// Submit final culprit report
function submitCulprit() {
  const input = document.getElementById("culpritInput").value.trim().toUpperCase();
  const feedback = document.getElementById("finalFeedback");

  if (input === "CHARLIE MERCER" || input === "USER_07") {
    feedback.style.color = "lime";
    feedback.textContent = "✅ Success! You solved the case!";
  } else {
    feedback.style.color = "red";
    feedback.textContent = "❌ That is not correct. Review the evidence and alibis carefully.";
  }
}

window.addEventListener("load", initPyodide);
