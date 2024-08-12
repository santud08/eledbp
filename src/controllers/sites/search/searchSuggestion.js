import { searchService } from "../../../services/index.js";
import { PAGINATION_LIMIT } from "../../../utils/constants.js";
import { StatusError } from "../../../config/index.js";

/**
 * searchSuggestion
 * @param req
 * @param res
 */
export const searchSuggestion = async (req, res, next) => {
  try {
    const searchText = req.query.search_text ? req.query.search_text.trim() : "";
    const defautlPageNo = 1;
    const page = req.query.page ? req.query.page : defautlPageNo;
    const limit = req.query.limit ? req.query.limit : PAGINATION_LIMIT;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let sortOrder = [];
    let resultData = { count: 0, rows: [] };
    const language = req.accept_language;

    // finding the search_text and listing out all the search related data
    if (searchText) {
      const indexName = "search-*";
      sortOrder.push({
        _score: {
          order: "desc",
        },
      });
      const searchQuery = {
        bool: {
          must: {
            multi_match: {
              query: `${searchText}`,
              fields: ["search.name_en^3", "search.name_ko^3"],
            },
          },
        },
      };
      const searchData = await searchService.getSearchData(
        indexName,
        offset,
        limit,
        searchQuery,
        sortOrder,
      );

      if (searchData && searchData.status == "success" && searchData.results.count > 0) {
        let searchResult = [];
        resultData.count = searchData.results.count;
        for (const eachRow of searchData.results.rows) {
          if (eachRow && eachRow._source) {
            let getType =
              eachRow._source.type == "tag"
                ? "tags"
                : eachRow._source.type == "company"
                ? "companies"
                : eachRow._source.type;
            getType = getType == "movie" ? "movies" : getType == "tv" ? "tv_shows" : getType;
            let record = {
              title_id: eachRow._source.id,
              title_name: "",
              title_type: getType ? getType : "",
            };
            if (eachRow._source.results) {
              record.title_name =
                eachRow._source.results[`${language}`] &&
                eachRow._source.results[`${language}`]["name"]
                  ? eachRow._source.results[`${language}`]["name"]
                  : "";
            }
            searchResult.push(record);
          }
        }
        resultData.rows = searchResult;
      }

      res.ok({
        page: page,
        limit: limit,
        total_records: resultData.count,
        total_pages: resultData.count > 0 ? Math.ceil(resultData.count / limit) : 0,
        results: resultData.rows,
      });
    } else {
      throw StatusError.badRequest(res.__("invalidInPuts"));
    }
  } catch (error) {
    next(error);
  }
};
