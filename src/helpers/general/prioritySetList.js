export const prioritySetList = async (key = null) => {
  const listArr = {
    1: "1st",
    2: "2nd",
    3: "3rd",
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
