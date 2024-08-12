import model from "../../../models/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { StatusError } from "../../../config/index.js";
import { Op } from "sequelize";
import { esService } from "../../../services/index.js";

/**
 * agencyEdit
 * @param req
 * @param res
 */
export const agencyEdit = async (req, res, next) => {
  try {
    const userId = req.userDetails.userId;
    const reqBody = req.body;
    const agencyId = reqBody.id ? reqBody.id : "";
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
    const isExists = await model.agency.findOne({
      where: { id: agencyId, status: { [Op.ne]: "deleted" } },
    });
    if (!isExists) throw StatusError.badRequest(res.__("Invalid agency id"));
    // check for agency code existance in agency table
    const getAgency = await model.agency.findOne({
      where: { status: { [Op.ne]: "deleted" }, agency_code: agencyCode },
      attributes: ["id", "agency_code"],
    });
    if (!getAgency) throw StatusError.badRequest(res.__("Invalid agency code."));
    // edit agency

    const updateAgency = {
      email: email,
      fax: fax,
      phone_number: phoneNumber,
      site_link: siteLink,
      instagram_link: instagramLink,
      facebook_link: facebookLink,
      twitter_link: twitterLink,
      youtube_link: youtubeLink,
      updated_at: await customDateTimeHelper.getCurrentDateTime(),
      updated_by: userId,
    };
    await model.agency.update(updateAgency, {
      where: { id: agencyId, status: { [Op.ne]: "deleted" } },
    });
    if (nameEn) {
      // edit agency translation
      const updateAgencyTranslation = {
        name: nameEn,
        address: addressEn,
        aka: akaEn,
        site_language: "en",
        updated_at: await customDateTimeHelper.getCurrentDateTime(),
        updated_by: userId,
      };
      await model.agencyTranslation.update(updateAgencyTranslation, {
        where: { agency_id: agencyId, status: { [Op.ne]: "deleted" }, site_language: "en" },
      });
    }
    if (nameKo) {
      const updateAgencyTranslation = {
        name: nameKo,
        address: addressKo,
        aka: akaKo,
        site_language: "ko",
        updated_at: await customDateTimeHelper.getCurrentDateTime(),
        updated_by: userId,
      };
      await model.agencyTranslation.update(updateAgencyTranslation, {
        where: {
          agency_id: agencyId,
          site_language: "ko",
          status: { [Op.ne]: "deleted" },
        },
      });
    }

    if (managerDetails.length > 0) {
      const editIdList = [];
      for (const manager of managerDetails) {
        if (manager) {
          let getManagerId = null;
          const managerNameEn = manager.name_en;
          const managerNameKo = manager.name_ko;
          if (manager.id) {
            editIdList.push(manager.id);
            getManagerId = await model.agencyManager.findOne({
              where: { agency_id: agencyId, id: manager.id, status: { [Op.ne]: "deleted" } },
              attributes: ["id"],
            });
          }
          if (getManagerId == null) {
            const dataManager = {
              agency_id: agencyId,
              email: manager.email,
              phone_number: manager.phone,
              created_at: await customDateTimeHelper.getCurrentDateTime(),
              created_by: userId,
            };
            getManagerId = await model.agencyManager.create(dataManager);
            if (getManagerId && getManagerId.id) {
              const bulkCreateManager = [];

              if (managerNameEn) {
                bulkCreateManager.push({
                  agency_manager_id: getManagerId.id,
                  name: managerNameEn,
                  site_language: "en",
                  created_at: await customDateTimeHelper.getCurrentDateTime(),
                  created_by: userId,
                });
              }
              if (managerNameKo) {
                bulkCreateManager.push({
                  agency_manager_id: getManagerId.id,
                  name: managerNameKo,
                  site_language: "ko",
                  created_at: await customDateTimeHelper.getCurrentDateTime(),
                  created_by: userId,
                });
              }
              if (bulkCreateManager.length > 0)
                await model.agencyManagerTranslation.bulkCreate(bulkCreateManager);
              editIdList.push(getManagerId.id);
            }
          }

          // Checking for update manager data
          if (getManagerId) {
            if (manager.id) {
              const dataManager = {
                email: manager.email,
                phone_number: manager.phone,
                updated_at: await customDateTimeHelper.getCurrentDateTime(),
                updated_by: userId,
              };
              await model.agencyManager.update(dataManager, {
                where: { agency_id: agencyId, id: manager.id },
              });
              if (managerNameEn) {
                const dataManagerTranslation = {
                  name: managerNameEn,
                  site_language: "en",
                  created_at: await customDateTimeHelper.getCurrentDateTime(),
                  created_by: userId,
                };
                await model.agencyManagerTranslation.update(dataManagerTranslation, {
                  where: { agency_manager_id: manager.id, site_language: "en" },
                });
              }
              if (managerNameKo) {
                const dataManagerTranslation = {
                  name: managerNameKo,
                  site_language: "ko",
                  created_at: await customDateTimeHelper.getCurrentDateTime(),
                  created_by: userId,
                };
                await model.agencyManagerTranslation.update(dataManagerTranslation, {
                  where: { agency_manager_id: manager.id, site_language: "ko" },
                });
              }
            }
            if (manager.artists.length > 0) {
              for (const artist of manager.artists) {
                if (artist) {
                  // Check people is exist
                  const isExists = await model.people.findOne({
                    attributes: ["id"],
                    where: { id: artist, status: { [Op.ne]: "deleted" } },
                  });
                  if (isExists) {
                    const getArtistId = await model.agencyManagerArtist.findOne({
                      where: {
                        agency_id: agencyId,
                        people_id: artist,
                        agency_manager_id: getManagerId.id,
                        status: { [Op.ne]: "deleted" },
                      },
                      attributes: ["people_id"],
                    });
                    // Insert manager artist data
                    if (!getArtistId) {
                      const dataManagerArtist = {
                        agency_id: agencyId,
                        agency_manager_id: getManagerId.id,
                        people_id: artist,
                        created_at: await customDateTimeHelper.getCurrentDateTime(),
                        created_by: userId,
                      };
                      await model.agencyManagerArtist.create(dataManagerArtist);
                    }
                  }
                }
              }
              // delete manager artist
              const deleteManagerArtist = {
                status: "deleted",
                updated_at: await customDateTimeHelper.getCurrentDateTime(),
                updated_by: userId,
              };
              await model.agencyManagerArtist.update(deleteManagerArtist, {
                where: {
                  people_id: { [Op.notIn]: manager.artists },
                  agency_id: agencyId,
                  agency_manager_id: getManagerId.id,
                  status: { [Op.ne]: "deleted" },
                },
              });
            }
          }
        }
      }
      if (editIdList.length > 0) {
        const getPreviousManagers = await model.agencyManager.findAll({
          where: {
            id: { [Op.notIn]: editIdList },
            agency_id: agencyId,
            status: { [Op.ne]: "deleted" },
          },
        });
        if (getPreviousManagers && getPreviousManagers.length > 0) {
          for (const previousManager of getPreviousManagers) {
            if (previousManager) {
              //delete manager
              const deleteManager = {
                status: "deleted",
                updated_at: await customDateTimeHelper.getCurrentDateTime(),
                updated_by: userId,
              };
              await model.agencyManager.update(deleteManager, {
                where: {
                  agency_id: agencyId,
                  id: previousManager.id,
                  status: { [Op.ne]: "deleted" },
                },
              });

              //delete manager translation
              const dataManagerTranslation = {
                status: "deleted",
                updated_at: await customDateTimeHelper.getCurrentDateTime(),
                updated_by: userId,
              };
              await model.agencyManagerTranslation.update(dataManagerTranslation, {
                where: {
                  agency_manager_id: previousManager.id,
                  status: { [Op.ne]: "deleted" },
                },
              });

              // delete manager artist
              const deleteManagerArtist = {
                status: "deleted",
                updated_at: await customDateTimeHelper.getCurrentDateTime(),
                updated_by: userId,
              };
              await model.agencyManagerArtist.update(deleteManagerArtist, {
                where: {
                  agency_id: agencyId,
                  agency_manager_id: previousManager.id,
                  status: { [Op.ne]: "deleted" },
                },
              });
            }
          }
        }
      }
    }
    //
    //add data in search db
    esService.esSchedularAddUpdate(agencyId, "company", "edit");
    res.ok({
      message: res.__("Data updated successfully."),
    });
  } catch (error) {
    next(error);
  }
};
