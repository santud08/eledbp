import model from "../../../models/index.js";
import { StatusError } from "../../../config/index.js";

/**
 * communityFamousLine
 * @param req
 * @param res
 */
export const communityFamousLine = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const type = reqBody.type; // Type Value will be title/people
    const id = reqBody.id; // id value will be title/people
    let resultData = [];
    let getInformations = [];
    const language = req.accept_language;

    // Check title(movie/tv) is exist
    if (type == "title") {
      getInformations = await model.people.findOne({
        attributes: ["id", "gender", "birth_date"],
        where: { id: id, status: "active" },
      });
    }
    // Check people is exist
    if (type == "people") {
      getInformations = await model.title.findOne({
        attributes: ["id", "type", "record_status"],
        where: { id: id, record_status: "active" },
      });
    }
    if (!getInformations) throw StatusError.badRequest(res.__("Invalid commentable id"));

    if (type == "people") {
      let department = "cast";
      let includeQ = [];
      let isWebtoons = false;
      if (getInformations.type && getInformations.type == "webtoons") {
        department = "character";
        includeQ = [
          {
            model: model.creditableTranslation,
            as: "creditableTranslationOne",
            attributes: ["character_name"],
            left: true,
            where: {
              status: "active",
              site_language: "en",
            },
            required: false,
          },
          {
            model: model.creditableTranslation,
            as: "creditableTranslationOnel",
            attributes: ["character_name"],
            left: true,
            where: {
              status: "active",
              site_language: "ko",
            },
            required: false,
          },
        ];
        isWebtoons = true;
      } else {
        department = "cast";
        includeQ = [
          {
            model: model.people,
            attributes: ["id"],
            left: true,
            where: { status: "active" },
            required: true,
            include: {
              model: model.peopleTranslation,
              attributes: ["name", "site_language"],
              left: true,
              where: { status: "active" },
              required: true,
              separate: true,
              order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
            },
          },
        ];
        isWebtoons = false;
      }
      const getList = await model.creditable.findAll({
        attributes: ["people_id", "id", "character_name"],
        where: {
          creditable_id: id,
          status: "active",
          creditable_type: "title",
          department: department,
        },
        include: includeQ,
        group: isWebtoons ? false : ["people_id"],
      });
      if (getList) {
        let list = [];
        for (const eachRow of getList) {
          if (eachRow) {
            let record = {};
            if (isWebtoons) {
              record = { id: eachRow.id ? eachRow.id : "", name: "" };
              const characterNameEn =
                eachRow.creditableTranslationOne && eachRow.creditableTranslationOne.character_name
                  ? eachRow.creditableTranslationOne.character_name
                  : "";
              const characterNameKo =
                eachRow.creditableTranslationOnel &&
                eachRow.creditableTranslationOnel.character_name
                  ? eachRow.creditableTranslationOnel.character_name
                  : "";
              if (language == "ko") {
                record.name = characterNameKo ? characterNameKo : characterNameEn;
              }
              if (language == "en") {
                record.name = characterNameEn ? characterNameEn : characterNameKo;
              }
            } else {
              record = {
                id: eachRow.people_id ? eachRow.people_id : "",
                name:
                  eachRow.person &&
                  eachRow.person.peopleTranslations[0] &&
                  eachRow.person.peopleTranslations[0].name
                    ? eachRow.person.peopleTranslations[0].name
                    : "",
              };

              if (eachRow.character_name && record.name) {
                record.name = `${record.name} (${eachRow.character_name})`;
              }
              if (eachRow.character_name && record.name == "") {
                record.name = `${eachRow.character_name}`;
              }
            }
            if (record && record.id != "undefined" && record.id != null && record.id > 0)
              list.push(record);
          }
        }
        resultData = list;
      }
    }
    if (type == "title") {
      const getList = await model.creditable.findAll({
        attributes: ["creditable_id", "creditable_type", "people_id", "character_name"],
        where: {
          people_id: id,
          creditable_type: "title",
          status: "active",
        },
        distinct: true,
        group: ["creditable_id"],
        include: [
          {
            model: model.title,
            left: true,
            attributes: ["id", "record_status"],
            where: { record_status: "active" },
            required: true,
            include: {
              model: model.titleTranslation,
              left: true,
              attributes: ["name", "site_language"],
              where: { status: "active" },
              required: true,
              separate: true,
              order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
            },
          },
        ],
      });
      if (getList) {
        let list = [];
        for (const eachRow of getList) {
          if (eachRow) {
            const record = {
              id: eachRow.titles[0] && eachRow.titles[0].id ? eachRow.titles[0].id : "",
              name:
                eachRow.titles[0] &&
                eachRow.titles[0].titleTranslations[0] &&
                eachRow.titles[0].titleTranslations[0].name
                  ? eachRow.titles[0].titleTranslations[0].name
                  : "",
            };
            if (eachRow.character_name && record.name) {
              record.name = `${record.name} (${eachRow.character_name})`;
            }
            if (eachRow.character_name && record.name == "") {
              record.name = `${eachRow.character_name}`;
            }
            list.push(record);
          }
        }
        resultData = list;
      }
    }
    res.ok({
      results: resultData,
    });
  } catch (error) {
    next(error);
  }
};
