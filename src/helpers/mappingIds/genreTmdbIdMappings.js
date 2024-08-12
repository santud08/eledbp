export const genreTmdbIdMappings = async (key = null) => {
  const genreMappingArrIds = {
    28: 1,
    10759: 1,
    12: 2,
    878: 2,
    16: 3,
    35: 4,
    99: 6,
    18: 7,
    10766: 7,
    10751: 7,
    10770: 7,
    10768: 7,
    14: 8,
    10765: 8,
    36: 9,
    10752: 9,
    37: 9,
    27: 10,
    9648: 12,
    10749: 13,
    53: 14,
    80: 14,
    10767: 16,
    10764: 17,
    10402: 18,
    10763: 19,
    10762: 19,
  };

  if (key) {
    let retStr = "";
    if (genreMappingArrIds[key]) {
      retStr = genreMappingArrIds[key];
    }
    return retStr;
  } else {
    return genreMappingArrIds;
  }
};
