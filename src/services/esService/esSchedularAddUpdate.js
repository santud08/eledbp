import { searchClient, isSearchClient } from "../../config/index.js";
import {
  createIndices,
  addNewMovieDocument,
  addNewTvDocument,
  addNewPeopleDocument,
  addNewTagDocument,
  addNewCompanyDocument,
  addNewWebtoonsDocument,
  addNewAwardDocument,
  addNewVideoDocument,
  deleteDocument,
} from "./index.js";

/**
 * esSchedularAddUpdate
 * @param id // id of movie,tv,webtoons,people,tag,company,award,video
 * @param type // type - movie,tv,webtoons,people,tag,company,award,video
 * @param action // add//update
 */

export const esSchedularAddUpdate = async (id, type, action) => {
  try {
    if (!isSearchClient) {
      return { status: "error", message: "something wrong with search db" };
    }
    if (type) {
      let indexName = "";
      let properties = {};
      indexName = `search-${type}`;
      // 1. Assign Properties based on the type
      if (type == "movie") {
        properties = {
          id: {
            type: "long",
            index: true,
          },
          sorting_fileds: {
            type: "object",
            properties: {
              popularity: {
                type: "integer",
                index: false,
              },
              release_date: {
                type: "date",
                index: false,
              },
            },
          },
          results: {
            type: "object",
            properties: {
              en: {
                type: "object",
                properties: {
                  name: {
                    type: "text",
                    index: false,
                  },
                  description: {
                    type: "text",
                    index: false,
                  },
                },
              },
              ko: {
                type: "object",
                properties: {
                  name: {
                    type: "text",
                    index: false,
                  },
                  description: {
                    type: "text",
                    index: false,
                  },
                },
              },
              poster_image: {
                type: "text",
                index: false,
              },
              release_date: {
                type: "date",
                index: false,
              },
            },
          },
          search: {
            type: "object",
            properties: {
              aka: {
                type: "text",
                index: true,
              },
              keywords: {
                type: "text",
                index: true,
              },
              name_en: {
                type: "text",
                index: true,
              },
              name_ko: {
                type: "text",
                index: true,
              },
            },
          },
          type: {
            type: "text",
            index: true,
          },
          uuid: {
            type: "text",
            index: false,
          },
        };
      } else if (type == "people") {
        properties = {
          id: {
            type: "long",
            index: true,
          },
          sorting_fileds: {
            type: "object",
            properties: {
              popularity: {
                type: "integer",
                index: false,
              },
              birth_date: {
                type: "date",
                index: false,
              },
            },
          },
          results: {
            type: "object",
            properties: {
              en: {
                type: "object",
                properties: {
                  name: {
                    type: "text",
                    index: false,
                  },
                  description: {
                    type: "text",
                    index: false,
                  },
                },
              },
              ko: {
                type: "object",
                properties: {
                  name: {
                    type: "text",
                    index: false,
                  },
                  description: {
                    type: "text",
                    index: false,
                  },
                },
              },
              poster_image: {
                type: "text",
                index: false,
              },
              birth_date: {
                type: "date",
                index: false,
              },
              death_date: {
                type: "date",
                index: false,
              },
            },
          },
          search: {
            type: "object",
            properties: {
              aka: {
                type: "text",
                index: true,
              },
              keywords: {
                type: "text",
                index: true,
              },
              name_en: {
                type: "text",
                index: true,
              },
              name_ko: {
                type: "text",
                index: true,
              },
            },
          },
          type: {
            type: "text",
            index: true,
          },
          uuid: {
            type: "text",
            index: false,
          },
          work_list: {
            type: "object",
            properties: {
              en: {
                type: "object",
                properties: {
                  title_id: {
                    type: "integer",
                    index: false,
                  },
                  title_name: {
                    type: "text",
                    index: false,
                  },
                },
              },
              ko: {
                type: "object",
                properties: {
                  title_id: {
                    type: "integer",
                    index: false,
                  },
                  title_name: {
                    type: "text",
                    index: false,
                  },
                },
              },
              poster_image: {
                type: "text",
                index: false,
              },
              birth_date: {
                type: "date",
                index: false,
              },
              death_date: {
                type: "date",
                index: false,
              },
            },
          },
        };
      } else if (type == "tv") {
        properties = {
          id: {
            type: "long",
            index: true,
          },
          sorting_fileds: {
            type: "object",
            properties: {
              popularity: {
                type: "integer",
                index: false,
              },
              release_date: {
                type: "date",
                index: false,
              },
            },
          },
          results: {
            type: "object",
            properties: {
              en: {
                type: "object",
                properties: {
                  name: {
                    type: "text",
                    index: false,
                  },
                  description: {
                    type: "text",
                    index: false,
                  },
                },
              },
              ko: {
                type: "object",
                properties: {
                  name: {
                    type: "text",
                    index: false,
                  },
                  description: {
                    type: "text",
                    index: false,
                  },
                },
              },
              poster_image: {
                type: "text",
                index: false,
              },
              release_date: {
                type: "date",
                index: false,
              },
            },
          },
          search: {
            type: "object",
            properties: {
              aka: {
                type: "text",
                index: true,
              },
              keywords: {
                type: "text",
                index: true,
              },
              name_en: {
                type: "text",
                index: true,
              },
              name_ko: {
                type: "text",
                index: true,
              },
            },
          },
          type: {
            type: "text",
            index: true,
          },
          uuid: {
            type: "text",
            index: false,
          },
        };
      } else if (type == "webtoons") {
        properties = {
          id: {
            type: "long",
            index: true,
          },
          sorting_fileds: {
            type: "object",
            properties: {
              popularity: {
                type: "integer",
                index: false,
              },
              release_date: {
                type: "date",
                index: false,
              },
            },
          },
          results: {
            type: "object",
            properties: {
              en: {
                type: "object",
                properties: {
                  name: {
                    type: "text",
                    index: false,
                  },
                  description: {
                    type: "text",
                    index: false,
                  },
                },
              },
              ko: {
                type: "object",
                properties: {
                  name: {
                    type: "text",
                    index: false,
                  },
                  description: {
                    type: "text",
                    index: false,
                  },
                },
              },
              poster_image: {
                type: "text",
                index: false,
              },
              release_date: {
                type: "date",
                index: false,
              },
              title_status: {
                type: "text",
                index: false,
              },
              weekly_telecast: {
                type: "text",
                index: false,
              },
            },
          },
          search: {
            type: "object",
            properties: {
              aka: {
                type: "text",
                index: true,
              },
              keywords: {
                type: "text",
                index: true,
              },
              name_en: {
                type: "text",
                index: true,
              },
              name_ko: {
                type: "text",
                index: true,
              },
            },
          },
          type: {
            type: "text",
            index: true,
          },
          uuid: {
            type: "text",
            index: false,
          },
        };
      } else if (type == "tag") {
        properties = {
          id: {
            type: "long",
            index: true,
          },
          type: {
            type: "text",
            index: true,
          },
          sorting_fileds: {
            type: "object",
            properties: {
              name_en: {
                type: "keyword",
              },
              name_ko: {
                type: "keyword",
              },
            },
          },
          results: {
            type: "object",
            properties: {
              en: {
                type: "object",
                properties: {
                  name: {
                    type: "text",
                    index: false,
                  },
                },
              },
              ko: {
                type: "object",
                properties: {
                  name: {
                    type: "text",
                    index: false,
                  },
                },
              },
            },
          },
          search: {
            type: "object",
            properties: {
              name_en: {
                type: "text",
                index: true,
              },
              name_ko: {
                type: "text",
                index: true,
              },
            },
          },
        };
      } else if (type == "company") {
        properties = {
          id: {
            type: "long",
            index: true,
          },
          sorting_fileds: {
            type: "object",
            properties: {
              name_en: {
                type: "keyword",
              },
              name_ko: {
                type: "keyword",
              },
            },
          },
          results: {
            type: "object",
            properties: {
              en: {
                type: "object",
                properties: {
                  name: {
                    type: "text",
                    index: false,
                  },
                },
              },
              ko: {
                type: "object",
                properties: {
                  name: {
                    type: "text",
                    index: false,
                  },
                },
              },
            },
          },
          search: {
            type: "object",
            properties: {
              name_en: {
                type: "text",
                index: true,
              },
              name_ko: {
                type: "text",
                index: true,
              },
            },
          },
        };
      } else if (type == "award") {
        properties = {
          id: {
            type: "long",
            index: true,
          },
          sorting_fileds: {
            type: "object",
            properties: {
              name_en: {
                type: "keyword",
              },
              name_ko: {
                type: "keyword",
              },
            },
          },
          results: {
            type: "object",
            properties: {
              en: {
                type: "object",
                properties: {
                  name: {
                    type: "text",
                    index: false,
                  },
                  description: {
                    type: "text",
                    index: false,
                  },
                },
              },
              ko: {
                type: "object",
                properties: {
                  name: {
                    type: "text",
                    index: false,
                  },
                  description: {
                    type: "text",
                    index: false,
                  },
                },
              },
              poster_image: {
                type: "text",
                index: false,
              },
              date: {
                type: "date",
                index: false,
              },
            },
          },
          search: {
            type: "object",
            properties: {
              name_en: {
                type: "text",
                index: true,
              },
              name_ko: {
                type: "text",
                index: true,
              },
            },
          },
          uuid: {
            type: "text",
            index: false,
          },
        };
      } else if (type == "video") {
        properties = {
          id: {
            type: "long",
            index: true,
          },
          sorting_fileds: {
            type: "object",
            properties: {
              popularity: {
                type: "integer",
                index: false,
              },
              registration_date: {
                type: "date",
                index: false,
              },
            },
          },
          results: {
            type: "object",
            properties: {
              en: {
                type: "object",
                properties: {
                  name: {
                    type: "text",
                    index: false,
                  },
                  title_name: {
                    type: "text",
                    index: false,
                  },
                },
              },
              ko: {
                type: "object",
                properties: {
                  name: {
                    type: "text",
                    index: false,
                  },
                  title_name: {
                    type: "text",
                    index: false,
                  },
                },
              },
              video_path: {
                type: "text",
                index: false,
              },
              video_source: {
                type: "text",
                index: false,
              },
              video_for: {
                type: "text",
                index: false,
              },
              registration_date: {
                type: "date",
                index: false,
              },
              item_id: {
                type: "long",
                index: false,
              },
            },
          },
          search: {
            type: "object",
            properties: {
              name_en: {
                type: "text",
                index: true,
              },
              name_ko: {
                type: "text",
                index: true,
              },
            },
          },
        };
      }

      // 2. Check for index is already created or not - If not created -> create an index
      const checkIndex = await searchClient.indices.exists({ index: indexName });
      let indexCreated = false;
      if (!checkIndex) {
        const resData = await createIndices(indexName, properties);
        indexCreated = resData && resData.status == "success" ? true : false;
      } else {
        indexCreated = true;
      }
      // 3.add/update document based on id-type-action
      if (indexCreated) {
        if (action == "add") {
          if (type == "movie") {
            return await addNewMovieDocument(id, indexName);
          }

          if (type == "tv") {
            return await addNewTvDocument(id, indexName);
          }

          if (type == "webtoons") {
            return await addNewWebtoonsDocument(id, indexName);
          }

          if (type == "people") {
            return await addNewPeopleDocument(id, indexName);
          }

          if (type == "tag") {
            return await addNewTagDocument(id, indexName);
          }

          if (type == "company") {
            return await addNewCompanyDocument(id, indexName);
          }

          if (type == "award") {
            return await addNewAwardDocument(id, indexName);
          }

          if (type == "video") {
            return await addNewVideoDocument(id, indexName);
          }
        } else if (action == "edit") {
          await deleteDocument(id, indexName);
          if (type == "movie") {
            return await addNewMovieDocument(id, indexName);
          }

          if (type == "tv") {
            return await addNewTvDocument(id, indexName);
          }

          if (type == "webtoons") {
            return await addNewWebtoonsDocument(id, indexName);
          }

          if (type == "people") {
            return await addNewPeopleDocument(id, indexName);
          }

          if (type == "tag") {
            return await addNewTagDocument(id, indexName);
          }

          if (type == "company") {
            return await addNewCompanyDocument(id, indexName);
          }

          if (type == "award") {
            return await addNewAwardDocument(id, indexName);
          }

          if (type == "video") {
            return await addNewVideoDocument(id, indexName);
          }
        } else {
          return { status: "error", message: "Error-invalid action" };
        }
      } else {
        return { status: "error", message: "Error in index creation" };
      }
    } else {
      return { status: "error", message: "type is required" };
    }
  } catch (error) {
    console.log("Error:", error);
    return { status: "sys_error", message: error };
  }
};
