import { celebrate, Joi } from "celebrate";

export const awardSectorList = celebrate({
  query: Joi.object({
    award_id: Joi.number().required(),
    //sort_order: Joi.string().optional().valid("", "desc", "asc"),
    //sort_by: Joi.string()
    //  .optional()
    //  .valid("", null, "division_name_en", "division_name_ko", "status"),
    //page: Joi.number().optional(),
    //limit: Joi.number().optional(),
  }),
});
