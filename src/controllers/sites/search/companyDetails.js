import model from "../../../models/index.js";
import { paginationService } from "../../../services/index.js";
import { PAGINATION_LIMIT } from "../../../utils/constants.js";
import { StatusError, envs } from "../../../config/index.js";
import { fn, col } from "sequelize";

/**
 * search
 * @param req
 * @param res
 */
export const companyDetails = async (req, res, next) => {
  try {
    const reqBody = req.body;
    const companyId = reqBody.company_id;
    const type = reqBody.type;
    let data = [];
    let agencyInformation,
      agencyManager = [];

    let includeQuery = [];
    let condition = [];
    const defautlPageNo = 1;
    const page = reqBody.page ? reqBody.page : defautlPageNo;
    const limit = reqBody.limit ? reqBody.limit : PAGINATION_LIMIT;

    const language = req.accept_language;

    let getAgency = await model.agency.findOne({
      where: { status: "active", id: companyId },
      attributes: ["id"],
    });
    if (!getAgency) throw StatusError.badRequest(res.__("Invalid company id"));

    const searchParams = {
      page: page,
      limit: limit,
      sortBy: "id",
      sortOrder: "desc",
    };

    // Get agency details
    agencyInformation = await model.agency.findOne({
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
      where: { id: companyId, status: "active" },
      include: {
        model: model.agencyTranslation,
        left: true,
        attributes: ["name", "address", "aka", "site_language"],
        where: { status: "active" },
        separate: true,
        order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
      },
    });

    if (type == "information") {
      const attributes = ["agency_id", "email", "phone_number"];
      const modelName = model.agencyManager;
      includeQuery = [
        {
          model: model.agencyManagerArtist,
          attributes: ["people_id"],
          left: true,
          where: { status: "active" },
          required: true,
          include: {
            model: model.people,
            attributes: [
              "id",
              [
                fn("REPLACE", col("poster"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`),
                "poster",
              ],
            ],
            left: true,
            where: { status: "active" },
            required: true,
            include: {
              model: model.peopleTranslation,
              left: true,
              attributes: ["name", "description", "site_language"],
              where: { status: "active" },
              separate: true,
              order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
            },
          },
        },
        {
          model: model.agencyManagerTranslation,
          attributes: ["agency_manager_id", "name", "site_language"],
          left: true,
          where: { status: "active" },
          required: false,
          separate: true,
          order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
        },
      ];

      condition = {
        agency_id: companyId,
        status: "active",
      };
      agencyManager = await paginationService.pagination(
        searchParams,
        modelName,
        includeQuery,
        condition,
        attributes,
      );

      if (agencyManager.count > 0) {
        let managerResult = [];
        for (const eachRow of agencyManager.rows) {
          if (eachRow) {
            let record = {
              id: eachRow.id,
              name: eachRow.agencyManagerTranslations[0]
                ? eachRow.agencyManagerTranslations[0].name
                : "",
              email: eachRow.email,
              phone_number: eachRow.phone_number,
              artist_list: [],
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
                      id:
                        eachManager.people[0] && eachManager.people[0].id
                          ? eachManager.people[0].id
                          : "",
                      name:
                        eachManager.people[0] && eachManager.people[0].peopleTranslations[0].name
                          ? eachManager.people[0].peopleTranslations[0].name
                          : "",
                    });
                  }
                }
              }
              record.artist_list = artistList;
            }
            managerResult.push(record);
          }
        }
        agencyManager.rows = managerResult;
      }

      res.ok({
        agency_name:
          agencyInformation && agencyInformation.agencyTranslations[0]
            ? agencyInformation.agencyTranslations[0].name
            : "",
        agency_code: agencyInformation ? agencyInformation.agency_code : "",
        aka:
          agencyInformation && agencyInformation.agencyTranslations[0]
            ? agencyInformation.agencyTranslations[0].aka
            : "",
        address:
          agencyInformation && agencyInformation.agencyTranslations[0]
            ? agencyInformation.agencyTranslations[0].address
            : "",
        tel: agencyInformation ? agencyInformation.phone_number : "",
        fax: agencyInformation ? agencyInformation.fax : "",
        email: agencyInformation ? agencyInformation.email : "",
        official_site: agencyInformation ? agencyInformation.site_link : "",
        facebook_link: agencyInformation ? agencyInformation.facebook_link : "",
        twitter_link: agencyInformation ? agencyInformation.twitter_link : "",
        youtube_link: agencyInformation ? agencyInformation.youtube_link : "",
        instagram_link: agencyInformation ? agencyInformation.instagram_link : "",
        page: page,
        limit: limit,
        total_records: agencyManager.count,
        manager_lists: agencyManager.rows,
      });
    }
    if (type == "artist") {
      const attributes = ["agency_id", "people_id"];
      const modelName = model.agencyManagerArtist;

      includeQuery = [
        {
          model: model.people,
          attributes: [
            "id",
            [fn("REPLACE", col("poster"), `${envs.s3.BUCKET_URL}`, `${envs.aws.cdnUrl}`), "poster"],
          ],
          left: true,
          where: { status: "active" },
          required: true,
          include: {
            model: model.peopleTranslation,
            left: true,
            attributes: ["name", "description", "site_language"],
            where: { status: "active" },
            separate: true,
            order: [["site_language", language == "ko" ? "DESC" : "ASC"]],
          },
        },
      ];

      condition = {
        agency_id: companyId,
        status: "active",
      };
      const result = await paginationService.pagination(
        searchParams,
        modelName,
        includeQuery,
        condition,
        attributes,
      );

      if (result.count > 0) {
        for (let eachRow of result.rows) {
          const requiredFormat = {
            id: eachRow.people_id,
            name:
              eachRow.people[0] &&
              eachRow.people[0].peopleTranslations[0] &&
              eachRow.people[0].peopleTranslations[0].name
                ? eachRow.people[0].peopleTranslations[0].name
                : "",
            profile_picture:
              eachRow.people[0] && eachRow.people[0].poster ? eachRow.people[0].poster : "",
          };
          data.push(requiredFormat);
        }
      }

      res.ok({
        agency_name:
          agencyInformation && agencyInformation.agencyTranslations[0]
            ? agencyInformation.agencyTranslations[0].name
            : "",
        page: page,
        limit: limit,
        total_records: result.count,
        total_pages: result.count > 0 ? Math.ceil(result.count / limit) : 0,
        artist: data,
      });
    }
  } catch (error) {
    next(error);
  }
};
