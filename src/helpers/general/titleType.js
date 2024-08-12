export const titleType = async (key = null) => {
  const listArr = {
    movie: "Movie",
    tv: "Tv Show",
    webtoons: "Webtoon",
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
