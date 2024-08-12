export const worklistSearchTypeList = async (key = null) => {
  const listArr = {
    movie: "Movies",
    tv: "Tv Shows",
    webtoons: "Webtoons",
    people: "People",
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
