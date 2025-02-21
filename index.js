/**
 * HappyGallery v1.2.0
 * Licensed under GPL-3.0
 *
 * https://github.com/KraussKommunikation/happygallery
 *
 * by Krauss Kommunikation (krausskommunikation.de)
 */
class HappyGallery {
  static renderers = [];

  constructor(container, options = {}) {
    const optionBluePrint = {
      observe: false,
      updateOpenGalleryOnMutation: true,
      itemSelector: "a",
      slideAnimationDuration: 0.3,
      toolbar: ["download", "share"],
      useNativeShareAPI: true,
      renderers: [...HappyGallery.renderers],
    };
    this.options = {
      ...optionBluePrint,
      ...options,
    };
    this.container = container;
    this.ui = null;
    this.unregisterEventListeners = this.registerEventListeners();

    this.createStyleTag();

    if (this.options.observe) {
      this.mutationObserver = new MutationObserver((list) => {
        const reopenIndex = this.ui ? this.getCurrentActiveIndex() : null;
        this.unregisterEventListeners();
        this.registerEventListeners();
        if (reopenIndex !== null && this.options.updateOpenGalleryOnMutation) {
          this.closeGallery();
          this.openGallery(reopenIndex);
        }
      });
      this.mutationObserver.observe(this.container, { subtree: true, childList: true });
    }
  }

  static registerRenderer(renderer) {
    HappyGallery.renderers.push(renderer);
  }

  registerEventListeners() {
    const keyDownCallback = this.handleKeyDownEvent.bind(this);
    const imageClickCallback = this.handleImageClickEvent.bind(this);
    document.body.addEventListener("keydown", keyDownCallback);
    this.container.querySelectorAll(this.options.itemSelector).forEach((element) => {
      element.addEventListener("click", imageClickCallback);
    });

    return () => {
      document.body.removeEventListener("keydown", keyDownCallback);
      this.container.querySelectorAll(this.options.itemSelector).forEach((element) => {
        element.removeEventListener("click", imageClickCallback);
      });
    };
  }

  handleKeyDownEvent(event) {
    if (!this.ui) return;
    const { keyCode } = event;
    if (keyCode === 27) {
      this.closeGallery();
    } else if (keyCode === 37) {
      this.prevSlide();
    } else if (keyCode === 39) {
      this.nextSlide();
    }
  }

  handleImageClickEvent(event) {
    event.preventDefault();
    event.stopPropagation();

    const target = event.path.find((element) => {
      if (element.matches(this.options.itemSelector)) return true;
      return false;
    });

    const index = [...this.container.querySelectorAll(this.options.itemSelector)].indexOf(target);
    this.openGallery(index);
  }

  openGallery(index = 0) {
    if (this.ui) return;

    this.ui = this.getUIElement();

    this.ui.querySelector("button[data-hg-btn-prev]").addEventListener("click", () => {
      this.prevSlide();
    });
    this.ui.querySelector("button[data-hg-btn-next]").addEventListener("click", () => {
      this.nextSlide();
    });
    this.ui.querySelector("button[data-hg-btn-close]").addEventListener("click", () => {
      this.closeGallery();
    });
    this.ui.querySelector('[data-hg-toolbar="share"]').addEventListener("click", () => {
      if ("share" in navigator && this.options.useNativeShareAPI === true) {
        // const file = new File([blob], 'picture.jpg', { type: 'image/jpeg' });
        navigator
          .share({
            title: document.title,
            url: document.location.href,
          })
          .then(() => {
            //
          })
          .catch(console.error);
      } else {
        this.ui.querySelector("[data-share-options]").classList.toggle("active");
        this.ui
          .querySelector("[data-hg-share='mail']")
          .setAttribute(
            "href",
            "mailto:?to=&body=" + document.location.href + ",&subject=" + document.title,
          );
        this.ui
          .querySelector("[data-hg-share='facebook']")
          .setAttribute("href", "https://www.facebook.com/sharer.php?u=" + document.location.href);
        this.ui
          .querySelector("[data-hg-share='twitter']")
          .setAttribute(
            "href",
            "https://twitter.com/intent/tweet?url=" +
              document.location.href +
              "&text=" +
              document.title,
          );
      }
    });

    document.body.classList.add("hg-overflow-hidden");

    // Slider
    let isDown = false;
    let moveX = 0;
    let startX = 0;

    const slider = this.ui.querySelector("[data-hg-images]");
    const sliderParent = this.ui.querySelector("[data-hg-imagecontainer]");

    const dragStart = (e) => {
      if (e.type === "touchstart") {
        startX = e.changedTouches[0].pageX - slider.offsetLeft;
      } else {
        startX = e.pageX - slider.offsetLeft;
      }
      isDown = true;
      slider.classList.add("hg-grabbing");
      sliderParent.setAttribute("style", `--drag: 0%;`);
    };
    const dragStop = () => {
      isDown = false;
      slider.classList.remove("hg-grabbing");
      onLetGo();
      moveX = 0;
      sliderParent.setAttribute("style", `--drag: 0%;`);
    };
    const onLetGo = () => {
      const fullWidth = sliderParent.clientWidth;
      const currentSlideStart = this.getCurrentActiveIndex() * fullWidth;
      const currentPos = currentSlideStart - moveX;
      const rest = currentPos % fullWidth;
      const currentProgress = rest / fullWidth;
      const slideChange = Math.round(currentProgress);
      const slidesBefore = Math.floor(currentPos / fullWidth);
      const newIndex = slideChange + slidesBefore;
      this.goToSlide(newIndex);
    };

    slider.addEventListener("mousedown", dragStart);
    slider.addEventListener("mouseleave", dragStop);
    slider.addEventListener("mouseup", dragStop);
    slider.addEventListener("mousemove", (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - slider.offsetLeft;
      const walk = (x - startX) * 2;
      moveX = walk;
      const percentage = Math.round((moveX / slider.clientWidth) * 100);
      sliderParent.setAttribute("style", `--drag: ${percentage}%;`);
    });

    slider.addEventListener("touchstart", dragStart);
    slider.addEventListener("touchleave", dragStop);
    slider.addEventListener("touchend", dragStop);
    slider.addEventListener("touchmove", (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.changedTouches[0].pageX - slider.offsetLeft;
      const walk = (x - startX) * 2;
      moveX = walk;
      const percentage = Math.round((moveX / slider.clientWidth) * 100);
      sliderParent.setAttribute("style", `--drag: ${percentage}%;`);
    });

    document.body.appendChild(this.ui);

    let itemCount = 0;
    this.container.querySelectorAll(this.options.itemSelector).forEach((el) => {
      for (const potentialRenderer of this.options.renderers) {
        const renderer = new potentialRenderer();
        const element = renderer.detector(el, this);
        if (element) {
          const output = renderer.render(element, this);
          this.ui.querySelector("[data-hg-images]").appendChild(output);
          itemCount++;
          break;
        }
      }
    });

    if (itemCount < 2) {
      this.ui.querySelector("button[data-hg-btn-prev]").classList.add("hg-hidden");
      this.ui.querySelector("button[data-hg-btn-next]").classList.add("hg-hidden");
      this.ui.querySelector("[data-hg-pageinfo]").classList.add("hg-hidden");
    }
    this.ui.querySelectorAll("[data-hg-toolbar]").forEach((el) => {
      if (!this.options.toolbar.includes(el.getAttribute("data-hg-toolbar"))) el.remove();
    });

    this.goToSlide(index, false);

    this.ui.addEventListener("click", (e) => {
      if (
        e.target.matches("svg") ||
        e.target.matches("button") ||
        e.target.matches("path") ||
        e.target.matches(".lg-footer span")
      )
        return;

      const imgOffsetLeft = document
        .querySelector(".hg-element-active img")
        .getBoundingClientRect().left;
      const imgOffsetRight = document
        .querySelector(".hg-element-active img")
        .getBoundingClientRect().right;
      const imgOffsetTop = document
        .querySelector(".hg-element-active img")
        .getBoundingClientRect().top;
      const imgOffsetBottom = document
        .querySelector(" .hg-element-active img")
        .getBoundingClientRect().bottom;
      if (imgOffsetLeft < 0 || imgOffsetRight > window.innerWidth) {
        return;
      }
      if (
        e.x > imgOffsetRight ||
        e.x < imgOffsetLeft ||
        e.y > imgOffsetBottom ||
        e.y < imgOffsetTop
      ) {
        this.closeGallery();
      }
    });
  }
  getCurrentActiveIndex() {
    if (!this.ui) return;
    const index = [...this.ui.querySelectorAll("[data-hg-images] > *")].findIndex((e) =>
      e.classList.contains("hg-element-active"),
    );
    return index;
  }

  nextSlide() {
    if (!this.ui) return;
    const amount = this.ui.querySelectorAll("[data-hg-images] > *").length;
    let currentIndex = this.getCurrentActiveIndex();
    currentIndex++;
    if (currentIndex === amount) {
      currentIndex = 0;
    }
    this.goToSlide(currentIndex);
  }
  prevSlide() {
    if (!this.ui) return;
    const amount = this.ui.querySelectorAll("[data-hg-images] > *").length;
    let currentIndex = this.getCurrentActiveIndex();
    currentIndex--;
    if (currentIndex < 0) {
      currentIndex = amount - 1;
    }
    this.goToSlide(currentIndex);
  }

  goToSlide(index, animate = true) {
    if (!this.ui) return;
    const amount = this.ui.querySelectorAll("[data-hg-images] > *").length;
    if (index < 0) index = 0;
    if (index + 1 >= amount) index = amount - 1;
    const cssValues = `--childs: ${amount};--active: ${index}; --slide-animation: ${
      animate ? this.options.slideAnimationDuration : 0
    }s`;
    this.ui.querySelector("[data-hg-images]").setAttribute("style", cssValues);
    this.ui.querySelectorAll("[data-hg-images] > *").forEach((element, elementIndex) => {
      if (elementIndex === index) {
        element.classList.add("hg-element-active");
      } else {
        element.classList.remove("hg-element-active");
      }
    });
    this.ui.querySelector("[data-hg-pageinfo]").innerHTML = `${index + 1} / ${amount}`;
    const currentElement = this.ui.querySelector("[data-hg-images] > .hg-element-active");
    this.ui.querySelector("[data-hg-title] span").innerHTML =
      currentElement.getAttribute("data-hg-title");

    const downloadUrl = currentElement.getAttribute("data-hg-download-url");
    const downloadButton = this.ui.querySelector('[data-hg-toolbar="download"]');
    if (downloadUrl) {
      downloadButton.hidden = false;
      downloadButton.setAttribute("download", "");
    } else {
      downloadButton.hidden = true;
    }

    this.ui.querySelector('[data-hg-toolbar="share"]').addEventListener("click", () => {
      const element = document.createElement("div");
    });
  }

  closeGallery() {
    if (!this.ui) return;
    this.ui.remove();
    this.ui = null;
    document.body.classList.remove("hg-overflow-hidden");
  }

  destroy() {
    this.closeGallery();
    this.unregisterEventListeners();
    if (this.options.observe) this.mutationObserver.disconnect();
  }

  getUIElement() {
    const element = document.createElement("div");
    element.innerHTML = `
        <div class="hg-header">
          <span class="hg-pageinfo" data-hg-pageinfo></span>
            <button class="hg-share hg-btn" data-hg-toolbar="share">
              <svg xmlns="http://www.w3.org/2000/svg" class="hg-icon" viewBox="0 0 20 20" fill="currentColor">
                <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
              </svg>
            </button>
            <div class="hg-share-options" data-share-options = "">
          <a class="hg-share-icon" href="" title="" data-hg-share="mail">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
  
          </a>
          <a class="hg-share-icon" href="" title="" data-hg-share="facebook" target="_blank">
            <svg id="Ebene_1" fill="currentcolor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 355.84 353.62">
              <path d="M205.83,353.62v-124.17h41.36c2.64-17.18,5.25-34.23,7.9-51.47h-49.17c-.07-.59-.15-1.01-.15-1.43,0-11.01-.02-22.02,0-33.03,0-2.79,.4-5.54,1.13-8.23,2.52-9.26,8.54-14.96,17.78-17.33,3.8-.97,7.68-1.14,11.58-1.15,6.28,0,12.57,0,18.85,0,.6,0,1.2,0,1.93,0v-43.89c-3.21-.45-6.38-1.01-9.57-1.32-7.19-.7-14.38-1.43-21.59-1.87-10.3-.63-20.56-.24-30.6,2.52-11.88,3.27-22.11,9.19-30.09,18.71-6.19,7.38-10.12,15.89-12.47,25.17-1.79,7.09-2.61,14.31-2.62,21.62-.03,12.68,0,25.36,0,38.03,0,.65,0,1.3,0,2.14h-45.05v51.45h44.96v124.19C71.81,342.58-.26,272.35,0,177.26,.26,80.21,78.28,1.79,174.59,.03c95.83-1.75,175.01,72.33,180.88,166.41,6.11,97.86-65.56,174.79-149.64,187.19Z" />
            </svg>
  
          </a>
          <a class="hg-share-icon" fill="currentcolor" href="" title="" target="_blank" data-hg-share="twitter">
            <svg id="Layer_1" fill="currentcolor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 310 253.81">
              <path d="M302.98,29.29c-4.87,2.16-9.88,3.98-14.99,5.46,6.06-6.85,10.67-14.91,13.49-23.73,.63-1.98-.02-4.14-1.65-5.43-1.62-1.29-3.88-1.45-5.67-.39-10.86,6.44-22.59,11.08-34.88,13.78C246.9,6.89,230.09,0,212.7,0c-36.7,0-66.55,29.85-66.55,66.55,0,2.89,.18,5.76,.54,8.6-45.53-4-87.87-26.38-116.94-62.04-1.04-1.27-2.63-1.96-4.27-1.83-1.64,.13-3.1,1.05-3.93,2.47-5.9,10.12-9.01,21.69-9.01,33.46,0,16.04,5.72,31.25,15.84,43.14-3.08-1.07-6.06-2.4-8.91-3.98-1.53-.85-3.4-.84-4.91,.03-1.52,.87-2.47,2.47-2.51,4.22,0,.29,0,.59,0,.89,0,23.93,12.88,45.48,32.58,57.23-1.69-.17-3.38-.41-5.06-.74-1.73-.33-3.51,.28-4.68,1.6-1.17,1.32-1.56,3.16-1.02,4.84,7.29,22.76,26.06,39.5,48.75,44.6-18.82,11.79-40.34,17.96-62.93,17.96-4.71,0-9.45-.28-14.1-.83-2.31-.27-4.51,1.09-5.29,3.28-.79,2.19,.05,4.64,2.01,5.9,29.02,18.61,62.58,28.44,97.05,28.44,67.75,0,110.14-31.95,133.76-58.75,29.46-33.42,46.36-77.66,46.36-121.37,0-1.83-.03-3.67-.08-5.51,11.62-8.76,21.63-19.35,29.77-31.54,1.24-1.85,1.1-4.29-.33-6-1.43-1.7-3.82-2.25-5.85-1.35Z" />
            </svg>
  
          </a>
        </div>
  
  
  
          <a href="" download target="_blank" class="hg-download hg-btn" data-hg-toolbar="download" >
            <svg xmlns="http://www.w3.org/2000/svg" class="hg-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </a>
          <button class="hg-close hg-btn" data-hg-btn-close>
            <svg xmlns="http://www.w3.org/2000/svg" class="hg-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
        <div class="hg-toolbar">
          <button class="hg-arrow-left hg-btn" data-hg-btn-prev>
            <svg xmlns="http://www.w3.org/2000/svg" class="hg-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
            </svg>
          </button>
          <button class="hg-arrow-right hg-btn" data-hg-btn-next>
            <svg xmlns="http://www.w3.org/2000/svg" class="hg-icon" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
          <div class="hg-body" data-hg-imagecontainer>
            <div class="hg-body-images" data-hg-images></div>
          </div>
        </div>
        <div class="hg-footer" data-hg-title><span></span></div>
      `;
    element.setAttribute("id", "happygallery-ui");
    return element;
  }
  createStyleTag() {
    if (document.head.querySelector("style#happygallery-style")) return;
    const style = document.createElement("style");
    style.setAttribute("id", "happygallery-style");
    style.innerHTML = `#happygallery-ui,
      #happygallery-ui * {
        box-sizing: border-box;
      }
  
      #happygallery-ui {
        --bg-opacity: 0.8;
        background-color: rgba(0, 0, 0, var(--bg-opacity));
        backdrop-filter: blur(4px);
        height: 100vh;
        width: 100vw;
        position: fixed;
        z-index: 90;
        inset: 0;
        display: flex;
        flex-direction: column;
      }
  
      @supports not (backdrop-filter: blur()) {
        #happygallery-ui {
          --bg-opacity: 0.9;
        }
      }
  
      #happygallery-ui .hg-hidden {
        display: none;
      }
  
      #happygallery-ui .hg-header {
        display: flex;
        margin: 1rem 1rem ;
        flex-shrink: 0;
        justify-content: end;
        user-select: none;
      }
  
      #happygallery-ui .hg-pageinfo {
        color: white;
        margin-right: auto;
      }
  
      #happygallery-ui .hg-btn {
        background-color: transparent;
        border: none;
        padding: 0 0.25rem;
        color: white;
        transition: all .3s ease-in-out;
      }
  
      #happygallery-ui .hg-btn:hover{
        cursor: pointer;
        opacity: 0.8;
      }
  
      #happygallery-ui .hg-icon,
      #happygallery-ui .hg-share-icon {
        width: 26px;
        aspect-ratio: 1;
      }
  
  
  
      #happygallery-ui .hg-arrow-left,
      #happygallery-ui .hg-arrow-right {
        position: absolute;
        top: 50%;
        transform: translateY(-50%);
      }
  
      #happygallery-ui .hg-arrow-left {
        left: 1rem;
      }
  
      #happygallery-ui .hg-arrow-right {
        right: 1rem;
      }
  
      #happygallery-ui .hg-toolbar {
        position: relative;
        height: 100%;
        display: flex;
        padding-bottom: 10px;
      }
  
      #happygallery-ui .hg-body {
        height: 100%;
        width: calc(100% - 6rem);
        margin: 0 auto;
        position: relative;
        animation: hg-open-imagecontainer .3s ease;
      }
  
      #happygallery-ui .hg-footer {
        display: flex;
        margin: 0 1rem 1rem 1rem;
        flex-shrink: 0;
        justify-content: center;
        color: white;
      }
  
      #happygallery-ui .hg-body {
        overflow: hidden;
        --drag: 0%;
      }
  
      #happygallery-ui .hg-body .hg-body-images {
        height: 100%;
        width: calc(var(--childs) * 100%);
        display: flex;
        transition: transform var(--slide-animation, 0) ease;
        transform: translateX(calc((100% / var(--childs, 0)) * var(--active, 0) * -1 + var(--drag)));
      }
  
      #happygallery-ui .hg-body-images.hg-grabbing {
        cursor: grabbing !important;
      }
  
      #happygallery-ui .hg-body .hg-body-images * {
        pointer-events: none;
        user-select: none;
      }
  
      #happygallery-ui .hg-body .hg-body-images .hg-image-element {
        width: 100%;
        height: 100%;
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        
      }
  
      #happygallery-ui .hg-body .hg-body-images .hg-image-element img {
        position: absolute;
        height: 100%;
        max-height: fit-content;
        width: calc(100% - 4rem);
        max-width: fit-content;
        object-position: center;
        object-fit: contain;
        margin: auto 0;
      }
      #happygallery-ui .hg-body .hg-body-images {
        cursor: grab;
      }
  
      @keyframes hg-open-imagecontainer {
        from {
          transform: scale(0.4);
          opacity: 0;
        }
  
        to {
          transform: scale(1);
          opacity: 1;
        }
      }
  
      #happygallery-ui .hg-share-options {
  
        margin: 0 2rem 0 1rem;
        display: none;
        transition: all 1s ease-in-out;
      } 
  
      #happygallery-ui .hg-share-options.active {
        display: flex !important;
        flex-flow: row;
        animation: open-menu .3s ease-in-out;
      }
    
       #happygallery-ui .hg-share-icon {
        color: white;
        opacity: 0.6;
        margin-right: 0.75rem;
        transition: all .3s ease-in-out;
      }
      #happygallery-ui .hg-share-icon:last-of-type {
        margin-right: 0;
      }
       #happygallery-ui .hg-share-icon:hover {
        opacity: 1;
      }
      @keyframes open-menu {
          from {
            opacity: 0;
            transform: translateX(50%);
          }
          to {
            opacity: 1;
            transform: translateX(0%);
          }
      }
      .hg-overflow-hidden {
        overflow: hidden;
      }`;
    document.head.appendChild(style);
  }
}

class HappyGallery_ImageRenderer {
  detector(element) {
    if (element.tagName.toLowerCase() === "img") {
      return element;
    }

    const img = element.querySelector("img");
    if (img) {
      return img;
    }

    return null;
  }

  render(element) {
    const src = element.getAttribute("src") ?? "";
    const title = element.getAttribute("title") ?? "";
    const alt = element.getAttribute("alt") ?? "";

    const preview = document.createElement("div");
    preview.classList.add("hg-image-element");
    preview.innerHTML = `<img src="${src}" title="${title}" alt="${alt}" />`;

    preview.setAttribute("data-hg-title", title ? title : alt);
    preview.setAttribute("data-hg-download-url", src);

    return preview;
  }
}

class HappyGallery_VideoRenderer {
  detector(element) {
    if (element.tagName.toLowerCase() === "video") {
      return element;
    }

    const video = element.querySelector("video");
    if (video) {
      return video;
    }

    return null;
  }

  render(element, gallery) {
    const video = element.cloneNode(true);

    const preview = document.createElement("div");
    preview.classList.add("hg-image-element");

    preview.setAttribute(
      "data-hg-title",
      video.getAttribute("title") ?? video.getAttribute("alt") ?? "",
    );

    video.classList = [];

    const uiHeight = gallery.ui.clientHeight - 150;
    const uiWidth = gallery.ui.clientWidth - 150;

    video.addEventListener(
      "loadedmetadata",
      (e) => {
        const videoHeight = video.videoHeight;
        const videoWidth = video.videoWidth;

        const size = this.getFittedVideoSize(uiWidth, uiHeight, videoWidth, videoHeight);
        video.style.height = size.height + "px";
        video.style.width = size.width + "px";
      },
      false,
    );

    preview.appendChild(video);

    return preview;
  }

  getFittedVideoSize(uiWidth, uiHeight, videoWidth, videoHeight) {
    const uiAspect = uiWidth / uiHeight;
    const videoAspect = videoWidth / videoHeight;

    if (videoAspect > uiAspect) {
      return {
        width: uiWidth,
        height: uiWidth / videoAspect,
      };
    } else {
      return {
        width: uiHeight * videoAspect,
        height: uiHeight,
      };
    }
  }
}

HappyGallery.registerRenderer(HappyGallery_ImageRenderer);
HappyGallery.registerRenderer(HappyGallery_VideoRenderer);

if (!("path" in Event.prototype))
  Object.defineProperty(Event.prototype, "path", {
    get: function () {
      var path = [],
        currentElem = this.target;
      while (currentElem) {
        path.push(currentElem);
        currentElem = currentElem.parentElement;
      }
      if (path.indexOf(window) === -1 && path.indexOf(document) === -1) path.push(document);
      if (path.indexOf(window) === -1) path.push(window);
      return path;
    },
  });

if (typeof module !== "undefined" && module.exports) {
  module.exports = HappyGallery;
} else {
  window.HappyGallery = HappyGallery;
}
