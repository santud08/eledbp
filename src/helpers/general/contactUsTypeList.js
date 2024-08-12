export const contactUsTypeList = async (key = null) => {
  const listArr = {
    general: "General",
    change_information: "Change Information",
    add_tags: "Add Tags",
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
