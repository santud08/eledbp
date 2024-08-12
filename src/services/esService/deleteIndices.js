import { searchClient, isSearchClient } from "../../config/index.js";

/**
 * deleteIndices
 * delete the index
 * @param indexName - string
 */
export const deleteIndices = async (indexName) => {
  try {
    if (!isSearchClient) {
      return { status: "error", error: "something wrong with search db" };
    }
    if (!indexName) {
      return { status: "error", error: "index is required" };
    } else {
      const checkIndex = await searchClient.indices.exists({ index: indexName });
      if (!checkIndex) {
        return { status: "error", error: "index is not valid" };
      } else {
        const res = await searchClient.indices.delete({ index: indexName });
        return res
          ? { status: "success", error: "" }
          : { status: "error", error: "something is wrong. index is not deleted" };
      }
    }
  } catch (error) {
    console.error("Error:", error);
    return { status: "sys_error", error: error };
  }
};
