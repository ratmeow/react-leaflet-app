import React from "react";
import { MapContainer, TileLayer, Rectangle } from "react-leaflet";
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import axios from "axios";
import './Map.css';

const maps = {};

for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
        let time = `${hour < 10 ? "0" : ""}${hour}:${minute === 0 ? "00" : "30"}`;
        let value = hour * 2 + (minute === 0 ? 1 : 2);
        maps[value] = { label: time, style: { fontSize: "0.7rem" } };
    }
}
class Mapcomponent extends React.Component {
    constructor(props) {
        super(props);
        this.cityUrl = 'http://localhost:8000/city';
        this.state = {
            showGrid: true, // Флаг, определяющий, показывать ли сетку
            gridData: [], // Массив данных для каждой ячейки сетки
            isLoading: true, // Флаг для отслеживания загрузки данных
            currentTime: "03", // Время, выбранное пользователем
            currentDate: "2013-07-01",
            dates: []
        };
        this.state.dataUrl = `${this.cityUrl}/inflows/${this.state.currentDate}/${this.state.currentTime}`
    };

    handleDataToggle = () => {
        const newUrl = this.state.dataUrl.includes("inflows")
            ? `${this.cityUrl}/outflows/${this.state.currentDate}/${this.state.currentTime}`
            : `${this.cityUrl}/inflows/${this.state.currentDate}/${this.state.currentTime}`;
        this.setState({ dataUrl: newUrl, isLoading: true });
        this.fetchData(newUrl);
    };

    handleSliderChange = (value) => {
        const newTime = value.toString().padStart(2, "0");
        const newUrl = this.state.dataUrl.includes("inflows")
            ? `${this.cityUrl}/inflows/${this.state.currentDate}/${newTime}`
            : `${this.cityUrl}/outflows/${this.state.currentDate}/${newTime}`;
        this.setState({ currentTime: newTime, dataUrl: newUrl, isLoading: true });
        this.fetchData(newUrl);
    };

    componentDidMount() {
        axios.get('http://localhost:8000/city/dates')
            .then(response =>  {
                console.log(response.data)
                this.setState({ dates: response.data });
            })
            .catch(error => console.error(error));
        this.fetchData(this.state.dataUrl);
    };

    componentDidUpdate(prevProps, prevState) {
        if (prevState.dataUrl !== this.state.dataUrl) {
            this.fetchData(this.state.dataUrl);
        }
    };

    handleDateChange = (event) => {
        const date = event.target.value;
        const newUrl = this.state.dataUrl.includes("inflows")
            ? `${this.cityUrl}/inflows/${date}/${this.state.currentTime}`
            : `${this.cityUrl}/outflows/${date}/${this.state.currentTime}`;
        this.setState({ currentDate: date, dataUrl: newUrl, isLoading: true });
        this.fetchData(newUrl);
    };

    fetchData = (url) => {
        axios.get(url)
            .then(response => {
                this.setState({ gridData: response.data, isLoading: false });
            })
            .catch(error => {
                console.error("Ошибка при выполнении GET-запроса:", error);
            });
    };

    handleToggleGrid = () => {
        this.setState((prevState) => ({ showGrid: !prevState.showGrid }));
    };

    getColor(number) {
        // Возвращаем цвет в зависимости от числа
        if (number <= 25) {
            return "green";
        } 
        else if (number <= 75) {
            return "yellow";
        } 
        else if (number <= 100) {
            return "orange";
        } 
        else {
            return "red";
        }
    };

    render() {
        const dateOptions = this.state.dates.map(date => (
            <option key={date} value={date}>{date}</option>
        ));


        const center = [39.9042, 116.4074]; // Координаты Пекина
        const zoom = 11; // Уровень масштабирования карты

        const { isLoading } = this.state;
        // Проверяем наличие данных сетки перед отображением

        if (isLoading) {
            return <div>Loading...</div>;
        }

        const gridSize = 32; // Размер сетки (кол-во ячеек по горизонтали и вертикали)
        const cellSize = 1; // Размер ячейки в километрах
        const gridOffset = 2; // Смещение сетки на 2 клетки левее

        const gridCoords = []; // Массив координат ячеек сетки
        const latFactor = 0.009; // Фактор для преобразования градусов широты в километры
        const lonFactor = 0.011; // Фактор для преобразования градусов долготы в километры
        for (let i = 0; i < gridSize; i++) {
            for (let j = 0; j < gridSize; j++) {
                // Рассчитываем координаты каждой ячейки сетки с учетом смещения
                const left = center[1] - (gridSize / 2 - i + gridOffset) * cellSize * lonFactor;
                const right = center[1] - (gridSize / 2 - i + 1 + gridOffset) * cellSize * lonFactor;
                const top = center[0] + (gridSize / 2 - j) * cellSize * latFactor;
                const bottom = center[0] + (gridSize / 2 - j + 1) * cellSize * latFactor;

                gridCoords.push([[top, left], [bottom, right]]);
            }
        }

        return (
            <div className="container">
                <div className="checkbox-container">
                    <label>
                        Показать сетку:
                        <input
                            type="checkbox"
                            checked={this.state.showGrid}
                            onChange={this.handleToggleGrid}
                        />
                    </label>
                    <label >
                        Outflows:
                        <input
                            type="checkbox"
                            checked={this.state.dataUrl.includes("outflows")}
                            onChange={this.handleDataToggle}
                        />
                    </label>
                    <label htmlFor="date">
                        Выберите дату:
                        <select
                            className="ip"
                            value={this.state. currentDate}
                            onChange={this.handleDateChange}
                        >
                            <option value="">Выберите дату</option>
                            {dateOptions}
                        </select>
                    </label>
                </div>
                <Slider className="Slider"
                    valueLabelDisplay="auto"
                    aria-label="Time"
                    value={this.state.currentTime}
                    step={1}
                    marks={maps}
                    min={1}
                    max={48}
                    onChange={this.handleSliderChange}
                />
                <div>
                    <MapContainer zoom={zoom} center={center}>
                        <TileLayer
                            attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.de/{z}/{x}/{y}.png"
                        />
                        {this.state.showGrid &&
                            gridCoords.map((coords, index) => (
                                <Rectangle // Отображаем прямоугольник (ячейку сетки) на карте
                                    key={index}
                                    bounds={coords}
                                    color="black"
                                    weight={1} // Толщина линий
                                    fillOpacity={0.3} // Задаем непрозрачность для заливки
                                    fillColor={this.getColor(this.state.gridData[index])} // Определяем цвет заливки в зависимости от числа
                                />
                            ))}
                    </MapContainer>
                </div>
            </div>
        )
    }
}

export default Mapcomponent;