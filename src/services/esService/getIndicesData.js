import { searchClient, isSearchClient } from "../../config/index.js";

/**
 * getIndicesData
 * get all the index
 * @param params - object
 */
export const getIndicesData = async (params = {}) => {
  try {
    if (!isSearchClient) {
      return [];
    }
    if (!params) {
      return [];
    } else {
      const searchIndex = params.search_index,
        from = params.from,
        size = params.size;
      const checkIndex = await searchClient.indices.exists({ index: searchIndex });
      if (!checkIndex) {
        return [];
      } else {
        return await searchClient.search({
          index: `${searchIndex}`,
          from: from,
          size: size,
          body: {
            query: {
              match_all: {},
            },
          },
        });
      }
    }
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
};
