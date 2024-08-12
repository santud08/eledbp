import { searchClient, isSearchClient } from "../../config/index.js";

/**
 * getIndices
 * get all the index
 * @param params - object
 */
export const getIndices = async (params = { raw: false }) => {
  try {
    if (!isSearchClient) {
      return [];
    }
    const { raw } = params;
    return searchClient.cat.indices({ format: "json" }).then((dataIndices) => {
      let indices = {};
      if (raw == "true") {
        indices = dataIndices;
      } else {
        indices = dataIndices.map((indexInfo) => indexInfo.index);
      }
      return indices;
    });
  } catch (error) {
    console.error("Error:", error);
    return [];
  }
};
