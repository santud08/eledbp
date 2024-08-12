import model from "../../models/index.js";
import { fn, col, Sequelize } from "sequelize";
import { envs } from "../../config/index.js";
import { generalHelper } from "../../helpers/index.js";

export const getPeopleXlsBulkExportData = async (primary_id, language = "ko", type) => {
  try {
    let getPeopleDataEn = {};
    let getPeopleDataKo = {};
    let getJobList = [];
    let getSearchKeywordList = [];
    let getNewsKeywordList = [];
    let getCountryList = [];
    let getVideoList = [];
    let getImageList = [];
    let koAKA = "";
    let enAKA = "";
    if (type === "basic") {
      const peopleData = await model.people.findOne({
        attributes: [
          "id",
          "gender",
          "birth_date",
          "death_date",
          "imdb_id",
          "tiving_id",
          "tmdb_id",
          "kobis_id",
          "odk_id",
          "official_site",
          "facebook_link",
          "instagram_link",
          "twitter_link",
        ],
        include: [
          {
            model: model.peopleTranslation,
            attributes: [
              "people_id",
              "name",
              ["description", "summery"],
              ["known_for", "aka"],
              "site_language",
            ],
            left: true,
            where: { status: "active" },
            required: false,
          },
        ],
        where: {
          id: primary_id,
          status: "active",
        },
        order: [["id", "DESC"]],
      });

      const people = JSON.parse(JSON.stringify(peopleData));
      if (people && people.peopleTranslations && people.peopleTranslations.length > 0) {
        let enData = {};
        let koData = {};
        for (const eachRow of people.peopleTranslations) {
          if (eachRow) {
            if (eachRow.site_language === "en") {
              enAKA = eachRow.aka && eachRow.aka !== "" ? eachRow.aka : "";
              enData = {
                name: eachRow.name && eachRow.name !== "" ? eachRow.name : "",
                summery: eachRow.summery && eachRow.summery !== "" ? eachRow.summery : "",
              };
            } else if (eachRow.site_language === "ko") {
              koAKA = eachRow.aka && eachRow.aka !== "" ? eachRow.aka : "";
              koData = {
                name: eachRow.name && eachRow.name !== "" ? eachRow.name : "",
                summery: eachRow.summery && eachRow.summery !== "" ? eachRow.summery : "",
              };
            }
          }
        }
        if (Object.keys(enData).length > 0) {
          getPeopleDataEn = enData;
        } else {
          getPeopleDataEn = {
            name: "",
            summery: "",
          };
        }
        // check ko data  is empty or not
        if (Object.keys(koData).length > 0) {
          getPeopleDataKo = koData;
        } else {
          getPeopleDataKo = {
            name: "",
            summery: "",
          };
        }
      }

      const jobData = await model.peopleJobs.findAll({
        attributes: [],
        where: {
          people_id: primary_id,
          status: "active",
        },
        include: [
          {
            model: model.department,
            left: true,
            attributes: ["id"],
            where: { status: "active" },
            required: true,
            include: {
              model: model.departmentTranslation,
              attributes: ["department_id", "department_name", "site_language"],
              left: true,
              where: { status: "active" },
              required: true,
              separate: true,
              order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
            },
          },
        ],
      });

      if (jobData && jobData.length > 0) {
        for (const eachRow of jobData) {
          if (
            eachRow &&
            eachRow.department &&
            eachRow.department.dataValues.departmentTranslations &&
            eachRow.department.dataValues.departmentTranslations.length > 0
          ) {
            getJobList.push(
              eachRow.department.dataValues.departmentTranslations[0].dataValues.department_name
                ? eachRow.department.dataValues.departmentTranslations[0].dataValues.department_name
                : "",
            );
          }
        }
      }

      //search keywords

      const searchKeyword = await model.peopleKeywords.findAll({
        attributes: ["id", "keyword", "site_language"],
        where: {
          people_id: primary_id,
          keyword_type: "search",
          status: "active",
        },
        separate: true,
        order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
      });

      if (searchKeyword && searchKeyword.length > 0) {
        for (const eachRow of searchKeyword) {
          getSearchKeywordList.push(eachRow.dataValues.keyword ? eachRow.dataValues.keyword : "");
        }
      }

      //news keywords
      const newsKeyword = await model.peopleKeywords.findAll({
        attributes: ["id", "keyword", "site_language"],
        where: {
          people_id: primary_id,
          keyword_type: "news",
          status: "active",
        },
        separate: true,
        order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
      });

      if (newsKeyword && newsKeyword.length > 0) {
        for (const eachRow of newsKeyword) {
          getNewsKeywordList.push(eachRow.dataValues.keyword ? eachRow.dataValues.keyword : "");
        }
      }

      // Get Country List
      const swipLanguage = await generalHelper.swipeLanguage(language);
      const countryList = await model.peopleCountries.findAll({
        attributes: [
          [
            Sequelize.fn(
              "IFNULL",
              fn(
                "getCountryTranslateName",
                Sequelize.fn("IFNULL", Sequelize.col("country.id"), ""),
                language,
              ),
              fn(
                "getCountryTranslateName",
                Sequelize.fn("IFNULL", Sequelize.col("country.id"), ""),
                swipLanguage,
              ),
            ),
            "country_name",
          ],
        ],
        where: { people_id: primary_id, status: "active" },
        left: true,
        required: true,
        include: [
          {
            model: model.country,
            left: true,
            attributes: [],
            where: { status: "active" },
          },
        ],
        group: ["peopleCountries.country_id"],
      });
      if (countryList.length > 0) {
        for (const eachRow of countryList) {
          getCountryList.push(
            eachRow.dataValues.country_name ? eachRow.dataValues.country_name : "",
          );
        }
      }

      return {
        type: "people",
        id: primary_id,
        imdb_id: people.imdb_id || "",
        tiving_id: people.tiving_id || "",
        tmdb_id: people.tmdb_id || "",
        kobis_id: people.kobis_id || "",
        odk_id: people.odk_id || "",
        name_en: getPeopleDataEn.name || "",
        name_ko: getPeopleDataKo.name || "",
        aka: koAKA || enAKA || "",
        summary_en: getPeopleDataEn.summery || "",
        summary_ko: getPeopleDataKo.summery || "",
        official_site: people.official_site || "",
        facebook_link: people.facebook_link || "",
        instagram_link: people.instagram_link || "",
        twitter_link: people.twitter_link || "",
        gender: people.gender || "",
        birth_date: people.birth_date || "",
        death_date: people.death_date || "",
        job: getJobList.join(",") || "",
        country: getCountryList.join(",") || "",
        search_keywords: getSearchKeywordList.join(",") || "",
        news_search_keywords: getNewsKeywordList.join(",") || "",
      };
    } else if (type === "media_video") {
      const video = await model.video.findAll({
        attributes: [
          "id",
          ["name", "video_title"],
          [fn("REPLACE", col("url"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "video_url"],
          "is_official_trailer",
          "site_language",
        ],
        where: { title_id: primary_id, status: "active", video_for: "people" },
        separate: true,
        order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
      });

      if (video && video.length > 0) {
        for (const eachRow of video) {
          getVideoList.push({
            id: primary_id,
            video_title: eachRow.dataValues.video_title ? eachRow.dataValues.video_title : "",
            video_url: eachRow.dataValues.video_url ? eachRow.dataValues.video_url : "",
            is_official_trailer: eachRow.dataValues.is_official_trailer
              ? eachRow.dataValues.is_official_trailer
              : "",
          });
        }
      }
      return getVideoList;
    } else if (type === "media_image") {
      // Get images list
      const images = await model.peopleImages.findAll({
        attributes: [
          "id",
          "original_name",
          "file_name",
          [
            fn("REPLACE", col("peopleImages.path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`),
            "path",
          ],
          "file_size",
          "mime_type",
          "image_category",
          "site_language",
        ],
        left: true,
        where: {
          people_id: primary_id,
          status: "active",
        },
        separate: true,
        order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
      });

      if (images && images.length > 0) {
        for (const eachRow of images) {
          getImageList.push({
            id: primary_id,
            original_name: eachRow.dataValues.original_name ? eachRow.dataValues.original_name : "",
            file_name: eachRow.dataValues.file_name ? eachRow.dataValues.file_name : "",
            path: eachRow.dataValues.path ? eachRow.dataValues.path : "",
            file_size: eachRow.dataValues.file_size ? eachRow.dataValues.file_size : "",
            mime_type: eachRow.dataValues.mime_type ? eachRow.dataValues.mime_type : "",
            image_category: eachRow.dataValues.image_category
              ? eachRow.dataValues.image_category
              : "",
          });
        }
      }
      return getImageList;
    }
  } catch (error) {
    return { data: {} };
  }
};
