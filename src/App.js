import "./App.css";
import React from "react";
import Plot from "react-plotly.js";
// import "bootstrap/dist/css/bootstrap.min.css"; // bootstrap
import { Grid, Card } from "@mui/material/"; // material ui
//컴포넌트
import Button from "./component/Button";
import Search from "./component/Search";
//함수
import { getInfo } from "./visualization/DataExtraction";
import { visualization } from "./visualization/visualization";
import { changeInfoDict } from "./visualization/edit";
import { moveIdxFront } from "./visualization/edit";
import { removeHtmlTag } from "./visualization/edit";
import { makeNewModel } from "./visualization/edit";
import { getRequest, postRequest, myRequest } from "./api";

//state
import { useState, useEffect } from "react";
//아이콘
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPenToSquare } from "@fortawesome/free-regular-svg-icons";
import { faFloppyDisk } from "@fortawesome/free-regular-svg-icons";
import { faGripLines, faPray } from "@fortawesome/free-solid-svg-icons";
import { faShuffle } from "@fortawesome/free-solid-svg-icons";
import { faCircleQuestion } from "@fortawesome/free-solid-svg-icons";
//img
import armLabel from "./img/label.png";

import axios from "axios";

import "./css/w3-ct.css";
import "./css/print.css";
import "./css/trial-record.css";


function App() {
  const [infoDict, setInfoDict] = useState();

  // crossover : NCT04450953
  // 군 엄청 많아: NCT04844424
  // 약 엄청 많아: NCT02374567

  // const dataProcessed = getInfo(infoDict);
  // let visualizationInfo = visualization(dataProcessed);

  //data
  // let vData = visualizationInfo.Gdata;

  //Layout
  // let vLayout = visualizationInfo.Glayout;
  // let vConfig = visualizationInfo.Gconfig;

  const [data, setData] = useState();
  const [layout, setLayout] = useState();
  const [frames, setFrames] = useState();
  const [config, setConfig] = useState();
  const [mode, setMode] = useState("read");
  const [visible, setVisible] = useState(false);
  const [text, setText] = useState();

  const clikckBranch = (e) => {
    const newLayout = { ...layout };
    let selectedBranch = 0;
    //branch 투명도
    e.points[0].data.opacity = e.points[0].data.opacity === 1 ? 0.3 : 1;
    //화살표 촉 투명도
    for (let value of newLayout.shapes) {
      if (
        value.name &&
        value.name.shape === "arrow" &&
        value.name.idx === e.points[0].data.name.idx
      ) {
        value.opacity = value.opacity === 1 ? 0.3 : 1;
      }
    }
    for (let value of data) {
      //클릭된 개수 세기
      selectedBranch =
        value.opacity === 0.3 ? selectedBranch + 1 : selectedBranch;
    }
    if (selectedBranch >= 3) {
      //branch 투명도
      alert("두개 까지만 선택 가능합니다.");
      e.points[0].data.opacity = 1;
      //화살표 촉 투명도
      for (let value of newLayout.shapes) {
        if (
          value.name &&
          value.name[0] === "arrow" &&
          value.name[1] === e.points[0].data.name[1]
        ) {
          value.opacity = 1;
        }
      }
    }
    const newData = [...data];
    setData(newData);
    setLayout(newLayout);
  };

  const postGraph = async (json) => {
    let result = '';
    try {
      result = await postRequest(json);
    }
    catch (error) {
      console.log(error);
    }
    return result;
  };

  const modifyBranch = (branchToModified) => { //바뀔 인자값 넣기
    const newInfoDict = { ...infoDict };
    let clickedBranchIdx = []; // 선택된 branchidx 2개 담기
    for (let i = 0; i < data.length; i++) {
      if (data[i].opacity === 0.3) clickedBranchIdx.push(i);
    }
    if (branchToModified === 'cross') moveIdxFront(newInfoDict, clickedBranchIdx);

    newInfoDict.DesignModel = makeNewModel(
      newInfoDict.DesignModel,
      newInfoDict.DrugInformation.ArmGroupList.length,
      "+"
    );

    const annot = layout.annotations;
    changeInfoDict(newInfoDict, annot);

    const newDataJson = getInfo(newInfoDict);
    const newVisualizationInfo = visualization(newDataJson);
    const newData = newVisualizationInfo.Gdata;
    const newLayout = newVisualizationInfo.Glayout;

    for (let value of newData) {
      if (value.name) value.hoverinfo = "none";
    }
    //Html tag 제거
    removeHtmlTag(newLayout.annotations);
    setInfoDict(newInfoDict);
    setLayout(newLayout);
    setData(newData);

  };

  const Parser = require("html-react-parser");
  let result_json;
  let result_text;
  const createGraph = async (keyword) => {
    try {
      result_json = await myRequest(keyword);
      // result_text = await myCrawling(result_json["_id"]);
      // result_json = await getRequest(keyword);

    } catch {
      console.log("error");
    }


    // setText(Parser(result_text)); // 내용 생성 뒤 render될 수 있도록


    const information = getInfo(result_json);
    const visualizationInformation = visualization(information);
    //data
    const newData = visualizationInformation.Gdata;
    //Layout
    const newLayout = visualizationInformation.Glayout;
    //Config
    const newConfig = visualizationInformation.Gconfig;

    setData(newData);
    setLayout(newLayout);
    setConfig(newConfig);
    setMode("read");
    setVisible(true);
    setInfoDict(result_json);
  };

  let content = "";
  if (mode === "read") {
    //READ 모드일때 edit버튼을 누르면
    content = (
      <Button
        mode="edit"
        icon={faPenToSquare}
        onChangeMode={() => {
          // editable하게 바꾸기
          const newConfig = { ...config };
          newConfig.edits.annotationText = true;


          // Layout값 바꾸기
          const newLayout = { ...layout };
          const annot = newLayout.annotations;
          //Html tag 제거
          removeHtmlTag(annot);

          // data 클릭 되게 바꾸기
          const newData = [...data];
          for (let value of newData) {
            if (value.name) value.hoverinfo = "none";
          }
          setConfig(newConfig);
          setData(newData);
          setLayout(newLayout);
          setMode("edit");
        }}
      ></Button>
    );
  } else if (mode === "edit") {
    content = (
      <>
        <Button
          mode="parallel"
          icon={faGripLines}
          onChangeBranch={modifyBranch}// cross over -> parallel로 바꾸기
        ></Button>

        <Button
          mode="cross"
          icon={faShuffle}
          onChangeBranch={modifyBranch}// parallel -> cross over로 바꾸기
        ></Button>

        <Button
          mode="save"
          icon={faFloppyDisk}
          onChangeMode={async () => {
            let result = '';
            // const newConfig = { ...config };
            // newConfig.edits.annotationText = false;


            // //편집 완료시 태그 다시 추가 및 박스 크기와 위치 조절
            const newInfoDict = { ...infoDict };
            const annot = layout.annotations;
            changeInfoDict(newInfoDict, annot);

            try {
              result = await postRequest(newInfoDict);
            }
            catch (error) {
              console.log(error);
            }

            console.log(result);

            const newDataJson = getInfo(result);
            const newVisualizationInfo = visualization(newDataJson);

            setLayout(newVisualizationInfo.Glayout);
            setData(newVisualizationInfo.Gdata);
            setConfig(newVisualizationInfo.Gconfig);
            setInfoDict(result);
            setMode("read");

          }}

        ></Button>
      </>
    );
  }


  const myCrawling = async (nctid) => {
    // console.log(nctid);
    try {
      const retries = 2;
      let body = {
        url: nctid,
      };
      let req;
      for (let q = 0; q < retries; q++) {
        try {
          req = await axios.post(`http://localhost:5000/crawling`, body);
          if (req) {
            break;
          } else {
            console.log(req);
            console.log("cannot fetch data");
          }
        } catch (e) {
          console.log("cannot fetch error");
        }
      }
      // console.log("this is from crawling! \n", req.data);
      return req.data;
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <div className="container">
      <div className="url">
        <Search onCreate={createGraph}></Search>
      </div>
      {visible && (
        <div className="contents">
          <Grid container spacing={2}>
            <Grid item xs={8}>
              <div className="original">{text}</div>
            </Grid>
            <Grid item xs={4}>
              <div className="plot">
                <Plot
                  layout={layout}
                  data={data}
                  frames={frames}
                  config={config}
                  onClick={(e) => {
                    clikckBranch(e);
                  }}
                  onHover={(e) => {
                    console.log(1);
                  }}
                ></Plot>
                <div className="buttonDiv">{content}</div>
                <div className="questionIcon">
                  <FontAwesomeIcon icon={faCircleQuestion} />
                  <img src={armLabel} alt="armlabel" />
                </div>
              </div>
            </Grid>
          </Grid>
        </div>
      )}
    </div>
  );
}

export default App;
