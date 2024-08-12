import { searchClient, isSearchClient } from "../../config/index.js";

/**
 * deleteVideoDocumentByItemId
 * @param itemId // title/people id, which video to be deleted
 * @param type // title/people which type video to be deleted
 * @param indexName // index name
 */

export const deleteVideoDocumentByItemId = async (indexName, itemId, type) => {
  try {
    const documentId = itemId;
    const videoFor = type;
    if (!isSearchClient) {
      return { status: "error", message: "something wrong with search db" };
    }
    if (indexName && itemId > 0 && (videoFor == "title" || videoFor == "people")) {
      //   --------->need to find id already exist add not exits , update if exist <-----------------
      const checkIndex = await searchClient.indices.exists({ index: indexName });
      if (checkIndex) {
        const docSearch = await searchClient.search({
          index: indexName,
          body: {
            query: {
              bool: {
                must: [
                  {
                    match: {
                      "results.item_id": documentId,
                    },
                  },
                  {
                    match: {
                      "results.video_for": videoFor,
                    },
                  },
                ],
              },
            },
          },
        });
        if (docSearch.hits.total.value > 0) {
          const response = await searchClient.deleteByQuery({
            index: indexName,
            body: {
              query: {
                bool: {
                  must: [
                    {
                      match: {
                        "results.item_id": documentId,
                      },
                    },
                    {
                      match: {
                        "results.video_for": videoFor,
                      },
                    },
                  ],
                },
              },
            },
            refresh: true, // Wait for the operation to refresh
          });
          if (response.deleted > 0) {
            return { status: "success", message: "Documents is deleted successfully." };
          } else {
            return { status: "error", message: "Failed to delete documents" };
          }
        } else {
          return { status: "error", message: "Documents id is not found" };
        }
      } else {
        return { status: "error", message: "Index not found" };
      }
    } else {
      return { status: "error", message: "Invalid inputs" };
    }
  } catch (error) {
    console.log(error);
    return { status: "sys_error", message: error };
  }
};
