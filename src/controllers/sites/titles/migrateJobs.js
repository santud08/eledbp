import { customDateTimeHelper } from "../../../helpers/index.js";

import models from "../../../models/index.js";
import { tmdbService } from "../../../services/index.js";
import { consoleColors } from "../../../utils/constants.js";

/**
 * migrateJobs
 * @param req
 * @param res
 */
export const migrateJobs = async (req, res, next) => {
  try {
    const language = ["en", "ko"];
    const jobsData = await tmdbService.fetchTmdbJobs();
    if (jobsData && jobsData.length > 0) {
      for (const eachJob of jobsData) {
        if (eachJob) {
          const departmentName = eachJob.department;
          const jobs = eachJob.jobs;
          console.log(
            `${consoleColors.fg.green} Start with Department: ${departmentName} \n ${consoleColors.reset}`,
          );
          const getDepartment = await models.department.findOne({
            where: { department_name: departmentName, status: "active" },
            raw: true,
          });
          let departmentId = "";
          if (getDepartment) {
            departmentId = getDepartment.id;
            console.log(
              `${consoleColors.fg.magenta} Department Already Present: ${departmentName} \n ${consoleColors.reset}`,
            );
          } else {
            console.log(
              `${consoleColors.fg.yellow} New Department Found To Insert : ${departmentName} \n ${consoleColors.reset}`,
            );
            const depData = {
              department_name: departmentName,
              status: "active",
              created_at: await customDateTimeHelper.getCurrentDateTime(),
            };
            const insDepartment = await models.department.create(depData);
            if (insDepartment && insDepartment.id) {
              departmentId = insDepartment.id;
              console.log(
                `${consoleColors.fg.green} Department Inserted : ${departmentName} \n ${consoleColors.reset}`,
              );
            } else {
              console.log(
                `${consoleColors.fg.red} Department Insertion Error : ${departmentName} \n ${consoleColors.reset}`,
              );
            }
          }
          if (departmentId) {
            if (language) {
              for (const eachLan of language) {
                if (eachLan) {
                  const getDepartmentTraslation = await models.departmentTranslation.findOne({
                    where: {
                      department_name: departmentName,
                      department_id: departmentId,
                      site_language: eachLan,
                      status: "active",
                    },
                    raw: true,
                  });
                  if (getDepartmentTraslation) {
                    console.log(
                      `${consoleColors.fg.magenta} Department Translation (${eachLan}) Already Present: ${departmentName} \n ${consoleColors.reset}`,
                    );
                  } else {
                    console.log(
                      `${consoleColors.fg.yellow} Department Translation (${eachLan}) Found To Insert : ${departmentName} \n ${consoleColors.reset}`,
                    );
                    const depTData = {
                      department_id: departmentId,
                      department_name: departmentName,
                      site_language: eachLan,
                      status: "active",
                      created_at: await customDateTimeHelper.getCurrentDateTime(),
                    };
                    const insDepartmentTrans = await models.departmentTranslation.create(depTData);
                    if (insDepartmentTrans) {
                      console.log(
                        `${consoleColors.fg.green} Department Translation (${eachLan}) Inserted : ${departmentName} \n ${consoleColors.reset}`,
                      );
                    } else {
                      console.log(
                        `${consoleColors.fg.red} Department Translation (${eachLan}) Insertion Error : ${departmentName} \n ${consoleColors.reset}`,
                      );
                    }
                  }
                }
              }
            }

            if (jobs) {
              for (const eachj of jobs) {
                if (eachj) {
                  console.log(
                    `${consoleColors.fg.green} --Jobs: ${eachj} \n ${consoleColors.reset}`,
                  );
                  let depJobId = "";
                  const getDepartmentJob = await models.departmentJob.findOne({
                    where: { job_name: eachj, department_id: departmentId, status: "active" },
                    raw: true,
                  });
                  if (getDepartmentJob) {
                    depJobId = getDepartmentJob.id;
                    console.log(
                      `${consoleColors.fg.magenta} Department Job Already Present: ${departmentName}--${eachj} \n ${consoleColors.reset}`,
                    );
                  } else {
                    console.log(
                      `${consoleColors.fg.yellow} New Department JoB Found To Insert : ${departmentName}--${eachj} \n ${consoleColors.reset}`,
                    );
                    const depJobData = {
                      department_id: departmentId,
                      job_name: eachj,
                      status: "active",
                      created_at: await customDateTimeHelper.getCurrentDateTime(),
                    };
                    const insDepartmentJob = await models.departmentJob.create(depJobData);
                    if (insDepartmentJob && insDepartmentJob.id) {
                      depJobId = insDepartmentJob.id;
                      console.log(
                        `${consoleColors.fg.green} Department Job Inserted : ${departmentName}--${eachj}\n ${consoleColors.reset}`,
                      );
                    } else {
                      console.log(
                        `${consoleColors.fg.red} Department Insertion Error : ${departmentName}--${eachj} \n ${consoleColors.reset}`,
                      );
                    }
                  }
                  if (depJobId) {
                    if (language) {
                      for (const eachLan of language) {
                        if (eachLan) {
                          const getDepartmentJobTraslation =
                            await models.departmentJobTranslation.findOne({
                              where: {
                                job_name: eachj,
                                department_job_id: depJobId,
                                site_language: eachLan,
                                status: "active",
                              },
                              raw: true,
                            });
                          if (getDepartmentJobTraslation) {
                            console.log(
                              `${consoleColors.fg.magenta} Department Job Translation (${eachLan}) Already Present: ${departmentName}--${eachj} \n ${consoleColors.reset}`,
                            );
                          } else {
                            console.log(
                              `${consoleColors.fg.yellow} Department Job Translation (${eachLan}) Found To Insert : ${departmentName}--${eachj} \n ${consoleColors.reset}`,
                            );
                            const depJobTData = {
                              department_job_id: depJobId,
                              job_name: eachj,
                              site_language: eachLan,
                              status: "active",
                              created_at: await customDateTimeHelper.getCurrentDateTime(),
                            };
                            const insDepartmentJobTrans =
                              await models.departmentJobTranslation.create(depJobTData);
                            if (insDepartmentJobTrans) {
                              console.log(
                                `${consoleColors.fg.green} Department Job Translation (${eachLan}) Inserted : ${departmentName}--${eachj} \n ${consoleColors.reset}`,
                              );
                            } else {
                              console.log(
                                `${consoleColors.fg.red} Department Job Translation (${eachLan}) Insertion Error : ${departmentName}--${eachj} \n ${consoleColors.reset}`,
                              );
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
          console.log(
            `${consoleColors.fg.green} End of Department: ${departmentName} --- \n ${consoleColors.reset}`,
          );
        }
      }
    }
    res.ok({
      message: res.__("success"),
      list: jobsData,
    });
  } catch (error) {
    next(error);
  }
};
