export const MAPS = {};

for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
        let time = `${hour < 10 ? "0" : ""}${hour}:${minute === 0 ? "00" : "30"}`;
        let value = hour * 2 + (minute === 0 ? 1 : 2);
        MAPS[value] = { label: time, style: { fontSize: "0.7rem" } };
    }
}

export const API_URL = 'http://localhost:8000/city';
export const CELL_API = 'http://localhost:8000/cell';

export const API_KEY = 'ZkHndOso53GTSVGEHdep'
export const GRID_SIZE = 32;
export const CELL_SIZE = 0.72;