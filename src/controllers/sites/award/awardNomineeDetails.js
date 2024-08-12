import model from "../../../models/index.js";
import { Sequelize, Op, fn, col } from "sequelize";
import { StatusError, envs } from "../../../config/index.js";
import { TABLES, TITLE_SETTINGS, PEOPLE_SETTINGS } from "../../../utils/constants.js";

/**
 * awardNomineeDetails
 * @param req
 * @param res
 */
export const awardNomineeDetails = async (req, res, next) => {
  try {
    const reqBody = req.query;
    if (!reqBody.id && reqBody.id == "undefined") {
      throw StatusError.badRequest(res.__("Invalid award id"));
    }
    if (!reqBody.round_id && reqBody.round_id == "undefined") {
      throw StatusError.badRequest(res.__("Invalid round id"));
    }
    const awardId = reqBody.id; //It will be award id
    const roundId = reqBody.round_id; //It will be award id
    let language = req.accept_language;

    const getAward = await model.awards.findOne({
      attributes: ["id", "news_search_keyword"],
      where: { id: awardId, status: "active" },
    });
    if (!getAward) throw StatusError.badRequest(res.__("Invalid award id"));

    const getAwardRound = await model.awardRounds.findOne({
      attributes: ["id"],
      where: { award_id: awardId, id: roundId, status: "active" },
    });
    if (!getAwardRound) throw StatusError.badRequest(res.__("Invalid round id"));

    const getAwardSectors = await model.awardNominees.findAll({
      attributes: ["id"],
      where: { award_id: awardId, status: "active", round_id: roundId },
      include: [
        {
          model: model.awardSectors,
          attributes: ["id"],
          where: { status: "active" },
          include: [
            {
              model: model.awardSectorTranslations,
              attributes: ["award_sector_id", "division_name", "site_language"],
              left: true,
              where: {
                id: {
                  [Op.eq]: Sequelize.literal(
                    `(SELECT id FROM ${TABLES.AWARD_SECTOR_TRANSLATIONS_TABLE} WHERE ${
                      TABLES.AWARD_SECTOR_TRANSLATIONS_TABLE
                    }.award_sector_id = awardSector.id AND status='active' ORDER BY site_language ${
                      language == "ko" ? "DESC" : "ASC"
                    } LIMIT 1)`,
                  ),
                },
              },
              required: false,
            },
          ],
        },
      ],
      group: ["sector_id"],
      order: [
        [model.awardSectors, "list_order", "asc"],
        //[model.awardSectors, model.awardSectorTranslations, "division_name", "ASC"],
        ["id", "desc"],
      ],
    });
    let nomineeDetails = [];
    if (getAwardSectors && getAwardSectors.length > 0) {
      for (const sector of getAwardSectors) {
        if (sector && sector.id > 0 && sector.awardSector.id > 0) {
          const findNominee = await model.awardNominees.findAll({
            attributes: ["id", "nominee_type", "work_id", "character_id", "is_work_thumbnail"],
            where: {
              award_id: awardId,
              status: "active",
              round_id: roundId,
              sector_id: sector.awardSector.id,
            },
            include: [
              {
                model: model.title,
                attributes: ["id", "type"],
                left: true,
                where: { record_status: "active" },
                required: false,
                include: [
                  {
                    model: model.titleTranslation,
                    attributes: ["title_id", "name", "site_language"],
                    left: true,
                    where: {
                      id: {
                        [Op.eq]: Sequelize.literal(
                          `(SELECT id FROM ${TABLES.TITLE_TRANSLATION_TABLE} WHERE ${
                            TABLES.TITLE_TRANSLATION_TABLE
                          }.title_id = title.id AND status='active' ORDER BY site_language ${
                            language == "ko" ? "DESC" : "ASC"
                          } LIMIT 1)`,
                        ),
                      },
                    },
                    required: false,
                  },
                  {
                    model: model.titleImage,
                    attributes: [
                      "id",
                      "title_id",
                      [
                        fn("REPLACE", col("path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`),
                        "path",
                      ],
                    ],
                    left: true,
                    where: {
                      id: {
                        [Op.eq]: Sequelize.literal(
                          `(SELECT id FROM ${TABLES.TITLE_IMAGE_TABLE} WHERE ${TABLES.TITLE_IMAGE_TABLE}.title_id = title.id AND image_category='poster_image' AND is_main_poster='y' AND status='active' AND episode_id IS NULL AND original_name IS NOT NULL AND path IS NOT NULL AND path!='' ORDER BY id DESC LIMIT 1)`,
                        ),
                      },
                    },
                    required: false,
                  },
                  {
                    model: model.creditable,
                    attributes: ["people_id", "creditable_id", "creditable_type", "job"],
                    left: true,
                    include: [
                      {
                        model: model.people,
                        left: true,
                        attributes: ["id"],
                        where: { status: "active" },
                        include: [
                          {
                            model: model.peopleTranslation,
                            attributes: ["people_id", "name", "known_for"],
                            left: true,
                            where: { site_language: language, status: "active" },
                            required: false,
                          },
                        ],
                        required: false,
                      },
                    ],
                    where: {
                      status: "active",
                      job: { [Op.in]: ["Directing", "Director"] },
                      creditable_type: "title",
                    },
                    required: false,
                  },
                ],
              },
              {
                model: model.people,
                attributes: ["id"],
                left: true,
                where: { status: "active" },
                required: false,
                include: [
                  {
                    model: model.peopleTranslation,
                    attributes: ["people_id", "name", "site_language"],
                    left: true,
                    where: {
                      id: {
                        [Op.eq]: Sequelize.literal(
                          `(SELECT id FROM ${TABLES.PEOPLE_TRANSLATION_TABLE} WHERE ${
                            TABLES.PEOPLE_TRANSLATION_TABLE
                          }.people_id = person.id AND status='active' ORDER BY site_language ${
                            language == "ko" ? "DESC" : "ASC"
                          } LIMIT 1)`,
                        ),
                      },
                    },
                    required: false,
                  },
                  {
                    model: model.peopleImages,
                    attributes: [
                      "id",
                      "people_id",
                      "original_name",
                      "file_name",
                      "url",
                      [
                        fn("REPLACE", col("path"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`),
                        "path",
                      ],
                    ],
                    where: {
                      image_category: "poster_image",
                      is_main_poster: "y",
                      status: "active",
                      path: { [Op.ne]: null },
                    },
                    required: true,
                    separate: true, //get the recently added image
                    order: [["id", "DESC"]],
                  },
                ],
              },
            ],
            order: [
              ["nominee_type", "desc"],
              ["id", "desc"],
            ],
          });
          let winners = [];
          let nominees = [];
          if (findNominee && findNominee.length > 0) {
            for (const nominee of findNominee) {
              if (nominee) {
                const nomineeType = nominee.dataValues.nominee_type;
                const workId = nominee.dataValues.work_id;
                const characterId = nominee.dataValues.character_id;
                const isWorkThumbnail = nominee.dataValues.is_work_thumbnail;
                let work = "";
                let workType = "";
                let workPoster = "";
                let peoplePoster = "";
                let directorName = "";
                let peopleId = "";
                if (workId) {
                  const tittleImageW = TITLE_SETTINGS.LIST_IMAGE;
                  work =
                    nominee.dataValues.title &&
                    nominee.dataValues.title.dataValues &&
                    nominee.dataValues.title.dataValues.titleTranslations &&
                    nominee.dataValues.title.dataValues.titleTranslations.length > 0 &&
                    nominee.dataValues.title.dataValues.titleTranslations[0] &&
                    nominee.dataValues.title.dataValues.titleTranslations[0].name
                      ? nominee.dataValues.title.dataValues.titleTranslations[0].name
                      : "";
                  workType =
                    nominee.dataValues.title &&
                    nominee.dataValues.title.dataValues &&
                    nominee.dataValues.title.dataValues.type
                      ? nominee.dataValues.title.dataValues.type
                      : "";
                  workPoster =
                    nominee.dataValues.title &&
                    nominee.dataValues.title.dataValues &&
                    nominee.dataValues.title.dataValues.titleImages &&
                    nominee.dataValues.title.dataValues.titleImages &&
                    nominee.dataValues.title.dataValues.titleImages.length > 0 &&
                    nominee.dataValues.title.dataValues.titleImages[0] &&
                    nominee.dataValues.title.dataValues.titleImages[0].path
                      ? nominee.dataValues.title.dataValues.titleImages[0].path.replace(
                          "p/original",
                          `p/${tittleImageW}`,
                        )
                      : "";
                  directorName =
                    nominee.dataValues.title &&
                    nominee.dataValues.title.dataValues &&
                    nominee.dataValues.title.dataValues.creditables &&
                    nominee.dataValues.title.dataValues.creditables.length > 0 &&
                    nominee.dataValues.title.dataValues.creditables[0] &&
                    nominee.dataValues.title.dataValues.creditables[0].person &&
                    nominee.dataValues.title.dataValues.creditables[0].person.peopleTranslations[0]
                      ? nominee.dataValues.title.dataValues.creditables[0].person
                          .peopleTranslations[0].name
                      : "";
                  peopleId =
                    nominee.dataValues.title &&
                    nominee.dataValues.title.dataValues &&
                    nominee.dataValues.title.dataValues.creditables &&
                    nominee.dataValues.title.dataValues.creditables.length > 0 &&
                    nominee.dataValues.title.dataValues.creditables[0] &&
                    nominee.dataValues.title.dataValues.creditables[0].person &&
                    nominee.dataValues.title.dataValues.creditables[0].person.id
                      ? nominee.dataValues.title.dataValues.creditables[0].person.id
                      : "";
                }
                let character = "";
                if (characterId) {
                  const peopleImageW = PEOPLE_SETTINGS.LIST_IMAGE;
                  character =
                    nominee.dataValues.person &&
                    nominee.dataValues.person.dataValues &&
                    nominee.dataValues.person.dataValues.peopleTranslations &&
                    nominee.dataValues.person.dataValues.peopleTranslations.length > 0 &&
                    nominee.dataValues.person.dataValues.peopleTranslations[0] &&
                    nominee.dataValues.person.dataValues.peopleTranslations[0].name
                      ? nominee.dataValues.person.dataValues.peopleTranslations[0].name
                      : "";
                  peoplePoster =
                    nominee.dataValues.person &&
                    nominee.dataValues.person.dataValues &&
                    nominee.dataValues.person.dataValues.peopleImages &&
                    nominee.dataValues.person.dataValues.peopleImages.length > 0 &&
                    nominee.dataValues.person.dataValues.peopleImages[0] &&
                    nominee.dataValues.person.dataValues.peopleImages[0].path
                      ? nominee.dataValues.person.dataValues.peopleImages[0].path.replace(
                          "p/original",
                          `p/${peopleImageW}`,
                        )
                      : "";
                }
                let nomineeRecord = {};
                if (workId && characterId) {
                  nomineeRecord = {
                    nominee_item_id: characterId,
                    nominee_people_name: character,
                    nominee_title_name: work,
                    nominee_title_id: workId,
                    nominee_title_type: workType,
                    type: "people",
                    poster_image: isWorkThumbnail == "y" ? workPoster : peoplePoster,
                  };
                }
                if (characterId && !workId) {
                  nomineeRecord = {
                    nominee_item_id: characterId,
                    nominee_people_name: character,
                    nominee_title_name: "",
                    nominee_title_id: "",
                    nominee_title_type: "",
                    type: "people",
                    poster_image: peoplePoster,
                  };
                }
                if (workId && !characterId) {
                  nomineeRecord = {
                    nominee_item_id: workId,
                    nominee_title_name: work,
                    nominee_people_name: directorName,
                    nominee_people_id: peopleId,
                    type: workType,
                    poster_image: workPoster,
                  };
                }
                if (
                  nomineeType == "winner" &&
                  nomineeRecord &&
                  nomineeRecord.nominee_item_id &&
                  nomineeRecord.nominee_item_id != "undefined" &&
                  nomineeRecord.nominee_item_id != null
                ) {
                  winners.push(nomineeRecord);
                }
                if (
                  nomineeRecord &&
                  nomineeRecord.nominee_item_id &&
                  nomineeRecord.nominee_item_id != "undefined" &&
                  nomineeRecord.nominee_item_id != null
                )
                  nominees.push(nomineeRecord);
              }
            }
          }
          const record = {
            sector_id: sector.awardSector.id,
            sector_name:
              sector.dataValues.awardSector &&
              sector.dataValues.awardSector.dataValues &&
              sector.dataValues.awardSector.dataValues.awardSectorTranslations &&
              sector.dataValues.awardSector.dataValues.awardSectorTranslations.length > 0 &&
              sector.dataValues.awardSector.dataValues.awardSectorTranslations[0] &&
              sector.dataValues.awardSector.dataValues.awardSectorTranslations[0].division_name
                ? sector.dataValues.awardSector.dataValues.awardSectorTranslations[0].division_name
                : "",
            winners,
            nominees,
          };
          nomineeDetails.push(record);
        }
      }
    }

    res.ok({ results: nomineeDetails });
  } catch (error) {
    next(error);
  }
};
