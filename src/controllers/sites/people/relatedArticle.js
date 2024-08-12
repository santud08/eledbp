import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
import { zapzeeService } from "../../../services/index.js";
import { PAGINATION_LIMIT, ZAPZEE_APIS } from "../../../utils/constants.js";
import { generalHelper } from "../../../helpers/index.js";

/**
 * relatedArticle
 * @param req
 * @param res
 */
export const relatedArticle = async (req, res, next) => {
  try {
    const reqBody = req.query;
    if (!reqBody.person_id && reqBody.person_id == "undefined") {
      throw StatusError.badRequest(res.__("Invalid people id"));
    }
    const peopleId = reqBody.person_id; //It will be people id
    const defautlPageNo = 1;
    const page = reqBody.page ? reqBody.page : defautlPageNo;
    const limit = reqBody.limit ? reqBody.limit : PAGINATION_LIMIT;

    let resultData = [];

    let language = req.accept_language;

    const getInformations = await model.people.findOne({
      where: { id: peopleId, status: "active" },
    });

    if (!getInformations) throw StatusError.badRequest(res.__("Invalid people id"));

    // Get Related Articles section data
    // Get the News search keyword
    let keywords = await getInformationsMethod(peopleId, language);
    let newsKeyWords = [];
    if (keywords) {
      for (const eachRow of keywords) {
        if (eachRow) {
          const name = eachRow.keyword ? eachRow.keyword : "";
          if (name) {
            newsKeyWords.push(name);
          }
        }
      }
    }

    let articleList = [];
    if (
      newsKeyWords &&
      newsKeyWords != null &&
      newsKeyWords != "undefined" &&
      newsKeyWords.length > 0
    ) {
      resultData = await zapzeeService.fetchSearchFeed(`"${newsKeyWords.toString()}"`);
    }

    if (resultData && resultData.length > 0) {
      articleList = resultData.slice(page - 1, limit);
      let list = [];
      for (const eachRow of articleList) {
        if (eachRow) {
          const getCategory = eachRow.category ? eachRow.category : "";
          const shortDescriptions = eachRow.description ? eachRow.description.slice(0, 100) : "";
          const record = {
            id: eachRow.id ? eachRow.id : "",
            title: eachRow.title ? eachRow.title : "",
            category: getCategory ? getCategory.shift() : "",
            creator_name: eachRow.creator_name ? eachRow.creator_name : "",
            short_descriptions: shortDescriptions ? shortDescriptions : "",
            publish_date: eachRow.published_date ? eachRow.published_date : "",
            image:
              eachRow.list_image && (await generalHelper.isImageURL(eachRow.list_image))
                ? eachRow.list_image
                : await generalHelper.generateImageUrl(req, "zapzee_n.png"),
            slug: eachRow.slug ? eachRow.slug : "",
          };
          list.push(record);
        }
      }
      articleList = list;
    }

    //ZapZee details page link
    let zapzeeLink = ZAPZEE_APIS.MORE_SEARCH_PAGE_URL;
    if (newsKeyWords) {
      zapzeeLink = `${zapzeeLink}${newsKeyWords.toString()}`;
    }

    if (resultData && resultData.length == 0) {
      zapzeeLink = "";
    }
    res.ok({
      page: page,
      limit: limit,
      total_records: resultData.length,
      total_pages: resultData.length > 0 ? Math.ceil(resultData.length / limit) : 0,
      results: articleList,
      related_articles_details_url: zapzeeLink,
    });
  } catch (error) {
    next(error);
  }
};

const getInformationsMethod = async (peopleId, language) => {
  return await model.peopleKeywords.findAll({
    where: {
      people_id: peopleId,
      keyword_type: "news",
      status: "active",
    },
    separate: true,
    order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
    attributes: ["id", "keyword", "site_language"],
  });
};
