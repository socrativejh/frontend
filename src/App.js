import "./App.css";
import React from "react";
import Plot from "react-plotly.js";
//컴포넌트
import Button from './component/Button'
import Search from './component/Search'
//함수
import { getInfo } from "./visualization/DataExtraction";
import { visualization } from "./visualization/visualization";
import { armGArrowW } from "./visualization/visualization";
import { changeInfoDict } from "./visualization/edit";
import { changeIdx } from "./visualization/edit";
import { removeHtmlTag } from "./visualization/edit";
//state
import { useState } from 'react';
//아이콘
import { faPenToSquare } from "@fortawesome/free-regular-svg-icons";
import { faFloppyDisk } from "@fortawesome/free-regular-svg-icons";
// import {PythonShell} from 'python-shell';
import { faGripLines, faPray } from "@fortawesome/free-solid-svg-icons";
import { faShuffle } from "@fortawesome/free-solid-svg-icons";


// import $ from "jquery";

function App() {

  const infoDict = require("./NCT_ID_database/NCT05488340.json");
  const dataJson = getInfo(infoDict);
  console.log(infoDict);

  let visualizationInfo = visualization(dataJson);
  //data
  let vData = visualizationInfo.Gdata;

  //Layout
  let vLayout = visualizationInfo.Glayout;
  let vConfig = visualizationInfo.Gconfig;

  const [data, setData] = useState(vData);
  const [layout, setLayout] = useState(vLayout);
  const [frames, setFrames] = useState([]);
  const [config, setConfig] = useState(vConfig);
  const [mode, setMode] = useState('READ');

  //branch
  const startX = data[0].x[1]; // 시작점
  const crossOverX = [data[0].x[0], startX, startX + armGArrowW / 3, startX + armGArrowW / 3 * 2, startX + armGArrowW];
  const parallelX = [data[0].x[0], startX, startX + armGArrowW];

  function modifyBranch(model, data, idx) {
    if (model === 'Crossover Assignment') {
      const startY1 = data[idx[0]].y[1];
      const startY2 = data[idx[1]].y[1];
      const y1 = [data[0].y[0], startY1, startY1, startY2, startY2];
      const y2 = [data[0].y[0], startY2, startY2, startY1, startY1];
      const y = [y1, y2];
      for (let i = 0; i < idx.length; i++) {
        data[idx[i]].x = crossOverX;
        data[idx[i]].y = y[i];
      }
    }
    const startY1 = data[idx[0]].y[1];
    const startY2 = data[idx[1]].y[1];
    const y1 = [data[0].y[0], startY1, startY1];
    const y2 = [data[0].y[0], startY2, startY2,];
    const y = [y1, y2];
    if (model === 'Parallel Assignment') {
      for (let i = 0; i < idx.length; i++) {
        data[idx[i]].x = parallelX;
        data[idx[i]].y = y[i];
      }
    }
  }

  let content = '';
  if (mode === 'READ') { //READ 모드일때 edit버튼을 누르면
    content =
      <Button icon={faPenToSquare} onChangeMode={() => {
        // editable하게 바꾸기
        const newConfig = { ...config };
        newConfig.edits.annotationText = true;
        setConfig(newConfig);

        // Layout값 바꾸기
        const newLayout = { ...layout };
        const annot = newLayout.annotations;
        //Html tag 제거
        removeHtmlTag(annot);

        // data 클릭 되게 바꾸기
        const newData = [...data];
        for (let value of newData) {
          if (value.name) value.hoverinfo = 'none';
        }
        setData(newData);
        setLayout(newLayout);
        setMode('EDIT');
      }} ></Button>;
  }

  else if (mode === 'EDIT') {
    content = <>
      <Button icon={faGripLines} onChangeMode={() => {
        // crossover -> parallel 로 바꾸기
        const newInfoDict = { ...infoDict };
        const clickedBranchIdx = []; // 선택된 branch idx 2개 담기
        for (let i = 0; i < data.length; i++) {
          if (data[i].opacity === 0.3) clickedBranchIdx.push(i);
        }

        const newDataJson = getInfo(newInfoDict);
        const newVisualizationInfo = visualization(newDataJson);
        const newData = newVisualizationInfo.Gdata;
        const newLayout = newVisualizationInfo.Glayout;
        modifyBranch('Parallel Assignment', newData, clickedBranchIdx);
        for (let value of newData) {
          if (value.name) value.hoverinfo = 'none';
        }
        removeHtmlTag(newLayout.annotations);
        setData(newData);
        setLayout(newLayout);
      }}></Button>

      <Button icon={faShuffle} onChangeMode={() => {
        // parallel -> cross over로 바꾸기
        const newInfoDict = { ...infoDict };
        let clickedBranchIdx = []; // 선택된 branchidx 2개 담기
        for (let i = 0; i < data.length; i++) {
          if (data[i].opacity === 0.3) clickedBranchIdx.push(i);
        }

        //branch가 붙어있지 않다면 붙어있도록 순서 변경
        let [smallIdx, bigIdx] = clickedBranchIdx[1] > clickedBranchIdx[0] ? clickedBranchIdx : [...clickedBranchIdx].reverse();
        const armGroupList = newInfoDict.DrugInformation.ArmGroupList;
        changeIdx(armGroupList, [smallIdx, bigIdx]);
        clickedBranchIdx = [0, 1];

        const newDataJson = getInfo(newInfoDict);
        const newVisualizationInfo = visualization(newDataJson);
        const newData = newVisualizationInfo.Gdata;
        const newLayout = newVisualizationInfo.Glayout;

        for (let value of newData) {
          if (value.name) value.hoverinfo = 'none';
        }
        //좌표 설정
        modifyBranch('Crossover Assignment', newData, clickedBranchIdx);
        //Html tag 제거
        removeHtmlTag(newLayout.annotations);
        setLayout(newLayout);
        setData(newData);
      }}></Button>

      <Button icon={faFloppyDisk} onChangeMode={() => {
        // editable: false
        const newConfig = { ...config };
        newConfig.edits.annotationText = false;
        setConfig(newConfig);

        //편집 완료시 태그 다시 추가 및 박스 크기와 위치 조절
        const newInfoDict = { ...infoDict };
        const annot = layout.annotations;
        changeInfoDict(newInfoDict, annot);
        const newDataJson = getInfo(newInfoDict);
        const newVisualizationInfo = visualization(newDataJson);

        setLayout(newVisualizationInfo.Glayout);
        // data 클릭 안되게 바꾸기
        const newData = [...data];
        for (let value of newData) {
          if (value.name) value.hoverinfo = 'skip';
        }
        setData(newData);
        setMode('READ');
      }}>
      </Button>
    </>;
  }

  return (
    <div className="container">
      <div className="url">
        <Search className></Search>
      </div>
      <div className="plot">
        <Plot

          layout={layout}
          data={data}
          frames={frames}
          config={config}

          onClick={(e) => {

            const newLayout = { ...layout };
            let selectedBranch = 0;
            //branch 투명도
            e.points[0].data.opacity = e.points[0].data.opacity === 1 ? 0.3 : 1;
            //화살표 촉 투명도
            for (let value of data) { //클릭된 개수 세기
              selectedBranch = value.opacity === 0.3 ? selectedBranch + 1 : selectedBranch;
            }
            if (selectedBranch >= 3) {
              //branch 투명도
              alert('두개 까지만 선택 가능합니다.');
              e.points[0].data.opacity = 1;
              //화살표 촉 투명도
              for (let value of newLayout.shapes) {
                if (value.name && value.name[0] === 'arrow' && value.name[1] === e.points[0].data.name[1]) {
                  value.opacity = 1;
                }
              }
            }
            const newData = [...data];
            setData(newData);
            setLayout(newLayout);

          }}
        // onInitialized={(figure) => useState(figure)}
        // onUpdate={(figure) => useState(figure)}
        >
        </Plot>
        <div className="buttonDiv">
          {content}
        </div>
      </div>
    </div>
  );
}

export default App;
