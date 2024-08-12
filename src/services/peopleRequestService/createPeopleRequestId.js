import model from "../../models/index.js";
import { customDateTimeHelper } from "../../helpers/index.js";

export const createPeopleRequestId = async (peopleId, userId, siteLanguage, relationId = null) => {
  try {
    let requestId = "";
    // Get people Information
    const getPeopleInformation = await model.people.findOne({
      attributes: [
        "id",
        "gender",
        "birth_date",
        "poster",
        "kobis_id",
        "imdb_id",
        "tmdb_id",
        "tiving_id",
        "official_site",
        "facebook_link",
        "instagram_link",
        "twitter_link",
      ],
      include: [
        {
          model: model.peopleTranslation,
          attributes: ["people_id", "name", "description", "known_for", "birth_place"],
          left: true,
          where: { status: "active", site_language: siteLanguage },
          required: false,
        },
      ],
      where: {
        id: peopleId,
        status: "active",
      },
    });
    let data = {};
    if (getPeopleInformation) {
      data.people_id = getPeopleInformation.id;
      data.name =
        getPeopleInformation.peopleTranslations &&
        getPeopleInformation.peopleTranslations.length > 0 &&
        getPeopleInformation.peopleTranslations[0].name
          ? getPeopleInformation.peopleTranslations[0].name
          : "";
      data.known_for =
        getPeopleInformation.peopleTranslations &&
        getPeopleInformation.peopleTranslations.length > 0 &&
        getPeopleInformation.peopleTranslations[0].known_for
          ? getPeopleInformation.peopleTranslations[0].known_for
          : "";
      data.description =
        getPeopleInformation.peopleTranslations &&
        getPeopleInformation.peopleTranslations.length > 0 &&
        getPeopleInformation.peopleTranslations[0].description
          ? getPeopleInformation.peopleTranslations[0].description
          : "";
      data.gender = getPeopleInformation.gender ? getPeopleInformation.gender : null;
      data.birth_date = getPeopleInformation.birth_date ? getPeopleInformation.birth_date : null;
      data.death_date = getPeopleInformation.death_date ? getPeopleInformation.death_date : null;
      data.tmdb_id = getPeopleInformation.tmdb_id ? getPeopleInformation.tmdb_id : null;
      data.kobis_id = getPeopleInformation.kobis_id ? getPeopleInformation.kobis_id : null;
      data.tiving_id = getPeopleInformation.tiving_id ? getPeopleInformation.tiving_id : null;
      data.official_site = getPeopleInformation.official_site
        ? getPeopleInformation.official_site
        : null;
      data.facebook_link = getPeopleInformation.facebook ? getPeopleInformation.facebook : null;
      data.instagram_link = getPeopleInformation.instagram ? getPeopleInformation.instagram : null;
      data.twitter_link = getPeopleInformation.twitter ? getPeopleInformation.twitter : null;
      data.poster = getPeopleInformation.poster;
      // site_langugae
      data.site_language = siteLanguage;
    }
    // Get Country - Country details
    const countryList = await model.peopleCountries.findAll({
      attributes: ["id", "people_id", "country_id", "birth_place"],
      where: { people_id: peopleId, status: "active" },
    });

    let countryListDetails = [];
    if (countryList.length > 0) {
      for (const value of countryList) {
        if (value.birth_place) {
          const element = {
            id: value.id,
            people_id: peopleId,
            country_id: "",
            birth_place: value.birth_place,
            site_language: siteLanguage,
            status: "active",
            created_at: await customDateTimeHelper.getCurrentDateTime(),
            updated_at: "",
            created_by: userId,
            updated_by: "",
          };
          countryListDetails.push(element);
        }
      }
    }
    data.country_details = { list: countryListDetails };

    // Get People Department- For JOB field
    const jobList = await model.peopleJobs.findAll({
      attributes: ["id", "people_id", "job_id", "list_order"],
      where: { people_id: peopleId, status: "active" },
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
            where: { site_language: siteLanguage, status: "active" },
            required: true,
          },
        },
      ],
    });

    let JobListDetails = [];
    if (jobList.length > 0) {
      for (const value of jobList) {
        if (value) {
          const element = {
            id: value.id,
            people_id: peopleId,
            job_id: value.job_id,
            list_order: value.list_order,
            site_language: siteLanguage,
            status: "active",
            created_at: await customDateTimeHelper.getCurrentDateTime(),
            updated_at: "",
            created_by: userId,
            updated_by: "",
          };
          JobListDetails.push(element);
        }
      }
    }
    data.job_details = { list: JobListDetails };

    // Get people search Keyword details:
    const searchKeywordList = await model.peopleKeywords.findAll({
      attributes: ["id", "keyword"],
      where: {
        people_id: peopleId,
        keyword_type: "search",
        status: "active",
      },
    });

    let searchKeywords = [];
    if (searchKeywordList) {
      for (const value of searchKeywordList) {
        if (value) {
          const element = {
            id: value.id,
            people_id: peopleId,
            site_language: siteLanguage,
            keyword: value.keyword,
            keyword_type: "search",
            status: "active",
            created_at: await customDateTimeHelper.getCurrentDateTime(),
            updated_at: "",
            created_by: userId,
            updated_by: "",
          };
          searchKeywords.push(element);
        }
      }
    }
    data.search_keyword_details = { list: searchKeywords };

    // Get people search Keyword details:
    const newsKeywordList = await model.peopleKeywords.findAll({
      where: {
        people_id: peopleId,
        keyword_type: "news",
        status: "active",
      },
    });
    let newsKeywords = [];
    if (newsKeywordList) {
      for (const value of newsKeywordList) {
        if (value) {
          const element = {
            id: value.id,
            people_id: peopleId,
            site_language: siteLanguage,
            keyword: value.keyword,
            keyword_type: "news",
            status: "active",
            created_at: await customDateTimeHelper.getCurrentDateTime(),
            updated_at: "",
            created_by: userId,
            updated_by: "",
          };
          newsKeywords.push(element);
        }
      }
    }
    data.news_keyword_details = { list: newsKeywords };
    data.created_at = await customDateTimeHelper.getCurrentDateTime();
    data.created_by = data.user_id;
    const createdRequest = await model.peopleRequestPrimaryDetails.create(data);
    if (createdRequest) {
      // updating the relation_id with respect to request_id
      data.relation_id = relationId ? relationId : createdRequest.id;
      requestId = createdRequest.id;

      await model.peopleRequestPrimaryDetails.update(data, {
        where: { id: createdRequest.id, status: "active" },
      });
    }
    return requestId;
  } catch (error) {
    return false;
  }
};
