import { celebrate, Joi } from "celebrate";
export const editCreateNewCredit = celebrate({
  body: Joi.object({
    title_id: Joi.number().required(),
    draft_request_id: Joi.number().optional().allow("", null),
    site_language: Joi.string().required(),
    credit_type: Joi.string().required().valid("cast", "crew"),
    cast_name: Joi.string().required(),
    job_title: Joi.string().required(),
    character_name: Joi.string()
      .required()
      .when("credit_type", {
        is: Joi.string().valid("cast"),
        then: Joi.string().required(),
      })
      .concat(
        Joi.string()
          .optional()
          .when("credit_type", {
            is: Joi.string().valid("crew"),
            then: Joi.string().allow(null).allow("").optional(),
          }),
      ),
    is_guest: Joi.number()
      .required()
      .when("credit_type", {
        is: Joi.string().valid("cast"),
        then: Joi.number().optional().valid(0, 1),
      })
      .concat(
        Joi.number()
          .optional()
          .when("credit_type", {
            is: Joi.string().valid("crew"),
            then: Joi.number().allow(null).allow("").optional(),
          }),
      ),
    image: Joi.string().optional().allow("", null),
  }),
});
