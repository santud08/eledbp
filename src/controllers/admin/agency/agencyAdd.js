import model from "../../../models/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { StatusError } from "../../../config/index.js";
import { Op } from "sequelize";
import { esService } from "../../../services/index.js";

/**
 * agencyAdd
 * @param req
 * @param res
 */
export const agencyAdd = async (req, res, next) => {
  try {
    const userId = req.userDetails.userId;
    const reqBody = req.body;
    const nameEn = reqBody.name_en ? reqBody.name_en : "";
    const addressEn = reqBody.address_en ? reqBody.address_en : "";
    const akaEn = reqBody.aka_en ? reqBody.aka_en : "";
    const nameKo = reqBody.name_ko ? reqBody.name_ko : "";
    const addressKo = reqBody.address_ko ? reqBody.address_ko : "";
    const akaKo = reqBody.aka_ko ? reqBody.aka_ko : "";
    const agencyCode = reqBody.agency_code ? reqBody.agency_code : "";
    const email = reqBody.email ? reqBody.email : "";
    const phoneNumber = reqBody.phone_number ? reqBody.phone_number : "";
    const fax = reqBody.fax ? reqBody.fax : "";
    const siteLink = reqBody.site_link ? reqBody.site_link : "";
    const instagramLink = reqBody.instagram_link ? reqBody.instagram_link : "";
    const facebookLink = reqBody.facebook_link ? reqBody.facebook_link : "";
    const twitterLink = reqBody.twitter_link ? reqBody.twitter_link : "";
    const youtubeLink = reqBody.youtube_link ? reqBody.youtube_link : "";
    const managerDetails = reqBody.manager_details ? reqBody.manager_details : [];

    // check for agency code existance in agency table
    const getAgency = await model.agency.findOne({
      where: { status: { [Op.ne]: "deleted" }, agency_code: agencyCode },
      attributes: ["id", "agency_code"],
    });
    if (getAgency) throw StatusError.badRequest(res.__("Agency code already exist."));
    // add agency
    const dataAgency = {
      agency_code: agencyCode,
      email: email,
      fax: fax,
      phone_number: phoneNumber,
      site_link: siteLink,
      instagram_link: instagramLink,
      facebook_link: facebookLink,
      twitter_link: twitterLink,
      youtube_link: youtubeLink,
      created_at: await customDateTimeHelper.getCurrentDateTime(),
      created_by: userId,
    };
    const addedAgency = await model.agency.create(dataAgency);
    if (addedAgency && addedAgency.id) {
      // Add agency translation
      const bulkCreate = [];
      if (nameEn) {
        bulkCreate.push({
          agency_id: addedAgency.id,
          name: nameEn,
          address: addressEn,
          aka: akaEn,
          site_language: "en",
          created_at: await customDateTimeHelper.getCurrentDateTime(),
          created_by: userId,
        });
      }
      if (nameKo) {
        bulkCreate.push({
          agency_id: addedAgency.id,
          name: nameKo,
          address: addressKo,
          aka: akaKo,
          site_language: "ko",
          created_at: await customDateTimeHelper.getCurrentDateTime(),
          created_by: userId,
        });
      }
      if (bulkCreate.length > 0) await model.agencyTranslation.bulkCreate(bulkCreate);

      //Add manager
      if (managerDetails && managerDetails.length > 0) {
        for (const manager of managerDetails) {
          if (manager) {
            const managerNameEn = manager.name_en;
            const managerNameKo = manager.name_ko;
            const dataManager = {
              agency_id: addedAgency.id,
              email: manager.email,
              phone_number: manager.phone,
              created_at: await customDateTimeHelper.getCurrentDateTime(),
              created_by: userId,
            };
            const checkManager = await model.agencyManager.findOne({
              where: {
                agency_id: addedAgency.id,
                email: manager.email,
                phone_number: manager.phone,
                status: { [Op.ne]: "deleted" },
              },
            });
            if (!checkManager) {
              const addedManager = await model.agencyManager.create(dataManager);
              if (addedManager && addedManager.id) {
                // Add manager translation
                const bulkCreateManager = [];
                if (managerNameEn) {
                  bulkCreateManager.push({
                    agency_manager_id: addedManager.id,
                    name: managerNameEn,
                    site_language: "en",
                    created_at: await customDateTimeHelper.getCurrentDateTime(),
                    created_by: userId,
                  });
                }
                if (managerNameKo) {
                  bulkCreateManager.push({
                    agency_manager_id: addedManager.id,
                    name: managerNameKo,
                    site_language: "ko",
                    created_at: await customDateTimeHelper.getCurrentDateTime(),
                    created_by: userId,
                  });
                }
                if (bulkCreateManager.length > 0)
                  await model.agencyManagerTranslation.bulkCreate(bulkCreateManager);
                // Add artist id
                if (manager.artists && manager.artists.length > 0) {
                  for (const artist of manager.artists) {
                    if (artist) {
                      // Check people is exist
                      const isExists = await model.people.findOne({
                        attributes: ["id"],
                        where: { id: artist, status: { [Op.ne]: "deleted" } },
                      });
                      if (isExists) {
                        const dataManagerArtist = {
                          agency_id: addedAgency.id,
                          agency_manager_id: addedManager.id,
                          people_id: artist,
                          created_at: await customDateTimeHelper.getCurrentDateTime(),
                          created_by: userId,
                        };
                        const checkArtist = await model.agencyManagerArtist.findOne({
                          where: {
                            agency_id: addedAgency.id,
                            agency_manager_id: addedManager.id,
                            people_id: artist,
                            status: { [Op.ne]: "deleted" },
                          },
                        });
                        if (!checkArtist) {
                          await model.agencyManagerArtist.create(dataManagerArtist);
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      //add data in search db
      esService.esSchedularAddUpdate(addedAgency.id, "company", "add");
    }

    res.ok({
      message: res.__("agency added successfully"),
    });
  } catch (error) {
    next(error);
  }
};
