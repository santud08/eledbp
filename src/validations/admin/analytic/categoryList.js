import { celebrate, Joi } from "celebrate";

export const categoryList = celebrate({
  query: Joi.object({
    section: Joi.string()
      .required()
      .valid("community_report", "user_feedback_report", "db_content_report"),
  }),
});
