  // mail
  window.addEventListener("DOMContentLoaded", () => {
    const foldersEl = document.getElementById("mailFolders");
    const folderButtons = Array.from(document.querySelectorAll("#mailFolders .folder"));
    const composeBtn = document.getElementById("composeBtn");
    const searchInput = document.getElementById("searchInput");
    const mailItemsEl = document.getElementById("mailItems");
    const actionsEl = document.getElementById("listActions");
    const selectAll = document.getElementById("selectAll");
    if (!mailItemsEl || !composeBtn || !searchInput) return;
  
    const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);
  
    const state = {
      sent: [],
      drafts: [],
      spam: [],
      trash: []
    };
  
    const content = window.MailContent[window.SiteLanguage.current];
    for (const [folder, messages] of Object.entries(content)) {
      state[folder] = messages.map(message => ({ ...message, id: uid() }));
    }

    const folderNames = {
      sent: "отправленные",
      drafts: "черновики",
      spam: "спам",
      trash: "корзина"
    };
    // =========================
  
    let currentFolder = document.querySelector("#mailFolders .folder.active")?.dataset.folder || "sent";
    let searchQuery = "";
    const selectedIds = new Set();
    let openedId = null;
  
    const nowTime = () => {
      const d = new Date();
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      return `${hh}:${mm}`;
    };
  
    const setActiveFolderBtn = (folder) => {
      folderButtons.forEach((b) => b.classList.toggle("active", b.dataset.folder === folder));
    };
  
    const updateBadges = () => {
      folderButtons.forEach((b) => {
        const badge = b.querySelector("b");
        if (!badge) return;
        const f = b.dataset.folder;
        badge.textContent = String((state[f] || []).length);
      });
    };
  
    const findMessageById = (id) => {
      for (const [folderName, list] of Object.entries(state)) {
        const idx = list.findIndex((m) => m.id === id);
        if (idx !== -1) return { folderName, idx, msg: list[idx] };
      }
      return null;
    };
  
    const matchesSearch = (msg) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
    
      const from = (msg.from || "").toLowerCase();
      const subject = (msg.subject || "").toLowerCase();
      const body = (msg.body || "").toLowerCase();
      const snippet = (msg.snippet || "").toLowerCase();
    
      return (
        from.includes(q) ||
        subject.includes(q) ||
        body.includes(q) ||
        snippet.includes(q)
      );
    };
  
    const getVisibleMessages = () => {
      if (!searchQuery) return (state[currentFolder] || []);
      return Object.entries(state)
        .flatMap(([folderName, list]) => list.map((m) => ({ ...m, __folder: folderName })))
        .filter(matchesSearch);
    };
  
    const clearSelection = () => {
      selectedIds.clear();
      if (selectAll) selectAll.checked = false;
    };
  
    const ensurePreviewPanel = () => {
      let panel = document.querySelector(".mailPreview");
      if (panel) return panel;
  
      const content = document.querySelector(".mailContent");
  
      panel = document.createElement("article");
      panel.className = "mailPreview";
      panel.style.padding = "16px";
      panel.style.overflow = "auto";
      panel.style.minWidth = "0";
      panel.style.color = "#6676b8";
      panel.style.background = "#ffffff";
  
      panel.innerHTML = `
      <button class="miniBtn mobileMailBack" type="button"><span aria-hidden="true">←</span><span>назад к письмам</span></button>
      <div class="previewHeader" style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;border-bottom:1px solid rgba(102,118,184,0.14);padding-bottom:12px;">
        <div>
          <h2 class="previewSubject" style="margin:0;font-size:18px;color:#6676b8;">выбери письмо</h2>
         <div class="previewMetaLine" style="margin-top:6px;color:rgba(102,118,184,0.72);font-size:13px;"></div>
        </div>
        <div class="previewBtns" style="display:flex;gap:8px;">
          <button class="miniBtn" id="replyBtn" type="button">ответить</button>
        </div>
      </div>
      <div class="previewBodyWrap" style="margin-top:12px;color:#6676b8;line-height:1.7;"></div>
      `;
      panel.querySelector('.mobileMailBack').addEventListener('click',()=>{
        content.classList.remove('hasOpenMessage');
        document.querySelector('.mailItem')?.focus();
      });
      content.append(panel);
      return panel;
    };
  
    const renderPreview = () => {
      const panel = ensurePreviewPanel();
      const subjEl = panel.querySelector(".previewSubject");
      const metaEl = panel.querySelector(".previewMetaLine");
      const bodyWrap = panel.querySelector(".previewBodyWrap");
  
      if (!openedId) {
        document.querySelector(".mailContent").classList.remove("hasOpenMessage");
        subjEl.textContent = "выбери письмо";
        metaEl.textContent = "";
        bodyWrap.innerHTML = "<p style='opacity:.8;color:rgba(102,118,184,0.82)'>нажми на письмо слева, чтобы открыть.</p>";
        return;
      }
  
      const found = findMessageById(openedId);
      if (!found) {
        openedId = null;
        renderPreview();
        return;
      }
  
      const { folderName, msg } = found;
  
      subjEl.textContent = msg.subject || "(без темы)";
      metaEl.textContent = `${msg.from || "—"} → ${msg.to || "—"} ${msg.time || ""}`;
  
      if (folderName === "drafts") {
        bodyWrap.innerHTML = `
          <div style="display:grid;gap:10px;">
            <input id="draftSubject" value="${escapeHtml(msg.subject || "")}" placeholder="тема" style="padding:12px;border-radius:0;border:1px solid rgba(102,118,184,0.22);background:#f7f8ff;color:#6676b8;">
            <textarea id="draftBody" rows="10" placeholder="текст..." style="padding:12px;border-radius:0;border:1px solid rgba(102,118,184,0.22);background:#f7f8ff;color:#6676b8;resize:vertical;">${escapeHtml(msg.body || "")}</textarea>
            <div style="display:flex;gap:8px;justify-content:flex-end;">
              <button class="miniBtn" id="saveDraftBtn" type="button">сохранить</button>
              <button class="miniBtn danger" id="sendDraftBtn" type="button" style="background:#111;color:#fff;border-color:#111;">отправить</button>
            </div>
          </div>
        `;
  
        const subjectInput = bodyWrap.querySelector("#draftSubject");
        const bodyInput = bodyWrap.querySelector("#draftBody");
        const saveBtn = bodyWrap.querySelector("#saveDraftBtn");
        const sendBtn = bodyWrap.querySelector("#sendDraftBtn");
  
        saveBtn.addEventListener("click", () => {
          msg.subject = subjectInput.value.trim() || "(без темы)";
          msg.body = bodyInput.value;
          msg.snippet = (bodyInput.value.trim() || "—").slice(0, 60);
          msg.time = nowTime();
          updateBadges();
          renderList();
          renderPreview();
        });
  
        sendBtn.addEventListener("click", () => {
          msg.subject = subjectInput.value.trim() || "(без темы)";
          msg.body = bodyInput.value;
          msg.snippet = (bodyInput.value.trim() || "—").slice(0, 60);
          msg.time = nowTime();
  
          const list = state.drafts;
          const idx = list.findIndex((m) => m.id === msg.id);
          if (idx !== -1) list.splice(idx, 1);
  
          state.sent.unshift({
            id: uid(),
            from: "я",
            subject: msg.subject,
            snippet: msg.snippet,
            body: msg.body,
            time: msg.time,
            unread: false
          });
  
          updateBadges();
          openedId = null;
          renderList();
          renderPreview();
        });
  
        return;
      }
  
      const bodyText = (msg.body || msg.snippet || "").trimStart();
  
  if (bodyText.includes("[[cols]]") && bodyText.includes("[[/cols]]")) {
    const [beforePart, restPart] = bodyText.split("[[cols]]");
    const [colsPart, afterPart] = restPart.split("[[/cols]]");
  
    const items = colsPart
      .split("\n")
      .map(s => s.trim())
      .filter(Boolean);
  
    bodyWrap.innerHTML =
      `<p data-no-translate style="white-space:pre-wrap;margin:0;color:#6676b8;">${escapeHtml(beforePart)}</p>` +
      `<div style="
        display:grid;
        grid-template-columns:repeat(3, max-content);
        column-gap:150px;
        row-gap:0;
        line-height:1.5;
        color:#6676b8;
        margin:16px 0;
      ">${items.map(item => `<div data-no-translate>${escapeHtml(item)}</div>`).join("")}</div>` +
      `<p data-no-translate style="white-space:pre-wrap;margin:0;color:#6676b8;">${escapeHtml(afterPart)}</p>`;
  
    return;
  }
  
  const replyBtn = panel.querySelector("#replyBtn");
  
  if (replyBtn) {
    replyBtn.onclick = () => {
      if (!openedId) return;
  
      const found = findMessageById(openedId);
      if (!found) return;
  
      const { msg } = found;
  
      openComposer({
        to: msg.from || "",
        subject: msg.subject ? `re: ${msg.subject}` : "",
        reply: true
      });
    };
  }
  
  bodyWrap.innerHTML = `<p data-no-translate style="white-space:pre-wrap;margin:0;color:#6676b8;overflow-wrap:anywhere;word-break:break-word;">${escapeHtml(bodyText)}</p>`;
    };
  
    const escapeHtml = (s) => {
      return String(s ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    };
  
    const renderList = () => {
      const list = getVisibleMessages();
      mailItemsEl.innerHTML = "";
  
      if (list.length === 0) {
        const empty = document.createElement("div");
        empty.style.padding = "12px";
        empty.style.opacity = "0.7";
        empty.textContent = searchQuery ? "ничего не найдено." : "тут пока пусто.";
        mailItemsEl.append(empty);
        clearSelection();
        if (!searchQuery) openedId = null;
        renderPreview();
        return;
      }
  
      if (openedId && !findMessageById(openedId)) openedId = null;
  
      list.forEach((m) => {
        const btn = document.createElement("button");
        btn.className = "mailItem" + (openedId === m.id ? " active" : "");
        btn.dataset.id = m.id;
  
        const dot = document.createElement("div");
        dot.className = "dot" + (m.unread ? "" : " muted");
  
        const meta = document.createElement("div");
        meta.className = "mailMeta";
  
        const row1 = document.createElement("div");
        row1.className = "mailRow";
  
        const left = document.createElement("div");
        left.style.display = "flex";
        left.style.alignItems = "center";
        left.style.gap = "10px";
  
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = selectedIds.has(m.id);
        checkbox.addEventListener("click", (e) => e.stopPropagation());
        checkbox.addEventListener("change", () => {
          if (checkbox.checked) selectedIds.add(m.id);
          else selectedIds.delete(m.id);
        });
  
        const from = document.createElement("span");
        from.className = "from";
        from.textContent = m.from || "—";
        left.append(checkbox, from);
  
        row1.append(left);
  
        const row2 = document.createElement("div");
        row2.className = "mailRow";
  
        const subject = document.createElement("div");
        subject.className = "subject";
        subject.textContent = m.subject || "(без темы)";
  
        row2.append(subject);
  
        if (searchQuery) {
          const tag = document.createElement("span");
          tag.className = "tag";
          tag.textContent = folderNames[m.__folder] || m.__folder;
          row2.append(tag);
        }
  
        meta.append(row1, row2);
        btn.append(dot, meta);
  
        btn.addEventListener("click", () => {
          openedId = m.id;
          document.querySelector(".mailContent").classList.add("hasOpenMessage");
  
          const found = findMessageById(m.id);
          if (found) found.msg.unread = false;
  
          renderList();
          renderPreview();
        });
  
        mailItemsEl.append(btn);
      });
  
      renderPreview();
      refreshKeyboardFocus();
    };
  
    const moveSelected = (toFolder) => {
      if (selectedIds.size === 0) return;
  
      const ids = Array.from(selectedIds);
      ids.forEach((id) => {
        const found = findMessageById(id);
        if (!found) return;
        const { folderName, idx, msg } = found;
        state[folderName].splice(idx, 1);
        state[toFolder].unshift(msg);
      });
  
      clearSelection();
      updateBadges();
  
      if (openedId && ids.includes(openedId)) openedId = null;
  
      renderList();
    };
  
    const openComposer = (prefill = {}) => {
      const overlay = document.createElement("div");
      overlay.style.position = "fixed";
      overlay.style.inset = "0";
      overlay.style.background = "rgba(102,118,184,0.22)";
      overlay.style.display = "grid";
      overlay.style.placeItems = "center";
      overlay.style.zIndex = "9999";
  
      const modal = document.createElement("div");
      modal.style.width = "min(640px, 92vw)";
      modal.style.maxHeight = "90dvh";
      modal.style.overflowY = "auto";
      modal.style.background = "#ffffff";
      modal.style.color = "#6676b8";
      modal.style.borderRadius = "0px";
      modal.style.boxShadow = "0 20px 60px rgba(0,0,0,0.25)";
      modal.style.padding = "14px";
  
      const top = document.createElement("div");
      top.style.display = "flex";
      top.style.justifyContent = "space-between";
      top.style.alignItems = "center";
      top.style.gap = "10px";
  
      const title = document.createElement("div");
      title.style.fontWeight = "700";
      title.textContent = "новое сообщение";
  
      const close = document.createElement("button");
      close.textContent = "✕";
      close.style.border = "1px solid rgba(102,118,184,0.2)";
      close.style.background = "#6676b8";
      close.style.color = "#ffffff";
      close.style.borderRadius = "0px";
      close.style.cursor = "pointer";
      close.style.padding = "6px 10px";
  
      const form = document.createElement("div");
      form.style.marginTop = "12px";
      form.style.display = "grid";
      form.style.gap = "10px";
  
      const to = document.createElement("input");
      to.placeholder = "кому";
      to.style.padding = "12px";
      to.style.borderRadius = "0px";
      to.style.border = "1px solid rgba(102,118,184,0.22)";
      to.style.background = "#f7f8ff";
      to.style.color = "#6676b8";
  
      const subject = document.createElement("input");
      subject.placeholder = "тема";
      subject.style.padding = "12px";
      subject.style.borderRadius = "0px";
      subject.style.border = "1px solid rgba(102,118,184,0.22)";
      subject.style.background = "#f7f8ff";
      subject.style.color = "#6676b8";
  
      const body = document.createElement("textarea");
      body.placeholder = "текст...";
      body.rows = 7;
      body.style.padding = "12px";
      body.style.borderRadius = "0px";
      body.style.border = "1px solid rgba(102,118,184,0.22)";
      body.style.background = "#f7f8ff";
      body.style.color = "#6676b8";
      body.style.resize = "vertical";
  
      to.value = prefill.to || "";
      subject.value = prefill.subject || "";
      if (prefill.reply) {
        to.disabled = true;
        subject.disabled = true;
      }
      to.readOnly = true;
      subject.readOnly = true;
  
      const bottom = document.createElement("div");
      bottom.style.display = "flex";
      bottom.style.justifyContent = "space-between";
      bottom.style.gap = "10px";
      bottom.style.marginTop = "10px";
  
      const saveDraft = document.createElement("button");
      saveDraft.textContent = "в черновики";
      saveDraft.style.border = "1px solid rgba(102,118,184,0.22)";
      saveDraft.style.background = "#ffffff";
      saveDraft.style.color = "#6676b8";
      saveDraft.style.borderRadius = "0px";
      saveDraft.style.cursor = "pointer";
      saveDraft.style.padding = "10px 12px";
  
      const send = document.createElement("button");
      send.textContent = "отправить";
      send.style.border = "1px solid #6676b8";
      send.style.background = "#6676b8";
      send.style.color = "#ffffff";
      send.style.borderRadius = "0px";
      send.style.cursor = "pointer";
      send.style.padding = "10px 12px";
  
      const closeModal = () => overlay.remove();
      close.addEventListener("click", closeModal);
      overlay.addEventListener("click", (e) => { if (e.target === overlay) closeModal(); });
  
      saveDraft.addEventListener("click", () => {
        const msg = {
          id: uid(),
          from: "я",
          to: to.value.trim() || "—",
          subject: subject.value.trim() || "(без темы)",
          snippet: (body.value.trim() || "—").slice(0, 60),
          body: body.value,
          time: nowTime(),
          unread: false
        };
        state.drafts.unshift(msg);
        updateBadges();
        closeModal();
        renderList();
      });
      
      send.addEventListener("click", () => {
        const msg = {
          id: uid(),
          from: "я",
          to: to.value.trim() || "—",
          subject: subject.value.trim() || "(без темы)",
          snippet: (body.value.trim() || "—").slice(0, 60),
          body: body.value,
          time: nowTime(),
          unread: false
        };
        state.spam.unshift(msg);
        updateBadges();
        closeModal();
        renderList();
      });
  
      top.append(title, close);
      bottom.append(saveDraft, send);
      form.append(to, subject, body, bottom);
      modal.append(top, form);
      overlay.append(modal);
      document.body.append(overlay);
  
      setTimeout(() => body.focus(), 50);
    };
  
    foldersEl.addEventListener("click", (e) => {
      const btn = e.target.closest(".folder");
      if (!btn) return;
      currentFolder = btn.dataset.folder;
      clearSelection();
      if (!searchQuery) openedId = null;
      setActiveFolderBtn(currentFolder);
      renderList();
    });
  
    actionsEl.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;
      const action = btn.dataset.action;
      if (action === "spam") moveSelected("spam");
      if (action === "trash") moveSelected("trash");
    });
  
    selectAll?.addEventListener("change", () => {
      const visible = getVisibleMessages();
      if (selectAll.checked) visible.forEach((m) => selectedIds.add(m.id));
      else clearSelection();
      renderList();
    });
  
    composeBtn.addEventListener("click", openComposer);
  
    searchInput.addEventListener("input", () => {
      searchQuery = searchInput.value.trim();
      clearSelection();
      renderList();
    });

    // =========================
    // random video popups
    // =========================
    const randomVideoSources = [
      "../../../imagesAndVideos/vlublenniyAgent/blueVideo.mp4",
      "../../../imagesAndVideos/vlublenniyAgent/colorVideo.mp4"
    ];
  
    const popupLayer = document.createElement("div");
    popupLayer.className = "videoPopupLayer";
    document.body.appendChild(popupLayer);
  
    const popupTimers = new Map();
    let topZIndex = 10000;
  
    const randomBetween = (min, max) => {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    };
  
    const clamp = (value, min, max) => {
      return Math.min(Math.max(value, min), max);
    };
  
    const schedulePopupForVideo = (videoSrc) => {
      const delayMs = randomBetween(60, 180) * 1000;
  
      const timerId = window.setTimeout(() => {
        spawnVideoPopup(videoSrc);
        schedulePopupForVideo(videoSrc);
      }, delayMs);
  
      popupTimers.set(videoSrc, timerId);
    };
  
    const getRandomPopupPosition = (popupWidth, popupHeight) => {
      const margin = 16;
      const maxLeft = Math.max(margin, window.innerWidth - popupWidth - margin);
      const maxTop = Math.max(margin, window.innerHeight - popupHeight - margin);
  
      return {
        left: randomBetween(margin, maxLeft),
        top: randomBetween(margin, maxTop)
      };
    };
  
    const makePopupDraggable = (popup, handle) => {
      let dragging = false;
      let startX = 0;
      let startY = 0;
      let startLeft = 0;
      let startTop = 0;
  
      const onMouseMove = (e) => {
        if (!dragging) return;
  
        const nextLeft = clamp(
          startLeft + (e.clientX - startX),
          0,
          window.innerWidth - popup.offsetWidth
        );
  
        const nextTop = clamp(
          startTop + (e.clientY - startY),
          0,
          window.innerHeight - popup.offsetHeight
        );
  
        popup.style.left = `${nextLeft}px`;
        popup.style.top = `${nextTop}px`;
      };
  
      const stopDragging = () => {
        dragging = false;
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", stopDragging);
      };
  
      handle.addEventListener("mousedown", (e) => {
        if (e.target.closest(".videoPopupClose")) return;
  
        dragging = true;
        startX = e.clientX;
        startY = e.clientY;
        startLeft = popup.offsetLeft;
        startTop = popup.offsetTop;
  
        popup.style.zIndex = String(++topZIndex);
  
        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", stopDragging);
      });
    };
  
    const spawnVideoPopup = (videoSrc) => {
      const popup = document.createElement("section");
      popup.className = "videoPopup is-entering";
      popup.style.zIndex = String(++topZIndex);
  
      popup.innerHTML = `
        <div class="videoPopupHeader">
          <div class="videoPopupTitle">thank u thank u</div>
          <button class="videoPopupClose" type="button">x</button>
        </div>
        <div class="videoPopupBody">
          <div class="videoPopupVideoWrap">
            <video class="videoPopupVideo" autoplay muted loop playsinline preload="auto">
              <source src="${videoSrc}" type="video/mp4">
            </video>
          </div>
        </div>
      `;
  
      popupLayer.appendChild(popup);
  
      const closeBtn = popup.querySelector(".videoPopupClose");
      const header = popup.querySelector(".videoPopupHeader");
      const video = popup.querySelector(".videoPopupVideo");
      const videoWrap = popup.querySelector(".videoPopupVideoWrap");
      const body = popup.querySelector(".videoPopupBody");
  
      popup.style.width = "260px";
      videoWrap.style.height = "180px";
  
      requestAnimationFrame(() => {
        const popupWidth = popup.offsetWidth || 260;
        const popupHeight = popup.offsetHeight || 240;
        const pos = getRandomPopupPosition(popupWidth, popupHeight);
  
        popup.style.left = `${pos.left}px`;
        popup.style.top = `${pos.top}px`;
      });
  
      closeBtn.addEventListener("click", () => {
        popup.remove();
      });
  
      popup.addEventListener("mousedown", () => {
        popup.style.zIndex = String(++topZIndex);
      });
  
      video.addEventListener("loadedmetadata", () => {
        const isVertical = video.videoHeight > video.videoWidth;
  
        if (isVertical) {
          popup.style.width = "220px";
          videoWrap.style.height = "260px";
        } else {
          popup.style.width = "260px";
          videoWrap.style.height = "180px";
        }
  
        const popupWidth = popup.offsetWidth || (isVertical ? 220 : 260);
        const popupHeight = popup.offsetHeight || (isVertical ? 320 : 240);
        const pos = getRandomPopupPosition(popupWidth, popupHeight);
  
        popup.style.left = `${pos.left}px`;
        popup.style.top = `${pos.top}px`;
      });
  
      video.addEventListener("error", () => {
        body.innerHTML = `
          <div class="videoPopupHint" style="font-size:12px; line-height:1.4;">
            видео не загрузилось
          </div>
        `;
      });
  
      video.load();
      video.play().catch((err) => {
        console.log("video play error:", err);
      });
  
      makePopupDraggable(popup, header);
  
      window.setTimeout(() => {
        popup.classList.remove("is-entering");
      }, 220);
    };
  
    randomVideoSources.forEach(schedulePopupForVideo);

    // mail timer
  const stopBtn = document.getElementById("stopBtn");
  
  if(stopBtn){
    stopBtn.addEventListener("click", () => {
      window.location.href = "../../../main.html";
    });
  }

    // zoned keyboard navigation
    let keyboardZone = 0;
    let keyboardIndexInZone = 0;
  
    const getKeyboardZones = () => {
      const zoneLeft = [];
      const zoneMiddle = [];
      const zoneRight = [];
  
      const composeBtnEl = document.getElementById("composeBtn");
      if (composeBtnEl) zoneLeft.push(composeBtnEl);
  
      const folderBtns = Array.from(document.querySelectorAll("#mailFolders .folder"));
      zoneLeft.push(...folderBtns);
  
      const spamBtn = document.querySelector('#listActions button[data-action="spam"]');
      const trashBtn = document.querySelector('#listActions button[data-action="trash"]');
      if (spamBtn) zoneMiddle.push(spamBtn);
      if (trashBtn) zoneMiddle.push(trashBtn);
  
      const mailBtns = Array.from(document.querySelectorAll("#mailItems .mailItem"));
      zoneMiddle.push(...mailBtns);
  
      const stopBtn = document.getElementById("stopBtn");
      const replyBtn = document.getElementById("replyBtn");
      if (stopBtn) zoneRight.push(stopBtn);
      if (replyBtn) zoneRight.push(replyBtn);
  
      return [zoneLeft, zoneMiddle, zoneRight].filter(zone => zone.length > 0);
    };
  
    const clearKeyboardFocus = () => {
      document.querySelectorAll(".keyboardFocus").forEach((el) => {
        el.classList.remove("keyboardFocus");
      });
    };
  
    const getCurrentKeyboardElement = () => {
      const zones = getKeyboardZones();
      if (!zones.length) return null;
      if (!zones[keyboardZone]) return null;
      return zones[keyboardZone][keyboardIndexInZone] || null;
    };
  
    const applyKeyboardFocus = (zoneIndex = keyboardZone, itemIndex = keyboardIndexInZone) => {
      const zones = getKeyboardZones();
      if (!zones.length) {
        clearKeyboardFocus();
        keyboardZone = 0;
        keyboardIndexInZone = 0;
        return;
      }
  
      if (zoneIndex < 0) zoneIndex = 0;
      if (zoneIndex >= zones.length) zoneIndex = zones.length - 1;
  
      const zone = zones[zoneIndex];
      if (!zone.length) return;
  
      if (itemIndex < 0) itemIndex = 0;
      if (itemIndex >= zone.length) itemIndex = zone.length - 1;
  
      keyboardZone = zoneIndex;
      keyboardIndexInZone = itemIndex;
  
      clearKeyboardFocus();
  
      const el = zone[itemIndex];
      if (!el) return;
  
      el.classList.add("keyboardFocus");
      el.scrollIntoView({
        block: "nearest",
        inline: "nearest"
      });
    };
  
    const refreshKeyboardFocus = () => {
      const zones = getKeyboardZones();
      if (!zones.length) {
        clearKeyboardFocus();
        keyboardZone = 0;
        keyboardIndexInZone = 0;
        return;
      }
  
      if (keyboardZone >= zones.length) {
        keyboardZone = zones.length - 1;
      }
  
      const zone = zones[keyboardZone];
      if (!zone || !zone.length) {
        keyboardZone = 0;
        keyboardIndexInZone = 0;
        applyKeyboardFocus(0, 0);
        return;
      }
  
      if (keyboardIndexInZone >= zone.length) {
        keyboardIndexInZone = zone.length - 1;
      }
  
      applyKeyboardFocus(keyboardZone, keyboardIndexInZone);
    };
  
    const moveWithinZone = (direction) => {
      const zones = getKeyboardZones();
      if (!zones.length) return;
  
      const zone = zones[keyboardZone];
      if (!zone || !zone.length) return;
  
      let nextIndex = keyboardIndexInZone + direction;
  
      if (nextIndex < 0) nextIndex = zone.length - 1;
      if (nextIndex >= zone.length) nextIndex = 0;
  
      applyKeyboardFocus(keyboardZone, nextIndex);
    };
  
    const moveAcrossZones = (direction) => {
      const zones = getKeyboardZones();
      if (!zones.length) return;
  
      let nextZone = keyboardZone + direction;
  
      if (nextZone < 0) nextZone = zones.length - 1;
      if (nextZone >= zones.length) nextZone = 0;
  
      const nextZoneItems = zones[nextZone];
      const nextIndex = Math.min(keyboardIndexInZone, nextZoneItems.length - 1);
  
      applyKeyboardFocus(nextZone, nextIndex);
    };
  
    const syncKeyboardFocusWithMouse = () => {
      document.addEventListener("mouseover", (e) => {
        const target = e.target.closest(
          "#composeBtn, #mailFolders .folder, #listActions button[data-action], #mailItems .mailItem, #stopBtn, #replyBtn"
        );
  
        if (!target) return;
  
        const zones = getKeyboardZones();
  
        for (let z = 0; z < zones.length; z++) {
          const idx = zones[z].indexOf(target);
          if (idx !== -1) {
            applyKeyboardFocus(z, idx);
            return;
          }
        }
      });
    };
  
    document.addEventListener("keydown", (e) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      const isTypingField =
        activeTag === "input" ||
        activeTag === "textarea" ||
        document.activeElement?.isContentEditable;
  
      if (isTypingField) return;
  
      if (e.key === "ArrowDown") {
        e.preventDefault();
        moveWithinZone(1);
        return;
      }
  
      if (e.key === "ArrowUp") {
        e.preventDefault();
        moveWithinZone(-1);
        return;
      }
  
      if (e.key === "ArrowRight") {
        e.preventDefault();
        moveAcrossZones(1);
        return;
      }
  
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        moveAcrossZones(-1);
        return;
      }
  
      if (e.key === "Enter") {
        const el = getCurrentKeyboardElement();
        if (!el) return;
  
        e.preventDefault();
        el.click();
  
        window.setTimeout(() => {
          refreshKeyboardFocus();
        }, 0);
      }
    });
  
    syncKeyboardFocusWithMouse();
  
    updateBadges();
    setActiveFolderBtn(currentFolder);
    renderList();
    applyKeyboardFocus(0);
  });