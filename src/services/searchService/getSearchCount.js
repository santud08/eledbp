import { searchClient, isSearchClient } from "../../config/index.js";

/**
 * getSearchCount
 * get the no of count
 * @param indexName - string
 * @param query - object
 * @return object
 */
export const getSearchCount = async (indexName, query) => {
  try {
    if (!isSearchClient) {
      return 0;
    }
    let resCount = 0;
    if (!indexName) {
      resCount = 0;
    } else if (!query) {
      resCount = 0;
    } else {
      const checkIndex = await searchClient.indices.exists({ index: indexName });
      if (!checkIndex) {
        resCount = 0;
      } else {
        const res = await searchClient.count({
          index: indexName,
          query: query,
        });
        resCount = res.count ? res.count : 0;
      }
    }
    return resCount;
  } catch (error) {
    console.error("Error:", error);
    return 0;
  }
};
