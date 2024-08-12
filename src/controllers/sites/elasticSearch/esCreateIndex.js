import { esService } from "../../../services/index.js";
import { StatusError } from "../../../config/index.js";

/**
 * esCreateIndex
 * @param req
 * @param res
 */

export const esCreateIndex = async (req, res, next) => {
  try {
    const searchIndex = req.body.index_name ? req.body.index_name : "";
    const type = req.body.type ? req.body.type : "";
    if (type) {
      let indexName = "";
      let properties = {};
      if (searchIndex) indexName = searchIndex;
      if (!indexName) indexName = `search-${type}`;
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
              video_thumb: {
                type: "text",
                index: false,
              },
              video_duration: {
                type: "text",
                index: false,
              },
              video_source: {
                type: "text",
                index: false,
              },
              video_for: {
                type: "text",
                index: true,
              },
              registration_date: {
                type: "date",
                index: false,
              },
              item_id: {
                type: "long",
                index: true,
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
      const resData = await esService.createIndices(indexName, properties);
      if (resData && resData.status == "success") {
        res.ok({ message: res.__("index name is created succesfully") });
      } else {
        if (resData.status == "sys_error") {
          throw StatusError.badRequest(res.__("System error"));
        } else {
          throw StatusError.badRequest(res.__(resData.error));
        }
      }
    } else {
      throw StatusError.badRequest(res.__("type is required"));
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};
