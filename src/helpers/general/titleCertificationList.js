export const titleCertificationList = async (type = null, key = null) => {
  const certificationArr = {
    movie: {
      all: "all",
      12: 12,
      15: 15,
      18: 18,
      restrict: "restrict",
      nr: "nr",
    },
    tv: {
      all: "all",
      7: 7,
      12: 12,
      15: 15,
      19: 19,
      nr: "nr",
    },
    webtoons: {
      all: "all",
      12: 12,
      15: 15,
      18: 18,
      nr: "nr",
    },
  };
  if (type && !key) {
    return certificationArr[type] ? certificationArr[type] : null;
  } else if (type && key) {
    let retStr = "";
    if (certificationArr[type]) {
      if (certificationArr[type][key]) {
        retStr = certificationArr[type][key];
      }
    }
    return retStr;
  } else {
    return certificationArr;
  }
};
