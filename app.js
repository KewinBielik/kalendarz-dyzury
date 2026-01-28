/***********************
 * KONFIGURACJA
 ***********************/

let START_DATE = new Date("2026-01-03");
START_DATE.setHours(16,0,0,0);

const SHIFT_START_HOUR = 16;
const DUTY_DAYS = 7;
const CYCLE_DAYS = 14;

// opcjonalnie: co drugi dyżur z autem
let ENABLE_CAR = true;


/***********************
 * HELPERY CZASU
 ***********************/

function normalizeDate(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date, days) {
  // Zwraca NOWY obiekt Date, nie zmienia oryginału
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function getGridStart(date) {
  const d = normalizeDate(date);
  const weekday = (d.getDay() + 6) % 7; // poniedziałek = 0
  return addDays(d, -weekday); // zwracamy nowy obiekt
}

/***********************
 * BLOKI DYŻURU
 ***********************/


function daysBetween(start, target) {
  const MS_PER_DAY = 1000 * 60 * 60 * 24;
  return Math.round(
    (normalizeDate(target) - normalizeDate(start)) / MS_PER_DAY
  );
}

function isDutyDay(date) {
  const days = daysBetween(START_DATE, date);
  if (days < 0) return false;

  const dayInCycle = days % 14;
  return dayInCycle <= 7;
}

function isDutyWithCar(date) {
  const days = daysBetween(START_DATE, date);
  if (days < 0) return false;

  const dayInCycle = days % 28; // np. auto co 4 tygodnie
  return dayInCycle < 7;
}



/***********************
 * TYP DNIA (START / FULL / END)
 ***********************/

const DAY_TYPE = {
  FREE: "FREE",
  DUTY_START: "DUTY_START",
  DUTY_FULL: "DUTY_FULL",
  DUTY_END: "DUTY_END",
  DUTY_CAR_START: "DUTY_CAR_START",
  DUTY_CAR_FULL: "DUTY_CAR_FULL",
  DUTY_CAR_END: "DUTY_CAR_END"
};

function getCalendarDayType(date) {
  const today = normalizeDate(date);
  const prev = addDays(today, -1);
  const next = addDays(today, 1);

  const t = isDutyDay(today);
  const p = isDutyDay(prev);
  const n = isDutyDay(next);

  if (!t) return DAY_TYPE.FREE;

  const days = daysBetween(START_DATE, today);
  const withCar = ENABLE_CAR && Math.floor(days / 14) % 2 === 0;

  if (!p && t) return withCar ? DAY_TYPE.DUTY_CAR_START : DAY_TYPE.DUTY_START;
  if (t && !n) return withCar ? DAY_TYPE.DUTY_CAR_END : DAY_TYPE.DUTY_END;

  return withCar ? DAY_TYPE.DUTY_CAR_FULL : DAY_TYPE.DUTY_FULL;
}


/***********************
 * RYSOWANIE KALENDARZA
 ***********************/

function renderCalendar(startDate, daysCount) {
  const calendar = document.getElementById("calendar");
  calendar.innerHTML = "";

  let currentMonth = -1;

  for (let i = 0; i < daysCount; i++) {
    const date = addDays(startDate, i); // nowy obiekt Date

    // jeśli miesiąc się zmienił
    if (date.getMonth() !== currentMonth) {
      currentMonth = date.getMonth();

      // nagłówek miesiąca
      const header = document.createElement("div");
      header.className = "month-header";
      header.textContent = date.toLocaleString("pl-PL", {
        month: "long",
        year: "numeric"
      });
      calendar.appendChild(header);

      // offset do poniedziałku
      const dayOfWeek = (date.getDay() + 6) % 7;
      for (let j = 0; j < dayOfWeek; j++) {
        const empty = document.createElement("div");
        empty.classList.add("day", "empty");
        calendar.appendChild(empty);
      }
    }

    const type = getCalendarDayType(date);
    const day = document.createElement("div");
    day.classList.add("day");
    day.textContent = date.getDate();

    // klasy kolorów i pół dni
    switch (type) {
      case DAY_TYPE.DUTY_START:
        day.classList.add("half", "start", "duty");
        break;
      case DAY_TYPE.DUTY_END:
        day.classList.add("half", "end", "duty");
        break;
      case DAY_TYPE.DUTY_FULL:
        day.classList.add("duty");
        break;
      case DAY_TYPE.DUTY_CAR_START:
        day.classList.add("half", "start", "duty-car");
        break;
      case DAY_TYPE.DUTY_CAR_END:
        day.classList.add("half", "end", "duty-car");
        break;
      case DAY_TYPE.DUTY_CAR_FULL:
        day.classList.add("duty-car");
        break;
      default:
        day.classList.add("free");
    }

    calendar.appendChild(day);
  }
}


/***********************
 * START
 ***********************/

// start siatki (poniedziałek tygodnia)
const startDateInput = document.getElementById("startDateInput");
const daysInput = document.getElementById("daysCountInput");
const refreshBtn = document.getElementById("refreshBtn");

refreshBtn.addEventListener("click", () => {
  // 1️⃣ pobierz nową datę startu i ustaw godzinę 16
  const newStart = new Date(startDateInput.value);
  newStart.setHours(16,0,0,0);
  START_DATE = newStart;

  // 2️⃣ pobierz liczbę dni do wyświetlenia
  const days = parseInt(daysInput.value, 10) || 42;

  // 3️⃣ oblicz początek siatki (poniedziałek)
  const today = new Date();
  const twoWeeksAgo = addDays(today, -14);
  const gridStart = getGridStart(twoWeeksAgo);

  // 4️⃣ renderuj kalendarz
  renderCalendar(gridStart, days);
});