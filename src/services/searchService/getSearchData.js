import { searchClient, isSearchClient } from "../../config/index.js";

/**
 * getSearchData
 * get the search match data
 * @param indexName - string
 * @param from - integer
 * @param size - integer
 * @param query - object
 * @param sort - object
 * @param raw - boolean/optional
 * @return array object
 */

export const getSearchData = async (indexName, from, size, query, sort, raw = false) => {
  try {
    if (!from) from = 0;
    if (!isSearchClient) {
      return { status: "error", error: "something wrong with search db" };
    } else if (!indexName) {
      return { status: "error", error: "index is required" };
    } else if (!query) {
      return { status: "error", error: "query is required" };
    } else if (!size) {
      return { status: "error", error: "size is required" };
    } else if (!sort) {
      return { status: "error", error: "sort is required" };
    } else {
      const checkIndex = await searchClient.indices.exists({ index: indexName });
      if (!checkIndex) {
        return { status: "error", error: "index is not valid" };
      } else {
        let results = { rows: [], count: 0 };
        const res = await searchClient.search({
          index: indexName,
          from: from,
          size: size,
          query: query,
          sort: sort,
        });
        if (res && res.hits) {
          if (res.hits.hits.length > 0) {
            results = {
              rows: res.hits.hits,
              count: res.hits.total && res.hits.total.value ? res.hits.total.value : 0,
            };
          }
        }
        return raw
          ? { status: "success", results: results, raw: res }
          : { status: "success", results: results };
      }
    }
  } catch (error) {
    console.error("Error:", error);
    return { status: "sys_error", error: error };
  }
};
