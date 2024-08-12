import { searchClient, isSearchClient } from "../../config/index.js";

/**
 * deleteDocument
 * @param id // id to be deleted
 * @param indexName // index name
 */

export const deleteDocument = async (id, indexName) => {
  try {
    const documentId = id;
    if (!isSearchClient) {
      return { status: "error", message: "something wrong with search db" };
    }
    //   --------->need to find id already exist add not exits , update if exist <-----------------
    const checkIndex = await searchClient.indices.exists({ index: indexName });
    if (checkIndex) {
      const docSearch = await searchClient.search({
        index: indexName,
        body: {
          query: {
            match: {
              id: documentId,
            },
          },
        },
      });
      if (docSearch.hits.total.value > 0) {
        const indexId = docSearch?.hits?.hits[0]?._id ?? null;
        if (indexId) {
          const response = await searchClient.delete({
            index: indexName,
            id: indexId,
            refresh: true, // Wait for the operation to refresh
          });
          if (response.result === "deleted") {
            return { status: "success", message: "Document is deleted successfully." };
          } else {
            return { status: "error", message: "Failed to delete document" };
          }
        } else {
          return { status: "error", message: "Document id is not found" };
        }
      } else {
        return { status: "error", message: "Document id is not found" };
      }
    } else {
      return { status: "error", message: "Index not found" };
    }
  } catch (error) {
    console.log(error);
    return { status: "sys_error", message: error };
  }
};
