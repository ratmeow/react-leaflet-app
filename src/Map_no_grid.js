import React from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import axios from "axios";
import './Map.css';
import Grid from "./Grid";
import MapLegend from "./legend";
import { MAPS, API_URL, API_KEY } from './constants';
import { getDayOfWeek, convertTimeToString } from './utils';

class Mapcomponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            futureDate: null,
            todayDate: null,
            todayTime: "5:00",
            showGrid: true, // Флаг, определяющий, показывать ли сетку
            gridData: [], // Массив данных для каждой ячейки сетки
            currentTime: null, // Время, выбранное пользователем
            currentDate: "",
            dates: [],
            type: "inflows",
            isLoading: true,
            weather: {},
            holiday: 'Нет',
            excludedDays: 14,
            predictMode: false,
            rmse: 0,
            someErrors: '',
            mape: 0,
            selectedModel: "",
            availableModels: [],
        };
    };

    handleDataToggle = () => {
        const newType = this.state.type == "inflows" ? "outflows" : "inflows";
        this.setState({ type: newType });
    };

    handleSliderChange = (value) => {
        const todayTime = convertTimeToString(this.state.todayTime)
        const newTime = value.toString().padStart(2, "0");
        let newPredictMode = false
        if (this.state.currentDate > this.state.todayDate) {
            newPredictMode = true
        }
        else if (this.state.currentDate === this.state.todayDate && parseInt(todayTime) < parseInt(newTime)) {
            newPredictMode = true

        }
        this.setState({ currentTime: newTime, predictMode: newPredictMode });
    };

    handleTodayLabelClick = () => {
        const { todayDate, todayTime } = this.state;
        this.setState({ currentDate: todayDate, currentTime: convertTimeToString(todayTime), predictMode: false });

    };


    handleDateChange = (event) => {
        const { todayTime, currentTime, todayDate } = this.state
        const date = event.target.value;
        let newPredictMode = false
        if (date > todayDate) {
            newPredictMode = true
        }
        else if (date === this.state.todayDate && parseInt(convertTimeToString(todayTime)) < parseInt(currentTime)) {
            newPredictMode = true

        }
        this.setState({ currentDate: date, predictMode: newPredictMode });
    };

    componentDidMount() {
        axios.get('http://localhost:8000/city/dates')
            .then(response => {
                const availableDates = response.data;
                const today = availableDates[availableDates.length - this.state.excludedDays];
                const todayTime = convertTimeToString(this.state.todayTime);
                this.setState({
                    dates: availableDates,
                    currentDate: today,
                    todayDate: today,
                    currentTime: todayTime,
                });

                // Получение списка доступных моделей
                axios.get('http://localhost:8000/city/models')
                    .then(modelsResponse => {
                        const newAvailableModels = modelsResponse.data;
                        console.log(newAvailableModels)
                        this.setState({ availableModels: newAvailableModels, selectedModel: newAvailableModels[0] });
                    })
                    .catch(error => console.error(error));
            })
            .catch(error => console.error(error));

        this.fetchData();
    }


    componentDidUpdate(prevProps, prevState) {
        if (
            prevState.currentDate !== this.state.currentDate ||
            prevState.currentTime !== this.state.currentTime ||
            prevState.type !== this.state.type
        ) {
            this.fetchData();
        }
    }

    fetchData = () => {
        this.setState({ isLoading: true, someErrors: '' });
        const { type, currentDate, currentTime, predictMode, rmse, someErrors, mape } = this.state;
        let dataUrl = `${API_URL}/${type}/${currentDate}/${currentTime}`;
        console.log(predictMode);
        if (predictMode === true) {
            dataUrl = `${API_URL}/${type}/${currentDate}/${currentTime}/predict`;
            if (this.state.selectedModel !== "") {
                dataUrl += `?model=${encodeURIComponent(this.state.selectedModel)}`;
            }
        }
        axios
            .get(dataUrl)
            .then((response) => {
                if (response.data.error) {
                    // Если присутствует поле "error" в объекте response.data
                    // Установить состояние для переменной ошибки и прекратить выполнение метода
                    this.setState({ someErrors: response.data.error, isLoading: true, rmse: 0, mape: 0 });
                    return;
                }

                let newGridData = [];
                let newRmse = 0;
                let newMape = 0;
                if (predictMode === true) {
                    newGridData = response.data.predict;
                    newRmse = response.data.rmse;
                    newMape = response.data.mape

                } else {
                    newGridData = response.data.state;
                }
                this.setState({
                    gridData: newGridData, isLoading: false, weather: response.data.weather,
                    holiday: response.data.holiday, rmse: newRmse, someErrors: '', mape: newMape
                });
            })
            .catch((error) => {
                console.error("Ошибка при выполнении GET-запроса:", error);
            });
    };


    handleToggleGrid = () => {
        this.setState((prevState) => ({ showGrid: !prevState.showGrid }));
    };

    handleModelChange = (event) => {
        const selectedModel = event.target.value;
        this.setState({ selectedModel }, () => {
            // Выполнение запроса на сервер при изменении модели
            this.fetchData();
        });
    };


    render() {
        const { gridData, isLoading, dates, excludedDays, showGrid, currentDate, currentTime, type, weather,
            holiday, todayDate, predictMode, todayTime, rmse, someErrors, mape } = this.state;
        const { availableModels, selectedModel } = this.state;
        const isDataLoaded = gridData.length > 0 && !isLoading;

        const datePast = dates.slice(0, -excludedDays).map(date => (
            <option key={date} value={date}>{date}</option>
        ));

        const dateFuture = dates.slice(dates.length - excludedDays, dates.length).map(date => (
            <option key={date} value={date}>{date}</option>
        ));


        const center = [39.9042, 116.4074]; // Координаты Пекина
        const zoom = 11; // Уровень масштабирования карты

        // if (!gridData || gridData.length === 0) {
        //     return <div>Loading...</div>;
        // }

        return (
            <div className="container">
                <div className="checkbox-container">
                    {todayDate !== null && (
                        <label className="label-date" >
                            Выбранная дата :<span>{currentDate}</span>
                        </label>
                    )}
                    {todayDate !== null && (
                        <label className="label-date" onClick={this.handleTodayLabelClick}>
                            Текущее время:<span>{todayDate} {todayTime}</span>
                        </label>
                    )}
                    {predictMode === true &&
                        (<label>
                            <label>
                                <span className="rmse-label">RMSE:</span> {rmse.toFixed(2)} <br />
                                <span className="rmse-label">MAPE:</span> {mape.toFixed(2)}
                            </label>
                        </label>)}
                    {isLoading > 0 && someErrors.length === 0 &&
                        (<label className="error-label">
                            Загрузка...
                        </label>)}
                    {someErrors.length > 0 &&
                        (
                            <label className="error-label">
                                Ошибка:
                                {someErrors}
                            </label>)}
                </div>
                <div>
                    <MapContainer zoom={zoom} center={center}>
                        <div className="show-grid">
                            <label>
                                Показать сетку:
                                <input
                                    type="checkbox"
                                    checked={showGrid}
                                    onChange={this.handleToggleGrid}
                                />
                            </label>
                            <label >
                                Исходящие потоки:
                                <input
                                    type="checkbox"
                                    // checked={this.state.dataUrl.includes("outflows")}
                                    onChange={this.handleDataToggle}
                                />
                            </label>
                            <div className="model-selection">
                                <label htmlFor="model">Выберите модель:</label>
                                <select
                                    id="model"
                                    value={selectedModel}
                                    onChange={this.handleModelChange}
                                >
                                    <option value="">Выберите модель</option>
                                    {availableModels.map(model => (
                                        <option key={model} value={model}>{model}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="dates-onmap">
                            <label htmlFor="date">
                                Прошлые данные:
                                <select
                                    className="ip-1"
                                    value={this.state.currentDate}
                                    onChange={this.handleDateChange}
                                >
                                    {datePast}
                                </select>
                            </label>

                            <label htmlFor="date">
                                Прогноз:
                                <select
                                    className="ip-2"
                                    value={this.state.currentDate}
                                    onChange={this.handleDateChange}
                                >
                                    {dateFuture}
                                </select>
                            </label>
                        </div>
                        <TileLayer
                            attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                            url={`https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${API_KEY}`}

                        />
                        {showGrid && isDataLoaded &&
                            <Grid key={`${currentDate}-${currentTime}`} center={center} gridData={gridData}
                                currentTime={currentTime} currentDate={currentDate} type={type} predictMode={predictMode}
                                todayDate={todayDate} todayTime={todayTime} selectedModel={selectedModel} />}
                        <MapLegend />
                        <div className="weather-info">
                            <p>Температура: {weather.temperature}°C</p>
                            <p>Ветер: {weather.wind}mph</p>
                            <p>Погода: {weather.weather}</p>
                            <p>Праздничный день: {holiday}</p>
                            <p>День недели: {getDayOfWeek(currentDate)}</p>
                        </div>
                    </MapContainer>
                    <Slider className="Slider"
                        valueLabelDisplay="auto"
                        aria-label="Time"
                        value={currentTime}
                        step={1}
                        marks={MAPS}
                        min={1}
                        max={48}
                        onChange={this.handleSliderChange}
                    />
                </div>
            </div>
        )
    }
}

export default Mapcomponent;