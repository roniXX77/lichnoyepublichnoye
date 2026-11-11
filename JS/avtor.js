(() => {
// автор
const windowsLayer = document.getElementById("windowsLayer");
const taskbarPrograms = document.getElementById("taskbarPrograms");
const startButton = document.getElementById("startButton");
const startMenu = document.getElementById("startMenu");
let desktopIcons;
const startMenuItems = document.querySelectorAll(".startMenu__item");

let zIndexCounter = 100;
let openWindows = new Map();

const desktopIconsContainer = document.querySelector(".desktopIcons");

const texts = Array.from({length:16}, (_, index) => ({
  file:`author-${index === 0 ? 'main' : index}.html`,
  title:index === 0 ? 'main' : index === 2 ? '2. практика разрушения доверия' : index === 4 ? '4. послание в космос' : `${index}.`
}));

texts.forEach((text,index)=>{

const button=document.createElement("button");

button.className="desktopIcon";

button.dataset.title=text.title;

button.dataset.file=text.file;

button.innerHTML=`
<img src="../../../imagesAndVideos/folderIcon.png">
<span>${text.title}</span>
`;

desktopIconsContainer.appendChild(button);

});

desktopIcons=document.querySelectorAll(".desktopIcon");

function bringToFront(windowElement, taskButton) {
  zIndexCounter += 1;

  document.querySelectorAll(".window").forEach((win) => {
    win.classList.remove("window--active");
  });

  document.querySelectorAll(".taskbarProgram").forEach((btn) => {
    btn.classList.remove("taskbarProgram--active");
  });

  windowElement.style.zIndex = String(zIndexCounter);
  windowElement.classList.add("window--active");

  if (taskButton) {
    taskButton.classList.add("taskbarProgram--active");
  }
}

async function loadFileContent(filePath, bodyElement, frameElement) {
  bodyElement.dataset.loadingLabel = window.SiteLanguage.translate("загрузка...");
  bodyElement.classList.add("loading");

  try {
    const response = await fetch(window.SiteLanguage.contentURL(filePath));

    if (!response.ok) {
      throw new Error(`Не удалось загрузить файл: ${filePath}`);
    }

    const html = await response.text();

    frameElement.srcdoc = html.replace("<head>", `<head><base href="${window.SiteLanguage.contentURL(filePath)}">`);
    bodyElement.classList.remove("loading");
  } catch (error) {
    bodyElement.classList.remove("loading");
    bodyElement.innerHTML = `<div class="window__error">${window.SiteLanguage.translate('не удалось загрузить текст')}</div>`;
    console.error(error);
  }
}

function createTaskbarButton(id, title, iconPath, windowElement) {
  const taskButton = document.createElement("button");
  taskButton.className = "taskbarProgram";
  taskButton.dataset.windowId = id;

  taskButton.innerHTML = `
    <img src="${iconPath}" alt="">
    <span>${title}</span>
  `;

  taskButton.addEventListener("click", () => {
    const isHidden = windowElement.style.display === "none";

    if (isHidden) {
      windowElement.style.display = "block";
      bringToFront(windowElement, taskButton);
      return;
    }

    if (windowElement.classList.contains("window--active")) {
      windowElement.style.display = "none";
      taskButton.classList.remove("taskbarProgram--active");
      return;
    }

    bringToFront(windowElement, taskButton);
  });

  taskbarPrograms.appendChild(taskButton);
  return taskButton;
}

function makeWindowDraggable(windowElement, handleElement) {
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let startLeft = 0;
  let startTop = 0;

  handleElement.addEventListener("mousedown", (event) => {
    if (event.target.closest(".window__control")) return;

    isDragging = true;
    const rect = windowElement.getBoundingClientRect();
    startX = event.clientX;
    startY = event.clientY;
    startLeft = rect.left;
    startTop = rect.top;

    bringToFront(
      windowElement,
      document.querySelector(`.taskbarProgram[data-window-id="${windowElement.dataset.windowId}"]`)
    );

    event.preventDefault();
  });

  document.addEventListener("mousemove", (event) => {
    if (!isDragging) return;

    const dx = event.clientX - startX;
    const dy = event.clientY - startY;

    let nextLeft = startLeft + dx;
    let nextTop = startTop + dy;

    const maxLeft = window.innerWidth - windowElement.offsetWidth;
    const maxTop = window.innerHeight - 40 - windowElement.offsetHeight;

    nextLeft = Math.max(0, Math.min(nextLeft, maxLeft));
    nextTop = Math.max(0, Math.min(nextTop, maxTop));

    windowElement.style.left = `${nextLeft}px`;
    windowElement.style.top = `${nextTop}px`;
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
  });
}

function openDesktopWindow({ title, file, icon = "../../../imagesAndVideos/folderIcon.png" }) {
  if (openWindows.has(file)) {
    const existing = openWindows.get(file);
    existing.window.style.display = "block";
    bringToFront(existing.window, existing.taskButton);
    return;
  }

  const id = `window-${Math.random().toString(36).slice(2, 11)}`;
  const windowElement = document.createElement("article");
  windowElement.className = "window window--active";
  windowElement.dataset.windowId = id;

  const startLeft = 120 + openWindows.size * 30;
  const startTop = 70 + openWindows.size * 30;


  windowElement.innerHTML = `
    <div class="window__titlebar">
      <div class="window__titleLeft">
        <img src="${icon}" alt="">
        <div class="window__title">${title}</div>
      </div>

      <div class="window__controls">
        <button class="window__control window__control--minimize" type="button">—</button>
        <button class="window__control window__control--close" type="button">×</button>
      </div>
    </div>

    <div class="window__body">
      <iframe class="window__frame" title="${title}"></iframe>
    </div>
  `;

  windowsLayer.appendChild(windowElement);
  windowElement.style.left = `${Math.max(0,Math.min(startLeft,window.innerWidth-windowElement.offsetWidth))}px`;
  windowElement.style.top = `${Math.max(0,Math.min(startTop,window.innerHeight-40-windowElement.offsetHeight))}px`;

  const bodyElement = windowElement.querySelector(".window__body");
  const frameElement = windowElement.querySelector(".window__frame");
  const titlebar = windowElement.querySelector(".window__titlebar");
  const minimizeButton = windowElement.querySelector(".window__control--minimize");
  const closeButton = windowElement.querySelector(".window__control--close");

  const taskButton = createTaskbarButton(id, title, icon, windowElement);

  openWindows.set(file, {
    window: windowElement,
    taskButton,
    title,
    file
  });

  bringToFront(windowElement, taskButton);
  makeWindowDraggable(windowElement, titlebar);
  loadFileContent(file, bodyElement, frameElement);

  windowElement.addEventListener("mousedown", () => {
    bringToFront(windowElement, taskButton);
  });

  minimizeButton.addEventListener("click", () => {
    windowElement.style.display = "none";
    taskButton.classList.remove("taskbarProgram--active");
  });

  closeButton.addEventListener("click", () => {
    openWindows.delete(file);
    windowElement.remove();
    taskButton.remove();
  });
}

desktopIcons.forEach((iconButton) => {

  iconButton.addEventListener("click", () => {
    desktopIcons.forEach((item) => item.classList.remove("active"));
    iconButton.classList.add("active");
  });

  iconButton.addEventListener("dblclick", () => {
    const title = iconButton.dataset.title;
    const file = iconButton.dataset.file;

    openDesktopWindow({
      title,
      file,
      icon: "../../../imagesAndVideos/folderIcon.png"
    });
  });

  iconButton.addEventListener("pointerup", event => {
    if (event.pointerType === 'touch') {
      openDesktopWindow({title:iconButton.dataset.title, file:iconButton.dataset.file});
    }
  });
});

if (startButton && startMenu) {
  startButton.addEventListener("click", (event) => {
    event.stopPropagation();
    startMenu.classList.toggle("open");
  });
}

startMenuItems.forEach((item) => {
  item.addEventListener("click", () => {
    const title = item.dataset.openTitle;
    const file = item.dataset.openFile;

    openDesktopWindow({
      title,
      file,
      icon: "../../../imagesAndVideos/folderIcon.png"
    });

    startMenu.classList.remove("open");
  });
});

document.addEventListener("click", (event) => {
  if (!startMenu || !startButton) return;
  if (!startMenu.contains(event.target) && !startButton.contains(event.target)) {
    startMenu.classList.remove("open");
  }
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".desktopIcon")) {
    desktopIcons.forEach((item) => item.classList.remove("active"));
  }
});

window.addEventListener("resize", () => {
  document.querySelectorAll(".window").forEach((windowElement) => {
    const rect = windowElement.getBoundingClientRect();
    const maxLeft = Math.max(0, window.innerWidth - windowElement.offsetWidth);
    const maxTop = Math.max(0, window.innerHeight - 40 - windowElement.offsetHeight);

    if (rect.left > maxLeft) {
      windowElement.style.left = `${maxLeft}px`;
    }

    if (rect.top > maxTop) {
      windowElement.style.top = `${maxTop}px`;
    }
  });
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && startMenu) {
    startMenu.classList.remove("open");
  }
});

const stopBtn = document.getElementById("stopBtn");

if (stopBtn) {
  stopBtn.addEventListener("click", () => {
    window.location.href = "../../../main.html?return=1";
  });
}
})();
