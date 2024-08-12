import model from "../../models/index.js";
import { envs } from "../../config/index.js";
import { fn, col } from "sequelize";

/**
 * otherTitleData
 * @param titleId
 * @param titleType
 * @param language
 */

export const otherTitleData = async (titleId, titleType, language = "en") => {
  try {
    let otherDataResposnse = {};
    let titleDetails = {};
    let getSearchKeywordList = [],
      getNewsSearchKeywordList = [],
      getReReleaseDateList = [],
      getOriginalWorkList = [],
      getConnectionList = [];
    const titleValid = await model.title.findOne({
      where: {
        id: titleId,
        type: titleType,
        record_status: "active",
      },
    });
    if (titleValid) {
      // Get the details from the Title - Check for tmdb and kobis id in title
      let dbTitleInformation = await model.title.findOne({
        attributes: [
          "id",
          "tiving_id",
          "odk_id",
          "kobis_id",
          "is_rerelease",
          "footfalls",
          "rating",
        ],
        include: [
          {
            model: model.titleTranslation,
            attributes: ["name", "aka", "plot_summary", "description"],
            left: true,
            where: { status: "active" },
          },
        ],
        where: {
          id: titleId,
          record_status: "active",
          type: titleType,
        },
      });
      if (dbTitleInformation) {
        // language dependent fields:
        // Get the details from the Title - Check for tmdb and kobis id in title
        const [dbTitleLangDependentInfo, keywords, reReleaseDate, getOriginalBy, relatedTitleList] =
          await Promise.all([
            model.title.findOne({
              attributes: ["id"],
              include: [
                {
                  model: model.titleTranslation,
                  attributes: ["plot_summary"],
                  left: true,
                  where: { status: "active", site_language: language },
                },
              ],
              where: {
                id: titleId,
                record_status: "active",
                type: titleType,
              },
            }),
            model.titleKeyword.findAll({
              attributes: ["id", "keyword", "keyword_type"],
              where: {
                title_id: titleId,
                status: "active",
              },
              separate: true,
              order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
            }),
            model.titleReRelease.findAll({
              where: { title_id: titleId, status: "active" },
              attributes: ["id", "re_release_date"],
              order: [["re_release_date", "ASC"]],
            }),
            model.originalWorks.findAll({
              attributes: ["id", "title_id", "ow_type", "ow_title", "ow_original_artis"],
              where: { title_id: titleId, status: "active", site_language: language },
            }),
            model.relatedTitle.findAll({
              attributes: ["id", "related_title_id", "title_id"],
              where: { title_id: titleId, status: "active" },
              include: [
                {
                  model: model.title,
                  attributes: ["id", "record_status"],
                  left: true,
                  where: { record_status: "active" },
                  required: true,
                  include: [
                    {
                      model: model.titleTranslation,
                      left: true,
                      attributes: ["title_id", "name", "site_language"],
                      where: { status: "active" },
                      separate: true,
                      order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
                    },
                    {
                      model: model.titleImage,
                      attributes: [
                        "title_id",
                        "original_name",
                        "file_name",
                        "url",
                        [
                          fn("REPLACE", col("path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`),
                          "path",
                        ],
                      ],
                      left: true,
                      where: {
                        status: "active",
                        image_category: "poster_image",
                        is_main_poster: "y",
                      },
                      separate: true,
                      order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
                      required: false,
                    },
                  ],
                },
              ],
            }),
          ]);
        if (dbTitleLangDependentInfo) {
          if (dbTitleLangDependentInfo.titleTranslations.length > 0) {
            titleDetails.plot_summary = dbTitleLangDependentInfo.titleTranslations[0].plot_summary
              ? dbTitleLangDependentInfo.titleTranslations[0].plot_summary
              : "";
          }
        }

        // Get search  and news search keyword details
        if (keywords) {
          for (const eachValue of keywords) {
            if (eachValue && eachValue.keyword_type == "search") {
              getSearchKeywordList.push(eachValue.keyword);
            } else if (eachValue && eachValue.keyword_type == "news") {
              getNewsSearchKeywordList.push(eachValue.keyword);
            }
          }
        }
        // Get Re-release details
        if (reReleaseDate) {
          for (const value of reReleaseDate) {
            if (value) {
              const record = {
                id: value.id,
                date: value.re_release_date,
              };
              getReReleaseDateList.push(record);
            }
          }
        }
        // Get Original By
        if (getOriginalBy) {
          let list = [];
          for (const eachRow of getOriginalBy) {
            if (eachRow) {
              const id = eachRow.id ? eachRow.id : "";
              const type = eachRow.ow_type ? eachRow.ow_type : "";
              const title = eachRow.ow_title ? eachRow.ow_title : "";
              const artis = eachRow.ow_original_artis ? eachRow.ow_original_artis : "";
              const record = {
                id: id,
                type: type,
                title: title,
                artis: artis,
              };
              list.push(record);
            }
          }
          getOriginalWorkList = list;
        }

        // connection Details
        if (relatedTitleList) {
          let list = [];
          for (const eachRow of relatedTitleList) {
            if (eachRow) {
              const record = {
                id: eachRow.id ? eachRow.id : "",
                title_id:
                  eachRow.title &&
                  eachRow.title.titleTranslations.length > 0 &&
                  eachRow.title.titleTranslations[0].title_id
                    ? eachRow.title.titleTranslations[0].title_id
                    : "",
                title_name:
                  eachRow.title &&
                  eachRow.title.titleTranslations.length > 0 &&
                  eachRow.title.titleTranslations[0].name
                    ? eachRow.title.titleTranslations[0].name
                    : "",
                title_poster:
                  eachRow.title &&
                  eachRow.title.titleImages.length > 0 &&
                  eachRow.title.titleImages[0].path
                    ? eachRow.title.titleImages[0].path
                    : "",
              };
              list.push(record);
            }
          }
          getConnectionList = list;
        }
        otherDataResposnse.tiving_id =
          dbTitleInformation && dbTitleInformation.tiving_id ? dbTitleInformation.tiving_id : "";
        otherDataResposnse.odk_id =
          dbTitleInformation && dbTitleInformation.odk_id ? dbTitleInformation.odk_id : "";
        otherDataResposnse.kobis_id =
          dbTitleInformation && dbTitleInformation.kobis_id ? dbTitleInformation.kobis_id : "";
        otherDataResposnse.plot_summery = titleDetails.plot_summary
          ? titleDetails.plot_summary
          : "";
        otherDataResposnse.search_keyword_details = getSearchKeywordList;
        otherDataResposnse.news_keyword_details = getNewsSearchKeywordList;
        otherDataResposnse.is_rerelease =
          dbTitleInformation && dbTitleInformation.is_rerelease
            ? dbTitleInformation.is_rerelease
            : "";
        otherDataResposnse.re_releasedate = getReReleaseDateList;
        otherDataResposnse.footfalls =
          dbTitleInformation && dbTitleInformation.footfalls ? dbTitleInformation.footfalls : "";
        otherDataResposnse.rating =
          dbTitleInformation && dbTitleInformation.rating ? dbTitleInformation.rating : "";
        otherDataResposnse.getoriginalWork_list = getOriginalWorkList;
        otherDataResposnse.getconnection_list = getConnectionList;
      }
    }
    return otherDataResposnse;
  } catch (e) {
    console.log("error", e);
    return {};
  }
};
