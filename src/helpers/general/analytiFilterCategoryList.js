export const analytiFilterCategoryList = async (type = null, key = null) => {
  const categoryArr = {
    community_report: {
      movie: "Movies",
      webtoons: "Webtoons",
      tv: "Tv Shows",
      people: "People",
    },
    user_feedback_report: {
      movie: "Movies",
      webtoons: "Webtoons",
      tv: "Tv Shows",
      people: "People",
      awards: "Awards",
    },
    db_content_report: {
      all: "All",
      movie: "Movies",
      webtoons: "Webtoons",
      tv: "Tv Shows",
      people: "People",
      awards: "Awards",
      video: "Videos",
    },
  };
  if (type && !key) {
    return categoryArr[type] ? categoryArr[type] : null;
  } else if (type && key) {
    let retStr = "";
    if (categoryArr[type]) {
      if (categoryArr[type][key]) {
        retStr = categoryArr[type][key];
      }
    }
    return retStr;
  } else {
    return categoryArr;
  }
};
