import model from "../../../models/index.js";
import { customDateTimeHelper } from "../../../helpers/index.js";
import { tmdbService } from "../../../services/index.js";
import { Op } from "sequelize";

/**
 * used for developer purpose to update the data
 * only run when its required with proper information
 */

export const updatePeopleDepartment = async (req, res, next) => {
  try {
    const page = req.body.page ? req.body.page : 0;
    const limit = req.body.limit ? req.body.limit : 10;
    const langEn = "en";
    //const langKo = "ko";
    const getData = await model.people.findAll({
      attributes: ["id", "tmdb_id", "created_by"],
      offset: parseInt(page),
      limit: parseInt(limit),
      where: {
        status: { [Op.ne]: "deleted" },
      },
      order: [["id", "ASC"]],
    });
    console.log("getData", getData);
    if (getData && getData.length > 0) {
      for (const data of getData) {
        const getTmbdId = data.tmdb_id;
        const peopleId = data.id; // people id
        const createdBy = data.created_by;

        const getPeopleDepartment = await model.peopleJobs.findOne({
          where: { people_id: peopleId },
        });
        if (!getPeopleDepartment) {
          const fetchPeople = await tmdbService.fetchPeopleDetails(getTmbdId, langEn);
          console.log("fetchPeople", fetchPeople);
          let departmentName =
            fetchPeople && fetchPeople.results && fetchPeople.results.role_name
              ? fetchPeople.results.role_name
              : "";
          departmentName = departmentName == "Acting" ? "Actors" : departmentName;
          console.log(departmentName, "departmentName");
          let departmentId = null;
          if (departmentName) {
            const getDepartment = await model.department.findOne({
              where: { department_name: departmentName, status: { [Op.ne]: "deleted" } },
            });
            console.log("getDepartment", getDepartment);
            if (getDepartment) {
              departmentId = getDepartment.id;
              const checkPeopleDepartment = await model.peopleJobs.findOne({
                where: {
                  people_id: peopleId,
                  job_id: departmentId,

                  status: { [Op.ne]: "deleted" },
                },
              });
              if (!checkPeopleDepartment) {
                console.log("checkPeopleDepartment", checkPeopleDepartment);
                const createData = {
                  site_language: langEn,
                  people_id: peopleId,
                  list_order: 1,
                  job_id: departmentId,
                  created_at: await customDateTimeHelper.getCurrentDateTime(),
                  created_by: createdBy,
                };
                await model.peopleJobs.create(createData);
              }
            }
          }
        }
      }
      res.ok({
        message: "success",
      });
    } else {
      res.ok({
        message: "no data found in file to import",
      });
    }
  } catch (error) {
    console.log(error);
    next(error);
  }
};
