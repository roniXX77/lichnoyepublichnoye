(() => {
  const timerElement = document.getElementById("timer");
  const flightsContainer = document.getElementById("flightsContainer");
  const pageIndicator = document.getElementById("pageIndicator");

  const modal = document.getElementById("flightModal");
  const modalBackdrop = document.getElementById("flightModalBackdrop");
  const modalClose = document.getElementById("flightModalClose");
  const modalTitle = document.getElementById("flightModalTitle");
  const modalMeta = document.getElementById("flightModalMeta");
  const modalContent = document.getElementById("flightModalContent");

  if (
    !timerElement ||
    !flightsContainer ||
    !pageIndicator ||
    !modal ||
    !modalBackdrop ||
    !modalClose ||
    !modalTitle ||
    !modalMeta ||
    !modalContent
  ) {
    return;
  }

  let currentPage = 0;

  const desktopPageSize = 12;
  const compactBoard = matchMedia("(max-width:760px), (max-height:500px)");
  const pageSwitchMs = 20000;

  const flights = [
    { id: 1, status: "registration", time: "20:00", destination: "москва", flight: "su532", gate: "n15", wind: "2.6 м/с", terminal: "a" },
    { id: 2, status: "closed", time: "05:32", destination: "алматы", flight: "kc1338", gate: "k3", wind: "1.9 м/с", terminal: "b" },
    { id: 3, status: "boarding", time: "11:49", destination: "стамбул", flight: "tk475", gate: "a11", wind: "4.5 м/с", terminal: "c" },
    { id: 4, status: "closed", time: "03:00", destination: "лос-анджелес", flight: "nk1239", gate: "f11", wind: "1.3 м/с", terminal: "d" },
    { id: 5, status: "registration", time: "21:11", destination: "санкт-петербург", flight: "su1522", gate: "n5", wind: "6.1 м/с", terminal: "a" },
    { id: 6, status: "boarding", time: "11:00", destination: "нью-йорк", flight: "nk715", gate: "c3", wind: "4.1 м/с", terminal: "d" },
    { id: 7, status: "boarding", time: "17:20", destination: "новосибирск", flight: "su844", gate: "n12", wind: "8.1 м/с", terminal: "a" },
    { id: 8, status: "closed", time: "01:10", destination: "белград", flight: "ju393", gate: "e2", wind: "7.1 м/с", terminal: "c" },
    { id: 9, status: "registration", time: "19:00", destination: "актау", flight: "kc478", gate: "h10", wind: "7.8 м/с", terminal: "b" },
    { id: 10, status: "registration", time: "22:10", destination: "новый орлеан", flight: "nk347", gate: "b17", wind: "2.2 м/с", terminal: "d" },
    { id: 11, status: "closed", time: "09:45", destination: "курск", flight: "su1129", gate: "n3", wind: "2.5 м/с", terminal: "a" },
    { id: 12, status: "registration", time: "14:25", destination: "екатеринбург", flight: "u6184", gate: "d6", wind: "5.4 м/с", terminal: "a" },
    { id: 13, status: "delayed", time: "16:40", destination: "минск", flight: "b2861", gate: "g8", wind: "3.7 м/с", terminal: "c" },
    { id: 14, status: "boarding", time: "18:15", destination: "тбилиси", flight: "a9870", gate: "l4", wind: "4.8 м/с", terminal: "b" },
    { id: 15, status: "registration", time: "23:30", destination: "владивосток", flight: "su1702", gate: "m9", wind: "6.6 м/с", terminal: "a" },
    { id: 16, status: "closed", time: "06:55", destination: "астана", flight: "kc912", gate: "c7", wind: "5.2 м/с", terminal: "b" },
    { id: 17, status: "registration", time: "12:20", destination: "ташкент", flight: "hy604", gate: "j1", wind: "3.9 м/с", terminal: "c" },
    { id: 18, status: "boarding", time: "08:35", destination: "самара", flight: "dp441", gate: "p2", wind: "4.0 м/с", terminal: "a" },
    { id: 19, status: "landed", time: "07:10", destination: "сочи", flight: "fv6211", gate: "r5", wind: "2.8 м/с", terminal: "c" },
    { id: 20, status: "registration", time: "15:05", destination: "варшава", flight: "lo784", gate: "e9", wind: "5.0 м/с", terminal: "d" },
    { id: 21, status: "delayed", time: "13:50", destination: "рим", flight: "az551", gate: "b4", wind: "4.3 м/с", terminal: "d" },
    { id: 22, status: "boarding", time: "10:15", destination: "пекин", flight: "ca908", gate: "k11", wind: "3.1 м/с", terminal: "d" },
    { id: 23, status: "registration", time: "18:55", destination: "дубай", flight: "ek176", gate: "a2", wind: "2.7 м/с", terminal: "c" },
    { id: 24, status: "closed", time: "04:40", destination: "париж", flight: "af1145", gate: "f6", wind: "3.4 м/с", terminal: "d" }
  ];

  const statusMap = {
    registration: { className: "flight-status--registration", label: "registration" },
    boarding: { className: "flight-status--boarding", label: "boarding" },
    closed: { className: "flight-status--closed", label: "boarding closed" },
    delayed: { className: "flight-status--delayed", label: "delayed" },
    landed: { className: "flight-status--landed", label: "landed" }
  };

  const pageSize = () => compactBoard.matches ? flights.length : desktopPageSize;
  const totalPages = () => Math.ceil(flights.length / pageSize());

  function createRow(flight) {
    const wrap = document.createElement("article");
    wrap.className = "board-row-wrap";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "board-row";

    const time = document.createElement("span");
    time.className = "flight-time";
    time.textContent = flight.time;

    const destination = document.createElement("span");
    destination.className = "flight-destination";
    destination.textContent = flight.destination;

    const code = document.createElement("span");
    code.className = "flight-code";
    code.textContent = flight.flight;

    const gate = document.createElement("span");
    gate.className = "flight-gate";
    gate.textContent = flight.gate;

    const status = document.createElement("span");
    status.className = statusMap[flight.status].className;
    status.textContent = statusMap[flight.status].label;

    for (const [element,label] of [[time,'time'],[destination,'destination'],[code,'flight'],[gate,'gate'],[status,'status']]) {
      element.dataset.label=window.SiteLanguage.translate(label);
    }
    status.classList.add('flight-status');
    button.append(time, destination, code, gate, status);

    button.addEventListener("click", () => {
      openFlightModal(flight);
    });

    wrap.appendChild(button);
    return wrap;
  }

  function renderFlightsPage(pageIndex) {
    const start = pageIndex * pageSize();
    const pageFlights = flights.slice(start, start + pageSize());

    const fragment = document.createDocumentFragment();

    for (const flight of pageFlights) {
      fragment.appendChild(createRow(flight));
    }

    flightsContainer.innerHTML = "";
    flightsContainer.appendChild(fragment);

    pageIndicator.textContent = `${pageIndex + 1} / ${totalPages()}`;
  }

  function nextPage() {
    if (compactBoard.matches || modal.classList.contains("is-open")) {
      return;
    }

    currentPage = (currentPage + 1) % totalPages();
    renderFlightsPage(currentPage);
  }

  async function openFlightModal(flight) {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    modalTitle.textContent = `${window.SiteLanguage.translate("flight")} ${flight.flight}`;
    modalMeta.textContent = `${window.SiteLanguage.translate(flight.destination)} · ${flight.time} · ${window.SiteLanguage.translate("gate")} ${flight.gate} · ${window.SiteLanguage.translate("terminal")} ${flight.terminal} · ${window.SiteLanguage.translate(statusMap[flight.status].label)}`;
    modalContent.innerHTML = "<p>loading...</p>";

    try {
      const response = await fetch(window.SiteLanguage.contentURL(`tourist-${flight.id}.html`));

      if (!response.ok) {
        throw new Error(`failed to load tourist text ${flight.id}`);
      }

      const html = await response.text();
      modalContent.innerHTML = html;
    } catch (error) {
      console.error(error);
      modalContent.textContent = window.SiteLanguage.translate('не удалось загрузить текст');
    }
  }

  function closeFlightModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  }

  modalClose.addEventListener("click", closeFlightModal);
  modalBackdrop.addEventListener("click", closeFlightModal);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("is-open")) {
      closeFlightModal();
    }
  });

  compactBoard.addEventListener('change',()=>{currentPage=0;renderFlightsPage(currentPage);});
  renderFlightsPage(currentPage);
  setInterval(nextPage, pageSwitchMs);
})();