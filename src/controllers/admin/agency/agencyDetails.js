import model from "../../../models/index.js";
import { StatusError, envs } from "../../../config/index.js";
import { Op, fn, col } from "sequelize";

/**
 * agencyDetails
 * @param req
 * @param res
 */
export const agencyDetails = async (req, res, next) => {
  try {
    const reqBody = req.query;
    let agencyManagerList = [];
    const agencyId = reqBody.id ? reqBody.id : ""; // agency id
    const language = req.accept_language;

    if (!agencyId) throw StatusError.badRequest(res.__("Invalid agency id"));

    // check for agency id existance in agency table
    const agencyInformation = await model.agency.findOne({
      where: { id: agencyId, status: { [Op.ne]: "deleted" } },
      attributes: [
        "id",
        "agency_code",
        "email",
        "fax",
        "phone_number",
        "site_link",
        "instagram_link",
        "facebook_link",
        "twitter_link",
        "youtube_link",
      ],
      include: {
        model: model.agencyTranslation,
        left: true,
        attributes: ["name", "address", "aka", "site_language"],
        where: { status: "active" },
      },
    });

    if (!agencyInformation) throw StatusError.badRequest(res.__("Invalid agency id"));

    const agencyManager = await model.agencyManager.findAll({
      attributes: ["agency_id", "email", "phone_number"],
      where: { agency_id: agencyId, status: { [Op.ne]: "deleted" } },
      include: [
        {
          model: model.agencyManagerArtist,
          attributes: ["people_id"],
          left: true,
          where: { status: { [Op.ne]: "deleted" } },
          required: true,
          include: {
            model: model.people,
            attributes: ["id"],
            left: true,
            where: { status: { [Op.ne]: "deleted" } },
            required: true,
            include: [
              {
                model: model.peopleTranslation,
                left: true,
                attributes: ["name", "description"],
                where: { status: { [Op.ne]: "deleted" }, site_language: language },
              },
              {
                model: model.peopleImages,
                attributes: [
                  "original_name",
                  "file_name",
                  "url",
                  [
                    fn(
                      "REPLACE",
                      col("peopleImages.path"),
                      `${envs.s3.BUCKET_URL}`,
                      `${envs.aws.cdnUrl}`,
                    ),
                    "path",
                  ],
                ],
                left: true,
                where: {
                  site_language: language,
                  image_category: "poster_image",
                  is_main_poster: "y",
                  status: "active",
                },
                required: false,
                separate: true, //get the recently added image
                order: [["id", "DESC"]],
              },
            ],
          },
        },
        {
          model: model.agencyManagerTranslation,
          attributes: ["agency_manager_id", "name", "site_language"],
          left: true,
          where: { status: { [Op.ne]: "deleted" } },
          required: false,
        },
      ],
    });

    if (agencyManager) {
      let managerResult = [];
      let enManagerName = {};
      let koManagerName = {};
      for (const eachRow of agencyManager) {
        if (eachRow) {
          for (const data of eachRow.agencyManagerTranslations) {
            if (data) {
              if (data.dataValues.site_language == "en") {
                enManagerName = {
                  manager_name_en: data.dataValues.name,
                };
              }
              if (data.dataValues.site_language == "ko") {
                koManagerName = {
                  manager_name_ko: data.dataValues.name,
                };
              }
            }
          }
          const record = {
            manager_id:
              eachRow.agencyManagerTranslations && eachRow.agencyManagerTranslations.length > 0
                ? eachRow.agencyManagerTranslations[0].dataValues.agency_manager_id
                : "",
            ...enManagerName,
            ...koManagerName,
            manager_email: eachRow.email,
            manager_phone: eachRow.phone_number,
          };

          if (eachRow.agencyManagerArtists && eachRow.agencyManagerArtists.length > 0) {
            let artistList = [];
            for (const eachManager of eachRow.agencyManagerArtists) {
              if (eachManager) {
                if (
                  eachManager.people &&
                  eachManager.people.length > 0 &&
                  eachManager.people[0].peopleTranslations &&
                  eachManager.people[0].peopleTranslations.length > 0
                ) {
                  artistList.push({
                    artist_id:
                      eachManager.people[0] && eachManager.people[0].id
                        ? eachManager.people[0].id
                        : "",
                    artist_name:
                      eachManager.people[0] &&
                      eachManager.people[0].peopleTranslations[0] &&
                      eachManager.people[0].peopleTranslations[0].name
                        ? eachManager.people[0].peopleTranslations[0].name
                        : "",
                    profile_image:
                      eachManager.people[0] &&
                      eachManager.people[0].peopleImages[0] &&
                      eachManager.people[0].peopleImages[0].path
                        ? eachManager.people[0].peopleImages[0].path
                        : "",
                  });
                }
              }
            }
            record.artists = artistList;
          }
          managerResult.push(record);
        }
      }
      agencyManagerList = managerResult;
    }

    let agencyTranslationEnData = {};
    let agencyTranslationKoData = {};
    if (agencyInformation.agencyTranslations.length > 0) {
      for (const data of agencyInformation.agencyTranslations) {
        if (data) {
          if (data.dataValues.site_language == "en") {
            agencyTranslationEnData = {
              name_en: data.dataValues.name,
              aka_en: data.dataValues.aka,
              address_en: data.dataValues.address,
            };
          }
          if (data.dataValues.site_language == "ko") {
            agencyTranslationKoData = {
              name_ko: data.dataValues.name,
              aka_ko: data.dataValues.aka,
              address_ko: data.dataValues.address,
            };
          }
        }
      }
    }

    res.ok({
      id: agencyInformation ? agencyInformation.id : "",
      agency_code: agencyInformation ? agencyInformation.agency_code : "",
      ...agencyTranslationEnData,
      ...agencyTranslationKoData,
      phone_number: agencyInformation ? agencyInformation.phone_number : "",
      fax: agencyInformation ? agencyInformation.fax : "",
      email: agencyInformation ? agencyInformation.email : "",
      site_link: agencyInformation ? agencyInformation.site_link : "",
      instagram_link: agencyInformation ? agencyInformation.instagram_link : "",
      facebook_link: agencyInformation ? agencyInformation.facebook_link : "",
      twitter_link: agencyInformation ? agencyInformation.twitter_link : "",
      youtube_link: agencyInformation ? agencyInformation.youtube_link : "",
      maneger_list: agencyManagerList,
    });
  } catch (error) {
    next(error);
  }
};
