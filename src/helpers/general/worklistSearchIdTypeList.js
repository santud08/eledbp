export const worklistSearchIdTypeList = async (key = null) => {
  const listArr = {
    id: "ID",
    tiving_id: "TVING ID",
  };

  if (key) {
    let retStr = "";
    if (listArr[key]) {
      retStr = listArr[key];
    }
    return retStr;
  } else {
    return listArr;
  }
};
