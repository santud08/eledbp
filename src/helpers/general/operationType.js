export const operationType = async (key = null) => {
  const listArr = {
    allocate: "Allocate",
    working: "Working",
    done: "Done",
    approve: "Approve",
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
