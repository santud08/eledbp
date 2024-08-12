import model from "../../../models/index.js";
import { Op } from "sequelize";
import xlsx from "xlsx";
import { customDateTimeHelper, generalHelper } from "../../../helpers/index.js";

/**
 * tagAddManually
 * used for developer purpose to update the data
 * only run when its required with proper information
 * @param req
 * @param res
 */
export const tagAddManually = async (req, res, next) => {
  try {
    // Reading our test file
    const file = xlsx.readFile("./public/download/tags/Tag_Data_Last_updated_20230326.xlsx");

    let excelData = [];
    const userId = req.userDetails.userId;
    const sheets = file.SheetNames;
    for (let i = 1; i < sheets.length; i++) {
      excelData = xlsx.utils.sheet_to_json(file.Sheets[file.SheetNames[i]], {
        header: "A",
        raw: false,
      });
    }
    //console.log("excelData", excelData);
    // Printing data

    if (excelData.length > 0) {
      //validate data of type number or string
      let i = 0;
      for (const checkEachRow of excelData) {
        if (i > 0) {
          let mainCategoryId = 0;
          let subCategoryId = 0;
          let tagId = 0;
          const categoryNameEn =
            checkEachRow["B"] && checkEachRow["B"] != null && checkEachRow["B"] != "undefined"
              ? checkEachRow["B"]
              : "";
          const tagCategoryType = categoryNameEn == "genre" ? "predefine" : "custom";
          const categoryNameKo =
            checkEachRow["C"] && checkEachRow["C"] != null && checkEachRow["C"] != "undefined"
              ? checkEachRow["C"]
              : "";

          const subCategoryNameEn =
            checkEachRow["E"] && checkEachRow["E"] != null && checkEachRow["E"] != "undefined"
              ? checkEachRow["E"]
              : "";
          const subCategoryNameKo =
            checkEachRow["F"] && checkEachRow["F"] != null && checkEachRow["F"] != "undefined"
              ? checkEachRow["F"]
              : "";
          tagId =
            checkEachRow["G"] && checkEachRow["G"] != null && checkEachRow["G"] != "undefined"
              ? checkEachRow["G"]
              : 0;
          const tagNameEn =
            checkEachRow["H"] && checkEachRow["H"] != null && checkEachRow["H"] != "undefined"
              ? checkEachRow["H"]
              : "";

          const tagNameKo =
            checkEachRow["I"] && checkEachRow["I"] != null && checkEachRow["I"] != "undefined"
              ? checkEachRow["I"]
              : "";

          console.log("MainCategoryEn==", categoryNameEn);
          console.log("MainCategoryKo==", categoryNameKo);
          //console.log("getSubCategoryId==", getSubCategoryId);
          console.log("getSubCategoryEn==", subCategoryNameEn);
          console.log("getSubCategoryKo==", subCategoryNameKo);
          console.log("getTagId==", tagId);
          console.log("getTagNameEn==", tagNameEn);
          console.log("getTagNameKo==", tagNameKo);

          // Add Parent category if not exist
          const [isExistsMainCategoryName, isExistsMainCategoryNameKo] = await Promise.all([
            model.tagCategory.findOne({
              attributes: ["id", "slug_name"],
              where: { parent_id: 0, status: { [Op.ne]: "deleted" } },
              include: [
                {
                  model: model.tagCategoryTranslation,
                  left: true,
                  attributes: ["category_name", "tag_category_id"],
                  where: {
                    category_name: categoryNameEn,
                    status: { [Op.ne]: "deleted" },
                  },
                },
              ],
            }),
            model.tagCategory.findOne({
              attributes: ["id", "slug_name"],
              where: { parent_id: 0, status: { [Op.ne]: "deleted" } },
              include: [
                {
                  model: model.tagCategoryTranslation,
                  left: true,
                  attributes: ["category_name", "tag_category_id"],
                  where: {
                    category_name: categoryNameKo,
                    status: { [Op.ne]: "deleted" },
                  },
                },
              ],
            }),
          ]);

          if (isExistsMainCategoryName || isExistsMainCategoryNameKo) {
            mainCategoryId =
              isExistsMainCategoryName && isExistsMainCategoryName.id
                ? isExistsMainCategoryName.id
                : isExistsMainCategoryNameKo.id;
          }

          // Insert english parent category name
          if (!isExistsMainCategoryName) {
            // Generate category slug name
            const whl = true;
            let slugName = "";
            let rslug = categoryNameEn;
            let regenarate = false;
            while (whl) {
              const generatedSlug = await generalHelper.generateSlugName(rslug, regenarate);
              // check for slug name existance in tag category table
              const isExists = await model.tagCategory.findOne({
                where: { status: { [Op.ne]: "deleted" }, slug_name: generatedSlug },
                attributes: ["id", "slug_name"],
              });
              if (!isExists) {
                regenarate = false;
                slugName = generatedSlug;
                break;
              } else {
                regenarate = true;
                rslug = generatedSlug;
              }
            }

            const dataCategory = {
              parent_id: 0,
              slug_name: slugName,
              tag_catgeory_type: tagCategoryType,
              created_at: await customDateTimeHelper.getCurrentDateTime(),
              created_by: userId,
            };

            const mainCategoryDetails = await model.tagCategory.create(dataCategory);
            if (mainCategoryDetails && mainCategoryDetails.id) {
              mainCategoryId = mainCategoryDetails.id;
              const dataCategoryTranslation = {
                tag_category_id: mainCategoryId,
                site_language: "en",
                category_name: categoryNameEn,
                created_at: await customDateTimeHelper.getCurrentDateTime(),
                created_by: userId,
              };
              await model.tagCategoryTranslation.create(dataCategoryTranslation);
            }
          }

          // Insert korean parent category name
          if (!isExistsMainCategoryNameKo && mainCategoryId) {
            const dataCategoryTranslation = {
              tag_category_id: mainCategoryId,
              site_language: "ko",
              category_name: categoryNameKo,
              created_at: await customDateTimeHelper.getCurrentDateTime(),
              created_by: userId,
            };
            await model.tagCategoryTranslation.create(dataCategoryTranslation);
          }

          // Main category end

          // Add Sub category if not exist
          const [isExistsSubCategoryName, isExistsSubCategoryNameKo] = await Promise.all([
            model.tagCategory.findOne({
              attributes: ["id", "slug_name"],
              where: { parent_id: mainCategoryId, status: { [Op.ne]: "deleted" } },
              include: [
                {
                  model: model.tagCategoryTranslation,
                  left: true,
                  attributes: ["category_name", "tag_category_id"],
                  where: { category_name: subCategoryNameEn, status: { [Op.ne]: "deleted" } },
                },
              ],
            }),
            model.tagCategory.findOne({
              attributes: ["id", "slug_name"],
              where: { parent_id: mainCategoryId, status: { [Op.ne]: "deleted" } },
              include: [
                {
                  model: model.tagCategoryTranslation,
                  left: true,
                  attributes: ["category_name", "tag_category_id"],
                  where: { category_name: subCategoryNameKo, status: { [Op.ne]: "deleted" } },
                },
              ],
            }),
          ]);

          if (isExistsSubCategoryName || isExistsSubCategoryNameKo) {
            subCategoryId =
              isExistsSubCategoryName && isExistsSubCategoryName.id
                ? isExistsSubCategoryName.id
                : isExistsSubCategoryNameKo.id;
          }

          // Insert english sub category name
          if (!isExistsSubCategoryName) {
            // Generate sub-category slug name
            const wh2 = true;
            let subCategorySlugName = "";
            let rslug2 = subCategoryNameEn;
            let regenarate2 = false;
            while (wh2) {
              const generatedSlug2 = await generalHelper.generateSlugName(rslug2, regenarate2);
              // check for slug name existance in tag category table
              const isExists = await model.tagCategory.findOne({
                where: { status: { [Op.ne]: "deleted" }, slug_name: generatedSlug2 },
                attributes: ["id", "slug_name"],
              });
              if (!isExists) {
                regenarate2 = false;
                subCategorySlugName = generatedSlug2;
                break;
              } else {
                regenarate2 = true;
                rslug2 = generatedSlug2;
              }
            }
            const dataSubCategory = {
              parent_id: mainCategoryId,
              tag_catgeory_type: tagCategoryType,
              slug_name: subCategorySlugName,
              created_at: await customDateTimeHelper.getCurrentDateTime(),
              created_by: userId,
            };
            const subCategoryDetails = await model.tagCategory.create(dataSubCategory);

            if (subCategoryDetails && subCategoryDetails.id) {
              subCategoryId = subCategoryDetails.id;

              const dataSubCategoryTranslation = {
                tag_category_id: subCategoryId,
                site_language: "en",
                category_name: subCategoryNameEn,
                created_at: await customDateTimeHelper.getCurrentDateTime(),
                created_by: userId,
              };
              await model.tagCategoryTranslation.create(dataSubCategoryTranslation);
            }
          }

          // Insert korean sub category name
          if (!isExistsSubCategoryNameKo && subCategoryId) {
            const dataSubCategoryTranslation = {
              tag_category_id: subCategoryId,
              site_language: "ko",
              category_name: subCategoryNameKo,
              created_at: await customDateTimeHelper.getCurrentDateTime(),
              created_by: userId,
            };
            await model.tagCategoryTranslation.create(dataSubCategoryTranslation);
          }

          // End subcategory

          // check for tag name existance in tag table
          const [isExistsTagName, isExistsTagNameKo] = await Promise.all([
            model.tag.findOne({
              attributes: ["id"],
              where: {
                id: tagId,
                tag_main_category_id: mainCategoryId,
                tag_category_id: subCategoryId,
                status: { [Op.ne]: "deleted" },
              },
              include: [
                {
                  model: model.tagTranslation,
                  attributes: ["tag_id"],
                  left: true,
                  where: {
                    display_name: tagNameEn,
                    status: { [Op.ne]: "deleted" },
                  },
                },
              ],
            }),
            model.tag.findOne({
              attributes: ["id"],
              where: {
                id: tagId,
                tag_main_category_id: mainCategoryId,
                tag_category_id: subCategoryId,
                status: { [Op.ne]: "deleted" },
              },
              include: [
                {
                  model: model.tagTranslation,
                  attributes: ["tag_id"],
                  left: true,
                  where: {
                    display_name: tagNameKo,
                    status: { [Op.ne]: "deleted" },
                  },
                },
              ],
            }),
          ]);

          const getCategory = await model.tagCategory.findOne({
            attributes: ["id", "slug_name", "tag_catgeory_type"],
            where: { id: mainCategoryId, status: { [Op.ne]: "deleted" } },
          });
          if (isExistsTagName || isExistsTagNameKo) {
            tagId =
              isExistsTagName && isExistsTagName.id ? isExistsTagName.id : isExistsTagNameKo.id;
          }

          // Insert english tag name
          if (!isExistsTagName) {
            // tag table type Value
            const tagType = tagCategoryType == "predefine" ? getCategory.slug_name : "custom";

            let dataTag = {
              name: tagNameEn,
              display_name: tagNameEn,
              type: tagType,
              tag_category_id: subCategoryId,
              tag_main_category_id: mainCategoryId,
              created_at: await customDateTimeHelper.getCurrentDateTime(),
              created_by: userId,
            };
            if (tagId) dataTag.id = tagId;
            const tagDetails = await model.tag.create(dataTag);
            if (tagDetails && tagDetails.id) {
              tagId = tagDetails.id;

              const dataTagTranslation = {
                tag_id: tagId,
                site_language: "en",
                display_name: tagNameEn,
                created_at: await customDateTimeHelper.getCurrentDateTime(),
                created_by: userId,
              };
              await model.tagTranslation.create(dataTagTranslation);
            }
          }

          // Insert korean tag name
          if (!isExistsTagNameKo && tagId) {
            const dataTagTranslation = {
              tag_id: tagId,
              site_language: "ko",
              display_name: tagNameKo,
              created_at: await customDateTimeHelper.getCurrentDateTime(),
              created_by: userId,
            };
            await model.tagTranslation.create(dataTagTranslation);
          }
        }
        i++;
      }
    }
    res.ok({ message: res.__("success") });
  } catch (error) {
    next(error);
  }
};
