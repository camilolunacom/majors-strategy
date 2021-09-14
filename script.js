const secsInMin = 60;
const secsInHour = secsInMin * 60;

const form = document.querySelector("form");
const pace = form.querySelector(".pace");
const factor = form.querySelector(".factor");
const currentAltitude = form.querySelector(".altitude");
const marathon = form.querySelector(".marathon");

const results = document.querySelector(".results");
const threshold = results.querySelector(".threshold");
const reference = results.querySelector(".reference");
const altitude = results.querySelector(".altitude");
const temperature = results.querySelector(".temperature");
const wind = results.querySelector(".wind");
const refPace = results.querySelector(".ref-pace");
const totalTime = results.querySelector(".total-time");

const table = results.querySelector(".results__table");
const tableBody = table.querySelector("tbody");
const tableRows = tableBody.children;

// Initital calculations
let refPaces = calculateRefPaces(refTimes);

// Validation
pace.addEventListener("input", () => {
  pace.setCustomValidity("");
  pace.checkValidity();
});

pace.addEventListener("invalid", () => {
  if (pace.value === "") {
    pace.setCustomValidity("Ingresa un pace!");
  } else {
    pace.setCustomValidity("El pace debe tener el formato h:mm:ss. Intenta otra vez!");
  }
});

factor.addEventListener("input", () => {
  factor.setCustomValidity("");
  factor.checkValidity();
});

factor.addEventListener("invalid", () => {
  if (factor.value === "") {
    factor.setCustomValidity("Ingresa un factor!");
  } else {
    factor.setCustomValidity("El factor debe estar entre 2.5 y 5. Solo se aceptan incrementos de 0.5. Intenta otra vez!");
  }
});

currentAltitude.addEventListener("input", () => {
  currentAltitude.setCustomValidity("");
  currentAltitude.checkValidity();
});

currentAltitude.addEventListener("invalid", () => {
  if (currentAltitude.value === "") {
    currentAltitude.setCustomValidity("Ingresa la altitud!");
  } else {
    currentAltitude.setCustomValidity("La altitud debe ser un número mayor o igual a cero. Intenta otra vez!");
  }
});

marathon.addEventListener("input", () => {
  marathon.setCustomValidity("");
  marathon.checkValidity();
});

marathon.addEventListener("invalid", () => {
  marathon.setCustomValidity("Escoge una maratón!");
});

// Create dropdown options
for (const key in marathons) {
  marathon.innerHTML += `<option value="${key}">${marathons[key].name}</option>`;
}

// Create event listeners
form.addEventListener("submit", formSubmission);
let inputs = [pace, factor, currentAltitude, marathon];
inputs.forEach(input => input.addEventListener("change", hideResults));

function convertToTime(totalSeconds) {
  let hoursRemainder = totalSeconds % secsInHour;
  let hours = (totalSeconds - hoursRemainder) / secsInHour;
  let minRemainer = hoursRemainder % secsInMin;
  let minutes = (hoursRemainder - minRemainer) / secsInMin;
  let seconds = Math.round(minRemainer);
  // return `${hours}:${minutes}:${seconds}`;
  return `${hours}:${("0" + minutes.toString()).slice(-2)}:${("0" + seconds.toString()).slice(-2)}`;
}

function convertFromTime(time) {
  let value = time.split(":");
  return parseInt(value[0]) * secsInHour + parseInt(value[1]) * secsInMin + parseInt(value[2]);
}

function convertToPercentage(number) {
  return Math.round((number * 100 + Number.EPSILON) * 10) / 10 + "%";
}

function calculateRefPaces(refTimes) {
  let refTimesInSeconds = [];
  refTimes.forEach((t) => refTimesInSeconds.push(convertFromTime(t)));
  console.log(refTimesInSeconds);
  let firstTime;
  let secondTime;
  let value;
  let values = [];

  for (let i = 1; i < refTimesInSeconds.length; i++) {
    firstTime = refTimesInSeconds[i - 1];
    secondTime = refTimesInSeconds[i];
    value = ((firstTime - (firstTime - secondTime) / 2) / 42.2) * 0.95;
    values.push(value);
  }

  return values;
}

function calculateReferencePercentage(threshold) {
  if (threshold <= refPaces[4]) {
    return 0.9;
  } else if (threshold <= refPaces[3]) {
    return 0.87;
  } else if (threshold <= refPaces[2]) {
    return 0.85;
  } else if (threshold <= refPaces[1]) {
    return 0.84;
  } else if (threshold <= refPaces[0]) {
    return 0.83;
  } else {
    return 0.82;
  }
}

function populateTable(referencePace, factorValue, kms) {
  let total = 0;
  for (let row of tableRows) {
    let km = parseInt(row.dataset.km);
    let factor = kms[km] ? parseFloat(kms[km]) : 0;
    let value = 0;
    if (km < 22) {
      value = referencePace * (1 + factorValue) * (1 + factor);
    } else {
      value = referencePace * (1 - factorValue) * (1 + factor);
    }
    if (km === 43) {
      total += value * 0.2;
    } else {
      total += value;
    }

    row.querySelector(".km__pace").textContent = convertToTime(value);
    row.querySelector(".km__time").textContent = convertToTime(total);
  }
  return total;
}

function calculateWinByAltitudeDifference(altitudeValue, winByAltitudeFactor) {
  return 1 - (1 - 11.7 * Math.pow(10, -3) * Math.pow((altitudeValue * Math.pow(10, -3) - winByAltitudeFactor), 2) - 4.01 * Math.pow(10, -3) * (altitudeValue * Math.pow(10, -3) - winByAltitudeFactor));
}

function calculateReferencePace(threshold, ref, winByAltitudeDifference, lossByTemperature, lossByWind) {
  return threshold * (2 - ref) * (1 - winByAltitudeDifference) * (1 + lossByTemperature) * (1 + lossByWind);
}

function hideResults() {
  results.classList.add("hidden");
  console.log("hide");
}

function formSubmission(e) {
  e.preventDefault();
  let paceValue = convertFromTime(pace.value);
  let factorValue = parseInt(factor.value) / 100;
  let altitudeValue = parseInt(currentAltitude.value);
  let thresholdValue = paceValue * 1.05;
  let selectedMarathon = marathon.value;
  let marathonData = marathons[selectedMarathon];
  let winByAltitudeFactor = parseFloat(marathonData.winByAltitudeFactor);
  let lossByTemperature = parseFloat(marathonData.lossByTemperature);
  let lossByWind = parseFloat(marathonData.lossByWind);
  let kms = marathonData.kms;

  let refValue = calculateReferencePercentage(thresholdValue);
  let winByAltitudeDifference = calculateWinByAltitudeDifference(altitudeValue, winByAltitudeFactor);
  let referencePace = calculateReferencePace(thresholdValue, refValue, winByAltitudeDifference, lossByTemperature, lossByWind);

  let total = populateTable(referencePace, factorValue, kms);

  threshold.textContent = convertToTime(thresholdValue);
  reference.textContent = `${refValue * 100}%`;
  altitude.textContent = convertToPercentage(winByAltitudeDifference);
  temperature.textContent = convertToPercentage(lossByTemperature);
  wind.textContent = convertToPercentage(lossByWind);
  refPace.textContent = convertToTime(referencePace);
  totalTime.textContent = convertToTime(total);

  results.classList.remove("hidden");
}
