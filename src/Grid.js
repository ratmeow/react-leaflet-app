import React from "react";
import { Rectangle, Popup } from "react-leaflet";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import './Grid.css';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Dot } from "recharts";
import { API_KEY, GRID_SIZE, CELL_SIZE, CELL_API } from './constants';
import axios from 'axios';
import { getDayOfWeek, convertTimeToString, createSlicedArray, calculateMAE, calculateMAPE } from './utils';

class Grid extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      cellTodayPast: null,
      selectedCell: 0,
      showModal: false,
      showYesterdayData: false,
      showTruthData: false,
      //данные с сервака
      cellData: null,
      cellDataYesterday: null,
      cellDataPredict: null,
    };
  }


  getColor(number) {
    if (number < 10) {
      return null;
    } else if (number >= 10 && number <= 25) {
      return "#FFD3D3"; // Светло-розовый
    } else if (number > 25 && number <= 50) {
      return "#FFA7A7"; // Розовый
    } else if (number > 50 && number <= 100) {
      return "#FF7B7B"; // Ярко-розовый
    } else if (number > 100 && number <= 150) {
      return "#FF5050"; // Красно-оранжевый
    } else if (number > 150 && number <= 200) {
      return "#FF2424"; // Красный
    } else if (number > 200 && number <= 300) {
      return "#FF0000"; // Ярко-красный
    } else if (number > 300 && number <= 500) {
      return "#E10000"; // Темно-красный
    } else if (number > 500 && number <= 700) {
      return "#C70000"; // Бордовый
    } else if (number > 700 && number <= 1000) {
      return "#AE0000"; // Темно-бордовый
    } else {
      return "#8A0000"; // Красно-фиолетовый
    }
  }


  handleCellClick = async (index) => {
    try {
      const { currentTime, currentDate, type, predictMode, todayDate, todayTime, selectedModel } = this.props;

      if (predictMode !== true) {
        let dataUrl = `${CELL_API}/${type}/${index}/${currentDate}/${currentTime}`;
        const response = await axios.get(dataUrl);
        const data = response.data;
        const todayData = data[1].data;
        const yesterdayData = data[0].data;
        const predictDataAllTimeSteps = Array(48).fill(undefined);
        this.setState({
          selectedCell: index,
          showModal: true,
          cellData: todayData,
          showChart: false,
          cellDataYesterday: yesterdayData,
          cellDataPredict: predictDataAllTimeSteps,
        });

      }
      else {
        let dataUrl = `${CELL_API}/${type}/${index}/${currentDate}/${currentTime}/predict`;
        if (selectedModel !== "") {
          dataUrl += `?model=${encodeURIComponent(selectedModel)}`;
        }
        const response = await axios.get(dataUrl);
        const data = response.data;
        const todayRealData = data.true_data[1].data;
        const yesterdayData = data.true_data[0].data
        const todayPredictData = data.predict_data;
        if (currentDate === todayDate) {
          const todayIndex = convertTimeToString(todayTime)
          let predictDataAllTimeSteps = createSlicedArray(todayPredictData, parseInt(todayIndex), parseInt(currentTime))
          this.setState({
            selectedCell: index,
            showModal: true,
            cellData: todayRealData,
            showChart: false,
            cellDataYesterday: yesterdayData,
            cellDataPredict: predictDataAllTimeSteps,
          });
        }
        else {
          this.setState({
            selectedCell: index,
            showModal: true,
            cellData: todayRealData,
            showChart: false,
            cellDataYesterday: yesterdayData,
            cellDataPredict: todayPredictData,
          });
        }
      }

    } catch (error) {
      console.error(error);
    }
  };


  handleCloseModal = () => {
    this.setState({ showModal: false });
  };

  //popup service

  handleShowYesterdayData = () => {
    this.setState(prevState => ({
      showYesterdayData: !prevState.showYesterdayData,
    }));
  };

  handleShowTruthData = () => {
    this.setState(prevState => ({
      showTruthData: !prevState.showTruthData,
    }));
  };

  ////
  render() {
    const { selectedCell, showModal, cellData, cellDataYesterday, cellDataPredict } = this.state;
    const { gridData, predictMode, todayTime, currentTime, currentDate, todayDate } = this.props;

    const isCellDataAvailable = Array.isArray(cellData) && cellData.length > 0;

    const xAxisData = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        xAxisData.push(time);
      }
    }

    let finalData = []
    if (Array.isArray(cellData) && cellData.length > 0 && currentDate === todayDate) {
      let endIndex = 0

      if (currentTime > convertTimeToString(todayTime)) {
        endIndex = convertTimeToString(todayTime)
      }
      else {
        endIndex = currentTime
      }
      const filteredData = cellData.slice(0, parseInt(endIndex));
      const remainingData = Array(cellData.length - filteredData.length).fill(undefined);
      finalData = [...filteredData, ...remainingData];
    }
    else { finalData = Array(48).fill(undefined); }

    let combinedData = [];
    if (Array.isArray(cellData) && cellData.length > 0 && Array.isArray(cellDataYesterday)) {
      combinedData = cellData.map((y, index) => ({
        x: xAxisData[index],
        today: y,
        yesterday: cellDataYesterday[index],
        predict: cellDataPredict[index],
        todayRestTruth: finalData[index],
      }));
    }

    const gridCoords = [];

    const topLeftLat = 40.028616;
    const topLeftLon = 116.249080;
    const latDelta = CELL_SIZE / 111.32;
    const lonDelta = CELL_SIZE / (111.32 * Math.cos(topLeftLat * Math.PI / 180));

    for (let i = 0; i < GRID_SIZE; i++) {
      for (let j = 0; j < GRID_SIZE; j++) {
        const left = topLeftLon + i * lonDelta;
        const right = topLeftLon + (i + 1) * lonDelta;
        const top = topLeftLat - j * latDelta;
        const bottom = topLeftLat - (j + 1) * latDelta;

        gridCoords.push([[top, left], [bottom, right]]);
      }

    }
    const selectedCellCoords = gridCoords[selectedCell];

    const gridRectangles = gridCoords.map((coords, index) => {
      const color = this.getColor(gridData[index]);
      const fillOpacity = color ? 0.7 : 0;
      const cellCenter = [
        (coords[0][0] + coords[1][0]) / 2,
        (coords[0][1] + coords[1][1]) / 2,
      ];

      return (
        <Rectangle
          key={index}
          bounds={coords}
          color="black"
          weight={0.1}
          fillOpacity={fillOpacity}
          fillColor={color}
          eventHandlers={{
            click: () => this.handleCellClick(index),
          }}
        >
          <Popup position={coords[0][0]} >
            <div className="cell-info" > Ячейка номер: {index} <br />
              {predictMode === true ? 'Кол-во машин (прогноз)' : 'Кол-во машин'} = {gridData[index]} <br />
              {Array.isArray(cellDataPredict) ? `MAE: ${calculateMAE(cellData, cellDataPredict)}` : null} <br />
              {Array.isArray(cellDataPredict) ? `MAPE: ${calculateMAPE(cellData, cellDataPredict)}%` : null} <br />
              <button onClick={this.handleShowYesterdayData}>Показать прошлые данные</button>
              <button onClick={this.handleShowTruthData}>Показать реальные данные</button>
            </div>
            {selectedCell === index && isCellDataAvailable && (
              <>
                <div className="popup-content">
                  <div className="mini-map-container">
                    <MapContainer center={cellCenter} zoom={15} style={{ height: "200px", width: "300px" }}>
                      <TileLayer
                        attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                        url={`https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${API_KEY}`}

                      />
                    </MapContainer>
                  </div>
                  <div className="chart-container">
                    <ResponsiveContainer width={700} height={250}>
                      <LineChart data={combinedData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="x" />
                        <YAxis domain={[0, 1200]} tickCount={9} label={{ value: "Значение", angle: -90, position: "insideLeft" }} />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" name="Прогноз" dataKey="predict" stroke="green" dot={<Dot r={0} />} />
                        {currentDate === todayDate && (
                          <Line type="monotone" name="Текущие данные" dataKey="todayRestTruth" stroke="black" activeDot={{ r: 1 }} dot={<Dot r={0} />} />
                        )}
                        {this.state.showTruthData && (
                          <Line type="monotone" name="Сегодня" dataKey="today" stroke="#8884d8" activeDot={{ r: 1 }} dot={<Dot r={0} />} />
                        )}
                        {this.state.showYesterdayData && (
                          <Line type="monotone" name="Вчера" dataKey="yesterday" stroke="red" dot={<Dot r={0} />} />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <span>Широта {cellCenter[0].toFixed(4)}</span>
                <span className="space"></span>
                <span>Долгота {cellCenter[1].toFixed(4)}</span>
              </>
            )}
          </Popup>
        </Rectangle>
      );
    });

    return (
      <>
        {gridRectangles}
      </>
    );
  }
}

export default Grid;