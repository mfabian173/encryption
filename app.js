let pyodideReady = false;
let pyodide;

async function initPyodide() {
  pyodide = await loadPyodide();

  await pyodide.runPythonAsync(`
def caesar(text, shift):
    result = ""
    for char in text:
        if char.isalpha():
            base = ord('A') if char.isupper() else ord('a')
            result += chr((ord(char) - base + shift) % 26 + base)
        else:
            result += char
    return result

def atbash(text):
    result = ""
    for char in text:
        if char.isalpha():
            base = ord('A') if char.isupper() else ord('a')
            result += chr(base + (25 - (ord(char) - base)))
        else:
            result += char
    return result
`);

  pyodideReady = true;

  // Update loading status
  document.getElementById("loading").textContent = "✅ Python ready.";

  // Reveal Begin button
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
  const output = await pyodide.runPythonAsync(code);
  document.getElementById(outputId).textContent = output;
}

// Unlock logic for each room
function unlock(roomNum, correct) {
  const answer = document.getElementById(`answer${roomNum}`).value.trim().toUpperCase();
  const feedback = document.getElementById(`feedback${roomNum}`);

  if (answer === correct) {
    feedback.textContent = "ACCESS GRANTED";
    // Placeholder: could unlock next room here
  } else {
    feedback.textContent = "ACCESS DENIED";
  }
}
