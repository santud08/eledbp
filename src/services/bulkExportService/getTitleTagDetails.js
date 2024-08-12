import model from "../../models/index.js";
import { paginationService } from "../../services/index.js";

export const getTitleTagDetails = async (titleId, siteLanguage) => {
  let tagResult = [];
  let genreResponseDetails = [];
  let tagResponseDetails = [];

  const searchParams = {
    distinct: true,
    raw: false,
  };
  const condition = {
    status: "active",
  };
  const attributes = ["id", "name", "tag_main_category_id", "type"];
  const modelName = model.tag;

  const titleTagData = await model.tagGable.findAll({
    where: { taggable_id: titleId, site_language: siteLanguage, status: "active" },
  });
  if (titleTagData) {
    for (const taggable of titleTagData) {
      const includeQuery = [
        {
          model: model.tagTranslation,
          attributes: ["display_name"],
          left: true,
          where: {
            tag_id: taggable.tag_id,
            site_language: siteLanguage,
            status: "active",
          },
          required: true,
        },
        {
          model: model.tagCategory,
          attributes: ["id", "slug_name"],
          include: [
            {
              model: model.tagCategoryTranslation,
              attributes: ["category_name"],
              left: true,
              where: {
                site_language: siteLanguage,
                status: "active",
              },
              required: true,
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

  // Get parent category
  let getParentCategoryList = [];
  const getParentCategory = await model.tagCategory.findAll({
    attributes: ["id", "slug_name", "tag_catgeory_type"],
    where: { parent_id: 0, status: "active" },
    include: [
      {
        model: model.tagCategoryTranslation,
        left: true,
        attributes: ["category_name", "tag_category_id"],
        where: { site_language: siteLanguage, status: "active" },
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
  return getParentCategoryList;
};
