/* =====================================================================
   main.js — index.html(메인) 전용 스크립트
   히어로 문구 효과: 위·아래 큰 제목 스크램블(TextScramble), 가운데 문구 타이핑
   ===================================================================== */

class TextScramble {
  constructor(el) {
    this.el = el;
    this.chars = "!<>-_\\/[]{}=+*^?#ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎ";
    this.frame = 0;
    this.queue = [];
    this.update = this.update.bind(this);
  }

  setText(newText) {
    const oldText = this.el.textContent;
    const length = Math.max(oldText.length, newText.length);

    this.queue = [];
    for (let i = 0; i < length; i++) {
      const from = oldText[i] || "";
      const to = newText[i] || "";
      const start = Math.floor(Math.random() * 20);
      const end = start + Math.floor(Math.random() * 20) + 10;
      this.queue.push({ from, to, start, end, char: "" });
    }

    cancelAnimationFrame(this.frameRequest);
    this.frame = 0;
    this.update();
  }

  update() {
    let output = "";
    let complete = 0;

    for (let i = 0; i < this.queue.length; i++) {
      const item = this.queue[i];

      if (this.frame >= item.end) {
        complete++;
        output += item.to;
      } else if (this.frame >= item.start) {
        if (!item.char || Math.random() < 0.28) {
          item.char = this.randomChar();
        }
        output += `<span class="scramble_char">${item.char}</span>`;
      } else {
        output += item.from;
      }
    }

    this.el.innerHTML = output;

    if (complete < this.queue.length) {
      this.frame++;
      this.frameRequest = requestAnimationFrame(this.update);
    }
  }

  randomChar() {
    return this.chars[Math.floor(Math.random() * this.chars.length)];
  }
}

function typeWriter(el, speed = 90, lineDelay = 400, startDelay = 0) {
  const lines = el.innerHTML.split(/<br\s*\/?>/i).map((s) => s.trim());
  let lineIndex = 0;
  let charIndex = 0;

  function step() {
    if (lineIndex >= lines.length) {
      el.innerHTML = lines.join("<br>") + '<span class="typing_cursor"></span>';
      return;
    }

    const currentLine = lines[lineIndex];
    const doneLines = lines.slice(0, lineIndex).join("<br>");
    const partial = currentLine.slice(0, charIndex);
    el.innerHTML = (doneLines ? doneLines + "<br>" : "") + partial + '<span class="typing_cursor"></span>';

    if (charIndex < currentLine.length) {
      charIndex++;
      setTimeout(step, speed);
    } else {
      lineIndex++;
      charIndex = 0;
      setTimeout(step, lineDelay);
    }
  }

  el.innerHTML = "";
  setTimeout(step, startDelay);
}

document.addEventListener("DOMContentLoaded", () => {
  const midTarget = document.querySelector(".hero_copy_mid");
  if (midTarget) {
    typeWriter(midTarget, 90, 400, 1500);
  }

  const topTarget = document.querySelector(".hero_copy_top");
  if (topTarget) {
    const topPhrases = ["확실한 휴식", "확실한 보상", "확실한 당분"];
    const topFx = new TextScramble(topTarget);
    let topIndex = 0;

    topFx.setText(topPhrases[topIndex]);

    setInterval(() => {
      topIndex = (topIndex + 1) % topPhrases.length;
      topFx.setText(topPhrases[topIndex]);
    }, 2800);
  }

  const bottomTarget = document.querySelector(".hero_copy_bottom");
  if (bottomTarget) {
    const phrases = ["확실한 일꾼", "확실한 성과", "확실한 디자이너"];
    const fx = new TextScramble(bottomTarget);
    let index = 0;

    fx.setText(phrases[index]);

    setInterval(() => {
      index = (index + 1) % phrases.length;
      fx.setText(phrases[index]);
    }, 2800);
  }
});
