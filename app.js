let pyodide;
let room1Unlocked = false;
let room2Unlocked = false;

async function initPyodide() {
  pyodide = await loadPyodide();
  document.getElementById("loading").textContent = "✅ Python ready.";
}
initPyodide();

function startCase() {
  document.getElementById("briefing").classList.add("hidden");
  document.getElementById("room1").classList.remove("hidden");
}

/* ================= ROOM 1 ================= */

function showBrief(cipher) {
  const d = document.getElementById("briefDisplay");
  if (cipher === "atbash") {
    d.innerHTML = `<pre>
def atbash(text):
    r=""
    for c in text:
        if c.isalpha():
            b=ord('A') if c.isupper() else ord('a')
            r+=chr(b+(25-(ord(c)-b)))
        else: r+=c
    return r
</pre>`;
  }
  if (cipher === "caesar") {
    d.innerHTML = `<pre>
def caesar(text,shift):
    r=""
    for c in text:
        if c.isalpha():
            b=ord('A') if c.isupper() else ord('a')
            r+=chr((ord(c)-b+shift)%26+b)
        else: r+=c
    return r
</pre>`;
  }
  if (cipher === "rot13") {
    d.innerHTML = `<pre>
def rot13(text):
    return caesar(text,13)
</pre>`;
  }
}

async function runPython1() {
  const code = document.getElementById("pythonCode1").value;
  const out = await pyodide.runPythonAsync(code);
  document.getElementById("output1").textContent = out;

  if (typeof out === "string" && out.toLowerCase().includes("one hour")) {
    unlockRoom1();
  }
}

function unlockRoom1() {
  if (room1Unlocked) return;
  room1Unlocked = true;

  document.getElementById("roomLock1").classList.add("room-unlock");
  setTimeout(() => document.getElementById("roomLock1").remove(), 1200);
  document.getElementById("room1Content").classList.remove("room-locked");
  document.getElementById("room2").classList.remove("hidden");
}

/* ================= ROOM 2 ================= */

async function runPython2() {
  const code = document.getElementById("pythonCode2").value;
  const out = await pyodide.runPythonAsync(code);
  document.getElementById("output2").textContent = out;

  if (
    typeof out === "string" &&
    out.includes("ALICE") &&
    out.includes("XV")
  ) {
    unlockRoom2();
  }
}

function unlockRoom2() {
  if (room2Unlocked) return;
  room2Unlocked = true;

  document.getElementById("roomLock2").classList.add("room-unlock");
  setTimeout(() => document.getElementById("roomLock2").remove(), 1200);
  document.getElementById("room2Content").classList.remove("room-locked");
}
// SAFETY CHECK: ensure startCase exists
window.startCase = function () {
  const briefing = document.getElementById("briefing");
  const room1 = document.getElementById("room1");

  if (!briefing || !room1) {
    console.error("Missing briefing or room1 section");
    return;
  }

  briefing.classList.add("hidden");
  room1.classList.remove("hidden");
};
