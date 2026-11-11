//манифест любви
document.addEventListener("DOMContentLoaded", () => {
    const menu = document.getElementById("manifestMenu");
    if (!menu) return;
  
    const items = Array.from(document.querySelectorAll(".manifest_item"));
    if (!items.length) return;
  
    let currentIndex = 0;
  
    function setActive(index) {
      items.forEach((item) => item.classList.remove("is-active"));
    
      currentIndex = Math.max(0, Math.min(index, items.length - 1));
      const activeItem = items[currentIndex];
      activeItem.classList.add("is-active");
    
      if (activeItem.closest("#manifestMenu")) {
        activeItem.scrollIntoView({
          block: "nearest",
          behavior: "smooth"
        });
      }
    }
  
    function activateCurrentItem() {
      const activeItem = items[currentIndex];
    
      if (activeItem.classList.contains("is-accept")) {
        const href = activeItem.dataset.href;
        if (href) {
          window.location.href = href;
        }
      }
    }
  
    document.addEventListener("keydown", (event) => {
      if (event.target.closest(".siteUtility")) return;
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActive(currentIndex + 1);
      }
  
      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActive(currentIndex - 1);
      }
  
      if (event.key === "Enter") {
        event.preventDefault();
        activateCurrentItem();
      }
    });
  
    items.forEach((item, index) => {
      item.addEventListener("mouseenter", () => {
        setActive(index);
      });
  
      item.addEventListener("click", () => {
        setActive(index);
        activateCurrentItem();
      });
    });
  
    setActive(0);
  
    const glitchLine = document.querySelector(".manifest_glitch_line");
    const manifestScreen = document.querySelector(".manifest_screen");
    
    if (glitchLine && manifestScreen) {
      function triggerGlitchLine() {
        const screenHeight = manifestScreen.clientHeight;
    
        const minTop = 50;
        const maxTop = screenHeight - 80;
    
        const randomTop = Math.floor(Math.random() * (maxTop - minTop + 1)) + minTop;
        const randomHeight = Math.floor(Math.random() * 14) + 8;
    
        glitchLine.style.top = `${randomTop}px`;
        glitchLine.style.height = `${randomHeight}px`;
    
        glitchLine.classList.remove("is-active");
        void glitchLine.offsetWidth;
        glitchLine.classList.add("is-active");
      }
    
      function loopGlitchLine() {
        const nextDelay = Math.random() * 5000 + 2200;
    
        setTimeout(() => {
          triggerGlitchLine();
          loopGlitchLine();
        }, nextDelay);
      }
    
      loopGlitchLine();
    }
  });
