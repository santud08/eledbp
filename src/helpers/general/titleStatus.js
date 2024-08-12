export const titleStatus = async (type = null, key = null) => {
  const statusArr = {
    movie: {
      rumored: "Rumored",
      planned: "Planned",
      in_production: "In Production",
      post_production: "Post Production",
      released: "Released",
      canceled: "Canceled",
    },
    tv: {
      returning_series: "Returning Series",
      planned: "Planned",
      pilot: "Pilot",
      in_production: "In Production",
      ended: "Ended",
      canceled: "Canceled",
    },
    webtoons: {
      returning_series: "Returning Series",
      pilot: "Pilot",
      ongoing: "Ongoing",
      hiatus: "Hiatus",
      completed: "Completed",
      canceled: "Canceled",
    },
  };
  if (type && !key) {
    return statusArr[type] ? statusArr[type] : null;
  } else if (type && key) {
    let retStr = "";
    if (statusArr[type]) {
      if (statusArr[type][key]) {
        retStr = statusArr[type][key];
      }
    }
    return retStr;
  } else {
    return statusArr;
  }
};
