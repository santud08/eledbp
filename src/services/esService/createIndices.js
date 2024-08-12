import { searchClient, isSearchClient } from "../../config/index.js";

/**
 * createIndices
 * create the index
 * @param indexName - string
 * @param properties - object
 */
export const createIndices = async (indexName, properties) => {
  try {
    if (!isSearchClient) {
      return { status: "error", error: "something wrong with search db" };
    } else if (!indexName) {
      return { status: "error", error: "index is required" };
    } else if (!properties) {
      return { status: "error", error: "properties is required" };
    } else {
      const checkIndex = await searchClient.indices.exists({ index: indexName });
      if (checkIndex) {
        return { status: "error", error: "index is already created" };
      } else {
        const res = await searchClient.indices.create({
          index: indexName,
          mappings: {
            properties: properties,
          },
        });
        return res
          ? { status: "success", error: "" }
          : { status: "error", error: "something is wrong. index is not created" };
      }
    }
  } catch (error) {
    console.error("Error:", error);
    return { status: "sys_error", error: error };
  }
};
