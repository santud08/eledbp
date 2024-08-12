import { isSearchClient } from "../../config/index.js";
import { deleteDocument } from "./index.js";

/**
 * esScheduleDelete
 * @param id // id of movie,tv,webtoons,people,tag,company
 * @param type // type - movie,tv,webtoons,people,tag,company
 */

export const esScheduleDelete = async (id, type) => {
  try {
    if (!isSearchClient) {
      return { status: "error", message: "something wrong with search db" };
    }
    if (type) {
      let indexName = "";
      indexName = `search-${type}`;
      return await deleteDocument(id, indexName);
    } else {
      return { status: "error", message: "type is required" };
    }
  } catch (error) {
    console.log("Error:", error);
    return { status: "sys_error", message: error };
  }
};
