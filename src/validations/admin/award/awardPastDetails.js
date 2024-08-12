import { celebrate, Joi } from "celebrate";
export const awardPastDetails = celebrate({
  query: Joi.object({
    award_id: Joi.number().required(),
    round_id: Joi.number().required(),
    sort_by: Joi.string()
      .optional()
      .allow("", null, "sector", "work", "charactar", "comment", "winner"),
    sort_order: Joi.string().optional().allow("", null),
    page: Joi.number().optional(),
    limit: Joi.number().optional(),
  }),
});
