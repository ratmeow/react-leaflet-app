export function getDayOfWeek(dateString) {
  const daysOfWeek = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
  const [year, month, day] = dateString.split('-');
  const date = new Date(year, month - 1, day); // Месяцы в объекте Date начинаются с 0, поэтому нужно вычесть 1
  const dayOfWeek = date.getDay();
  return daysOfWeek[dayOfWeek];
}

export function convertTimeToString(timeString) {
  const [hours, minutes] = timeString.split(":");
  const totalMinutes = parseInt(hours) * 60 + parseInt(minutes);
  const convertedValue = Math.floor(totalMinutes / 30) + 1;

  return convertedValue.toString().padStart(2, "0");
}

export function createSlicedArray(originalArray, startIdx, endIdx) {
  const newArray = Array(48).fill(undefined);
  newArray.splice(startIdx, endIdx - startIdx, ...originalArray);
  return newArray;
}

export function calculateMAE(actual, predicted) {
  let validPredicted = predicted.filter(value => typeof value === 'number' && !isNaN(value));
  const n = validPredicted.length;
  const minLength = 48
  let mae = 0;

  for (let i = 0; i < minLength; i++) {
    if (typeof actual[i] === 'number' && typeof predicted[i] === 'number' && !isNaN(actual[i]) && !isNaN(predicted[i])) {
      mae += Math.abs(actual[i] - predicted[i]);
    }
  }

  return (mae / n).toFixed(2);
}


export function calculateMAPE(actual, predicted) {
  let validPredicted = predicted.filter(value => typeof value === 'number' && !isNaN(value));
  const n = validPredicted.length;
  const minLength = 48
  let mape = 0;

  for (let i = 0; i < minLength; i++) {
    if (typeof actual[i] === 'number' && typeof predicted[i] === 'number' && !isNaN(actual[i]) && !isNaN(predicted[i])) {
      mape += (Math.abs(actual[i] - predicted[i]) / actual[i]);
    }
  }

  return ((mape / n) * 100).toFixed(2);
}