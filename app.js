
document.body.insertAdjacentHTML(
  "afterbegin",
  "<p id='loading'>⏳ Loading Python environment…</p>"
);

let pyodideReady = false;
let pyodide;

async function initPyodide() {
  pyodide = await loadPyodide();

  await pyodide.runPythonAsync(
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
);
  pyodideReady = true;
  document.getElementById("loading").textContent = "✅ Python ready.";

}

initPyodide();

async function runPython(codeId, outputId) {
  if (!pyodideReady) return;
  const code = document.getElementById(codeId).value;
  const output = await pyodide.runPythonAsync(code);
  document.getElementById(outputId).textContent = output;
}

function unlock(roomNum, correct) {
  const answer = document.getElementById(`answer${roomNum}`).value.trim().toUpperCase();
  const feedback = document.getElementById(`feedback${roomNum}`);

  if (answer === correct) {
    feedback.textContent = "ACCESS GRANTED";
    const next = document.getElementById(
      roomNum === 4 ? "final" : `room${roomNum + 1}`
    );
    if (next) next.classList.remove("locked");
  } else {
    feedback.textContent = "ACCESS DENIED";
  }
}
