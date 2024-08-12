export const titleSearchByList = async (type, key = null) => {
  let listArr = {
    title: "Title (Name)",
    tmdb_id: "TMDB_ID",
    kobis_id: "KOBIS_ID",
    imdb_id: "IMDB_ID",
    tiving_id: "TVING_ID",
    odk_id: "ODK_ID",
  };
  if (type == "tv") {
    listArr = {
      title: "Title (Name)",
      tmdb_id: "TMDB_ID",
      tiving_id: "TVING_ID",
      imdb_id: "IMDB_ID",
      odk_id: "ODK_ID",
    };
  }
  if (type == "people") {
    listArr = {
      title: "Title (Name)",
      tmdb_id: "TMDB_ID",
      kobis_id: "KOBIS_ID",
      imdb_id: "IMDB_ID",
      odk_id: "ODK_ID",
    };
  }
  if (type == "webtoons") {
    listArr = {
      title: "Title (Name)",
      naver_id: "Naver_ID",
      kakao_id: "Kakao_ID",
      tmdb_id: "TMDB_ID",
    };
  }
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
