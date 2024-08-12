import { isSearchClient } from "../../config/index.js";
import { deleteVideoDocumentByItemId } from "./index.js";

/**
 * esScheduleDeleteVideoByItemId
 * @param id // id of title,people,
 * @param type // type - title,people
 */

export const esScheduleDeleteVideoByItemId = async (id, type) => {
  try {
    if (!isSearchClient) {
      return { status: "error", message: "something wrong with search db" };
    }
    if (type && ["movie", "tv", "webtoons", "people"].includes(type)) {
      let indexName = "";
      indexName = `search-video`;
      return await deleteVideoDocumentByItemId(indexName, id, type != "people" ? "title" : type);
    } else {
      return { status: "error", message: "type is required" };
    }
  } catch (error) {
    console.log("Error:", error);
    return { status: "sys_error", message: error };
  }
};
