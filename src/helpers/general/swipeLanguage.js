export const swipeLanguage = async (lan = "en") => {
  let retStr = lan;

  if (lan == "en") {
    retStr = "ko";
  }
  if (lan == "ko") {
    retStr = "en";
  }
  return retStr;
};
