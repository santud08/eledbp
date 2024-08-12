import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";
import { paginationService } from "../../../services/index.js";

/**
 * editTagRequestList
 * @param req
 * @param res
 */
export const editTagRequestList = async (req, res, next) => {
  try {
    const userId = req.userDetails.userId;
    // check for user existance in user table
    const isExists = await model.user.findOne({ where: { id: userId } });
    if (!isExists) throw StatusError.badRequest(res.__("user is not registered"));

    const requestId = req.body.draft_request_id ? req.body.draft_request_id : "";
    const siteLanguage = req.body.site_language;
    let genreResponseDetails = [];
    let tagResponseDetails = [];

    const titleId = req.body.title_id ? req.body.title_id : "";
    // find relation id
    let getRelationData = {};
    if (requestId) {
      getRelationData = await model.titleRequestPrimaryDetails.findOne({
        where: {
          id: requestId,
          record_status: "active",
        },
      });
    }
    const relationId =
      getRelationData && getRelationData.relation_id ? getRelationData.relation_id : "";

    // find requestId is present in request table
    const findTagRequest = await model.titleRequestTag.findOne({
      where: {
        request_id: requestId,
        status: "active",
      },
    });
    if (findTagRequest) {
      // getting data for tag_id from people and people translation table
      let tagResult = [];
      const searchParams = {
        distinct: true,
        raw: false,
      };

      const attributes = ["id", "name", "tag_main_category_id"];
      const modelName = model.tag;
      // genre details list :
      const genreList =
        findTagRequest.genre_details != null ? JSON.parse(findTagRequest.genre_details) : null;

      if (genreList != null && genreList.list.length > 0) {
        for (const genreDetails of genreList.list) {
          const includeQuery = [
            {
              model: model.tagTranslation,
              attributes: ["tag_id", "display_name", "site_language"],
              left: true,
              where: {
                status: "active",
              },
              required: false,
              separate: true,
              order: [["site_language", siteLanguage == "ko" ? "DESC" : "ASC"]],
            },
            {
              model: model.tagCategory,
              attributes: ["id", "slug_name"],
              include: [
                {
                  model: model.tagCategoryTranslation,
                  attributes: ["tag_category_id", "category_name", "site_language"],
                  left: true,
                  where: {
                    status: "active",
                  },
                  required: false,
                  separate: true,
                  order: [["site_language", siteLanguage == "ko" ? "DESC" : "ASC"]],
                },
              ],
              left: true,
              where: {
                parent_id: 0,
                status: "active",
              },
              required: true,
            },
          ];
          const condition = {
            status: "active",
            id: genreDetails.tag_id,
          };
          tagResult = await paginationService.pagination(
            searchParams,
            modelName,
            includeQuery,
            condition,
            attributes,
          );

          for (const element of tagResult.rows) {
            if (element) {
              const data = {
                id: genreDetails.id,
                tag_id: element.id,
                score: genreDetails.score,
                display_name:
                  element.tagTranslations && element.tagTranslations[0]
                    ? element.tagTranslations[0].display_name
                    : "",
                category_id:
                  element.tagCategory && element.tagCategory.id ? element.tagCategory.id : "",
              };
              genreResponseDetails.push(data);
            }
          }
        }
      }

      // fetching the tag details :
      const tagList =
        findTagRequest.tag_details != null ? JSON.parse(findTagRequest.tag_details) : null;

      if (tagList != null && tagList.list.length > 0) {
        for (const tagDetails of tagList.list) {
          const includeQuery = [
            {
              model: model.tagTranslation,
              attributes: ["tag_id", "display_name", "site_language"],
              left: true,
              where: {
                status: "active",
              },
              required: false,
              separate: true,
              order: [["site_language", siteLanguage == "ko" ? "DESC" : "ASC"]],
            },
            {
              model: model.tagCategory,
              attributes: ["id", "slug_name"],
              include: [
                {
                  model: model.tagCategoryTranslation,
                  attributes: ["tag_category_id", "category_name", "site_language"],
                  left: true,
                  where: {
                    status: "active",
                  },
                  required: false,
                  separate: true,
                  order: [["site_language", siteLanguage == "ko" ? "DESC" : "ASC"]],
                },
              ],
              left: true,
              where: {
                parent_id: 0,
                status: "active",
              },
              required: true,
            },
          ];
          const condition = {
            status: "active",
            id: tagDetails.tag_id,
          };
          tagResult = await paginationService.pagination(
            searchParams,
            modelName,
            includeQuery,
            condition,
            attributes,
          );
          for (const element of tagResult.rows) {
            if (element) {
              const data = {
                id: tagDetails.id,
                tag_id: element.id,
                score: tagDetails.score,
                display_name:
                  element.tagTranslations && element.tagTranslations[0]
                    ? element.tagTranslations[0].display_name
                    : "",
                category_id:
                  element.tagCategory && element.tagCategory.id ? element.tagCategory.id : "",
              };
              tagResponseDetails.push(data);
            }
          }
        }
      }
    } else if (titleId) {
      // getting data for tag_id from people and people translation table
      let tagResult = [];
      const searchParams = {
        distinct: true,
        raw: false,
      };

      const attributes = ["id", "name", "tag_main_category_id", "type"];
      const modelName = model.tag;

      const titleTagData = await model.tagGable.findAll({
        where: {
          taggable_id: titleId,
          status: "active",
        },
      });
      if (titleTagData) {
        for (const taggable of titleTagData) {
          const includeQuery = [
            {
              model: model.tagTranslation,
              attributes: ["tag_id", "display_name", "site_language"],
              left: true,
              where: {
                status: "active",
              },
              required: false,
              separate: true,
              order: [["site_language", siteLanguage == "ko" ? "DESC" : "ASC"]],
            },
            {
              model: model.tagCategory,
              attributes: ["id", "slug_name"],
              include: [
                {
                  model: model.tagCategoryTranslation,
                  attributes: ["tag_category_id", "category_name", "site_language"],
                  left: true,
                  where: {
                    status: "active",
                  },
                  required: false,
                  separate: true,
                  order: [["site_language", siteLanguage == "ko" ? "DESC" : "ASC"]],
                },
              ],
              left: true,
              where: {
                parent_id: 0,
                status: "active",
              },
              required: true,
            },
          ];
          const condition = {
            status: "active",
            id: taggable.tag_id,
          };

          tagResult = await paginationService.pagination(
            searchParams,
            modelName,
            includeQuery,
            condition,
            attributes,
          );
          for (let element of tagResult.rows) {
            if (element) {
              if (element.type == "genre") {
                let data = {
                  id: taggable.id,
                  tag_id: element.id,
                  score: taggable.score,
                  display_name:
                    element.tagTranslations && element.tagTranslations[0]
                      ? element.tagTranslations[0].display_name
                      : "",
                  category_id:
                    element.tagCategory && element.tagCategory.id ? element.tagCategory.id : "",
                };
                genreResponseDetails.push(data);
              } else {
                const data = {
                  id: taggable.id,
                  tag_id: element.id,
                  score: taggable.score,
                  display_name:
                    element.tagTranslations && element.tagTranslations[0]
                      ? element.tagTranslations[0].display_name
                      : "",
                  category_id:
                    element.tagCategory && element.tagCategory.id ? element.tagCategory.id : "",
                };
                tagResponseDetails.push(data);
              }
            }
          }
        }
      }
    }
    // Get parent category
    let getParentCategoryList = [];
    const getParentCategory = await model.tagCategory.findAll({
      attributes: ["id", "slug_name", "tag_catgeory_type"],
      where: { parent_id: 0, status: "active" },
      include: [
        {
          model: model.tagCategoryTranslation,
          left: true,
          attributes: ["category_name", "tag_category_id", "site_language"],
          where: {
            status: "active",
          },
          required: false,
          separate: true,
          order: [["site_language", siteLanguage == "ko" ? "DESC" : "ASC"]],
        },
      ],
    });
    if (getParentCategory) {
      for (const eachRow of getParentCategory) {
        if (eachRow) {
          const parentId = eachRow.id ? eachRow.id : "";
          const slugName = eachRow.slug_name ? eachRow.slug_name : "";
          const categoryName = eachRow.tagCategoryTranslations[0].category_name
            ? eachRow.tagCategoryTranslations[0].category_name
            : "";
          if (slugName == "genre") {
            const genRecord = {
              category_id: parentId,
              category_name: categoryName,
              type: slugName,
            };
            let eachGenTags = [];
            for (const eachGenTag of genreResponseDetails) {
              if (eachGenTag && eachGenTag.category_id) {
                eachGenTags.push({
                  id: eachGenTag.id,
                  tag_id: eachGenTag.tag_id,
                  score: eachGenTag.score,
                  display_name: eachGenTag.display_name,
                });
              }
            }
            genRecord.tags = eachGenTags;
            getParentCategoryList.push(genRecord);
          } else {
            const record = {
              category_id: parentId,
              category_name: categoryName,
              type: "",
            };
            let eachTags = [];
            for (const eachTag of tagResponseDetails) {
              if (eachTag && eachTag.category_id && eachTag.category_id == parentId) {
                eachTags.push({
                  id: eachTag.id,
                  tag_id: eachTag.tag_id,
                  score: eachTag.score,
                  display_name: eachTag.display_name,
                });
              }
            }
            record.tags = eachTags;
            getParentCategoryList.push(record);
          }
        }
      }
    }
    res.ok({
      draft_relation_id: relationId,
      draft_request_id: requestId,
      draft_tag_id: findTagRequest && findTagRequest.id ? findTagRequest.id : "",
      results: getParentCategoryList,
    });
  } catch (error) {
    next(error);
  }
};
