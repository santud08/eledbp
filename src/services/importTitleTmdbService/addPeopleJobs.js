import { Op } from "sequelize";
import model from "../../models/index.js";
import { customDateTimeHelper } from "../../helpers/index.js";
import { titleService } from "../../services/index.js";

export const addPeopleJobs = async (departmentName, peopleId, createdBy, siteLanguage = "en") => {
  try {
    if (departmentName) {
      let actionDate = "";
      let recordId = "";
      departmentName = departmentName == "Acting" ? "Actors" : departmentName;
      let departmentId = null;

      const getDepartment = await model.department.findOne({
        where: { department_name: departmentName, status: { [Op.ne]: "deleted" } },
      });
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
          const createData = {
            site_language: siteLanguage,
            people_id: peopleId,
            list_order: 1,
            job_id: departmentId,
            created_at: await customDateTimeHelper.getCurrentDateTime(),
            created_by: createdBy,
          };
          await model.peopleJobs.create(createData);
          actionDate = createData.created_at;
          recordId = peopleId;
        }
      }
      if (recordId)
        await titleService.titleDataAddEditInEditTbl(recordId, "people", createdBy, actionDate);
    }
  } catch (error) {
    console.log(error);
  }
};
